import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';

export class TaskController {
  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        departmentId: req.query.departmentId as string,
        assigneeId: req.query.assigneeId as string,
        search: req.query.search as string,
      };
      const tasks = await taskService.getAllTasks(filters);
      return sendSuccess(res, tasks);
    } catch (err) {
      next(err);
    }
  };

  getTaskById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const task = await taskService.getTaskById(id);
      return sendSuccess(res, task);
    } catch (err) {
      next(err);
    }
  };

  createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const creatorId = req.user?.userId;
      const task = await taskService.createTask(req.body, creatorId);
      return sendSuccess(res, task, 'Tạo công việc thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const task = await taskService.updateTask(id, req.body);
      return sendSuccess(res, task, 'Cập nhật công việc thành công');
    } catch (err) {
      next(err);
    }
  };

  deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await taskService.deleteTask(id);
      return sendSuccess(res, null, 'Xóa công việc thành công');
    } catch (err) {
      next(err);
    }
  };

  addChecklist = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const item = await taskService.addChecklist(id, req.body.title);
      return sendSuccess(res, item, 'Thêm checklist thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  toggleChecklist = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const checklistId = req.params.checklistId as string;
      const item = await taskService.toggleChecklist(checklistId, req.body.isDone);
      return sendSuccess(res, item, 'Cập nhật checklist thành công');
    } catch (err) {
      next(err);
    }
  };

  addComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const comment = await taskService.addComment(id, userId, req.body.content);
      return sendSuccess(res, comment, 'Đã gửi bình luận', 201);
    } catch (err) {
      next(err);
    }
  };
}

export const taskController = new TaskController();
