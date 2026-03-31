import { BattleRoom, BattleRoomStatus, Difficulty, Role, SubmissionStatus } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';
import { ExecutionEngineService } from './execution-engine.service';
import { getIO } from '../utils/socket';
import { AchievementService } from './achievement.service';

const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 180;
const DEFAULT_MAX_PARTICIPANTS = 100;
const MAX_ROOM_CODE_ATTEMPTS = 25;
const TIMER_SYNC_INTERVAL_MS = 5_000;
const MAX_END_REASON_LENGTH = 240;
const MAX_ROOM_PROBLEMS = 25;
const SOLVE_POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
    EASY: 100,
    MEDIUM: 200,
    HARD: 320,
};
const SPEED_BONUS_FACTOR = 0.25;
const WRONG_ATTEMPT_POINT_PENALTY = 12;
const WRONG_ATTEMPT_TIME_PENALTY_MS = 20 * 60_000;

export interface BattleRoomProblemItem {
    id: string;
    title: string;
    difficulty: Difficulty;
    order: number;
}

export interface BattleLeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    isCorrect: boolean;
    score: number;
    wrongAttempts: number;
    penaltyTimeMs: number | null;
    attemptNumber: number;
    timeTaken: number | null;
    submissionTime: string | null;
    solvedProblems: number;
    totalProblems: number;
}

export interface BattleRoomSnapshot {
    id: string;
    roomCode: string;
    problemId: string;
    problemTitle: string;
    problems: BattleRoomProblemItem[];
    totalProblems: number;
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
    score: number;
    wrongAttempts: number;
    penaltyTimeMs: number;
    attemptNumber: number;
    timeTaken: number | null;
    submissionTime: Date | null;
    solvedProblemIds: Set<string>;
    solvedAtByProblem: Map<string, number>;
    wrongAttemptsByProblem: Map<string, number>;
}

interface RuntimeRoomState {
    leaderboard: Map<string, RuntimeLeaderboardEntry>;
    problemIds: string[];
    timer: NodeJS.Timeout | null;
}

interface SubmitAttemptInput {
    roomId: string;
    userId: string;
    code: string;
    language: string;
    problemId?: string;
}

interface EndRoomMetadata {
    endedByUserId?: string | null;
    teacherNote?: string | null;
}

export class BattleService {
    private static runtime = new Map<string, RuntimeRoomState>();

