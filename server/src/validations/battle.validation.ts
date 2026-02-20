import { z } from 'zod';

const allowedDurations = [15, 30, 60] as const;

export const createBattleRoomSchema = z.object({
    problemId: z.string().uuid('Invalid problem ID'),
    duration: z
        .number()
        .int('Duration must be an integer')
        .refine((value) => allowedDurations.includes(value as (typeof allowedDurations)[number]), {
            message: 'Duration must be one of: 15, 30, 60 minutes',
        }),
    maxParticipants: z
        .number()
        .int('Max participants must be an integer')
        .min(2, 'Max participants must be at least 2')
        .max(500, 'Max participants must be at most 500')
        .optional(),
});

export const joinBattleRoomSchema = z.object({
    roomCode: z
        .string()
        .trim()
        .length(6, 'Room code must be 6 characters')
        .regex(/^[A-Za-z0-9]+$/, 'Room code can only contain letters and numbers'),
});
