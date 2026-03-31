import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/errors';
import { AchievementService } from '../services/achievement.service';

export class AchievementController {
    static async getMyAchievements(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const data = await AchievementService.getUserAchievements(req.user.id);

            res.status(200).json({
                success: true,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
}
