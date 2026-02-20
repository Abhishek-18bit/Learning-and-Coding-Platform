import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';
import { ApiError } from '../utils/errors';

export class UserController {
    static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Not authenticated');
            }

            const user = await UserService.findById(req.user.id);
            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            res.status(200).json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
