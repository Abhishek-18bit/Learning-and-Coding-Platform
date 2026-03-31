import api from './api';

export interface AchievementBadge {
    code: string;
    title: string;
    description: string;
    icon: string | null;
    category: string;
    earned: boolean;
    earnedAt: string | null;
    progressCurrent: number;
    progressTarget: number | null;
    metadata: Record<string, unknown> | null;
}

export interface AchievementSummary {
    totals: {
        earned: number;
        total: number;
        completionPercent: number;
    };
    highlights: {
        courseEnrollments: number;
        solvedProblems: number;
        completedQuizzes: number;
        highScoreQuizzes: number;
        battleJoins: number;
        battleWins: number;
    };
    recentUnlocked: AchievementBadge[];
    badges: AchievementBadge[];
}

export const achievementService = {
    getMyAchievements: async () => {
        const response = await api.get<{ success: boolean; data: AchievementSummary }>('/achievements/me');
        return response.data.data;
    },
};
