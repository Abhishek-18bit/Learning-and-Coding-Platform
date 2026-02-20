import { Difficulty, Lesson } from '@prisma/client';
import prisma from '../db/prisma';
import { ApiError } from '../utils/errors';
import { QuizGeneratorService } from './quiz-generator.service';
import { QuizService } from './quiz.service';

export class LessonService {
    static async create(data: { title: string; content?: string; courseId: string }): Promise<Lesson> {
        return prisma.lesson.create({
            data: {
                title: data.title,
                content: data.content,
                courseId: data.courseId,
            },
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
            timeLimit,
            totalMarks,
            questions,
        });
    }
}
