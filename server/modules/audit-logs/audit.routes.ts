import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma.js';
import { sendSuccess } from '../../utils/response.js';
import { authGuard, requirePermission } from '../../middleware/authGuard.js';

const router = Router();
router.use(authGuard);

router.get('/', requirePermission('audit_logs.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);

    return sendSuccess(res, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
