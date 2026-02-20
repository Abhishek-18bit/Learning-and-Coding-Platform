import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ApiError } from '../utils/errors';

export class CourseController {
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const course = await CourseService.create({
                ...req.body,
                teacherId: req.user.id,
            });

            res.status(201).json({
                success: true,
                message: 'Course created successfully',
                course,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await CourseService.findAll(page, limit);

            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const courseId = req.params.courseId as string;
            const course = await CourseService.findById(courseId);

            if (!course) {
                throw new ApiError(404, 'Course not found');
            }

            res.status(200).json({
                success: true,
                course,
            });
        } catch (error) {
            next(error);
        }
    }

    static async enroll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const courseId = req.params.courseId as string;
            const enrollment = await CourseService.enrollStudent(courseId, req.user.id);

            res.status(201).json({
                success: true,
                message: 'Enrolled in course successfully',
                enrollment,
            });
        } catch (error) {
            next(error);
        }
    }

    static async unenroll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const courseId = req.params.courseId as string;
            await CourseService.unenrollStudent(courseId, req.user.id);

            res.status(200).json({
                success: true,
                message: 'Unenrolled from course successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    static async getStudents(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                throw new ApiError(401, 'Unauthorized');
            }

            const courseId = req.params.courseId as string;
            const students = await CourseService.getEnrolledStudents(
                courseId,
                req.user.id,
                req.user.role
            );

            res.status(200).json({
                success: true,
                students,
            });
        } catch (error) {
            next(error);
        }
    }
}
