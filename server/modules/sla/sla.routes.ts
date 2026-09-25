import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma.js';
import { sendSuccess } from '../../utils/response.js';
import { authGuard, requirePermission, AuthenticatedRequest } from '../../middleware/authGuard.js';

const router = Router();
router.use(authGuard);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await prisma.slaGroup.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return sendSuccess(res, groups);
  } catch (err) {
    next(err);
  }
});

router.post('/groups', requirePermission('sla.manage'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const group = await prisma.slaGroup.create({
      data: { name, description },
      include: { items: true },
    });
    return sendSuccess(res, group, 'Thêm nhóm SLA thành công', 201);
  } catch (err) {
    next(err);
  }
});

router.post('/items', requirePermission('sla.manage'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { groupId, taskType, durationHours } = req.body;
    const item = await prisma.slaItem.create({
      data: {
        groupId,
        taskType,
        durationHours: parseFloat(durationHours) || 24,
      },
    });
    return sendSuccess(res, item, 'Thêm công việc SLA thành công', 201);
  } catch (err) {
    next(err);
  }
});

export default router;
