import { Worker } from 'worker_threads';
import { SubmissionStatus } from '@prisma/client';
import { ApiError } from '../utils/errors';

export interface ExecutionTestCase {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
}

export interface ExecutionSummary {
    passedCount: number;
    failedCount: number;
    executionTime: number;
    finalVerdict: SubmissionStatus;
    failedCases: Array<{
        testCaseId: string;
        expectedOutput: string;
        actualOutput: string;
        isHidden: boolean;
    }>;
}

const SUPPORTED_LANGUAGES = new Set(['javascript', 'js']);
const CODE_SIZE_LIMIT = 30_000;
const INPUT_SIZE_LIMIT = 10_000;
const TIME_LIMIT_MS = 2000;
const MEMORY_LIMIT_MB = 64;

const WORKER_SOURCE = `
const { parentPort } = require('worker_threads');
const vm = require('vm');

parentPort.on('message', ({ code, input, timeoutMs }) => {
  const stdout = [];
  const sandbox = {
    input,
    console: {
      log: (...args) => {
        stdout.push(args.map((item) => String(item)).join(' '));
      },
    },
    require: undefined,
    process: undefined,
    module: undefined,
    exports: undefined,
    Buffer: undefined,
    setInterval: undefined,
    setTimeout: undefined,
  };

  const context = vm.createContext(sandbox, {
    codeGeneration: {
      strings: false,
      wasm: false,
    },
  });
  const wrappedCode = \`
\${code}
if (typeof solve === 'function') {
  const __result = solve(input);
  if (__result !== undefined) {
    console.log(__result);
  }
}
\`;

  try {
    const script = new vm.Script(wrappedCode, { displayErrors: true });
    script.runInContext(context, { timeout: timeoutMs });
    parentPort.postMessage({ ok: true, output: stdout.join('\\n') });
  } catch (error) {
    parentPort.postMessage({
      ok: false,
      error: error && error.message ? String(error.message) : 'Execution error',
    });
  }
});
`;

export class ExecutionEngineService {
    static async run({
        code,
        language,
        testCases,
    }: {
        code: string;
        language: string;
        testCases: ExecutionTestCase[];
    }): Promise<ExecutionSummary> {
        const normalizedLanguage = language.toLowerCase().trim();
        if (!SUPPORTED_LANGUAGES.has(normalizedLanguage)) {
            throw new ApiError(400, 'Unsupported language. Only JavaScript is supported currently.');
        }

        const sanitizedCode = this.sanitizeCode(code);
        if (testCases.length === 0) {
            return {
                passedCount: 0,
                failedCount: 0,
                executionTime: 0,
                finalVerdict: SubmissionStatus.ERROR,
                failedCases: [],
            };
        }

        let passedCount = 0;
        let failedCount = 0;
        const failedCases: ExecutionSummary['failedCases'] = [];
        const startedAt = Date.now();

        for (const testCase of testCases) {
            const sanitizedInput = this.sanitizeInput(testCase.input);
            const result = await this.executeJavascript({
                code: sanitizedCode,
                input: sanitizedInput,
                timeoutMs: TIME_LIMIT_MS,
            });

            if (!result.ok) {
                failedCount += 1;
                failedCases.push({
                    testCaseId: testCase.id,
                    expectedOutput: testCase.expectedOutput,
                    actualOutput: `ERROR: ${result.error}`,
                    isHidden: testCase.isHidden,
                });
                continue;
            }

            const expectedOutput = this.normalizeOutput(testCase.expectedOutput);
            const actualOutput = this.normalizeOutput(result.output || '');
            if (actualOutput === expectedOutput) {
                passedCount += 1;
            } else {
                failedCount += 1;
                failedCases.push({
                    testCaseId: testCase.id,
                    expectedOutput: testCase.expectedOutput,
                    actualOutput: result.output || '',
                    isHidden: testCase.isHidden,
                });
            }
        }

        const executionTime = Date.now() - startedAt;
        const hasRuntimeError = failedCases.some((item) => item.actualOutput.startsWith('ERROR:'));
        const finalVerdict = failedCount === 0
            ? SubmissionStatus.ACCEPTED
            : hasRuntimeError
                ? SubmissionStatus.ERROR
                : SubmissionStatus.WRONG_ANSWER;

        return {
            passedCount,
            failedCount,
            executionTime,
            finalVerdict,
            failedCases,
        };
    }

    private static sanitizeCode(code: string): string {
        if (typeof code !== 'string') {
            throw new ApiError(400, 'Code must be a string');
        }

        const trimmed = code.replace(/\u0000/g, '').trim();
        if (!trimmed) {
            throw new ApiError(400, 'Code cannot be empty');
        }
        if (trimmed.length > CODE_SIZE_LIMIT) {
            throw new ApiError(413, 'Code is too large');
        }

        const blockedPatterns = [
            /\brequire\s*\(/i,
            /\bimport\s+/i,
            /\bprocess\b/i,
            /\bchild_process\b/i,
            /\bfs\b/i,
            /\bhttp\b/i,
            /\bhttps\b/i,
            /\bnet\b/i,
            /\bWorker\b/i,
            /\beval\s*\(/i,
            /\bFunction\s*\(/i,
            /constructor\s*\.\s*constructor/i,
        ];

        if (blockedPatterns.some((pattern) => pattern.test(trimmed))) {
            throw new ApiError(400, 'Code contains restricted operations');
        }

        return trimmed;
    }

    private static sanitizeInput(input: string): string {
        const normalized = String(input || '').replace(/\u0000/g, '');
        if (normalized.length > INPUT_SIZE_LIMIT) {
            throw new ApiError(413, 'Test input is too large');
        }
        return normalized;
    }

    private static normalizeOutput(output: string): string {
        return output.replace(/\r/g, '').trim();
    }

    private static async executeJavascript({
        code,
        input,
        timeoutMs,
    }: {
        code: string;
        input: string;
        timeoutMs: number;
    }): Promise<{ ok: boolean; output?: string; error?: string }> {
        return new Promise((resolve) => {
            const worker = new Worker(WORKER_SOURCE, {
                eval: true,
                resourceLimits: {
                    maxOldGenerationSizeMb: MEMORY_LIMIT_MB,
                    maxYoungGenerationSizeMb: 16,
                    stackSizeMb: 2,
                },
            });

            let settled = false;
            const timeoutHandle = setTimeout(() => {
                if (settled) return;
                settled = true;
                worker.terminate().catch(() => undefined);
                resolve({ ok: false, error: `Time limit exceeded (${timeoutMs}ms)` });
            }, timeoutMs + 100);

            worker.once('message', (message: unknown) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutHandle);
                worker.terminate().catch(() => undefined);

                const payload = message as { ok: boolean; output?: string; error?: string };
                if (payload.ok) {
                    resolve({ ok: true, output: payload.output || '' });
                } else {
                    resolve({ ok: false, error: payload.error || 'Execution failed' });
                }
            });

            worker.once('error', (error: Error) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutHandle);
                worker.terminate().catch(() => undefined);
                resolve({ ok: false, error: error.message || 'Worker execution error' });
            });

            worker.postMessage({ code, input, timeoutMs });
        });
    }
}
