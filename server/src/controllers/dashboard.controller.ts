import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { DashboardService } from '../services/dashboard.service';
import { ApiError } from '../utils/errors';

export class DashboardController {
    static async getStudentDashboard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const data = await DashboardService.getStudentData(req.user.id);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTeacherDashboard(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const data = await DashboardService.getTeacherData(req.user.id);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    static async getPlatformStats(_req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await DashboardService.getPlatformStats();

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }
}
