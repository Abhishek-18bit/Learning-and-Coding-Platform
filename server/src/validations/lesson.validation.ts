import { z } from 'zod';

export const createLessonSchema = z.object({
    courseId: z.string().uuid('Invalid Course ID'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().optional(),
});

export const generateLessonQuizSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    questionCount: z.number().int('Question count must be an integer').min(5, 'Question count must be at least 5').max(10, 'Question count must be at most 10').default(5),
});
