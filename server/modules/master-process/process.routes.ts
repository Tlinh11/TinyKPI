import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma.js';
import { sendSuccess } from '../../utils/response.js';
import { authGuard, requirePermission, AuthenticatedRequest } from '../../middleware/authGuard.js';

const router = Router();
router.use(authGuard);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;
    const where: any = {};
    if (category) where.category = category as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { code: { contains: search as string } },
      ];
    }

    const items = await prisma.masterProcess.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
});

router.post('/', requirePermission('processes.manage'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const created = await prisma.masterProcess.create({
      data: req.body,
    });
    return sendSuccess(res, created, 'Thêm quy trình mới thành công', 201);
  } catch (err) {
    next(err);
  }
});

export default router;
