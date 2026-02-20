import prisma from '../db/prisma';

export const getAllInterviewQuestions = async (userId: string, category?: string, search?: string) => {
    const where: any = {};

    if (category && category !== 'All') {
        where.category = category;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [questions, progress] = await Promise.all([
        prisma.interviewQuestion.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.interviewProgress.findMany({
            where: { userId }
        })
    ]);

    const progressMap = new Map(progress.map(p => [p.interviewQuestionId, p.completed]));

    return questions.map(q => ({
        ...q,
        completed: progressMap.get(q.id) || false
    }));
};

export const createInterviewQuestion = async (data: { title: string; content: string; category: string }) => {
    return prisma.interviewQuestion.create({
        data
    });
};

export const markInterviewCompleted = async (userId: string, interviewQuestionId: string) => {
    return prisma.interviewProgress.upsert({
        where: {
            id: `${userId}_${interviewQuestionId}`, // Note: This might require a composite unique key or manual check
        },
        update: {
            completed: true,
            completedAt: new Date()
        },
        create: {
            userId,
            interviewQuestionId,
            completed: true,
            completedAt: new Date()
        }
    });
};

// Since upsert with a custom string ID might fail if not in schema, let's do it safely
export const safeMarkCompleted = async (userId: string, interviewQuestionId: string) => {
    const existing = await prisma.interviewProgress.findFirst({
        where: { userId, interviewQuestionId }
    });

    if (existing) {
        return prisma.interviewProgress.update({
            where: { id: existing.id },
            data: { completed: true, completedAt: new Date() }
        });
    }

    return prisma.interviewProgress.create({
        data: {
            userId,
            interviewQuestionId,
            completed: true,
            completedAt: new Date()
        }
    });
};
