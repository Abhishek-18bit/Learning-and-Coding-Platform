import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import * as interviewValidation from '../validations/interview.validation';

const router = Router();

router.get('/interview-questions', authenticate, interviewController.getQuestions);

router.post(
    '/interview-questions',
    authenticate,
    authorize('TEACHER', 'ADMIN'),
    validateBody(interviewValidation.createInterviewQuestionSchema),
    interviewController.createQuestion
);

router.post(
    '/interview-progress',
    authenticate,
    validateBody(interviewValidation.markCompletedSchema),
    interviewController.markCompleted
);

export default router;
