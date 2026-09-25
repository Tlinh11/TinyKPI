import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/response.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`💥 Error at ${req.method} ${req.originalUrl}:`, err);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const errorDetails = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      data: errorDetails,
      message: 'Dữ liệu đầu vào không hợp lệ',
      code: 'VALIDATION_ERROR',
    });
  }

  // 2. Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      message: err.message,
      code: err.code,
    });
  }

  // 3. JWT Error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      code: 'UNAUTHORIZED',
    });
  }

  // 4. Default Internal Server Error
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Lỗi hệ thống nội bộ. Vui lòng thử lại sau.';
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
