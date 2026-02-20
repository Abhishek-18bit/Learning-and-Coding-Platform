import { Response, NextFunction } from 'express';
import { QuizService } from '../services/quiz.service';
import { CourseService } from '../services/course.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/errors';

export class QuizController {
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const quiz = await QuizService.create({
                teacherId: req.user.id,
                title: req.body.title,
                courseId: req.body.courseId,
                lessonId: req.body.lessonId,
                difficulty: req.body.difficulty,
                questions: req.body.questions,
            });

            res.status(201).json({
                success: true,
                message: 'Quiz created successfully',
                quiz,
            });
        } catch (error) {
            next(error);
        }
    }

    static async addQuestion(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const quizId = req.params.quizId as string;
            const quiz = await QuizService.findById(quizId);
            if (!quiz) throw new ApiError(404, 'Quiz not found');

            const course = await CourseService.findById(quiz.courseId);
            if (course?.teacherId !== req.user.id && req.user.role !== 'ADMIN') {
                throw new ApiError(403, 'Forbidden: Access denied');
            }

            const question = await QuizService.addQuestion({
                quizId,
                ...req.body
            });

            res.status(201).json({
                success: true,
                message: 'Question added successfully',
                question,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getByCourse(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const courseId = req.params.courseId as string;
            const includeEmpty = req.user?.role !== 'STUDENT';

            if (req.user.role === 'STUDENT') {
                const enrolled = await CourseService.isStudentEnrolled(courseId, req.user.id);
                if (!enrolled) {
                    return res.status(200).json({
                        success: true,
                        quizzes: [],
                    });
                }
            }

            const quizzes = await QuizService.findByCourseId(courseId, { includeEmpty });

            res.status(200).json({
                success: true,
                quizzes,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const quizId = req.params.quizId as string;
            const quiz = await QuizService.findById(quizId);
            if (!quiz) throw new ApiError(404, 'Quiz not found');

            if (req.user.role === 'STUDENT') {
                const enrolled = await CourseService.isStudentEnrolled(quiz.courseId, req.user.id);
                if (!enrolled) {
                    throw new ApiError(403, 'Forbidden: You are not enrolled in this course');
                }
            }

            res.status(200).json({
                success: true,
                quiz,
            });
        } catch (error) {
            next(error);
        }
    }

    static async attempt(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const quizId = req.params.quizId as string;
            const quiz = await QuizService.findById(quizId);
            if (!quiz) throw new ApiError(404, 'Quiz not found');
            if (!quiz.questions || quiz.questions.length === 0) {
                throw new ApiError(400, 'Quiz is not published yet. It has no questions.');
            }

            const enrolled = await CourseService.isStudentEnrolled(quiz.courseId, req.user.id);
            if (!enrolled) {
                throw new ApiError(403, 'Forbidden: You are not enrolled in this course');
            }

            const attempt = await QuizService.createAttempt({
                userId: req.user.id,
                quizId,
            });

            res.status(201).json({
                success: true,
                message: 'Quiz attempt started',
                attempt,
            });
        } catch (error) {
            next(error);
        }
    }

    static async submitAttempt(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const attemptId = req.params.attemptId as string;
            const { score } = req.body;

            const updatedAttempt = await QuizService.submitAttempt(attemptId, score);
            const attempt = await QuizService.findAttemptById(attemptId) as any;

            // Emit socket event
            const { emitToUser } = await import('../utils/socket');
            emitToUser(req.user.id, 'QUIZ_COMPLETED', {
                quizId: attempt?.quizId,
                quizTitle: attempt?.quiz?.title,
                score,
                attemptId
            });

            res.status(200).json({
                success: true,
                message: 'Quiz submitted successfully',
                attempt: updatedAttempt,
            });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) throw new ApiError(401, 'Unauthorized');

            const quizId = req.params.quizId as string;
            await QuizService.deleteById(quizId, req.user.id, req.user.role);

            res.status(200).json({
                success: true,
                message: 'Quiz deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}