    static async createRoom(input: {
        teacherId: string;
        problemId?: string;
        problemIds?: string[];
        duration: number;
        maxParticipants?: number;
    }): Promise<BattleRoom> {
        await this.assertTeacherRole(input.teacherId);
        this.assertDuration(input.duration);

        const maxParticipants = input.maxParticipants ?? DEFAULT_MAX_PARTICIPANTS;
        if (!Number.isInteger(maxParticipants) || maxParticipants < 2 || maxParticipants > 500) {
            throw new ApiError(400, 'maxParticipants must be between 2 and 500');
        }

        const resolvedProblemIds = this.normalizeProblemIds(input.problemId, input.problemIds);
        if (resolvedProblemIds.length === 0) {
            throw new ApiError(400, 'At least one problem is required');
        }
        if (resolvedProblemIds.length > MAX_ROOM_PROBLEMS) {
            throw new ApiError(400, `A room can include at most ${MAX_ROOM_PROBLEMS} problems`);
        }

        const problems = await prisma.problem.findMany({
            where: {
                id: {
                    in: resolvedProblemIds,
                },
            },
            select: { id: true },
        });
        if (problems.length !== resolvedProblemIds.length) {
            throw new ApiError(404, 'One or more selected problems were not found');
        }

        const roomCode = await this.generateUniqueRoomCode();
        const primaryProblemId = resolvedProblemIds[0];

        const room = await prisma.$transaction(async (tx) => {
            const createdRoom = await tx.battleRoom.create({
                data: {
                    roomCode,
                    problemId: primaryProblemId,
                    teacherId: input.teacherId,
                    duration: input.duration,
                    maxParticipants,
                    status: BattleRoomStatus.WAITING,
                },
            });

            await tx.battleRoomProblem.createMany({
                data: resolvedProblemIds.map((problemId, index) => ({
                    roomId: createdRoom.id,
                    problemId,
                    order: index + 1,
                })),
            });

            return createdRoom;
        });

        this.syncRuntimeProblemIds(room.id, resolvedProblemIds);
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

        try {
            await AchievementService.onBattleJoined(input.userId);
        } catch (error) {
            console.error('Failed to evaluate battle join achievements:', error);
        }

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

    static async endRoom(roomId: string, teacherId: string, reason?: string) {
        await this.assertCanEndRoom(roomId, teacherId);
        const teacherNote = this.normalizeTeacherEndReason(reason);
        return this.endRoomInternal(roomId, 'MANUAL', {
            endedByUserId: teacherId,
            teacherNote,
        });
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
                        id: true,
                        title: true,
                        difficulty: true,
                    },
                },
                problems: {
                    orderBy: {
                        order: 'asc',
                    },
                    select: {
                        order: true,
                        problem: {
                            select: {
                                id: true,
                                title: true,
                                difficulty: true,
                            },
                        },
                    },
                },
            },
        });

        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        const roomProblems = this.buildRoomProblemItems(room);
        this.syncRuntimeProblemIds(
            room.id,
            roomProblems.map((item) => item.id)
        );

        await this.hydrateRoomState(
            room.id,
            roomProblems.map((item) => item.id)
        );

        const [participantCount, connectedParticipants] = await Promise.all([
            prisma.battleParticipant.count({ where: { roomId: room.id } }),
            prisma.battleParticipant.count({ where: { roomId: room.id, isConnected: true } }),
        ]);

        const primaryProblem = roomProblems[0];

        return {
            id: room.id,
            roomCode: room.roomCode,
            problemId: primaryProblem.id,
            problemTitle: primaryProblem.title,
            problems: roomProblems,
            totalProblems: roomProblems.length,
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
            select: {
                id: true,
                problemId: true,
                duration: true,
                status: true,
                startTime: true,
                endTime: true,
                problems: {
                    orderBy: {
                        order: 'asc',
                    },
                    select: {
                        problemId: true,
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

        const roomProblemIds = this.resolveRoomProblemIds(room.problemId, room.problems);
        this.syncRuntimeProblemIds(room.id, roomProblemIds);
        await this.hydrateRoomState(room.id, roomProblemIds);

        const runtimeState = this.ensureRuntime(room.id);
        const existingEntry = runtimeState.leaderboard.get(input.userId);
        if (existingEntry?.isCorrect) {
            throw new ApiError(400, 'You already solved all battle problems');
        }

        const selectedProblemId =
            typeof input.problemId === 'string' && input.problemId.trim()
                ? input.problemId.trim()
                : roomProblemIds[0];

        if (!roomProblemIds.includes(selectedProblemId)) {
            throw new ApiError(400, 'Selected problem does not belong to this battle room');
        }

        const selectedProblem = await prisma.problem.findUnique({
            where: { id: selectedProblemId },
            include: {
                testCases: true,
            },
        });

        if (!selectedProblem) {
            throw new ApiError(404, 'Problem not found');
        }

        if (selectedProblem.testCases.length === 0) {
            throw new ApiError(400, 'Selected battle problem has no test cases configured');
        }

        const summary = await ExecutionEngineService.run({
            code: trimmedCode,
            language: input.language,
            testCases: selectedProblem.testCases.map((testCase) => ({
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
            problemId: selectedProblemId,
            userId: input.userId,
            isCorrect,
            submissionTime: now,
            timeTaken,
            language: input.language,
        });

        await this.updateLeaderboardCache({
            roomId: room.id,
            userId: input.userId,
            problemId: selectedProblemId,
            problemDifficulty: selectedProblem.difficulty,
            attemptNumber: submission.attemptNumber,
            isCorrect,
            timeTaken,
            submissionTime: submission.submissionTime,
            roomDurationMs: room.duration * 60_000,
            roomProblemIds,
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
            problemId: selectedProblemId,
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
        problemId: string;
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
                            problemId: data.problemId,
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
        problemId: string;
        problemDifficulty: Difficulty;
        attemptNumber: number;
        isCorrect: boolean;
        timeTaken: number;
        submissionTime: Date;
        roomDurationMs: number;
        roomProblemIds?: string[];
    }) {
        await this.hydrateRoomState(data.roomId, data.roomProblemIds);
        const state = this.ensureRuntime(data.roomId);

        if (state.problemIds.length === 0 && data.roomProblemIds?.length) {
            this.syncRuntimeProblemIds(data.roomId, data.roomProblemIds);
        }

        const totalProblems = Math.max(state.problemIds.length, 1);
        const allowedProblemIds = new Set(state.problemIds);

        const existing = state.leaderboard.get(data.userId);
        if (!existing) {
            const user = await prisma.user.findUnique({
                where: { id: data.userId },
                select: { name: true },
            });

            const newEntry: RuntimeLeaderboardEntry = {
                userId: data.userId,
                name: user?.name || `User ${data.userId.slice(0, 6)}`,
                isCorrect: false,
                score: 0,
                wrongAttempts: 0,
                penaltyTimeMs: 0,
                attemptNumber: data.attemptNumber,
                timeTaken: null,
                submissionTime: data.submissionTime,
                solvedProblemIds: new Set<string>(),
                solvedAtByProblem: new Map<string, number>(),
                wrongAttemptsByProblem: new Map<string, number>(),
            };

            state.leaderboard.set(data.userId, newEntry);
            this.applySubmissionToRuntimeEntry(
                newEntry,
                {
                    problemId: data.problemId,
                    problemDifficulty: data.problemDifficulty,
                    isCorrect: data.isCorrect,
                    timeTaken: data.timeTaken,
                    roomDurationMs: data.roomDurationMs,
                },
                totalProblems,
                allowedProblemIds
            );
            return;
        }

        if (existing.isCorrect) {
            return;
        }

        existing.attemptNumber = Math.max(existing.attemptNumber, data.attemptNumber);
        if (!existing.submissionTime || data.submissionTime > existing.submissionTime) {
            existing.submissionTime = data.submissionTime;
        }

        this.applySubmissionToRuntimeEntry(
            existing,
            {
                problemId: data.problemId,
                problemDifficulty: data.problemDifficulty,
                isCorrect: data.isCorrect,
                timeTaken: data.timeTaken,
                roomDurationMs: data.roomDurationMs,
            },
            totalProblems,
            allowedProblemIds
        );
    }

    private static buildLeaderboard(roomId: string): BattleLeaderboardEntry[] {
        const state = this.ensureRuntime(roomId);
        const totalProblems = Math.max(state.problemIds.length, 1);
        const rows = Array.from(state.leaderboard.values()).sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;

            const solvedDiff = b.solvedProblemIds.size - a.solvedProblemIds.size;
            if (solvedDiff !== 0) return solvedDiff;

            if (a.isCorrect !== b.isCorrect) return a.isCorrect ? -1 : 1;

            if (a.penaltyTimeMs !== b.penaltyTimeMs) {
                return a.penaltyTimeMs - b.penaltyTimeMs;
            }

            if (a.isCorrect || b.isCorrect) {
                const completionA = a.timeTaken ?? Number.MAX_SAFE_INTEGER;
                const completionB = b.timeTaken ?? Number.MAX_SAFE_INTEGER;
                if (completionA !== completionB) return completionA - completionB;
            }

            if (a.attemptNumber !== b.attemptNumber) return a.attemptNumber - b.attemptNumber;

            const submittedA = a.submissionTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const submittedB = b.submissionTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
            if (submittedA !== submittedB) return submittedA - submittedB;

            return a.name.localeCompare(b.name);
        });

        return rows.map((row, index) => ({
            rank: index + 1,
            userId: row.userId,
            name: row.name,
            isCorrect: row.isCorrect,
            score: row.score,
            wrongAttempts: row.wrongAttempts,
            penaltyTimeMs: row.penaltyTimeMs > 0 ? row.penaltyTimeMs : null,
            attemptNumber: row.attemptNumber,
            timeTaken: row.isCorrect ? row.timeTaken : null,
            submissionTime: row.submissionTime ? row.submissionTime.toISOString() : null,
            solvedProblems: Math.min(row.solvedProblemIds.size, totalProblems),
            totalProblems,
        }));
    }

    private static async hydrateRoomState(roomId: string, knownProblemIds?: string[]) {
        const state = this.ensureRuntime(roomId);

        if (knownProblemIds?.length) {
            this.syncRuntimeProblemIds(roomId, knownProblemIds);
        } else if (state.problemIds.length === 0) {
            await this.hydrateRuntimeProblemIds(roomId);
        }

        if (state.leaderboard.size > 0) {
            return;
        }

        const totalProblems = Math.max(state.problemIds.length, 1);
        const allowedProblemIds = new Set(state.problemIds);

        const [participants, submissions, roomMeta] = await Promise.all([
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
                    problem: {
                        select: {
                            difficulty: true,
                        },
                    },
                },
                orderBy: [{ submissionTime: 'asc' }, { attemptNumber: 'asc' }],
            }),
            prisma.battleRoom.findUnique({
                where: { id: roomId },
                select: { duration: true },
            }),
        ]);
        const roomDurationMs = (roomMeta?.duration ?? MIN_DURATION_MINUTES) * 60_000;

        participants.forEach((participant) => {
            state.leaderboard.set(participant.userId, {
                userId: participant.userId,
                name: participant.user.name,
                isCorrect: false,
                score: 0,
                wrongAttempts: 0,
                penaltyTimeMs: 0,
                attemptNumber: 0,
                timeTaken: null,
                submissionTime: null,
                solvedProblemIds: new Set<string>(),
                solvedAtByProblem: new Map<string, number>(),
                wrongAttemptsByProblem: new Map<string, number>(),
            });
        });

        submissions.forEach((submission) => {
            const existing = state.leaderboard.get(submission.userId) || {
                userId: submission.userId,
                name: submission.user.name,
                isCorrect: false,
                score: 0,
                wrongAttempts: 0,
                penaltyTimeMs: 0,
                attemptNumber: 0,
                timeTaken: null,
                submissionTime: null,
                solvedProblemIds: new Set<string>(),
                solvedAtByProblem: new Map<string, number>(),
                wrongAttemptsByProblem: new Map<string, number>(),
            };

            if (existing.isCorrect) {
                state.leaderboard.set(submission.userId, existing);
                return;
            }

            existing.attemptNumber = Math.max(existing.attemptNumber, submission.attemptNumber);
            if (!existing.submissionTime || submission.submissionTime > existing.submissionTime) {
                existing.submissionTime = submission.submissionTime;
            }

            this.applySubmissionToRuntimeEntry(
                existing,
                {
                    problemId: submission.problemId,
                    problemDifficulty: submission.problem.difficulty,
                    isCorrect: submission.isCorrect,
                    timeTaken: submission.timeTaken,
                    roomDurationMs,
                },
                totalProblems,
                allowedProblemIds
            );

            state.leaderboard.set(submission.userId, existing);
        });
    }

    private static applySubmissionToRuntimeEntry(
        entry: RuntimeLeaderboardEntry,
        submission: {
            problemId: string;
            problemDifficulty: Difficulty;
            isCorrect: boolean;
            timeTaken: number;
            roomDurationMs: number;
        },
        totalProblems: number,
        allowedProblemIds: Set<string>
    ) {
        const isAllowedProblem = allowedProblemIds.size === 0 || allowedProblemIds.has(submission.problemId);
        if (!isAllowedProblem) {
            return;
        }

        const alreadySolvedProblem = entry.solvedProblemIds.has(submission.problemId);
        if (submission.isCorrect) {
            if (alreadySolvedProblem) {
                return;
            }

            const wrongAttemptsForProblem = entry.wrongAttemptsByProblem.get(submission.problemId) ?? 0;
            const earnedScore = this.calculateSolveScore({
                difficulty: submission.problemDifficulty,
                timeTaken: submission.timeTaken,
                roomDurationMs: submission.roomDurationMs,
                wrongAttemptsForProblem,
            });

            entry.score += earnedScore;
            entry.solvedProblemIds.add(submission.problemId);
            entry.solvedAtByProblem.set(submission.problemId, submission.timeTaken);
            entry.penaltyTimeMs += submission.timeTaken + wrongAttemptsForProblem * WRONG_ATTEMPT_TIME_PENALTY_MS;
        } else if (!alreadySolvedProblem) {
            const nextWrongAttemptsForProblem = (entry.wrongAttemptsByProblem.get(submission.problemId) ?? 0) + 1;
            entry.wrongAttemptsByProblem.set(submission.problemId, nextWrongAttemptsForProblem);
            entry.wrongAttempts += 1;
            entry.score = Math.max(0, entry.score - WRONG_ATTEMPT_POINT_PENALTY);
            entry.penaltyTimeMs += Math.round(WRONG_ATTEMPT_TIME_PENALTY_MS * 0.15);
        }

        if (entry.solvedProblemIds.size >= totalProblems) {
            entry.isCorrect = true;
            entry.timeTaken = this.resolveCompletionTimeMs(entry.solvedAtByProblem);
        }
    }

    private static calculateSolveScore(input: {
        difficulty: Difficulty;
        timeTaken: number;
        roomDurationMs: number;
        wrongAttemptsForProblem: number;
    }) {
        const baseScore = SOLVE_POINTS_BY_DIFFICULTY[input.difficulty] ?? SOLVE_POINTS_BY_DIFFICULTY.MEDIUM;
        const speedBonus = this.calculateSpeedBonus(baseScore, input.timeTaken, input.roomDurationMs);
        const wrongAttemptPenalty = input.wrongAttemptsForProblem * WRONG_ATTEMPT_POINT_PENALTY;
        return Math.max(5, baseScore + speedBonus - wrongAttemptPenalty);
    }

    private static calculateSpeedBonus(baseScore: number, timeTaken: number, roomDurationMs: number) {
        const safeDuration = Math.max(1, roomDurationMs);
        const elapsedRatio = Math.min(Math.max(timeTaken / safeDuration, 0), 1);
        const bonusMultiplier = (1 - elapsedRatio) * SPEED_BONUS_FACTOR;
        return Math.round(baseScore * bonusMultiplier);
    }

    private static resolveCompletionTimeMs(solvedAtByProblem: Map<string, number>) {
        if (solvedAtByProblem.size === 0) {
            return null;
        }

        let latestTime = 0;
        solvedAtByProblem.forEach((time) => {
            if (time > latestTime) {
                latestTime = time;
            }
        });

        return latestTime;
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

    private static async endRoomInternal(
        roomId: string,
        reason: 'MANUAL' | 'TIME_UP',
        metadata: EndRoomMetadata = {}
    ) {
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

        try {
            await AchievementService.onBattleEnded({
                roomId: room.id,
                leaderboard: snapshot.leaderboard.map((entry) => ({
                    rank: entry.rank,
                    userId: entry.userId,
                    isCorrect: entry.isCorrect,
                })),
            });
        } catch (error) {
            console.error('Failed to evaluate battle end achievements:', error);
        }

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
            endedByUserId: metadata.endedByUserId || null,
            teacherNote: metadata.teacherNote || null,
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
        if (!Number.isInteger(duration) || duration < MIN_DURATION_MINUTES || duration > MAX_DURATION_MINUTES) {
            throw new ApiError(
                400,
                `Duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes`
            );
        }
    }

    private static normalizeTeacherEndReason(reason?: string): string | null {
        if (typeof reason !== 'string') {
            return null;
        }

        const sanitized = reason.replace(/\u0000/g, '').trim();
        if (!sanitized) {
            return null;
        }

        return sanitized.slice(0, MAX_END_REASON_LENGTH);
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
            problemIds: [],
            timer: null,
        };
        this.runtime.set(roomId, state);
        return state;
    }

    private static normalizeProblemIds(problemId?: string, problemIds?: string[]): string[] {
        const merged = [
            ...(Array.isArray(problemIds) ? problemIds : []),
            ...(typeof problemId === 'string' ? [problemId] : []),
        ];

        const normalized: string[] = [];
        const seen = new Set<string>();
        merged.forEach((value) => {
            if (typeof value !== 'string') {
                return;
            }
            const trimmed = value.trim();
            if (!trimmed || seen.has(trimmed)) {
                return;
            }
            seen.add(trimmed);
            normalized.push(trimmed);
        });

        return normalized;
    }

    private static resolveRoomProblemIds(
        primaryProblemId: string,
        problemRows: Array<{ problemId: string }>
    ): string[] {
        const fromRows = problemRows.map((row) => row.problemId);
        const combined = fromRows.length > 0 ? fromRows : [primaryProblemId];
        return this.normalizeProblemIds(undefined, combined);
    }

    private static buildRoomProblemItems(room: {
        problem: {
            id: string;
            title: string;
            difficulty: Difficulty;
        };
        problems: Array<{
            order: number;
            problem: {
                id: string;
                title: string;
                difficulty: Difficulty;
            };
        }>;
    }): BattleRoomProblemItem[] {
        if (room.problems.length === 0) {
            return [
                {
                    id: room.problem.id,
                    title: room.problem.title,
                    difficulty: room.problem.difficulty,
                    order: 1,
                },
            ];
        }

        const seen = new Set<string>();
        const mapped: BattleRoomProblemItem[] = [];
        room.problems.forEach((entry) => {
            if (seen.has(entry.problem.id)) {
                return;
            }
            seen.add(entry.problem.id);
            mapped.push({
                id: entry.problem.id,
                title: entry.problem.title,
                difficulty: entry.problem.difficulty,
                order: entry.order,
            });
        });

        if (!seen.has(room.problem.id)) {
            mapped.unshift({
                id: room.problem.id,
                title: room.problem.title,
                difficulty: room.problem.difficulty,
                order: 0,
            });
        }

        mapped.sort((a, b) => a.order - b.order);
        return mapped.map((item, index) => ({
            ...item,
            order: index + 1,
        }));
    }

    private static syncRuntimeProblemIds(roomId: string, problemIds: string[]) {
        const state = this.ensureRuntime(roomId);
        state.problemIds = this.normalizeProblemIds(undefined, problemIds);
    }

    private static async hydrateRuntimeProblemIds(roomId: string) {
        const room = await prisma.battleRoom.findUnique({
            where: { id: roomId },
            select: {
                problemId: true,
                problems: {
                    orderBy: {
                        order: 'asc',
                    },
                    select: {
                        problemId: true,
                    },
                },
            },
        });

        if (!room) {
            throw new ApiError(404, 'Battle room not found');
        }

        const problemIds = this.resolveRoomProblemIds(room.problemId, room.problems);
        this.syncRuntimeProblemIds(roomId, problemIds);
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
