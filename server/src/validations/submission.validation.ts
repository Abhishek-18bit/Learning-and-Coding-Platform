import { z } from 'zod';

export const submitCodeSchema = z.object({
    problemId: z.string().uuid('Invalid Problem ID'),
    language: z.string().min(1, 'Language is required'),
    code: z.string().min(1, 'Code cannot be empty'),
});

export const submitCodeByProblemSchema = z.object({
    language: z.string().min(1, 'Language is required'),
    code: z.string().min(1, 'Code cannot be empty'),
});

export const runCustomCodeByProblemSchema = z.object({
    language: z.string().min(1, 'Language is required'),
    code: z.string().min(1, 'Code cannot be empty'),
    input: z.string().max(10000, 'Input is too large'),
    expectedOutput: z.string().max(10000, 'Expected output is too large').optional(),
});
