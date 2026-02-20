import api from './api';

export interface InterviewQuestion {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
    completed?: boolean;
}

export const interviewService = {
    getAll: async (category?: string, search?: string) => {
        const response = await api.get<{ success: boolean; data: InterviewQuestion[] }>('/interview-questions', {
            params: { category, search }
        });
        return response.data.data;
    },

    markCompleted: async (questionId: string) => {
        const response = await api.post<{ success: boolean }>('/interview-progress', {
            interviewQuestionId: questionId
        });
        return response.data;
    }
};
