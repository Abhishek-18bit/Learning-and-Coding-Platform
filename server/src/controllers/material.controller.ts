import { Request, Response, NextFunction } from 'express';
import { MaterialService } from '../services/material.service';
import { ApiError } from '../utils/errors';
import fs from 'fs';
import { AuthRequest } from '../middlewares/auth.middleware';

export class MaterialController {
    static async upload(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const file = req.file;
            const courseId = String(req.params.courseId);
            const { title } = req.body;
            const user = req.user;

            if (!file) {
                throw new ApiError(400, 'No file uploaded');
            }
            if (!user) {
                throw new ApiError(401, 'Unauthorized');
            }

            if (!title) {
                // If title missing, use original filename
                // But better to enforce title or default.
            }

            // Validate file type (already done by middleware but good to double check)
            if (file.mimetype !== 'application/pdf') {
                // Remove invalid file
                fs.unlinkSync(file.path);
                throw new ApiError(400, 'Invalid file type. Only PDF allowed.');
            }

            const material = await MaterialService.create({
                title: title || file.originalname,
                fileUrl: file.path, // Store relative path 'uploads/filename.pdf'
                fileType: 'application/pdf',
                courseId,
                uploadedBy: user.id
            });

            res.status(201).json({
                success: true,
                data: material
            });
        } catch (error) {
            // Cleanup file if error
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            next(error);
        }
    }

    static async getByCourse(req: Request, res: Response, next: NextFunction) {
        try {
            const courseId = String(req.params.courseId);
            const materials = await MaterialService.getByCourseId(courseId);
            res.status(200).json({
                success: true,
                data: materials
            });
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            const user = req.user;

            if (!user) {
                throw new ApiError(401, 'Unauthorized');
            }

            // Check if material exists
            const material = await MaterialService.findById(id);
            if (!material) {
                throw new ApiError(404, 'Material not found');
            }

            // Check permission: Teacher of the course or Admin?
            // For now, only uploader (teacher) or admin.
            if (user.role !== 'ADMIN' && material.uploadedBy !== user.id) {
                throw new ApiError(403, 'Not authorized to delete this material');
            }

            await MaterialService.delete(id);
            res.status(200).json({
                success: true,
                message: 'Material deleted successfully'
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

            const materialId = String(req.params.materialId);
            const quiz = await MaterialService.generateQuizFromMaterial({
                materialId,
                teacherId: req.user.id,
                difficulty: req.body.difficulty,
                questionCount: req.body.questionCount,
                title: req.body.title,
            });

            res.status(201).json({
                success: true,
                message: 'Quiz generated from PDF material successfully',
                quiz,
            });
        } catch (error) {
            next(error);
        }
    }
}
