import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';
import { ApiError } from '../utils/errors';

export const validateBody = (schema: ZodType<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                const errorMessage = error.issues.map(issue => issue.message).join(', ');
                return next(new ApiError(400, errorMessage, errors));
            }
            next(error);
        }
    };
};
