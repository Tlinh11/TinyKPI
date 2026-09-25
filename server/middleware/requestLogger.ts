import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const logPrefix = status >= 400 ? '⚠️' : '✓';
    console.log(`${logPrefix} [${new Date().toISOString()}] ${method} ${originalUrl} ${status} - ${duration}ms`);
  });

  next();
}
