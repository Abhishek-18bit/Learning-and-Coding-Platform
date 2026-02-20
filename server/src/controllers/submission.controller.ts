import { Response, NextFunction } from 'express';
import { SubmissionService } from '../services/submission.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/errors';

export class SubmissionController {
    static async submit(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const result = await SubmissionService.submitAndEvaluate({
                studentId: req.user.id,
                problemId: req.body.problemId,
                code: req.body.code,
                language: req.body.language,
            });

            res.status(201).json({
                success: true,
                message: 'Code submitted and evaluated',
                submission: result.submission,
                summary: {
                    passedTestCount: result.summary.passedCount,
                    failedTestCount: result.summary.failedCount,
                    executionTime: result.summary.executionTime,
                    finalVerdict: result.summary.finalVerdict,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async getMySubmissions(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const submissions = await SubmissionService.findByUserId(req.user.id);

            res.status(200).json({
                success: true,
                submissions,
            });
        } catch (error) {
            next(error);
        }
    }
}
