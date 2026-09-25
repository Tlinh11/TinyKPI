import { Router } from 'express';
import { strategyController } from './strategy.controller.js';
import { authGuard, requirePermission } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

router.get('/', strategyController.getAssessment);
router.post('/', requirePermission('bsc_strategy.manage'), strategyController.saveAssessment);

export default router;
