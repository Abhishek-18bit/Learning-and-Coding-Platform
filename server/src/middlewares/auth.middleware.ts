import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { ApiError } from '../utils/errors';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError(401, 'Unauthorized: No token provided'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as { id: string; role: string };
        req.user = decoded;
        next();
    } catch (error) {
        return next(new ApiError(401, 'Unauthorized: Invalid token'));
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new ApiError(401, 'Unauthorized: User not authenticated'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, 'Forbidden: You do not have permission to access this resource'));
        }

        next();
    };
};
