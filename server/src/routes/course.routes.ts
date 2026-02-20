import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createCourseSchema } from '../validations/course.validation';

import { MaterialController } from '../controllers/material.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Public/General Access
router.get('/', CourseController.getAll);
router.get('/:courseId', CourseController.getById);

// Enrollment Routes
router.post('/:courseId/enroll', authenticate, authorize('STUDENT'), CourseController.enroll);
router.delete('/:courseId/enroll', authenticate, authorize('STUDENT'), CourseController.unenroll);
router.get('/:courseId/students', authenticate, authorize('TEACHER', 'ADMIN'), CourseController.getStudents);

// Materials Routes
router.get('/:courseId/materials', authenticate, MaterialController.getByCourse);
router.post(
    '/:courseId/materials',
    authenticate,
    authorize('TEACHER', 'ADMIN'),
    upload.single('file'),
    MaterialController.upload
);

// Teacher/Admin Only
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(createCourseSchema), CourseController.create);

export default router;
