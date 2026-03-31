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
                    createdAt: user.createdAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Not authenticated');
            }

            const updatedUser = await UserService.updateProfile(req.user.id, req.body);

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    createdAt: updatedUser.createdAt,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Not authenticated');
            }

            await UserService.changePassword(req.user.id, req.body);

            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}
