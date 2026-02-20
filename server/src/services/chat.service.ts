import { ChatChannelType, ChatMessageType, Prisma, Role } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';
import { CourseService } from './course.service';

const DEFAULT_MESSAGE_LIMIT = 30;
const MAX_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 2000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const channelSelect = {
    id: true,
    type: true,
    courseId: true,
    lessonId: true,
    problemId: true,
    quizId: true,
    battleRoomId: true,
    createdAt: true,
    updatedAt: true,
} as const;

type ChannelRecord = Prisma.ChatChannelGetPayload<{ select: typeof channelSelect }>;
type MessageRecord = Prisma.ChatMessageGetPayload<{
    include: {
        sender: {
            select: {
                id: true;
                name: true;
                role: true;
            };
        };
    };
}>;

type ResolvedContext = {
    type: ChatChannelType;
    courseId?: string;
    lessonId?: string;
    problemId?: string;
    quizId?: string;
    battleRoomId?: string;
    ownerTeacherId?: string;
};

export interface ChatMessageView {
    id: string;
    channelId: string;
    type: ChatMessageType;
    content: string;
    metadata: Prisma.JsonValue | null;
    createdAt: string;
    editedAt: string | null;
    deletedAt: string | null;
    sender: {
        id: string;
        name: string;
        role: Role;
    };
}

export interface ChatChannelView {
    id: string;
    type: ChatChannelType;
    courseId: string | null;
    lessonId: string | null;
    problemId: string | null;
    quizId: string | null;
    battleRoomId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ChatContextMessagesResponse {
    channel: ChatChannelView;
    messages: ChatMessageView[];
    nextCursor: string | null;
    readState: {
        lastReadMessageId: string | null;
        lastReadAt: string | null;
    };
}

export class ChatService {
    static getSocketRoom(channelId: string) {
        return `chat:${channelId}`;
    }

    static parseContextType(rawType: string): ChatChannelType {
        const normalized = String(rawType || '').trim().toUpperCase();
        if (
            normalized !== ChatChannelType.COURSE &&
            normalized !== ChatChannelType.LESSON &&
            normalized !== ChatChannelType.PROBLEM &&
            normalized !== ChatChannelType.QUIZ &&
            normalized !== ChatChannelType.BATTLE
        ) {
            throw new ApiError(400, 'Invalid chat contextType');
        }
        return normalized;
    }

