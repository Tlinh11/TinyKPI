import { Router } from 'express';
import { departmentController } from './department.controller.js';
import { authGuard, requirePermission } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', requirePermission('departments.manage'), departmentController.createDepartment);
router.put('/:id', requirePermission('departments.manage'), departmentController.updateDepartment);
router.delete('/:id', requirePermission('departments.manage'), departmentController.deleteDepartment);

export default router;
