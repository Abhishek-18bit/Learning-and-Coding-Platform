import { z } from 'zod';

export const createProblemSchema = z.object({
    lessonId: z.string().uuid('Invalid Lesson ID').optional(),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    inputFormat: z.string().min(3, 'Input format is required'),
    outputFormat: z.string().min(3, 'Output format is required'),
    constraints: z.string().min(3, 'Constraints are required'),
    starterCode: z.string().min(1, 'Starter code is required'),
});

export const addTestCasesSchema = z.object({
    testCases: z.array(z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().default(true).optional(),
    })).min(1, 'At least one test case is required'),
});
