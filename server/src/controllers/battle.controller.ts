import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/errors';
import { BattleService } from '../services/battle.service';

export class BattleController {
    static async createRoom(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const room = await BattleService.createRoom({
                teacherId: req.user.id,
                problemId: req.body.problemId,
                problemIds: req.body.problemIds,
                duration: req.body.duration,
                maxParticipants: req.body.maxParticipants,
            });

            res.status(201).json({
                success: true,
                message: 'Battle room created successfully',
                room,
            });
        } catch (error) {
            next(error);
        }
    }

    static async startRoom(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const roomId = String(req.params.roomId);
            const room = await BattleService.startRoom(roomId, req.user.id);

            res.status(200).json({
                success: true,
                message: 'Battle started successfully',
                room,
            });
        } catch (error) {
            next(error);
        }
    }

    static async endRoom(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const roomId = String(req.params.roomId);
            const room = await BattleService.endRoom(roomId, req.user.id, req.body.reason);

            res.status(200).json({
                success: true,
                message: 'Battle ended successfully',
                room,
            });
        } catch (error) {
            next(error);
        }
    }

    static async joinRoom(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const room = await BattleService.joinRoomByCode({
                roomCode: req.body.roomCode,
                userId: req.user.id,
            });

            res.status(200).json({
                success: true,
                message: 'Joined battle room successfully',
                room,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getRoom(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const roomId = String(req.params.roomId);
            const room = await BattleService.getRoomSnapshotForUser(roomId, req.user.id);

            res.status(200).json({
                success: true,
                room,
            });
        } catch (error) {
            next(error);
        }
    }
}
