import api from './api';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type QuizOptionKey = 'A' | 'B' | 'C' | 'D';
export type QuizSourceType = 'MANUAL' | 'LESSON_AI' | 'PDF_AI';

export interface QuizQuestion {
    id: string;
    quizId: string;
    question: string;
    options: Record<string, string>;
    correctOption: string;
    explanation?: string;
    marks: number;
}

export interface Quiz {
    id: string;
    courseId: string;
    title: string;
    difficulty?: Difficulty;
    sourceType?: QuizSourceType;
    deadline?: string | null;
    timeLimit: number;
    totalMarks: number;
    createdAt: string;
    questions?: QuizQuestion[];
    _count?: {
        questions?: number;
    };
}

export interface QuizAttempt {
    id: string;
    userId: string;
    quizId: string;
    score?: number;
    startedAt: string;
    submittedAt?: string;
}

export interface CreateQuizQuestionPayload {
    question: string;
    options: Record<QuizOptionKey, string>;
    correctOption: QuizOptionKey;
    explanation?: string;
    marks?: number;
}

export interface CreateQuizPayload {
    title: string;
    courseId: string;
    lessonId?: string;
    difficulty: Difficulty;
    deadline?: string;
    questions: CreateQuizQuestionPayload[];
}

export interface LegacyCreateQuizPayload {
    title: string;
    courseId: string;
    timeLimit: number;
    totalMarks: number;
    deadline?: string;
}

export const quizService = {
    getByCourse: async (courseId: string) => {
        const response = await api.get<{ success: boolean; quizzes: Quiz[] }>(`/quizzes/course/${courseId}`);
        return response.data.quizzes;
    },

    getById: async (quizId: string) => {
        const response = await api.get<{ success: boolean; quiz: Quiz }>(`/quizzes/${quizId}`);
        return response.data.quiz;
    },

    startAttempt: async (quizId: string) => {
        const response = await api.post<{ success: boolean; attempt: QuizAttempt }>(`/quizzes/${quizId}/attempt`);
        return response.data.attempt;
    },

    submitAttempt: async (attemptId: string, score: number) => {
        const response = await api.post<{ success: boolean; attempt: QuizAttempt }>(`/quizzes/attempts/${attemptId}/submit`, { score });
        return response.data.attempt;
    },

    create: async (data: CreateQuizPayload | LegacyCreateQuizPayload) => {
        const response = await api.post<{ success: boolean; quiz: Quiz }>(`/quizzes`, data);
        return response.data.quiz;
    },

    addQuestion: async (quizId: string, data: { question: string; options: Record<string, string>; correctOption: string; explanation?: string; marks: number }) => {
        const response = await api.post<{ success: boolean; question: QuizQuestion }>(`/quizzes/${quizId}/questions`, data);
        return response.data.question;
    },

    remove: async (quizId: string) => {
        await api.delete(`/quizzes/${quizId}`);
    },

    updateDeadline: async (quizId: string, deadline: string | null) => {
        const response = await api.patch<{ success: boolean; quiz: Quiz }>(`/quizzes/${quizId}/deadline`, {
            deadline,
        });
        return response.data.quiz;
    },
};
