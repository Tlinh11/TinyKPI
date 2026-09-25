import { Response, NextFunction } from 'express';
import { ticketService } from './ticket.service.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';
import { sendSuccess } from '../../utils/response.js';

export class TicketController {
  getTickets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const result = await ticketService.getTickets(userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  createTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const userName = (req.user as any)?.fullName;
      const result = await ticketService.createTicket(req.body, userId, userEmail, userName);
      return sendSuccess(res, result, 'Gửi Ticket yêu cầu hỗ trợ thành công', 201);
    } catch (err) {
      next(err);
    }
  };

  updateTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      const result = await ticketService.updateTicketStatus(id, req.body, userId, userEmail);
      return sendSuccess(res, result, 'Cập nhật trạng thái Ticket thành công');
    } catch (err) {
      next(err);
    }
  };

  deleteTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;
      await ticketService.deleteTicket(id, userId, userEmail);
      return sendSuccess(res, { success: true }, 'Đã xóa Ticket');
    } catch (err) {
      next(err);
    }
  };
}

export const ticketController = new TicketController();
