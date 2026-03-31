import api from './api';
import type { Quiz } from './quiz.service';

export interface Lesson {
    id: string;
    title: string;
    content: string;
    courseId: string;
    unitId?: string | null;
    createdAt: string;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface GenerateLessonQuizPayload {
    difficulty: Difficulty;
    questionCount: number;
    deadline?: string;
}

export const lessonService = {
    getById: async (id: string) => {
        const response = await api.get<{ success: boolean; lesson: Lesson }>(`/lessons/${id}`);
        return response.data.lesson;
    },
    getByCourseId: async (courseId: string) => {
        const response = await api.get<{ success: boolean; lessons: Lesson[] }>(`/lessons/course/${courseId}`);
        return response.data.lessons;
    },
    create: async (data: {
        title: string;
        content: string;
        courseId: string;
        unitId?: string;
        topicId?: string;
        unitTitle?: string;
        topicTitle?: string;
        topicOrder?: number;
        estimatedMinutes?: number;
    }) => {
        const response = await api.post<{ success: boolean; lesson: Lesson }>(`/lessons`, data);
        return response.data.lesson;
    },
    generateQuizFromLesson: async (lessonId: string, data: GenerateLessonQuizPayload) => {
        const response = await api.post<{ success: boolean; quiz: Quiz }>(`/lessons/${lessonId}/generate-quiz`, data, {
            timeout: 20000,
        });
        return response.data.quiz;
    }
};
