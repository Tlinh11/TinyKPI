import { Request, Response, NextFunction } from 'express';
import { positionService } from './position.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';

export class PositionController {
  getPositions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await positionService.getAllPositions();
      return sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  };

  getPositionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const item = await positionService.getPositionById(id);
      return sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  };

  createPosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await positionService.createPosition(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Thêm chức vụ thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  updatePosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await positionService.updatePosition(id, req.body, userId, userEmail);
      return sendSuccess(res, result, 'Cập nhật chức vụ thành công');
    } catch (err) {
      next(err);
    }
  };

  deletePosition = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      await positionService.deletePosition(id, userId, userEmail);
      return sendSuccess(res, null, 'Xóa chức vụ thành công');
    } catch (err) {
      next(err);
    }
  };

  bulkCreatePositions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const items = Array.isArray(req.body) ? req.body : req.body.items;
      if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không đúng định dạng mảng (array)' });
      }
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await positionService.bulkCreatePositions(items, userId, userEmail);
      return sendSuccess(res, result, `Đã nhập thành công ${result.importedCount}/${items.length} chức vụ`);
    } catch (err) {
      next(err);
    }
  };
}

export const positionController = new PositionController();

