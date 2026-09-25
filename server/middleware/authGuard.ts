import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { AppError } from '../utils/response.js';
import { prisma } from '../utils/prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { permissions?: string[] };
}

export async function authGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Bạn chưa đăng nhập hoặc thiếu token xác thực', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Fetch user and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Tài khoản không tồn tại hoặc đã bị khóa', 401, 'USER_INACTIVE');
    }

    const permissions = user.role.rolePermissions.map((rp) => rp.permission.name);

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(permissionName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Chưa xác thực người dùng', 401, 'UNAUTHORIZED'));
    }

    // Admin bypasses all checks
    if (req.user.role === 'Admin') {
      return next();
    }

    if (!req.user.permissions?.includes(permissionName)) {
      return next(
        new AppError(`Bạn không có quyền thực hiện thao tác này (${permissionName})`, 403, 'FORBIDDEN')
      );
    }

    next();
  };
}
