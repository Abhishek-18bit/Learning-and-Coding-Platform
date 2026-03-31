import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/errors';
import { ChatService } from '../services/chat.service';

export class ChatController {
    static async getContextMessages(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const limitParam = typeof req.query.limit === 'string'
                ? Number.parseInt(req.query.limit, 10)
                : undefined;
            const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

            const result = await ChatService.getContextMessages({
                userId: req.user.id,
                role: req.user.role,
                contextType: String(req.params.contextType || ''),
                contextId: String(req.params.contextId || ''),
                limit: Number.isFinite(limitParam) ? limitParam : undefined,
                cursor,
            });

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    static async createMessage(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const result = await ChatService.createContextMessage({
                userId: req.user.id,
                role: req.user.role,
                contextType: String(req.params.contextType || ''),
                contextId: String(req.params.contextId || ''),
                content: req.body.content,
                type: req.body.type,
            });

            const contextType = String(req.params.contextType || '').toUpperCase();
            const contextId = String(req.params.contextId || '').trim();
            const { getIO } = await import('../utils/socket');
            getIO()
                .to(ChatService.getSocketRoom(result.channel.id))
                .emit('chat_message', {
                    channelId: result.channel.id,
                    contextType,
                    contextId,
                    message: result.message,
                });

            res.status(201).json({
                success: true,
                status: 'Message sent',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    static async markRead(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const readState = await ChatService.markContextRead({
                userId: req.user.id,
                role: req.user.role,
                contextType: String(req.params.contextType || ''),
                contextId: String(req.params.contextId || ''),
                messageId: req.body.messageId,
            });

            res.status(200).json({
                success: true,
                readState,
            });
        } catch (error) {
            next(error);
        }
    }
}
