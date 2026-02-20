import { z } from 'zod';

export const createInterviewQuestionSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        content: z.string().min(1, 'Content is required'),
        category: z.string().min(1, 'Category is required'),
    }),
});

export const markCompletedSchema = z.object({
    body: z.object({
        interviewQuestionId: z.string().uuid('Invalid question ID'),
    }),
});
