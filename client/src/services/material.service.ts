import api from './api';
import type { Quiz } from './quiz.service';

export interface Material {
    id: string;
    title: string;
    fileUrl: string;
    fileType: string;
    courseId?: string;
    uploadedBy: string;
    createdAt: string;
    uploader?: {
        id: string;
        name: string;
    };
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface GenerateFromPdfPayload {
    difficulty: Difficulty;
    questionCount: number;
}

export const materialService = {
    getByCourseId: async (courseId: string) => {
        const response = await api.get<{ success: boolean; data: Material[] }>(`/courses/${courseId}/materials`);
        return response.data.data;
    },

    upload: async (courseId: string, file: File, title?: string, onProgress?: (progress: number) => void) => {
        const formData = new FormData();
        formData.append('file', file);
        if (title) formData.append('title', title);

        const response = await api.post<{ success: boolean; data: Material }>(`/courses/${courseId}/materials`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
        });
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<{ success: boolean }>(`/materials/${id}`);
        return response.data;
    },

    generateQuizFromPdf: async (materialId: string, payload: GenerateFromPdfPayload) => {
        const response = await api.post<{ success: boolean; quiz: Quiz }>(
            `/materials/${materialId}/generate-quiz`,
            payload,
            { timeout: 25000 }
        );
        return response.data.quiz;
    }
};
