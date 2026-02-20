import { Problem, Difficulty, TestCase } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';

export class ProblemService {
    static async create(data: {
        title: string;
        description: string;
        difficulty: Difficulty;
        inputFormat: string;
        outputFormat: string;
        constraints: string;
        starterCode: string;
        createdById: string;
        lessonId?: string;
    }): Promise<Problem> {
        return prisma.problem.create({
            data: {
                title: data.title,
                description: data.description,
                difficulty: data.difficulty,
                inputFormat: data.inputFormat,
                outputFormat: data.outputFormat,
                constraints: data.constraints,
                starterCode: data.starterCode,
                createdById: data.createdById,
                lessonId: data.lessonId,
            },
        });
    }

    static async addTestCases(problemId: string, testCases: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>): Promise<TestCase[]> {
        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            select: { id: true },
        });

        if (!problem) {
            throw new ApiError(404, 'Problem not found');
        }

        await prisma.testCase.createMany({
            data: testCases.map((testCase) => ({
                problemId,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                isHidden: testCase.isHidden ?? true,
            })),
        });

        return prisma.testCase.findMany({
            where: { problemId },
            orderBy: { id: 'asc' },
        });
    }

    static async findAll(filters: { lessonId?: string }): Promise<Problem[]> {
        return prisma.problem.findMany({
            where: {
                ...(filters.lessonId ? { lessonId: filters.lessonId } : {}),
            },
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                lesson: true,
            },
        });
    }

    static async findByLessonId(lessonId: string): Promise<Problem[]> {
        return this.findAll({ lessonId });
    }

    static async findById(id: string) {
        return prisma.problem.findUnique({
            where: { id },
            include: {
                lesson: {
                    include: {
                        course: true,
                    },
                },
                testCases: true,
            },
        });
    }
}