    static async getContextMessages(input: {
        userId: string;
        role: string;
        contextType: string;
        contextId: string;
        limit?: number;
        cursor?: string | null;
    }): Promise<ChatContextMessagesResponse> {
        const role = this.normalizeRole(input.role);
        const contextType = this.parseContextType(input.contextType);
        const contextId = this.normalizeUuid(input.contextId, 'Invalid contextId');
        const limit = this.normalizeLimit(input.limit);
        const cursor = input.cursor ? this.normalizeUuid(input.cursor, 'Invalid cursor') : null;

        const context = await this.resolveContext(contextType, contextId);
        await this.assertAccess(context, input.userId, role);
        const channel = await this.getOrCreateChannel(context, input.userId);

        if (cursor) {
            await this.assertCursorInChannel(cursor, channel.id);
        }

        const messages = await prisma.chatMessage.findMany({
            where: {
                channelId: channel.id,
                deletedAt: null,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: limit + 1,
            ...(cursor
                ? {
                    cursor: { id: cursor },
                    skip: 1,
                }
                : {}),
        });

        const hasMore = messages.length > limit;
        const pageRows = hasMore ? messages.slice(0, limit) : messages;
        const orderedRows = [...pageRows].reverse();
        const nextCursor = hasMore ? pageRows[pageRows.length - 1]?.id || null : null;

        const readState = await prisma.chatReadState.findUnique({
            where: {
                channelId_userId: {
                    channelId: channel.id,
                    userId: input.userId,
                },
            },
            select: {
                lastReadMessageId: true,
                lastReadAt: true,
            },
        });

        return {
            channel: this.toChannelView(channel),
            messages: orderedRows.map((message) => this.toMessageView(message)),
            nextCursor,
            readState: {
                lastReadMessageId: readState?.lastReadMessageId || null,
                lastReadAt: readState?.lastReadAt ? readState.lastReadAt.toISOString() : null,
            },
        };
    }

    static async createContextMessage(input: {
        userId: string;
        role: string;
        contextType: string;
        contextId: string;
        content: string;
        type?: ChatMessageType | 'TEXT' | 'CODE';
    }) {
        const role = this.normalizeRole(input.role);
        const contextType = this.parseContextType(input.contextType);
        const contextId = this.normalizeUuid(input.contextId, 'Invalid contextId');
        const context = await this.resolveContext(contextType, contextId);
        await this.assertAccess(context, input.userId, role);

        const channel = await this.getOrCreateChannel(context, input.userId);
        const content = this.sanitizeContent(input.content);
        const messageType = this.normalizeMessageType(input.type);

        const createdMessage = await prisma.$transaction(async (tx) => {
            const message = await tx.chatMessage.create({
                data: {
                    channelId: channel.id,
                    senderId: input.userId,
                    type: messageType,
                    content,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            });

            await tx.chatReadState.upsert({
                where: {
                    channelId_userId: {
                        channelId: channel.id,
                        userId: input.userId,
                    },
                },
                update: {
                    lastReadMessageId: message.id,
                    lastReadAt: new Date(),
                },
                create: {
                    channelId: channel.id,
                    userId: input.userId,
                    lastReadMessageId: message.id,
                    lastReadAt: new Date(),
                },
            });

            return message;
        });

        return {
            channel: this.toChannelView(channel),
            message: this.toMessageView(createdMessage),
        };
    }

    static async markContextRead(input: {
        userId: string;
        role: string;
        contextType: string;
        contextId: string;
        messageId?: string | null;
    }) {
        const role = this.normalizeRole(input.role);
        const contextType = this.parseContextType(input.contextType);
        const contextId = this.normalizeUuid(input.contextId, 'Invalid contextId');
        const context = await this.resolveContext(contextType, contextId);
        await this.assertAccess(context, input.userId, role);

        const channel = await this.getOrCreateChannel(context, input.userId);
        const messageId = input.messageId ? this.normalizeUuid(input.messageId, 'Invalid messageId') : null;

        let lastReadMessageId: string | null = null;
        if (messageId) {
            const message = await prisma.chatMessage.findUnique({
                where: { id: messageId },
                select: { id: true, channelId: true },
            });
            if (!message || message.channelId !== channel.id) {
                throw new ApiError(400, 'Invalid messageId for this channel');
            }
            lastReadMessageId = message.id;
        } else {
            const latestMessage = await prisma.chatMessage.findFirst({
                where: {
                    channelId: channel.id,
                    deletedAt: null,
                },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                select: { id: true },
            });
            lastReadMessageId = latestMessage?.id || null;
        }

        const now = new Date();
        const readState = await prisma.chatReadState.upsert({
            where: {
                channelId_userId: {
                    channelId: channel.id,
                    userId: input.userId,
                },
            },
            update: {
                lastReadAt: now,
                ...(lastReadMessageId ? { lastReadMessageId } : {}),
            },
            create: {
                channelId: channel.id,
                userId: input.userId,
                lastReadAt: now,
                ...(lastReadMessageId ? { lastReadMessageId } : {}),
            },
            select: {
                channelId: true,
                userId: true,
                lastReadMessageId: true,
                lastReadAt: true,
            },
        });

        return {
            channelId: readState.channelId,
            userId: readState.userId,
            lastReadMessageId: readState.lastReadMessageId || null,
            lastReadAt: readState.lastReadAt.toISOString(),
        };
    }

    static async resolveChannelForSocket(input: {
        userId: string;
        role: string;
        contextType: string;
        contextId: string;
    }): Promise<ChatChannelView> {
        const role = this.normalizeRole(input.role);
        const contextType = this.parseContextType(input.contextType);
        const contextId = this.normalizeUuid(input.contextId, 'Invalid contextId');
        const context = await this.resolveContext(contextType, contextId);
        await this.assertAccess(context, input.userId, role);
        const channel = await this.getOrCreateChannel(context, input.userId);
        return this.toChannelView(channel);
    }

    private static async assertCursorInChannel(cursor: string, channelId: string) {
        const cursorMessage = await prisma.chatMessage.findUnique({
            where: { id: cursor },
            select: {
                id: true,
                channelId: true,
            },
        });
        if (!cursorMessage || cursorMessage.channelId !== channelId) {
            throw new ApiError(400, 'Cursor does not belong to this chat channel');
        }
    }

    private static normalizeRole(role: string): Role {
        if (role === Role.STUDENT || role === Role.TEACHER || role === Role.ADMIN) {
            return role;
        }
        throw new ApiError(403, 'Invalid user role');
    }

    private static normalizeUuid(rawValue: string, message: string): string {
        const value = String(rawValue || '').trim();
        if (!UUID_PATTERN.test(value)) {
            throw new ApiError(400, message);
        }
        return value;
    }

    private static normalizeLimit(limit?: number): number {
        if (!Number.isFinite(limit)) {
            return DEFAULT_MESSAGE_LIMIT;
        }
        const parsedLimit = Math.trunc(Number(limit));
        if (parsedLimit < 1) {
            return DEFAULT_MESSAGE_LIMIT;
        }
        return Math.min(parsedLimit, MAX_MESSAGE_LIMIT);
    }

    private static sanitizeContent(rawContent: string): string {
        const content = String(rawContent || '')
            .replace(/\u0000/g, '')
            .trim();
        if (!content) {
            throw new ApiError(400, 'Message content is required');
        }
        if (content.length > MAX_MESSAGE_LENGTH) {
            throw new ApiError(400, `Message exceeds ${MAX_MESSAGE_LENGTH} characters`);
        }
        return content;
    }

    private static normalizeMessageType(rawType?: ChatMessageType | 'TEXT' | 'CODE'): ChatMessageType {
        if (!rawType) {
            return ChatMessageType.TEXT;
        }
        if (rawType === ChatMessageType.TEXT || rawType === ChatMessageType.CODE) {
            return rawType;
        }
        throw new ApiError(400, 'Invalid message type');
    }

    private static async resolveContext(type: ChatChannelType, contextId: string): Promise<ResolvedContext> {
        if (type === ChatChannelType.COURSE) {
            const course = await prisma.course.findUnique({
                where: { id: contextId },
                select: { id: true, teacherId: true },
            });
            if (!course) {
                throw new ApiError(404, 'Course not found');
            }
            return {
                type,
                courseId: course.id,
                ownerTeacherId: course.teacherId,
            };
        }

        if (type === ChatChannelType.LESSON) {
            const lesson = await prisma.lesson.findUnique({
                where: { id: contextId },
                select: {
                    id: true,
                    courseId: true,
                    course: {
                        select: {
                            teacherId: true,
                        },
                    },
                },
            });
            if (!lesson) {
                throw new ApiError(404, 'Lesson not found');
            }
            return {
                type,
                lessonId: lesson.id,
                courseId: lesson.courseId,
                ownerTeacherId: lesson.course.teacherId,
            };
        }

        if (type === ChatChannelType.PROBLEM) {
            const problem = await prisma.problem.findUnique({
                where: { id: contextId },
                select: {
                    id: true,
                    createdById: true,
                    lesson: {
                        select: {
                            courseId: true,
                            course: {
                                select: {
                                    teacherId: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!problem) {
                throw new ApiError(404, 'Problem not found');
            }
            return {
                type,
                problemId: problem.id,
                courseId: problem.lesson?.courseId,
                ownerTeacherId: problem.lesson?.course.teacherId || problem.createdById,
            };
        }

        if (type === ChatChannelType.QUIZ) {
            const quiz = await prisma.quiz.findUnique({
                where: { id: contextId },
                select: {
                    id: true,
                    courseId: true,
                    course: {
                        select: {
                            teacherId: true,
                        },
                    },
                },
            });
            if (!quiz) {
                throw new ApiError(404, 'Quiz not found');
            }
            return {
                type,
                quizId: quiz.id,
                courseId: quiz.courseId,
                ownerTeacherId: quiz.course.teacherId,
            };
        }

        const battleRoom = await prisma.battleRoom.findUnique({
            where: { id: contextId },
            select: {
                id: true,
                teacherId: true,
            },
        });
        if (!battleRoom) {
            throw new ApiError(404, 'Battle room not found');
        }
        return {
            type,
            battleRoomId: battleRoom.id,
            ownerTeacherId: battleRoom.teacherId,
        };
    }

    private static async assertAccess(context: ResolvedContext, userId: string, role: Role) {
        if (role === Role.ADMIN) {
            return;
        }

        if (context.type === ChatChannelType.BATTLE) {
            if (role === Role.TEACHER) {
                if (context.ownerTeacherId !== userId) {
                    throw new ApiError(403, 'Forbidden: You do not have battle chat access');
                }
                return;
            }

            const participant = await prisma.battleParticipant.findUnique({
                where: {
                    roomId_userId: {
                        roomId: context.battleRoomId as string,
                        userId,
                    },
                },
                select: { id: true },
            });

            if (!participant) {
                throw new ApiError(403, 'Forbidden: Join the battle to access chat');
            }
            return;
        }

        if (role === Role.TEACHER) {
            if (context.ownerTeacherId !== userId) {
                throw new ApiError(403, 'Forbidden: You do not own this context');
            }
            return;
        }

        if (!context.courseId) {
            throw new ApiError(403, 'Forbidden: Student access unavailable for this context');
        }

        const isEnrolled = await CourseService.isStudentEnrolled(context.courseId, userId);
        if (!isEnrolled) {
            throw new ApiError(403, 'Forbidden: You are not enrolled in this course');
        }
    }

    private static buildChannelWhere(context: ResolvedContext): Prisma.ChatChannelWhereInput {
        if (context.type === ChatChannelType.COURSE) {
            return { courseId: context.courseId };
        }
        if (context.type === ChatChannelType.LESSON) {
            return { lessonId: context.lessonId };
        }
        if (context.type === ChatChannelType.PROBLEM) {
            return { problemId: context.problemId };
        }
        if (context.type === ChatChannelType.QUIZ) {
            return { quizId: context.quizId };
        }
        return { battleRoomId: context.battleRoomId };
    }

    private static buildChannelCreateData(context: ResolvedContext, createdById: string): Prisma.ChatChannelCreateInput {
        if (context.type === ChatChannelType.COURSE) {
            return {
                type: context.type,
                createdBy: { connect: { id: createdById } },
                course: { connect: { id: context.courseId as string } },
            };
        }

        if (context.type === ChatChannelType.LESSON) {
            return {
                type: context.type,
                createdBy: { connect: { id: createdById } },
                lesson: { connect: { id: context.lessonId as string } },
            };
        }

        if (context.type === ChatChannelType.PROBLEM) {
            return {
                type: context.type,
                createdBy: { connect: { id: createdById } },
                problem: { connect: { id: context.problemId as string } },
            };
        }

        if (context.type === ChatChannelType.QUIZ) {
            return {
                type: context.type,
                createdBy: { connect: { id: createdById } },
                quiz: { connect: { id: context.quizId as string } },
            };
        }

        return {
            type: context.type,
            createdBy: { connect: { id: createdById } },
            battleRoom: { connect: { id: context.battleRoomId as string } },
        };
    }

    private static async getOrCreateChannel(context: ResolvedContext, createdById: string): Promise<ChannelRecord> {
        const where = this.buildChannelWhere(context);
        const existing = await prisma.chatChannel.findFirst({
            where,
            select: channelSelect,
        });
        if (existing) {
            return existing;
        }

        try {
            return await prisma.chatChannel.create({
                data: this.buildChannelCreateData(context, createdById),
                select: channelSelect,
            });
        } catch (error: any) {
            if (error?.code !== 'P2002') {
                throw error;
            }
            const channel = await prisma.chatChannel.findFirst({
                where,
                select: channelSelect,
            });
            if (!channel) {
                throw new ApiError(500, 'Failed to resolve chat channel');
            }
            return channel;
        }
    }

    private static toChannelView(channel: ChannelRecord): ChatChannelView {
        return {
            id: channel.id,
            type: channel.type,
            courseId: channel.courseId,
            lessonId: channel.lessonId,
            problemId: channel.problemId,
            quizId: channel.quizId,
            battleRoomId: channel.battleRoomId,
            createdAt: channel.createdAt.toISOString(),
            updatedAt: channel.updatedAt.toISOString(),
        };
    }

    private static toMessageView(message: MessageRecord): ChatMessageView {
        return {
            id: message.id,
            channelId: message.channelId,
            type: message.type,
            content: message.content,
            metadata: message.metadata,
            createdAt: message.createdAt.toISOString(),
            editedAt: message.editedAt ? message.editedAt.toISOString() : null,
            deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
            sender: {
                id: message.sender.id,
                name: message.sender.name,
                role: message.sender.role,
            },
        };
    }
}
