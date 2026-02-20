import api from './api';

export type ChatContextType = 'COURSE' | 'LESSON' | 'PROBLEM' | 'QUIZ' | 'BATTLE';
export type ChatMessageType = 'TEXT' | 'CODE' | 'SYSTEM';
export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface ChatChannel {
    id: string;
    type: ChatContextType;
    courseId: string | null;
    lessonId: string | null;
    problemId: string | null;
    quizId: string | null;
    battleRoomId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    id: string;
    channelId: string;
    type: ChatMessageType;
    content: string;
    metadata: unknown;
    createdAt: string;
    editedAt: string | null;
    deletedAt: string | null;
    sender: {
        id: string;
        name: string;
        role: UserRole;
    };
}

export interface ChatContextMessagesResponse {
    channel: ChatChannel;
    messages: ChatMessage[];
    nextCursor: string | null;
    readState: {
        lastReadMessageId: string | null;
        lastReadAt: string | null;
    };
}

const normalizeContextType = (contextType: ChatContextType) => contextType.toUpperCase() as ChatContextType;

export const chatService = {
    getContextMessages: async (
        contextType: ChatContextType,
        contextId: string,
        options?: { limit?: number; cursor?: string | null }
    ) => {
        const response = await api.get<ChatContextMessagesResponse & { success: boolean }>(
            `/chat/context/${normalizeContextType(contextType)}/${contextId}/messages`,
            {
                params: {
                    ...(options?.limit ? { limit: options.limit } : {}),
                    ...(options?.cursor ? { cursor: options.cursor } : {}),
                },
            }
        );

        return {
            channel: response.data.channel,
            messages: response.data.messages,
            nextCursor: response.data.nextCursor,
            readState: response.data.readState,
        };
    },

    sendMessage: async (
        contextType: ChatContextType,
        contextId: string,
        payload: {
            content: string;
            type?: Extract<ChatMessageType, 'TEXT' | 'CODE'>;
        }
    ) => {
        const response = await api.post<{
            success: boolean;
            status: string;
            channel: ChatChannel;
            message: ChatMessage;
        }>(`/chat/context/${normalizeContextType(contextType)}/${contextId}/messages`, payload);

        return {
            channel: response.data.channel,
            message: response.data.message,
        };
    },

    markRead: async (contextType: ChatContextType, contextId: string, messageId?: string | null) => {
        const response = await api.post<{
            success: boolean;
            readState: {
                channelId: string;
                userId: string;
                lastReadMessageId: string | null;
                lastReadAt: string;
            };
        }>(`/chat/context/${normalizeContextType(contextType)}/${contextId}/read`, {
            ...(messageId ? { messageId } : {}),
        });

        return response.data.readState;
    },
};
