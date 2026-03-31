import { z } from 'zod';

const minDurationMinutes = 5;
const maxDurationMinutes = 180;
const maxTeacherEndReasonLength = 240;
const maxRoomProblems = 25;
const problemIdSchema = z.string().uuid('Invalid problem ID');

export const createBattleRoomSchema = z
    .object({
        problemId: problemIdSchema.optional(),
        problemIds: z
            .array(problemIdSchema)
            .min(1, 'At least one problem is required')
            .max(maxRoomProblems, `A room can include at most ${maxRoomProblems} problems`)
            .optional(),
        duration: z
            .number()
            .int('Duration must be an integer')
            .min(minDurationMinutes, `Duration must be at least ${minDurationMinutes} minutes`)
            .max(maxDurationMinutes, `Duration must be at most ${maxDurationMinutes} minutes`),
        maxParticipants: z
            .number()
            .int('Max participants must be an integer')
            .min(2, 'Max participants must be at least 2')
            .max(500, 'Max participants must be at most 500')
            .optional(),
    })
    .superRefine((value, context) => {
        const normalizedProblemIds = [
            ...(Array.isArray(value.problemIds) ? value.problemIds : []),
            ...(typeof value.problemId === 'string' ? [value.problemId] : []),
        ];

        if (normalizedProblemIds.length === 0) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['problemIds'],
                message: 'At least one problem is required',
            });
            return;
        }

        if (normalizedProblemIds.length > maxRoomProblems) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['problemIds'],
                message: `A room can include at most ${maxRoomProblems} problems`,
            });
            return;
        }

        if (new Set(normalizedProblemIds).size !== normalizedProblemIds.length) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['problemIds'],
                message: 'Duplicate problems are not allowed',
            });
        }
    });

export const joinBattleRoomSchema = z.object({
    roomCode: z
        .string()
        .trim()
        .length(6, 'Room code must be 6 characters')
        .regex(/^[A-Za-z0-9]+$/, 'Room code can only contain letters and numbers'),
});

export const endBattleRoomSchema = z.object({
    reason: z
        .string()
        .trim()
        .max(maxTeacherEndReasonLength, `Reason cannot exceed ${maxTeacherEndReasonLength} characters`)
        .optional(),
});
