import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
    createCourseSchema,
    createCourseTopicSchema,
    createCourseUnitSchema,
    reorderCourseTopicsSchema,
    reorderCourseUnitsSchema,
} from '../validations/course.validation';

import { MaterialController } from '../controllers/material.controller';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Public/General Access
router.get('/', CourseController.getAll);
router.get('/:courseId', CourseController.getById);
router.get('/:courseId/units', CourseController.getUnits);

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
router.post('/:courseId/units', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(createCourseUnitSchema), CourseController.createUnit);
router.post('/:courseId/units/:unitId/topics', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(createCourseTopicSchema), CourseController.createTopic);
router.patch('/:courseId/units/reorder', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(reorderCourseUnitsSchema), CourseController.reorderUnits);
router.patch('/:courseId/units/:unitId/topics/reorder', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(reorderCourseTopicsSchema), CourseController.reorderTopics);
router.delete('/:courseId', authenticate, authorize('TEACHER', 'ADMIN'), CourseController.delete);

export default router;
