import api from './api';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    createdAt?: string;
}

interface UserResponse {
    success: boolean;
    message?: string;
    user: UserProfile;
}

interface MessageResponse {
    success: boolean;
    message: string;
}

export interface UpdateProfilePayload {
    name: string;
    email: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

export const userService = {
    updateProfile: async (payload: UpdateProfilePayload) => {
        const { data } = await api.put<UserResponse>('/users/me', payload);
        return data;
    },

    changePassword: async (payload: ChangePasswordPayload) => {
        const { data } = await api.put<MessageResponse>('/users/me/password', payload);
        return data;
    },
};
