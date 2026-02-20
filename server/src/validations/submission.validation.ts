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
