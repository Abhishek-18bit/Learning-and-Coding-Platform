import { Difficulty, Quiz, QuizQuestion, QuizAttempt } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';

interface CreateQuizQuestionInput {
    question: string;
    options: Record<string, string>;
    correctOption: string;
    explanation?: string;
    marks?: number;
}

interface CreateManualQuizInput {
    teacherId: string;
    title: string;
    courseId?: string;
    lessonId?: string;
    difficulty: Difficulty;
    questions: CreateQuizQuestionInput[];
}

export class QuizService {
    private static ensureGeneratedQuestions(questions: Array<{
        question: string;
        options: Record<string, string>;
        correctOption: string;
        explanation: string;
        marks: number;
    }>) {
        if (!questions || questions.length === 0) {
            throw new ApiError(422, 'AI could not generate valid questions. Please try again with richer content.');
        }

        for (const [index, question] of questions.entries()) {
            const optionKeys = Object.keys(question.options || {});
            if (optionKeys.length !== 4) {
                throw new ApiError(422, `Generated question ${index + 1} is invalid: expected exactly 4 options.`);
            }
            if (!Object.prototype.hasOwnProperty.call(question.options, question.correctOption)) {
                throw new ApiError(422, `Generated question ${index + 1} is invalid: correct option mismatch.`);
            }
        }
    }

    static async create(data: CreateManualQuizInput): Promise<Quiz & { questions: QuizQuestion[] }> {
        return prisma.$transaction(async (tx) => {
            let courseId: string;
            let lessonId: string | null = null;

            if (data.lessonId) {
                const lesson = await tx.lesson.findUnique({
                    where: { id: data.lessonId },
                    select: {
                        id: true,
                        courseId: true,
                        course: { select: { teacherId: true } },
                    },
                });

                if (!lesson) {
                    throw new ApiError(404, 'Lesson not found');
                }

                if (lesson.course.teacherId !== data.teacherId) {
                    throw new ApiError(403, 'Forbidden: You do not have permission to create a quiz for this lesson');
                }

                courseId = lesson.courseId;
                lessonId = lesson.id;
            } else {
                if (!data.courseId) {
                    throw new ApiError(400, 'Either lessonId or courseId is required');
                }

                const course = await tx.course.findUnique({
                    where: { id: data.courseId },
                    select: { id: true, teacherId: true },
                });

                if (!course) {
                    throw new ApiError(404, 'Course not found');
                }

                if (course.teacherId !== data.teacherId) {
                    throw new ApiError(403, 'Forbidden: You do not have permission to create a quiz for this course');
                }

                courseId = course.id;
            }

            const normalizedQuestions = data.questions.map((question) => ({
                ...question,
                explanation: question.explanation ?? 'No explanation provided',
                marks: question.marks ?? 1,
            }));

            const totalMarks = normalizedQuestions.reduce((sum, question) => sum + question.marks, 0);
            const timeLimit = Math.max(5, normalizedQuestions.length * 2);

            return tx.quiz.create({
                data: {
                    title: data.title,
                    courseId,
                    lessonId,
                    difficulty: data.difficulty,
                    sourceType: 'MANUAL',
                    timeLimit,
                    totalMarks,
                    questions: {
                        create: normalizedQuestions.map((question) => ({
                            question: question.question,
                            options: question.options,
                            correctOption: question.correctOption,
                            explanation: question.explanation,
                            marks: question.marks,
                        })),
                    },
                },
                include: {
                    questions: true,
                },
            });
        });
    }

    static async addQuestion(data: { quizId: string; question: string; options: any; correctOption: string; explanation?: string; marks: number }): Promise<QuizQuestion> {
        return prisma.quizQuestion.create({
            data: {
                quizId: data.quizId,
                question: data.question,
                options: data.options,
                correctOption: data.correctOption,
                explanation: data.explanation ?? 'No explanation provided',
                marks: data.marks,
            },
        });
    }

