import { Router } from 'express';
import { positionController } from './position.controller.js';
import { authGuard, requirePermission } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

router.get('/', positionController.getPositions);
router.get('/:id', positionController.getPositionById);
router.post('/', requirePermission('positions.manage'), positionController.createPosition);
router.put('/:id', requirePermission('positions.manage'), positionController.updatePosition);
router.delete('/:id', requirePermission('positions.manage'), positionController.deletePosition);

export default router;
