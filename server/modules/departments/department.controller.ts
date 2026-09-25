import { Request, Response, NextFunction } from 'express';
import { departmentService } from './department.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';

export class DepartmentController {
  getDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await departmentService.getAllDepartments();
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  };

  getDepartmentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const item = await departmentService.getDepartmentById(id);
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  };

  createDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await departmentService.createDepartment(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Thêm phòng ban thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  updateDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await departmentService.updateDepartment(id, req.body, userId, userEmail);
      return sendSuccess(res, result, 'Cập nhật phòng ban thành công');
    } catch (err) {
      next(err);
    }
  };

  deleteDepartment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      await departmentService.deleteDepartment(id, userId, userEmail);
      return sendSuccess(res, null, 'Xóa phòng ban thành công');
    } catch (err) {
      next(err);
    }
  };

  bulkCreateDepartments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const items = Array.isArray(req.body) ? req.body : req.body.items;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không đúng định dạng mảng (array)' });
      }
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await departmentService.bulkCreateDepartments(items, userId, userEmail);
      return sendSuccess(res, result, `Đã nhập thành công ${result.importedCount}/${items.length} phòng ban`);
    } catch (err) {
      next(err);
    }
  };
}

export const departmentController = new DepartmentController();

