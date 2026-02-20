import fs from 'fs/promises';
import path from 'path';
import { ApiError } from '../utils/errors';

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 120000;
const MIN_TEXT_LENGTH = 120;
const PARSE_TIMEOUT_MS = 12000;

export class PdfExtractService {
    static async extractCleanTextFromPdf(fileUrl: string): Promise<string> {
        const absolutePath = path.resolve(process.cwd(), fileUrl);
        const extension = path.extname(absolutePath).toLowerCase();
        if (extension !== '.pdf') {
            throw new ApiError(400, 'Only PDF files are supported');
        }

        const fileStat = await fs.stat(absolutePath);
        if (fileStat.size > MAX_PDF_BYTES) {
            throw new ApiError(413, 'PDF is too large to process');
        }

        const fileBuffer = await fs.readFile(absolutePath);
        const parsed = await this.withTimeout(this.parsePdf(fileBuffer), PARSE_TIMEOUT_MS, 'PDF parsing timed out');
        const cleanedText = await this.cleanText(parsed.text || '');

        if (cleanedText.length < MIN_TEXT_LENGTH) {
            throw new ApiError(400, 'PDF content is too short to generate a reliable quiz');
        }

        return cleanedText;
    }

    private static async parsePdf(buffer: Buffer): Promise<{ text: string }> {
        let pdfModule: any;
        try {
            const runtimeRequire = eval('require');
            pdfModule = runtimeRequire('pdf-parse');
        } catch (_error) {
            throw new ApiError(500, 'PDF parsing library is not available');
        }

        const parserClass =
            (typeof pdfModule?.PDFParse === 'function' && pdfModule.PDFParse)
            || (typeof pdfModule?.default?.PDFParse === 'function' && pdfModule.default.PDFParse);

        if (parserClass) {
            let parser: any;
            try {
                parser = new parserClass({ data: new Uint8Array(buffer) });
                const result = await parser.getText();
                return { text: typeof result?.text === 'string' ? result.text : '' };
            } catch (_error) {
                throw new ApiError(400, 'Failed to parse PDF content');
            } finally {
                if (parser && typeof parser.destroy === 'function') {
                    await parser.destroy().catch(() => undefined);
                }
            }
        }

        const legacyParser =
            (typeof pdfModule === 'function' && pdfModule)
            || (typeof pdfModule?.default === 'function' && pdfModule.default);

        if (legacyParser) {
            try {
                const result = await legacyParser(buffer);
                return { text: typeof result?.text === 'string' ? result.text : '' };
            } catch (_error) {
                throw new ApiError(400, 'Failed to parse PDF content');
            }
        }

        throw new ApiError(500, 'Unsupported PDF parser API version');
    }

    private static async cleanText(rawText: string): Promise<string> {
        const normalized = rawText
            .replace(/\u0000/g, ' ')
            .replace(/\r/g, '\n')
            .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
            .replace(/-{2,}\s*\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n');

        const lines = normalized
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const output: string[] = [];
        for (let index = 0; index < lines.length; index += 1) {
            const line = lines[index];
            if (line.length < 2) continue;
            output.push(line.replace(/\s{2,}/g, ' '));

            if (output.join(' ').length >= MAX_TEXT_LENGTH) {
                break;
            }

            if (index % 120 === 0) {
                await this.yieldToEventLoop();
            }
        }

        return output.join(' ').slice(0, MAX_TEXT_LENGTH).trim();
    }

    private static async withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
        let timeoutHandle: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new ApiError(408, errorMessage)), timeoutMs);
        });

        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        }
    }

    private static async yieldToEventLoop(): Promise<void> {
        await new Promise<void>((resolve) => setImmediate(resolve));
    }
}
