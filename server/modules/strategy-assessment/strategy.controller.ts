import { Request, Response, NextFunction } from 'express';
import { strategyService } from './strategy.service.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';

export class StrategyController {
  getAssessment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organization, stage } = req.query;
      const result = await strategyService.getAssessment(
        organization as string,
        stage as string
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  saveAssessment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await strategyService.saveAssessment(req.body, userId, userEmail);
      return sendSuccess(res, result, 'Lưu dữ liệu chiến lược thành công');
    } catch (err) {
      next(err);
    }
  };
}

export const strategyController = new StrategyController();
