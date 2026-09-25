import { Request, Response, NextFunction } from 'express';
import { bscService } from './bsc.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';

export class BscController {
  getStrategyMap = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organization, stage } = req.query;
      const result = await bscService.getStrategyMap(
        organization as string,
        stage as string
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  getStrategyLinks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bscService.getStrategyLinks();
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  saveStrategyLinks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.saveStrategyLinks(req.body.links || [], userId, userEmail);
      return sendSuccess(res, result, 'Lưu liên kết bản đồ chiến lược thành công');
    } catch (err) {
      next(err);
    }
  };

  addStrategyLink = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.addStrategyLink(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Thêm liên kết nhân - quả thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  deleteStrategyLink = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.deleteStrategyLink(id, userId, userEmail);
      return sendSuccess(res, result, 'Đã xóa liên kết nhân - quả');
    } catch (err) {
      next(err);
    }
  };

  createObjective = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.createObjective(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Tạo mục tiêu chiến lược thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  updateObjective = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.updateObjective(id, req.body, userId, userEmail);
      return sendSuccess(res, result, 'Cập nhật mục tiêu thành công');
    } catch (err) {
      next(err);
    }
  };

  deleteObjective = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      await bscService.deleteObjective(id, userId, userEmail);
      return sendSuccess(res, null, 'Xóa mục tiêu chiến lược thành công');
    } catch (err) {
      next(err);
    }
  };

  createKpi = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.createKpi(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Tạo chỉ số KPI thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  updateKpi = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.updateKpi(id, req.body, userId, userEmail);
      return sendSuccess(res, result, 'Cập nhật chỉ số KPI thành công');
    } catch (err) {
      next(err);
    }
  };

  deleteKpi = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      await bscService.deleteKpi(id, userId, userEmail);
      return sendSuccess(res, null, 'Xóa chỉ số KPI thành công');
    } catch (err) {
      next(err);
    }
  };

  getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await bscService.getReports();
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  createReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.createReport(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Tạo báo cáo BSC thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  deleteReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      await bscService.deleteReport(id, userId, userEmail);
      return sendSuccess(res, null, 'Xóa báo cáo BSC thành công');
    } catch (err) {
      next(err);
    }
  };

  // SWOT Handlers
  getSwot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organization, stage } = req.query;
      const result = await bscService.getSwot(organization as string, stage as string);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  createSwotItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.createSwotItem(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Thêm mục SWOT thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  deleteSwotItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      await bscService.deleteSwotItem(id, userId, userEmail);
      return sendSuccess(res, null, 'Đã xóa mục SWOT');
    } catch (err) {
      next(err);
    }
  };

  // Strategy Matrix Handlers
  getStrategyMatrix = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organization, stage } = req.query;
      const result = await bscService.getStrategyMatrix(organization as string, stage as string);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  createStrategyMatrixItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.createStrategyMatrixItem(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Tạo chiến lược thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  updateStrategyMatrixItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await bscService.updateStrategyMatrixItem(id, req.body, userId, userEmail);
      return sendSuccess(res, result, 'Cập nhật chiến lược thành công');
    } catch (err) {
      next(err);
    }
  };

  deleteStrategyMatrixItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      await bscService.deleteStrategyMatrixItem(id, userId, userEmail);
      return sendSuccess(res, null, 'Đã xóa chiến lược');
    } catch (err) {
      next(err);
    }
  };
}

export const bscController = new BscController();

