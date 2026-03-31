import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/platform-stats', DashboardController.getPlatformStats);
router.get('/student', authenticate, authorize('STUDENT'), DashboardController.getStudentDashboard);
router.get('/teacher', authenticate, authorize('TEACHER', 'ADMIN'), DashboardController.getTeacherDashboard);

export default router;
