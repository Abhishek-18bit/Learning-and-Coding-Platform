import { BattleRoom, BattleRoomStatus, Role, SubmissionStatus } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';
import { ExecutionEngineService } from './execution-engine.service';
import { getIO } from '../utils/socket';

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ALLOWED_DURATIONS = new Set([15, 30, 60]);
const DEFAULT_MAX_PARTICIPANTS = 100;
const MAX_ROOM_CODE_ATTEMPTS = 25;
const TIMER_SYNC_INTERVAL_MS = 5_000;

export interface BattleLeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    isCorrect: boolean;
    attemptNumber: number;
    timeTaken: number | null;
    submissionTime: string | null;
}

export interface BattleRoomSnapshot {
    id: string;
    roomCode: string;
    problemId: string;
    problemTitle: string;
    teacherId: string;
    status: BattleRoomStatus;
    duration: number;
    maxParticipants: number;
    startTime: string | null;
    endTime: string | null;
    participantCount: number;
    connectedParticipants: number;
    remainingTimeMs: number;
    leaderboard: BattleLeaderboardEntry[];
}

interface RuntimeLeaderboardEntry {
    userId: string;
    name: string;
    isCorrect: boolean;
    attemptNumber: number;
    timeTaken: number | null;
    submissionTime: Date | null;
}

interface RuntimeRoomState {
    leaderboard: Map<string, RuntimeLeaderboardEntry>;
    timer: NodeJS.Timeout | null;
}

interface SubmitAttemptInput {
    roomId: string;
    userId: string;
    code: string;
    language: string;
}

export class BattleService {
    private static runtime = new Map<string, RuntimeRoomState>();

    static async createRoom(input: {
        teacherId: string;
        problemId: string;
        duration: number;
        maxParticipants?: number;
    }): Promise<BattleRoom> {
        await this.assertTeacherRole(input.teacherId);
        this.assertDuration(input.duration);

        const maxParticipants = input.maxParticipants ?? DEFAULT_MAX_PARTICIPANTS;
        if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 500) {
            throw new ApiError(400, 'maxParticipants must be between 2 and 500');
        }

        const problem = await prisma.problem.findUnique({
            where: { id: input.problemId },
            select: { id: true },
        });
        if (!problem) {
            throw new ApiError(404, 'Problem not found');
        }

        const roomCode = await this.generateUniqueRoomCode();
        const room = await prisma.battleRoom.create({
            data: {
                roomCode,
                problemId: input.problemId,
                teacherId: input.teacherId,
                duration: input.duration,
                maxParticipants,
                status: BattleRoomStatus.WAITING,
            },
        });

