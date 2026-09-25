import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authGuard, authController.getProfile);
router.post('/change-password', authGuard, authController.changePassword);

export default router;
