import { Router } from 'express';
import { MaterialController } from '../controllers/material.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { generateMaterialQuizSchema } from '../validations/material.validation';

const router = Router();

// Generate quiz from PDF material
router.post(
    '/:materialId/generate-quiz',
    authenticate,
    authorize('TEACHER'),
    validateBody(generateMaterialQuizSchema),
    MaterialController.generateQuiz
);

// Delete a material
router.delete(
    '/:id',
    authenticate,
    authorize('TEACHER', 'ADMIN'),
    MaterialController.delete
);

export default router;