    static async createLessonGeneratedQuiz(data: {
        title: string;
        courseId: string;
        lessonId: string;
        difficulty: Difficulty;
        timeLimit: number;
        totalMarks: number;
        questions: Array<{
            question: string;
            options: Record<string, string>;
            correctOption: string;
            explanation: string;
            marks: number;
        }>;
    }): Promise<Quiz & { questions: QuizQuestion[] }> {
        this.ensureGeneratedQuestions(data.questions);

        return prisma.$transaction(async (tx) => {
            return tx.quiz.create({
                data: {
                    title: data.title,
                    courseId: data.courseId,
                    lessonId: data.lessonId,
                    difficulty: data.difficulty,
                    sourceType: 'LESSON_AI',
                    timeLimit: data.timeLimit,
                    totalMarks: data.totalMarks,
                    questions: {
                        create: data.questions.map((question) => ({
                            question: question.question,
                            options: question.options,
                            correctOption: question.correctOption,
                            explanation: question.explanation,
                            marks: question.marks,
                        })),
                    },
                },
                include: {
                    questions: true,
                },
            });
        });
    }

    static async createPdfGeneratedQuiz(data: {
        title: string;
        courseId: string;
        difficulty: Difficulty;
        timeLimit: number;
        totalMarks: number;
        questions: Array<{
            question: string;
            options: Record<string, string>;
            correctOption: string;
            explanation: string;
            marks: number;
        }>;
    }): Promise<Quiz & { questions: QuizQuestion[] }> {
        this.ensureGeneratedQuestions(data.questions);

        return prisma.$transaction(async (tx) => {
            return tx.quiz.create({
                data: {
                    title: data.title,
                    courseId: data.courseId,
                    difficulty: data.difficulty,
                    sourceType: 'PDF_AI',
                    timeLimit: data.timeLimit,
                    totalMarks: data.totalMarks,
                    questions: {
                        create: data.questions.map((question) => ({
                            question: question.question,
                            options: question.options,
                            correctOption: question.correctOption,
                            explanation: question.explanation,
                            marks: question.marks,
                        })),
                    },
                },
                include: {
                    questions: true,
                },
            });
        });
    }

    static async findById(id: string): Promise<(Quiz & { questions: QuizQuestion[] }) | null> {
        return prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: true,
            },
        });
    }

    static async findByCourseId(
        courseId: string,
        options?: { includeEmpty?: boolean }
    ): Promise<Quiz[]> {
        const includeEmpty = options?.includeEmpty ?? true;

        return prisma.quiz.findMany({
            where: {
                courseId,
                ...(includeEmpty ? {} : { questions: { some: {} } }),
            },
            include: {
                _count: {
                    select: { questions: true },
                },
            },
        });
    }

    static async createAttempt(data: { userId: string; quizId: string }): Promise<QuizAttempt> {
        return prisma.quizAttempt.create({
            data: {
                userId: data.userId,
                quizId: data.quizId,
            },
        });
    }

    static async submitAttempt(attemptId: string, score: number): Promise<QuizAttempt> {
        return prisma.quizAttempt.update({
            where: { id: attemptId },
            data: {
                score,
                submittedAt: new Date(),
            },
        });
    }

    static async findAttemptById(id: string): Promise<QuizAttempt | null> {
        return prisma.quizAttempt.findUnique({
            where: { id },
            include: { quiz: true }
        });
    }

    static async deleteById(quizId: string, requesterId: string, requesterRole: string): Promise<void> {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: {
                id: true,
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

        if (requesterRole !== 'ADMIN' && quiz.course.teacherId !== requesterId) {
            throw new ApiError(403, 'Forbidden: You do not have permission to delete this quiz');
        }

        await prisma.$transaction(async (tx) => {
            await tx.quizAttempt.deleteMany({ where: { quizId } });
            await tx.quizQuestion.deleteMany({ where: { quizId } });
            await tx.quiz.delete({ where: { id: quizId } });
        });
    }
}
