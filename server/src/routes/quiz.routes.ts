import { Router } from 'express';
import { QuizController } from '../controllers/quiz.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createQuizSchema, addQuestionSchema, updateQuizDeadlineSchema } from '../validations/quiz.validation';

const router = Router();

// Teacher private route for manual quiz creation
router.post('/', authenticate, authorize('TEACHER'), validateBody(createQuizSchema), QuizController.create);
// Teacher/Admin route for incremental question management
router.post('/:quizId/questions', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(addQuestionSchema), QuizController.addQuestion);
router.patch('/:quizId/deadline', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(updateQuizDeadlineSchema), QuizController.updateDeadline);
router.delete('/:quizId', authenticate, authorize('TEACHER', 'ADMIN'), QuizController.delete);

// Student/General Authenticated Routes
router.get('/course/:courseId', authenticate, QuizController.getByCourse);
router.get('/:quizId', authenticate, QuizController.getById);
router.post('/:quizId/attempt', authenticate, authorize('STUDENT'), QuizController.attempt);
router.post('/attempts/:attemptId/submit', authenticate, authorize('STUDENT'), QuizController.submitAttempt);

export default router;
