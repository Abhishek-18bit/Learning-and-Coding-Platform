import { Router } from 'express';
import { ProblemController } from '../controllers/problem.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createProblemSchema } from '../validations/problem.validation';
import { addTestCasesSchema } from '../validations/problem.validation';
import { submitCodeByProblemSchema } from '../validations/submission.validation';

const router = Router();

// Teacher/Admin Only: Create Problem
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(createProblemSchema), ProblemController.create);
router.post('/:id/testcases', authenticate, authorize('TEACHER', 'ADMIN'), validateBody(addTestCasesSchema), ProblemController.addTestCases);

// Authenticated Fetch APIs
router.get('/', authenticate, ProblemController.getAll);
router.get('/:id', authenticate, ProblemController.getById);

// Student Submission API
router.post('/:id/submit', authenticate, authorize('STUDENT'), validateBody(submitCodeByProblemSchema), ProblemController.submit);

export default router;
