import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { ChatController } from '../controllers/chat.controller';
import { createChatMessageSchema, markChatReadSchema } from '../validations/chat.validation';

const router = Router();

router.get(
    '/context/:contextType/:contextId/messages',
    authenticate,
    ChatController.getContextMessages
);

router.post(
    '/context/:contextType/:contextId/messages',
    authenticate,
    validateBody(createChatMessageSchema),
    ChatController.createMessage
);

router.post(
    '/context/:contextType/:contextId/read',
    authenticate,
    validateBody(markChatReadSchema),
    ChatController.markRead
);

export default router;
