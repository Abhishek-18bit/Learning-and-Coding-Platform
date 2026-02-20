import { z } from 'zod';

export const createChatMessageSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, 'Message content is required')
        .max(2000, 'Message cannot exceed 2000 characters'),
    type: z
        .enum(['TEXT', 'CODE'])
        .optional()
        .default('TEXT'),
});

export const markChatReadSchema = z.object({
    messageId: z.string().uuid('Invalid message ID').optional(),
});
