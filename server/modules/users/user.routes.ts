import { Router } from 'express';
import { userController } from './user.controller.js';
import { authGuard, requirePermission } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('users.view'), userController.getUsers);
router.post('/bulk', requirePermission('users.create_update'), userController.bulkCreateUsers);
router.get('/:id', requirePermission('users.view'), userController.getUserById);
router.post('/', requirePermission('users.create_update'), userController.createUser);
router.put('/:id', requirePermission('users.create_update'), userController.updateUser);
router.delete('/:id', requirePermission('users.delete'), userController.deleteUser);

export default router;
