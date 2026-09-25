import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';

export class UserController {
  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, search, departmentId, positionId, roleId, status } = req.query;
      const result = await userService.getUsers({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        search: search as string,
        departmentId: departmentId as string,
        positionId: positionId as string,
        roleId: roleId as string,
        status: status as string,
      });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const user = await userService.getUserById(id);
      return sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  };

  createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authorId = req.user?.userId;
      const authorEmail = req.user?.email;
      const created = await userService.createUser(req.body, authorId, authorEmail);
      return sendSuccess(res, created, 'Thêm nhân sự mới thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const authorId = req.user?.userId;
      const authorEmail = req.user?.email;
      const updated = await userService.updateUser(id, req.body, authorId, authorEmail);
      return sendSuccess(res, updated, 'Cập nhật nhân sự thành công');
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const authorId = req.user?.userId;
      const authorEmail = req.user?.email;
      await userService.deleteUser(id, authorId, authorEmail);
      return sendSuccess(res, null, 'Xóa nhân sự thành công');
    } catch (err) {
      next(err);
    }
  };

  bulkCreateUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const items = Array.isArray(req.body) ? req.body : req.body.items;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không đúng định dạng mảng (array)' });
      }
      const authorId = req.user?.userId;
      const authorEmail = req.user?.email;
      const result = await userService.bulkCreateUsers(items, authorId, authorEmail);
      return sendSuccess(res, result, `Đã nhập thành công ${result.importedCount}/${items.length} nhân sự`);
    } catch (err) {
      next(err);
    }
  };
}

export const userController = new UserController();

