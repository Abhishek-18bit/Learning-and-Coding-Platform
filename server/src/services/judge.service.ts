import { Submission, SubmissionStatus } from '@prisma/client';
import prisma from '../db/prisma';
import { ExecutionEngineService } from './execution-engine.service';
import { ProblemProgressService } from './problem-progress.service';

export class JudgeService {
    /**
     * Backward-compatible evaluator by submission id.
     * Used by legacy /api/submissions endpoint.
     */
    static async evaluate(submissionId: string): Promise<Submission> {
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                problem: {
                    include: {
                        testCases: true,
                    },
                },
            },
        });

        if (!submission || !submission.problem) {
            throw new Error('Submission or problem not found');
        }

        const summary = await ExecutionEngineService.run({
            code: submission.code,
            language: submission.language,
            testCases: submission.problem.testCases.map((testCase) => ({
                id: testCase.id,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                isHidden: testCase.isHidden,
            })),
        });

        const updatedSubmission = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: summary.finalVerdict,
                executionTime: summary.executionTime,
            },
        });

        await ProblemProgressService.recordAttempt(
            submission.problemId,
            submission.studentId,
            summary.finalVerdict === SubmissionStatus.ACCEPTED
        );

        if (summary.finalVerdict === SubmissionStatus.ACCEPTED) {
            const { emitToUser } = await import('../utils/socket');
            emitToUser(submission.studentId, 'PROBLEM_SOLVED', {
                problemId: submission.problemId,
                problemTitle: submission.problem.title,
                submissionId: updatedSubmission.id,
            });
        }

        return updatedSubmission;
    }
}