        this.ensureRuntime(room.id);
        return room;
    }

    static async joinRoomByCode(input: { roomCode: string; userId: string }) {
        const normalizedCode = input.roomCode.trim().toUpperCase();
        const room = await prisma.battleRoom.findUnique({
            where: { roomCode: normalizedCode },
            select: {
                id: true,
                status: true,
                maxParticipants: true,
                _count: {
                    select: {
                        participants: true,
                    },
                },
            },
        });

        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        if (room.status !== BattleRoomStatus.WAITING) {
            throw new ApiError(400, 'Room is no longer accepting joins');
        }

        const existing = await prisma.battleParticipant.findUnique({
            where: {
                roomId_userId: {
                    roomId: room.id,
                    userId: input.userId,
                },
            },
        });

        if (existing) {
            if (!existing.isConnected) {
                await prisma.battleParticipant.update({
                    where: { id: existing.id },
                    data: { isConnected: true },
                });
            }
            await this.hydrateRoomState(room.id);
            await this.emitParticipantUpdate(room.id);
            return this.getRoomSnapshot(room.id);
        }

        if (room._count.participants >= room.maxParticipants) {
            throw new ApiError(409, 'Room is full');
        }

        await prisma.battleParticipant.create({
            data: {
                roomId: room.id,
                userId: input.userId,
                isConnected: true,
            },
        });

        await this.hydrateRoomState(room.id);
        await this.emitParticipantUpdate(room.id);
        return this.getRoomSnapshot(room.id);
    }

    static async startRoom(roomId: string, teacherId: string) {
        const room = await prisma.battleRoom.findUnique({
            where: { id: roomId },
            select: {
                id: true,
                teacherId: true,
                duration: true,
                status: true,
                endTime: true,
            },
        });

        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        await this.assertTeacherOwnsRoom(room.teacherId, teacherId);

        if (room.status === BattleRoomStatus.ENDED) {
            throw new ApiError(400, 'Battle already ended and cannot be restarted');
        }

        if (room.status === BattleRoomStatus.LIVE) {
            return this.getRoomSnapshot(room.id);
        }

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + room.duration * 60_000);

        await prisma.battleRoom.update({
            where: { id: room.id },
            data: {
                status: BattleRoomStatus.LIVE,
                startTime,
                endTime,
            },
        });

        await this.hydrateRoomState(room.id);
        this.startRoomTimer(room.id, endTime);

        const snapshot = await this.getRoomSnapshot(room.id);
        const io = getIO();
        io.to(this.getSocketRoom(room.id)).emit('battle_started', {
            roomId: room.id,
            startTime: snapshot.startTime,
            endTime: snapshot.endTime,
            remainingTimeMs: snapshot.remainingTimeMs,
        });
        io.to(this.getSocketRoom(room.id)).emit('timer_sync', {
            roomId: room.id,
            status: BattleRoomStatus.LIVE,
            remainingTimeMs: snapshot.remainingTimeMs,
            endTime: snapshot.endTime,
            serverTime: new Date().toISOString(),
        });
        io.to(this.getSocketRoom(room.id)).emit('leaderboard_update', {
            roomId: room.id,
            leaderboard: snapshot.leaderboard,
        });

        return snapshot;
    }

    static async endRoom(roomId: string, teacherId: string) {
        await this.assertCanEndRoom(roomId, teacherId);
        return this.endRoomInternal(roomId, 'MANUAL');
    }

    static async getRoomSnapshot(roomId: string): Promise<BattleRoomSnapshot> {
        const room = await prisma.battleRoom.findUnique({
            where: { id: roomId },
            select: {
                id: true,
                roomCode: true,
                problemId: true,
                teacherId: true,
                status: true,
                duration: true,
                maxParticipants: true,
                startTime: true,
                endTime: true,
                problem: {
                    select: {
                        title: true,
                    },
                },
            },
        });

        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        await this.hydrateRoomState(room.id);

        const [participantCount, connectedParticipants] = await Promise.all([
            prisma.battleParticipant.count({ where: { roomId: room.id } }),
            prisma.battleParticipant.count({ where: { roomId: room.id, isConnected: true } }),
        ]);

        return {
            id: room.id,
            roomCode: room.roomCode,
            problemId: room.problemId,
            problemTitle: room.problem.title,
            teacherId: room.teacherId,
            status: room.status,
            duration: room.duration,
            maxParticipants: room.maxParticipants,
            startTime: room.startTime ? room.startTime.toISOString() : null,
            endTime: room.endTime ? room.endTime.toISOString() : null,
            participantCount,
            connectedParticipants,
            remainingTimeMs: this.calculateRemainingTimeMs(room.status, room.endTime),
            leaderboard: this.buildLeaderboard(room.id),
        };
    }

    static async getRoomSnapshotForUser(roomId: string, userId: string): Promise<BattleRoomSnapshot> {
        const room = await prisma.battleRoom.findUnique({
            where: { id: roomId },
            select: { teacherId: true },
        });
        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const isRoomTeacher = room.teacherId === userId;
        const isAdmin = user.role === Role.ADMIN;
        if (!isRoomTeacher && !isAdmin) {
            const participant = await prisma.battleParticipant.findUnique({
                where: {
                    roomId_userId: {
                        roomId,
                        userId,
                    },
                },
                select: { id: true },
            });
            if (!participant) {
                throw new ApiError(403, 'Forbidden: You are not a participant of this room');
            }
        }

        return this.getRoomSnapshot(roomId);
    }

    static async handleSocketJoin(roomId: string, userId: string) {
        const room = await prisma.battleRoom.findUnique({
            where: { id: roomId },
            select: { id: true, teacherId: true },
        });
        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        if (room.teacherId !== userId) {
            const participant = await prisma.battleParticipant.findUnique({
                where: {
                    roomId_userId: {
                        roomId,
                        userId,
                    },
                },
            });
            if (!participant) {
                throw new ApiError(403, 'You are not a participant of this room');
            }
        }

        await prisma.battleParticipant.updateMany({
            where: { roomId, userId },
            data: { isConnected: true },
        });

        await this.emitParticipantUpdate(roomId);
        return this.getRoomSnapshot(roomId);
    }

    static async handleSocketLeave(roomId: string, userId: string) {
        await prisma.battleParticipant.updateMany({
            where: { roomId, userId },
            data: { isConnected: false },
        });
        await this.emitParticipantUpdate(roomId);
    }

    static async submitBattleAttempt(input: SubmitAttemptInput) {
        const trimmedCode = String(input.code ?? '').trim();
        if (!trimmedCode) {
            throw new ApiError(400, 'Code is required');
        }

        const room = await prisma.battleRoom.findUnique({
            where: { id: input.roomId },
            include: {
                problem: {
                    include: {
                        testCases: true,
                    },
                },
            },
        });

        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        if (room.status !== BattleRoomStatus.LIVE || !room.startTime || !room.endTime) {
            throw new ApiError(400, 'Battle is not live');
        }

        const participant = await prisma.battleParticipant.findUnique({
            where: {
                roomId_userId: {
                    roomId: input.roomId,
                    userId: input.userId,
                },
            },
        });
        if (!participant) {
            throw new ApiError(403, 'Join the room before submitting');
        }

        const now = new Date();
        if (now.getTime() >= room.endTime.getTime()) {
            await this.endRoomInternal(room.id, 'TIME_UP');
            throw new ApiError(400, 'Battle has ended');
        }

        if (room.problem.testCases.length === 0) {
            throw new ApiError(400, 'Battle problem has no test cases configured');
        }

        const summary = await ExecutionEngineService.run({
            code: trimmedCode,
            language: input.language,
            testCases: room.problem.testCases.map((testCase) => ({
                id: testCase.id,
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                isHidden: testCase.isHidden,
            })),
        });

        const isCorrect = summary.finalVerdict === SubmissionStatus.ACCEPTED;
        const timeTaken = Math.max(0, now.getTime() - room.startTime.getTime());

        const submission = await this.createBattleSubmissionWithRetry({
            roomId: room.id,
            userId: input.userId,
            isCorrect,
            submissionTime: now,
            timeTaken,
            language: input.language,
        });

        await this.updateLeaderboardCache({
            roomId: room.id,
            userId: input.userId,
            attemptNumber: submission.attemptNumber,
            isCorrect,
            timeTaken,
            submissionTime: submission.submissionTime,
        });

        const leaderboard = this.buildLeaderboard(room.id);
        const io = getIO();
        io.to(this.getSocketRoom(room.id)).emit('leaderboard_update', {
            roomId: room.id,
            leaderboard,
        });

        return {
            submission,
            summary,
            leaderboard,
            remainingTimeMs: this.calculateRemainingTimeMs(BattleRoomStatus.LIVE, room.endTime),
        };
    }

    static async bootstrapLiveRooms() {
        const rooms = await prisma.battleRoom.findMany({
            where: {
                status: BattleRoomStatus.LIVE,
            },
            select: {
                id: true,
                endTime: true,
            },
        });

        const now = Date.now();
        for (const room of rooms) {
            if (!room.endTime || room.endTime.getTime() <= now) {
                await this.endRoomInternal(room.id, 'TIME_UP');
                continue;
            }

            await this.hydrateRoomState(room.id);
            this.startRoomTimer(room.id, room.endTime);
        }
    }

    private static async createBattleSubmissionWithRetry(data: {
        roomId: string;
        userId: string;
        isCorrect: boolean;
        submissionTime: Date;
        timeTaken: number;
        language: string;
    }) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                return await prisma.$transaction(async (tx) => {
                    const currentCount = await tx.battleSubmission.count({
                        where: {
                            roomId: data.roomId,
                            userId: data.userId,
                        },
                    });

                    return tx.battleSubmission.create({
                        data: {
                            roomId: data.roomId,
                            userId: data.userId,
                            attemptNumber: currentCount + 1,
                            isCorrect: data.isCorrect,
                            submissionTime: data.submissionTime,
                            timeTaken: data.timeTaken,
                            language: data.language,
                        },
                    });
                });
            } catch (error: any) {
                const isUniqueConflict = error?.code === 'P2002';
                if (!isUniqueConflict || attempt === 2) {
                    throw error;
                }
            }
        }

        throw new ApiError(409, 'Duplicate submission detected. Please retry.');
    }

    private static async updateLeaderboardCache(data: {
        roomId: string;
        userId: string;
        attemptNumber: number;
        isCorrect: boolean;
        timeTaken: number;
        submissionTime: Date;
    }) {
        await this.hydrateRoomState(data.roomId);
        const state = this.ensureRuntime(data.roomId);
        const existing = state.leaderboard.get(data.userId);
        if (!existing) {
            const user = await prisma.user.findUnique({
                where: { id: data.userId },
                select: { name: true },
            });
            state.leaderboard.set(data.userId, {
                userId: data.userId,
                name: user?.name || `User ${data.userId.slice(0, 6)}`,
                isCorrect: data.isCorrect,
                attemptNumber: data.attemptNumber,
                timeTaken: data.isCorrect ? data.timeTaken : null,
                submissionTime: data.submissionTime,
            });
            return;
        }

        if (existing.isCorrect) {
            return;
        }

        existing.attemptNumber = Math.max(existing.attemptNumber, data.attemptNumber);
        if (data.isCorrect) {
            existing.isCorrect = true;
            existing.timeTaken = data.timeTaken;
            existing.submissionTime = data.submissionTime;
        } else if (!existing.submissionTime || data.submissionTime > existing.submissionTime) {
            existing.submissionTime = data.submissionTime;
        }
    }

    private static buildLeaderboard(roomId: string): BattleLeaderboardEntry[] {
        const state = this.ensureRuntime(roomId);
        const rows = Array.from(state.leaderboard.values()).sort((a, b) => {
            if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1;

            const timeA = a.isCorrect ? (a.timeTaken ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
            const timeB = b.isCorrect ? (b.timeTaken ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
            if (timeA !== timeB) return timeA - timeB;

            if (a.attemptNumber !== b.attemptNumber) return a.attemptNumber - b.attemptNumber;

            const submittedA = a.submissionTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const submittedB = b.submissionTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return submittedA - submittedB;
        });

        return rows.map((row, index) => ({
            rank: index + 1,
            userId: row.userId,
            name: row.name,
            isCorrect: row.isCorrect,
            attemptNumber: row.attemptNumber,
            timeTaken: row.isCorrect ? row.timeTaken : null,
            submissionTime: row.submissionTime ? row.submissionTime.toISOString() : null,
        }));
    }

    private static async hydrateRoomState(roomId: string) {
        const state = this.ensureRuntime(roomId);
        if (state.leaderboard.size > 0) {
            return;
        }

        const [participants, submissions] = await Promise.all([
            prisma.battleParticipant.findMany({
                where: { roomId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.battleSubmission.findMany({
                where: { roomId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: [{ submissionTime: 'asc' }, { attemptNumber: 'asc' }],
            }),
        ]);

        participants.forEach((participant) => {
            state.leaderboard.set(participant.userId, {
                userId: participant.userId,
                name: participant.user.name,
                isCorrect: false,
                attemptNumber: 0,
                timeTaken: null,
                submissionTime: null,
            });
        });

        submissions.forEach((submission) => {
            const existing = state.leaderboard.get(submission.userId) || {
                userId: submission.userId,
                name: submission.user.name,
                isCorrect: false,
                attemptNumber: 0,
                timeTaken: null,
                submissionTime: null,
            };

            if (!existing.isCorrect) {
                existing.attemptNumber = Math.max(existing.attemptNumber, submission.attemptNumber);
                if (submission.isCorrect) {
                    existing.isCorrect = true;
                    existing.timeTaken = submission.timeTaken;
                    existing.submissionTime = submission.submissionTime;
                } else if (!existing.submissionTime || submission.submissionTime > existing.submissionTime) {
                    existing.submissionTime = submission.submissionTime;
                }
            }

            state.leaderboard.set(submission.userId, existing);
        });
    }

    private static async emitParticipantUpdate(roomId: string) {
        const [participantCount, connectedParticipants] = await Promise.all([
            prisma.battleParticipant.count({ where: { roomId } }),
            prisma.battleParticipant.count({ where: { roomId, isConnected: true } }),
        ]);

        const io = getIO();
        io.to(this.getSocketRoom(roomId)).emit('participant_update', {
            roomId,
            participantCount,
            connectedParticipants,
        });
    }

    private static startRoomTimer(roomId: string, endTime: Date) {
        const state = this.ensureRuntime(roomId);
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }

        const timer = setInterval(async () => {
            const remainingTimeMs = Math.max(0, endTime.getTime() - Date.now());
            const io = getIO();
            io.to(this.getSocketRoom(roomId)).emit('timer_sync', {
                roomId,
                status: BattleRoomStatus.LIVE,
                remainingTimeMs,
                endTime: endTime.toISOString(),
                serverTime: new Date().toISOString(),
            });

            if (remainingTimeMs <= 0) {
                clearInterval(timer);
                state.timer = null;
                await this.endRoomInternal(roomId, 'TIME_UP');
            }
        }, TIMER_SYNC_INTERVAL_MS);

        state.timer = timer;
    }

    private static async endRoomInternal(roomId: string, reason: 'MANUAL' | 'TIME_UP') {
        const room = await prisma.battleRoom.findUnique({
            where: { id: roomId },
            select: { id: true, status: true, endTime: true },
        });
        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        if (room.status !== BattleRoomStatus.ENDED) {
            await prisma.battleRoom.update({
                where: { id: room.id },
                data: {
                    status: BattleRoomStatus.ENDED,
                    endTime: new Date(),
                },
            });
        }

        const state = this.runtime.get(room.id);
        if (state?.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }

        const snapshot = await this.getRoomSnapshot(room.id);
        const io = getIO();
        io.to(this.getSocketRoom(room.id)).emit('timer_sync', {
            roomId: room.id,
            status: BattleRoomStatus.ENDED,
            remainingTimeMs: 0,
            endTime: snapshot.endTime,
            serverTime: new Date().toISOString(),
        });
        io.to(this.getSocketRoom(room.id)).emit('battle_ended', {
            roomId: room.id,
            reason,
            endedAt: snapshot.endTime,
            leaderboard: snapshot.leaderboard,
        });

        return snapshot;
    }

    private static async assertCanEndRoom(roomId: string, userId: string) {
        const room = await prisma.battleRoom.findUnique({
            where: { id: roomId },
            select: { teacherId: true },
        });
        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }
        await this.assertTeacherOwnsRoom(room.teacherId, userId);
    }

    private static async assertTeacherOwnsRoom(ownerId: string, userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const isAdmin = user.role === Role.ADMIN;
        if (ownerId !== userId && !isAdmin) {
            throw new ApiError(403, 'Forbidden: You do not have permission for this room');
        }
    }

    private static async assertTeacherRole(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        if (user.role !== Role.TEACHER && user.role !== Role.ADMIN) {
            throw new ApiError(403, 'Only teachers can create battle rooms');
        }
    }

    private static assertDuration(duration: number) {
        if (!Number.isInteger(duration) || !ALLOWED_DURATIONS.has(duration)) {
            throw new ApiError(400, 'Duration must be one of: 15, 30, 60 minutes');
        }
    }

    private static calculateRemainingTimeMs(status: BattleRoomStatus, endTime: Date | null): number {
        if (status !== BattleRoomStatus.LIVE || !endTime) {
            return 0;
        }
        return Math.max(0, endTime.getTime() - Date.now());
    }

    private static ensureRuntime(roomId: string): RuntimeRoomState {
        const existing = this.runtime.get(roomId);
        if (existing) {
            return existing;
        }

        const state: RuntimeRoomState = {
            leaderboard: new Map<string, RuntimeLeaderboardEntry>(),
            timer: null,
        };
        this.runtime.set(roomId, state);
        return state;
    }

    private static async generateUniqueRoomCode() {
        for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt += 1) {
            const roomCode = this.generateRoomCode();
            const existing = await prisma.battleRoom.findUnique({
                where: { roomCode },
                select: { id: true },
            });
            if (!existing) {
                return roomCode;
            }
        }

        throw new ApiError(500, 'Failed to generate unique room code');
    }

    private static generateRoomCode() {
        let code = '';
        for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
            const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
            code += ROOM_CODE_ALPHABET[index];
        }
        return code;
    }

    static getSocketRoom(roomId: string) {
        return `battle:${roomId}`;
    }
}
