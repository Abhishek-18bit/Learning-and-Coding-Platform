import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller';
import { ProblemController } from '../controllers/problem.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createLessonSchema, generateLessonQuizSchema } from '../validations/lesson.validation';

const router = Router();

// Teacher/Admin Only: Create Lesson
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(createLessonSchema), LessonController.create);
// Teacher Only: Generate AI quiz from lesson content
router.post('/:lessonId/generate-quiz', authenticate, authorize('TEACHER'), validateBody(generateLessonQuizSchema), LessonController.generateQuiz);

// Public/Authenticated: Get lessons by course
router.get('/course/:courseId', LessonController.getByCourse);

// API Contract: Get problems by lesson
router.get('/:lessonId/problems', ProblemController.getByLesson);

export default router;
