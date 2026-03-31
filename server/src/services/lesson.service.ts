import { Difficulty, Lesson } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';
import { QuizGeneratorService } from './quiz-generator.service';
import { QuizService } from './quiz.service';

export class LessonService {
    static async create(data: {
        title: string;
        content?: string;
        courseId: string;
        unitId?: string;
        topicId?: string;
        unitTitle?: string;
        topicTitle?: string;
        topicOrder?: number;
        estimatedMinutes?: number;
    }): Promise<Lesson> {
        return prisma.$transaction(async (tx) => {
            let resolvedUnitId = data.unitId;

            if (resolvedUnitId) {
                const unit = await tx.courseUnit.findUnique({
                    where: { id: resolvedUnitId },
                    select: { id: true, courseId: true },
                });

                if (!unit || unit.courseId !== data.courseId) {
                    throw new ApiError(400, 'Selected unit does not belong to this course');
                }
            } else if (data.unitTitle?.trim()) {
                const trimmedTitle = data.unitTitle.trim();
                const existingUnit = await tx.courseUnit.findFirst({
                    where: {
                        courseId: data.courseId,
                        title: trimmedTitle,
                    },
                    select: { id: true },
                });

                if (existingUnit) {
                    resolvedUnitId = existingUnit.id;
                } else {
                    const lastUnit = await tx.courseUnit.findFirst({
                        where: { courseId: data.courseId },
                        orderBy: { sortOrder: 'desc' },
                        select: { sortOrder: true },
                    });

                    const createdUnit = await tx.courseUnit.create({
                        data: {
                            courseId: data.courseId,
                            title: trimmedTitle,
                            sortOrder: (lastUnit?.sortOrder || 0) + 1,
                            estimatedHours: 8,
                        },
                        select: { id: true },
                    });

                    resolvedUnitId = createdUnit.id;
                }
            } else {
                const firstUnit = await tx.courseUnit.findFirst({
                    where: { courseId: data.courseId },
                    orderBy: { sortOrder: 'asc' },
                    select: { id: true },
                });

                if (firstUnit) {
                    resolvedUnitId = firstUnit.id;
                } else {
                    const createdUnit = await tx.courseUnit.create({
                        data: {
                            courseId: data.courseId,
                            title: 'Unit 1',
                            sortOrder: 1,
                            estimatedHours: 8,
                        },
                        select: { id: true },
                    });

                    resolvedUnitId = createdUnit.id;
                }
            }

            if (!resolvedUnitId) {
                throw new ApiError(500, 'Unable to assign lesson unit');
            }

            const lesson = await tx.lesson.create({
                data: {
                    title: data.title,
                    content: data.content,
                    courseId: data.courseId,
                    unitId: resolvedUnitId,
                },
            });

            if (data.topicId) {
                const existingTopic = await tx.courseTopic.findUnique({
                    where: { id: data.topicId },
                    select: {
                        id: true,
                        unitId: true,
                        lessonId: true,
                        title: true,
                        estimatedMinutes: true,
                    },
                });

                if (!existingTopic) {
                    throw new ApiError(404, 'Selected topic not found');
                }

                if (existingTopic.unitId !== resolvedUnitId) {
                    throw new ApiError(400, 'Selected topic does not belong to the chosen unit');
                }

                if (existingTopic.lessonId) {
                    throw new ApiError(409, 'Selected topic already has lesson content');
                }

                await tx.courseTopic.update({
                    where: { id: existingTopic.id },
                    data: {
                        lessonId: lesson.id,
                        title: data.topicTitle?.trim() || existingTopic.title,
                        estimatedMinutes:
                            data.estimatedMinutes ||
                            existingTopic.estimatedMinutes ||
                            30,
                    },
                });

                return lesson;
            }

            let resolvedTopicOrder: number;
            if (data.topicOrder && data.topicOrder > 0) {
                resolvedTopicOrder = data.topicOrder;
            } else {
                const lastTopic = await tx.courseTopic.findFirst({
                    where: { unitId: resolvedUnitId },
                    orderBy: { sortOrder: 'desc' },
                    select: { sortOrder: true },
                });
                resolvedTopicOrder = (lastTopic?.sortOrder || 0) + 1;
            }

            await tx.courseTopic.create({
                data: {
                    unitId: resolvedUnitId,
                    lessonId: lesson.id,
                    title: data.topicTitle?.trim() || lesson.title,
                    sortOrder: resolvedTopicOrder,
                    estimatedMinutes: data.estimatedMinutes || 30,
                },
            });

            return lesson;
        });
    }

    static async findByCourseId(courseId: string) {
        return prisma.lesson.findMany({
            where: { courseId },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    static async findById(id: string) {
        return prisma.lesson.findUnique({
            where: { id },
            include: {
                course: true,
                problems: true,
            },
        });
    }

    static async generateQuizFromLesson(data: {
        lessonId: string;
        teacherId: string;
        difficulty: Difficulty;
        questionCount: number;
        title?: string;
        deadline?: string;
    }) {
        const lesson = await prisma.lesson.findUnique({
            where: { id: data.lessonId },
            include: {
                course: {
                    select: {
                        id: true,
                        teacherId: true,
                    },
                },
            },
        });

        if (!lesson) {
            throw new ApiError(404, 'Lesson not found');
        }

        if (lesson.course.teacherId !== data.teacherId) {
            throw new ApiError(403, 'Forbidden: You do not have permission to generate quiz for this lesson');
        }

        const questions = await QuizGeneratorService.generateFromLessonContent({
            lessonTitle: lesson.title,
            lessonContent: lesson.content || '',
            difficulty: data.difficulty,
            questionCount: data.questionCount,
        });

        if (questions.length === 0) {
            throw new ApiError(422, 'Unable to generate quiz questions from this lesson content.');
        }

        const quizTitle = data.title || `${lesson.title} - AI Quiz`;
        const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
        const timeLimit = Math.max(5, questions.length * 2);

        return QuizService.createLessonGeneratedQuiz({
            title: quizTitle,
            courseId: lesson.course.id,
            lessonId: lesson.id,
            difficulty: data.difficulty,
            deadline: data.deadline,
            timeLimit,
            totalMarks,
            questions,
        });
    }
}
