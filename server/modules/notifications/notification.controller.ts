import { Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';
import { sendSuccess } from '../../utils/response.js';

export class NotificationController {
  getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || 'default_user';
      const result = await notificationService.getNotifications(userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || 'default_user';
      const { id } = req.params;
      await notificationService.markAsRead(userId, id);
      return sendSuccess(res, { success: true }, 'Đã đánh dấu thông báo là đã đọc');
    } catch (err) {
      next(err);
    }
  };

  markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || 'default_user';
      await notificationService.markAllAsRead(userId);
      return sendSuccess(res, { success: true }, 'Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      next(err);
    }
  };

  dismissNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId || 'default_user';
      const { id } = req.params;
      await notificationService.dismissNotification(userId, id);
      return sendSuccess(res, { success: true }, 'Đã ẩn thông báo');
    } catch (err) {
      next(err);
    }
  };
}

export const notificationController = new NotificationController();
