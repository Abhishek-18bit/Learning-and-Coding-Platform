import prisma from '../db/prisma';

export class ProblemProgressService {
    static async recordAttempt(problemId: string, studentId: string, solved: boolean) {
        return prisma.problemProgress.upsert({
            where: {
                problemId_studentId: {
                    problemId,
                    studentId,
                },
            },
            create: {
                problemId,
                studentId,
                attempts: 1,
                isSolved: solved,
                solvedAt: solved ? new Date() : null,
            },
            update: {
                attempts: {
                    increment: 1,
                },
                ...(solved
                    ? {
                        isSolved: true,
                        solvedAt: new Date(),
                    }
                    : {}),
            },
        });
    }
}
