import { Router } from 'express';
import { taskController } from './task.controller.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

router.post('/:id/checklists', taskController.addChecklist);
router.put('/:id/checklists/:checklistId', taskController.toggleChecklist);
router.post('/:id/comments', taskController.addComment);

export default router;
