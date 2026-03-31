import { z } from 'zod';

export const createCourseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().optional(),
});

export const createCourseUnitSchema = z.object({
    title: z.string().min(2, 'Unit title must be at least 2 characters').max(80, 'Unit title must be at most 80 characters'),
    sortOrder: z.number().int('Sort order must be an integer').positive('Sort order must be positive').optional(),
    estimatedHours: z.number().int('Estimated hours must be an integer').positive('Estimated hours must be positive').max(500, 'Estimated hours must be at most 500').optional(),
});

export const createCourseTopicSchema = z.object({
    title: z.string().min(2, 'Topic title must be at least 2 characters').max(120, 'Topic title must be at most 120 characters'),
    lessonId: z.string().uuid('Invalid lesson ID').optional(),
    sortOrder: z.number().int('Sort order must be an integer').positive('Sort order must be positive').optional(),
    estimatedMinutes: z.number().int('Estimated minutes must be an integer').positive('Estimated minutes must be positive').max(240, 'Estimated minutes must be at most 240').optional(),
});

export const reorderCourseUnitsSchema = z.object({
    unitIds: z.array(z.string().uuid('Invalid unit ID')).min(1, 'At least one unit is required'),
});

export const reorderCourseTopicsSchema = z.object({
    topicIds: z.array(z.string().uuid('Invalid topic ID')).min(1, 'At least one topic is required'),
});

export const getCoursesQuerySchema = z.object({
    page: z.string().optional().transform(v => parseInt(v || '1')),
    limit: z.string().optional().transform(v => parseInt(v || '10')),
});
