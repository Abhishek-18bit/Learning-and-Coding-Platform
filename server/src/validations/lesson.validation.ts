import { z } from 'zod';

export const createLessonSchema = z.object({
    courseId: z.string().uuid('Invalid Course ID'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().optional(),
    unitId: z.string().uuid('Invalid Unit ID').optional(),
    topicId: z.string().uuid('Invalid Topic ID').optional(),
    unitTitle: z.string().min(2, 'Unit title must be at least 2 characters').max(80, 'Unit title must be at most 80 characters').optional(),
    topicTitle: z.string().min(2, 'Topic title must be at least 2 characters').max(120, 'Topic title must be at most 120 characters').optional(),
    topicOrder: z.number().int('Topic order must be an integer').positive('Topic order must be positive').optional(),
    estimatedMinutes: z.number().int('Estimated minutes must be an integer').positive('Estimated minutes must be positive').max(240, 'Estimated minutes must be at most 240').optional(),
});

export const generateLessonQuizSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    questionCount: z.number().int('Question count must be an integer').min(5, 'Question count must be at least 5').max(10, 'Question count must be at most 10').default(5),
    deadline: z.string().datetime({ offset: true, message: 'Deadline must be a valid ISO datetime' }).optional(),
});
