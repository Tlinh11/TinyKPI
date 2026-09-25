import { Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function sendSuccess<T>(res: Response, data: T, message: string | null = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function sendError(res: Response, message: string, code = 'ERROR', statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    code,
  });
}
