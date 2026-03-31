import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { changePasswordSchema, updateProfileSchema } from '../validations/user.validation';

const router = Router();

router.get('/me', authenticate, UserController.getMe);
router.put('/me', authenticate, validateBody(updateProfileSchema), UserController.updateMe);
router.put('/me/password', authenticate, validateBody(changePasswordSchema), UserController.changePassword);

export default router;
