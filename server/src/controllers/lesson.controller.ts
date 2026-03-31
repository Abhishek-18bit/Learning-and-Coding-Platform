import { Request, Response, NextFunction } from 'express';
import { LessonService } from '../services/lesson.service';
import { CourseService } from '../services/course.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/errors';

export class LessonController {
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            // Verify course ownership
            const course = await CourseService.findById(req.body.courseId);
            if (!course) {
                throw new ApiError(404, 'Course not found');
            }

            if (course.teacherId !== req.user.id && req.user.role !== 'ADMIN') {
                throw new ApiError(403, 'You do not have permission to add lessons to this course');
            }

            const lesson = await LessonService.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Lesson created successfully',
                lesson,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getByCourse(req: Request, res: Response, next: NextFunction) {
        try {
            const courseId = req.params.courseId as string;
            const lessons = await LessonService.findByCourseId(courseId);

            res.status(200).json({
                success: true,
                lessons,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const lessonId = req.params.lessonId as string;
            const lesson = await LessonService.findById(lessonId);

            if (!lesson) {
                throw new ApiError(404, 'Lesson not found');
            }

            res.status(200).json({
                success: true,
                lesson,
            });
        } catch (error) {
            next(error);
        }
    }

    static async generateQuiz(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const lessonId = req.params.lessonId as string;
            const quiz = await LessonService.generateQuizFromLesson({
                lessonId,
                teacherId: req.user.id,
                difficulty: req.body.difficulty,
                questionCount: req.body.questionCount,
                title: req.body.title,
                deadline: req.body.deadline,
            });

            res.status(201).json({
                success: true,
                message: 'Quiz generated from lesson successfully',
                quiz,
            });
        } catch (error) {
            next(error);
        }
    }
}
