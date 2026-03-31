import { Submission, SubmissionStatus } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';
import { ExecutionEngineService, type ExecutionSummary } from './execution-engine.service';
import { ProblemProgressService } from './problem-progress.service';
import { ProblemService } from './problem.service';
import { AchievementService } from './achievement.service';

export class SubmissionService {
    static async create(data: { studentId: string; problemId: string; code: string; language: string }): Promise<Submission> {
        return prisma.submission.create({
            data: {
                studentId: data.studentId,
                problemId: data.problemId,
                code: data.code,
                language: data.language,
                status: SubmissionStatus.PENDING,
            },
        });
    }

    static async findByUserId(studentId: string): Promise<Submission[]> {
        return prisma.submission.findMany({
            where: { studentId },
            include: {
                problem: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    static async findById(id: string): Promise<Submission | null> {
        return prisma.submission.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                problem: true,
            },
        });
    }

    static async submitAndEvaluate(data: {
        studentId: string;
        problemId: string;
        code: string;
        language: string;
    }): Promise<{ submission: Submission; summary: ExecutionSummary }> {
        const problem = await ProblemService.findById(data.problemId);
        if (!problem) {
            throw new ApiError(404, 'Problem not found');
        }

        const testCases = problem.testCases || [];
        if (testCases.length === 0) {
            throw new ApiError(400, 'Problem has no test cases configured yet');
        }

        const submission = await this.create(data);
        const summary = await ExecutionEngineService.run({
            code: data.code,
            language: data.language,
            testCases: testCases.map((testCase) => ({
                id: testCase.id,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                isHidden: testCase.isHidden,
            })),
        });

        const updatedSubmission = await prisma.submission.update({
            where: { id: submission.id },
            data: {
                status: summary.finalVerdict,
                executionTime: summary.executionTime,
            },
        });

        await ProblemProgressService.recordAttempt(
            data.problemId,
            data.studentId,
            summary.finalVerdict === SubmissionStatus.ACCEPTED
        );

        try {
            await AchievementService.onProblemSubmissionEvaluated({
                userId: data.studentId,
                finalVerdict: summary.finalVerdict,
            });
        } catch (error) {
            console.error('Failed to evaluate problem submission achievements:', error);
        }

        return {
            submission: updatedSubmission,
            summary,
        };
    }

    static async runCustomInput(data: {
        problemId: string;
        code: string;
        language: string;
        input: string;
        expectedOutput?: string;
    }) {
        const problem = await ProblemService.findById(data.problemId);
        if (!problem) {
            throw new ApiError(404, 'Problem not found');
        }

        const result = await ExecutionEngineService.runCustomInput({
            code: data.code,
            language: data.language,
            input: data.input,
        });

        const normalizedExpected = typeof data.expectedOutput === 'string'
            ? data.expectedOutput.replace(/\r/g, '').trim()
            : null;
        const normalizedActual = result.output.replace(/\r/g, '').trim();

        const hasExpectedOutput = normalizedExpected !== null && normalizedExpected.length > 0;
        const isMatch = hasExpectedOutput ? normalizedActual === normalizedExpected : null;

        return {
            output: result.output,
            executionTime: result.executionTime,
            status: result.status,
            error: result.error,
            expectedOutput: hasExpectedOutput ? data.expectedOutput : null,
            isMatch,
        };
    }
}
