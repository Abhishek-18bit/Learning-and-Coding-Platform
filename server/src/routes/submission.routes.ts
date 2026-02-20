import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { submitCodeSchema } from '../validations/submission.validation';

const router = Router();

// Student Only: Submit Code
router.post('/', authenticate, authorize('STUDENT'), validateBody(submitCodeSchema), SubmissionController.submit);

// Authenticated: Get My Submissions
router.get('/me', authenticate, SubmissionController.getMySubmissions);

export default router;
