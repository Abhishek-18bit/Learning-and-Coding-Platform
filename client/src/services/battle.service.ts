import api from './api';

export type BattleRoomStatus = 'WAITING' | 'LIVE' | 'ENDED';

export interface BattleRoom {
    id: string;
    roomCode: string;
    problemId: string;
    teacherId: string;
    status: BattleRoomStatus;
    duration: number;
    startTime: string | null;
    endTime: string | null;
    maxParticipants: number;
    createdAt: string;
}

export interface BattleRoomProblem {
    id: string;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
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
    problems: BattleRoomProblem[];
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

export interface CreateBattleRoomPayload {
    problemIds: string[];
    problemId?: string;
    duration: number;
    maxParticipants?: number;
}

export const battleService = {
    createRoom: async (payload: CreateBattleRoomPayload) => {
        const response = await api.post<{
            success: boolean;
            message: string;
            room: BattleRoom;
        }>('/battle/create', payload);
        return response.data.room;
    },

    joinRoom: async (roomCode: string) => {
        const response = await api.post<{
            success: boolean;
            message: string;
            room: BattleRoomSnapshot;
        }>('/battle/join', {
            roomCode: roomCode.trim().toUpperCase(),
        });
        return response.data.room;
    },

    getRoom: async (roomId: string) => {
        const response = await api.get<{
            success: boolean;
            room: BattleRoomSnapshot;
        }>(`/battle/${roomId}`);
        return response.data.room;
    },

    startRoom: async (roomId: string) => {
        const response = await api.post<{
            success: boolean;
            message: string;
            room: BattleRoomSnapshot;
        }>(`/battle/start/${roomId}`);
        return response.data.room;
    },

    endRoom: async (roomId: string, reason?: string) => {
        const response = await api.post<{
            success: boolean;
            message: string;
            room: BattleRoomSnapshot;
        }>(`/battle/end/${roomId}`, {
            ...(reason?.trim() ? { reason: reason.trim() } : {}),
        });
        return response.data.room;
    },
};

export interface BattleSubmissionSummary {
    passedTestCount: number;
    failedTestCount: number;
    executionTime: number;
    finalVerdict: 'PENDING' | 'ACCEPTED' | 'WRONG_ANSWER' | 'ERROR';
}
