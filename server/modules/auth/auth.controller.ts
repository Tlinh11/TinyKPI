import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service.js';
import { loginSchema, changePasswordSchema } from './auth.schema.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';

export class AuthController {
  constructor(private service: AuthService = authService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedInput = loginSchema.parse(req.body);
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await this.service.login(validatedInput, ipAddress);
      return sendSuccess(res, result, 'Đăng nhập thành công');
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const result = await this.service.getProfile(userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const validatedInput = changePasswordSchema.parse(req.body);
      await this.service.changePassword(userId, validatedInput);
      return sendSuccess(res, null, 'Đổi mật khẩu thành công');
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
