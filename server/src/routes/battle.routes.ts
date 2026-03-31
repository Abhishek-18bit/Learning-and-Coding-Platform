import { Router } from 'express';
import { BattleController } from '../controllers/battle.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createBattleRoomSchema, endBattleRoomSchema, joinBattleRoomSchema } from '../validations/battle.validation';

const router = Router();

router.post(
    '/create',
    authenticate,
    authorize('TEACHER', 'ADMIN'),
    validateBody(createBattleRoomSchema),
    BattleController.createRoom
);

router.post(
    '/start/:roomId',
    authenticate,
    authorize('TEACHER', 'ADMIN'),
    BattleController.startRoom
);

router.post(
    '/end/:roomId',
    authenticate,
    authorize('TEACHER', 'ADMIN'),
    validateBody(endBattleRoomSchema),
    BattleController.endRoom
);

router.post(
    '/join',
    authenticate,
    authorize('STUDENT'),
    validateBody(joinBattleRoomSchema),
    BattleController.joinRoom
);

router.get(
    '/:roomId',
    authenticate,
    BattleController.getRoom
);

export default router;
