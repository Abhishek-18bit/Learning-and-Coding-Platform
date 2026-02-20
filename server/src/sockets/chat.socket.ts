import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';
import { config } from '../utils/config';
import { ChatService } from '../services/chat.service';

const SOCKET_EVENTS = {
    join: 'join_chat',
    leave: 'leave_chat',
    send: 'send_chat_message',
    read: 'mark_chat_read',
    joined: 'chat_joined',
    message: 'chat_message',
    readReceipt: 'chat_read_receipt',
    error: 'chat_error',
} as const;

type SocketJwtPayload = {
    id: string;
    role: string;
};

type ChatSocket = Socket & {
    data: Socket['data'] & {
        userId?: string;
        role?: string;
        chatRooms?: Set<string>;
    };
};

type JoinPayload = {
    contextType?: string;
    contextId?: string;
    userId?: string;
};

type LeavePayload = {
    channelId?: string;
};

type SendPayload = {
    contextType?: string;
    contextId?: string;
    content?: string;
    type?: 'TEXT' | 'CODE';
    userId?: string;
};

type ReadPayload = {
    contextType?: string;
    contextId?: string;
    messageId?: string;
    userId?: string;
};

const resolveJwt = (socket: ChatSocket): SocketJwtPayload | null => {
    const authToken = typeof socket.handshake.auth?.token === 'string'
        ? socket.handshake.auth.token
        : undefined;

    const headerTokenRaw = socket.handshake.headers.authorization;
    const headerToken = typeof headerTokenRaw === 'string'
        ? headerTokenRaw
        : Array.isArray(headerTokenRaw)
            ? headerTokenRaw[0]
            : undefined;

    const rawToken = authToken || headerToken;
    if (!rawToken) {
        return null;
    }

    const token = rawToken.startsWith('Bearer ')
        ? rawToken.slice(7)
        : rawToken;

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as SocketJwtPayload;
        if (!decoded?.id || !decoded?.role) {
            return null;
        }
        return decoded;
    } catch (_error) {
        return null;
    }
};

const resolveUser = async (socket: ChatSocket, fallbackUserId?: unknown) => {
    if (socket.data.userId && socket.data.role) {
        return {
            id: socket.data.userId,
            role: socket.data.role,
        };
    }

    const decoded = resolveJwt(socket);
    if (decoded) {
        socket.data.userId = decoded.id;
        socket.data.role = decoded.role;
        return decoded;
    }

    if (typeof fallbackUserId === 'string' && fallbackUserId.trim()) {
        const user = await prisma.user.findUnique({
            where: { id: fallbackUserId.trim() },
            select: { id: true, role: true },
        });
        if (user) {
            socket.data.userId = user.id;
            socket.data.role = user.role;
            return {
                id: user.id,
                role: user.role,
            };
        }
    }

    throw new ApiError(401, 'Unauthorized chat socket request');
};

const normalizeChannelId = (channelId: unknown): string => {
    if (typeof channelId !== 'string' || !channelId.trim()) {
        throw new ApiError(400, 'channelId is required');
    }
    return channelId.trim();
};

const emitSocketError = (socket: Socket, error: unknown) => {
    if (error instanceof ApiError) {
        socket.emit(SOCKET_EVENTS.error, {
            message: error.message,
            statusCode: error.statusCode,
            errors: error.errors,
        });
        return;
    }

    console.error('Chat socket error:', error);
    socket.emit(SOCKET_EVENTS.error, {
        message: 'Unexpected chat socket error',
        statusCode: 500,
    });
};

export const registerChatSocketHandlers = (io: Server) => {
    io.on('connection', (rawSocket) => {
        const socket = rawSocket as ChatSocket;
        if (!socket.data.chatRooms) {
            socket.data.chatRooms = new Set<string>();
        }

        socket.on(SOCKET_EVENTS.join, async (payload: JoinPayload = {}) => {
            try {
                const user = await resolveUser(socket, payload.userId);
                const channel = await ChatService.resolveChannelForSocket({
                    userId: user.id,
                    role: user.role,
                    contextType: String(payload.contextType || ''),
                    contextId: String(payload.contextId || ''),
                });

                const socketRoom = ChatService.getSocketRoom(channel.id);
                await socket.join(socketRoom);
                socket.data.chatRooms?.add(socketRoom);

                socket.emit(SOCKET_EVENTS.joined, {
                    channel,
                    contextType: String(payload.contextType || '').toUpperCase(),
                    contextId: String(payload.contextId || ''),
                });
            } catch (error) {
                emitSocketError(socket, error);
            }
        });

        socket.on(SOCKET_EVENTS.leave, async (payload: LeavePayload = {}) => {
            try {
                const channelId = normalizeChannelId(payload.channelId);
                const socketRoom = ChatService.getSocketRoom(channelId);
                await socket.leave(socketRoom);
                socket.data.chatRooms?.delete(socketRoom);
            } catch (error) {
                emitSocketError(socket, error);
            }
        });

        socket.on(SOCKET_EVENTS.send, async (payload: SendPayload = {}) => {
            try {
                const user = await resolveUser(socket, payload.userId);
                const result = await ChatService.createContextMessage({
                    userId: user.id,
                    role: user.role,
                    contextType: String(payload.contextType || ''),
                    contextId: String(payload.contextId || ''),
                    content: String(payload.content || ''),
                    type: payload.type,
                });

                io.to(ChatService.getSocketRoom(result.channel.id)).emit(SOCKET_EVENTS.message, {
                    channelId: result.channel.id,
                    contextType: String(payload.contextType || '').toUpperCase(),
                    contextId: String(payload.contextId || ''),
                    message: result.message,
                });
            } catch (error) {
                emitSocketError(socket, error);
            }
        });

        socket.on(SOCKET_EVENTS.read, async (payload: ReadPayload = {}) => {
            try {
                const user = await resolveUser(socket, payload.userId);
                const readState = await ChatService.markContextRead({
                    userId: user.id,
                    role: user.role,
                    contextType: String(payload.contextType || ''),
                    contextId: String(payload.contextId || ''),
                    messageId: payload.messageId,
                });

                io.to(ChatService.getSocketRoom(readState.channelId)).emit(SOCKET_EVENTS.readReceipt, readState);
            } catch (error) {
                emitSocketError(socket, error);
            }
        });

        socket.on('disconnect', () => {
            socket.data.chatRooms?.clear();
        });
    });
};
