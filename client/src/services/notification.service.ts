import api from './api';

export interface Notification {
    id: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export const notificationService = {
    getAll: async () => {
        const response = await api.get<{ success: boolean; data: Notification[] }>('/notifications');
        return response.data.data;
    },
    markRead: async (id: string) => {
        const response = await api.put<{ success: boolean }>(`/notifications/${id}/read`);
        return response.data;
    }
};
