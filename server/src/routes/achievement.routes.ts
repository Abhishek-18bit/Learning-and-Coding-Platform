import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { AchievementController } from '../controllers/achievement.controller';

const router = Router();

router.get('/me', authenticate, AchievementController.getMyAchievements);

export default router;
