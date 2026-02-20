import { z } from 'zod';

const optionsSchema = z
    .record(z.string(), z.string().min(1, 'Option text is required'))
    .refine((options) => Object.keys(options).length === 4, {
        message: 'Each question must contain exactly 4 options',
    });

const manualQuestionSchema = z
    .object({
        question: z.string().min(1, 'Question text is required'),
        options: optionsSchema,
        correctOption: z.string().min(1, 'Correct option is required'),
        explanation: z.string().min(1, 'Explanation is required').optional().default('No explanation provided'),
        marks: z.number().int().positive('Marks must be a positive integer').optional().default(1),
    })
    .superRefine((question, ctx) => {
        if (!Object.prototype.hasOwnProperty.call(question.options, question.correctOption)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['correctOption'],
                message: 'Correct option must match one of the 4 provided options',
            });
        }
    });

export const createQuizSchema = z
    .object({
        courseId: z.string().uuid('Invalid Course ID').optional(),
        lessonId: z.string().uuid('Invalid Lesson ID').optional(),
        title: z.string().min(3, 'Title must be at least 3 characters'),
        difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
        questions: z.array(manualQuestionSchema).min(1, 'At least one question is required'),
    })
    .superRefine((quiz, ctx) => {
        if (!quiz.lessonId && !quiz.courseId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['lessonId'],
                message: 'Either lessonId or courseId is required',
            });
        }
    });

export const addQuestionSchema = manualQuestionSchema;
