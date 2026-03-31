import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { ApiError } from '../utils/errors';
import { config } from '../utils/config';
import { BattleService } from '../services/battle.service';

const SOCKET_EVENTS = {
    joinRoom: 'join_room',
    leaveRoom: 'leave_room',
    submitAttempt: 'submit_attempt',
    startBattle: 'start_battle',
    roomJoined: 'room_joined',
    submissionResult: 'submission_result',
    error: 'error_event',
} as const;

type SocketJwtPayload = {
    id: string;
    role: string;
};

type BattleSocket = Socket & {
    data: Socket['data'] & {
        userId?: string;
        battleRooms?: Set<string>;
    };
};

type JoinRoomPayload = {
    roomId?: string;
    roomCode?: string;
    userId?: string;
};

type LeaveRoomPayload = {
    roomId?: string;
    userId?: string;
};

type StartBattlePayload = {
    roomId?: string;
    userId?: string;
};

type SubmitAttemptPayload = {
    roomId?: string;
    problemId?: string;
    code?: string;
    language?: string;
    userId?: string;
};

const resolveJwtFromSocket = (socket: BattleSocket): SocketJwtPayload | null => {
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
        if (!decoded?.id) {
            return null;
        }
        return decoded;
    } catch (_error) {
        return null;
    }
};

const resolveUserId = (socket: BattleSocket, fallbackUserId?: unknown): string => {
    const decoded = resolveJwtFromSocket(socket);
    if (decoded?.id) {
        const fallback = typeof fallbackUserId === 'string' ? fallbackUserId.trim() : '';
        if (fallback && fallback !== decoded.id) {
            throw new ApiError(401, 'Socket identity mismatch');
        }
        socket.data.userId = decoded.id;
        return decoded.id;
    }

    if (typeof fallbackUserId === 'string' && fallbackUserId.trim()) {
        const userId = fallbackUserId.trim();
        socket.data.userId = userId;
        return userId;
    }

    if (socket.data.userId) {
        return socket.data.userId;
    }

    throw new ApiError(401, 'Unauthorized socket request');
};

const normalizeRoomId = (roomId: unknown): string => {
    if (typeof roomId !== 'string' || !roomId.trim()) {
        throw new ApiError(400, 'roomId is required');
    }
    return roomId.trim();
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

    console.error('Battle socket error:', error);
    socket.emit(SOCKET_EVENTS.error, {
        message: 'Unexpected battle socket error',
        statusCode: 500,
    });
};

export const registerBattleSocketHandlers = (io: Server) => {
    io.on('connection', (rawSocket) => {
        const socket = rawSocket as BattleSocket;
        if (!socket.data.battleRooms) {
            socket.data.battleRooms = new Set<string>();
        }

        socket.on(SOCKET_EVENTS.joinRoom, async (payload: JoinRoomPayload = {}) => {
            try {
                const userId = resolveUserId(socket, payload.userId);

                let roomId: string;
                let snapshot;

                if (typeof payload.roomCode === 'string' && payload.roomCode.trim()) {
                    snapshot = await BattleService.joinRoomByCode({
                        roomCode: payload.roomCode,
                        userId,
                    });
                    roomId = snapshot.id;
                } else {
                    roomId = normalizeRoomId(payload.roomId);
                    snapshot = await BattleService.handleSocketJoin(roomId, userId);
                }

                const socketRoom = BattleService.getSocketRoom(roomId);
                await socket.join(socketRoom);
                socket.data.battleRooms?.add(roomId);

                socket.emit(SOCKET_EVENTS.roomJoined, {
                    roomId,
                    room: snapshot,
                });
            } catch (error) {
                emitSocketError(socket, error);
            }
        });

        socket.on(SOCKET_EVENTS.leaveRoom, async (payload: LeaveRoomPayload = {}) => {
            try {
                const userId = resolveUserId(socket, payload.userId);
                const roomId = normalizeRoomId(payload.roomId);

                await BattleService.handleSocketLeave(roomId, userId);
                await socket.leave(BattleService.getSocketRoom(roomId));
                socket.data.battleRooms?.delete(roomId);
            } catch (error) {
                emitSocketError(socket, error);
            }
        });

        socket.on(SOCKET_EVENTS.submitAttempt, async (payload: SubmitAttemptPayload = {}) => {
            try {
                const userId = resolveUserId(socket, payload.userId);
                const roomId = normalizeRoomId(payload.roomId);

                const result = await BattleService.submitBattleAttempt({
                    roomId,
                    problemId: typeof payload.problemId === 'string' ? payload.problemId : undefined,
                    userId,
                    code: String(payload.code || ''),
                    language: String(payload.language || ''),
                });

                socket.emit(SOCKET_EVENTS.submissionResult, {
                    roomId,
                    problemId: result.problemId,
                    submission: {
                        id: result.submission.id,
                        problemId: result.submission.problemId,
                        attemptNumber: result.submission.attemptNumber,
                        isCorrect: result.submission.isCorrect,
                        timeTaken: result.submission.timeTaken,
                        submissionTime: result.submission.submissionTime,
                    },
                    summary: {
                        passedTestCount: result.summary.passedCount,
                        failedTestCount: result.summary.failedCount,
                        executionTime: result.summary.executionTime,
                        finalVerdict: result.summary.finalVerdict,
                    },
                    remainingTimeMs: result.remainingTimeMs,
                });
            } catch (error) {
                emitSocketError(socket, error);
            }
        });

        socket.on(SOCKET_EVENTS.startBattle, async (payload: StartBattlePayload = {}) => {
            try {
                const userId = resolveUserId(socket, payload.userId);
                const roomId = normalizeRoomId(payload.roomId);
                const socketRoom = BattleService.getSocketRoom(roomId);

                await socket.join(socketRoom);
                socket.data.battleRooms?.add(roomId);
                await BattleService.startRoom(roomId, userId);
            } catch (error) {
                emitSocketError(socket, error);
            }
        });

        socket.on('disconnect', () => {
            const userId = socket.data.userId || resolveJwtFromSocket(socket)?.id;
            const battleRooms: string[] = Array.from(
                (socket.data.battleRooms ?? new Set<string>()) as Set<string>
            );
            if (typeof userId !== 'string' || battleRooms.length === 0) {
                return;
            }

            void Promise.allSettled(
                battleRooms.map((roomId) => BattleService.handleSocketLeave(roomId, userId))
            );
        });
    });
};
