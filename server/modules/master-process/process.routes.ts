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

router.post('/bulk', requirePermission('processes.manage'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không đúng định dạng mảng (array)' });
    }

    const departments = await prisma.department.findMany({ select: { id: true, name: true, code: true } });
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      try {
        const title = String(row.title || row.name || '').trim();
        if (!title) {
          errors.push(`Dòng ${i + 1}: Thiếu tên quy trình`);
          continue;
        }

        const code = row.code ? String(row.code).trim() : `QT-${Math.floor(100 + Math.random() * 900)}`;

        let departmentId = row.departmentId;
        if (!departmentId && (row.department || row.departmentName)) {
          const deptQuery = String(row.department || row.departmentName).trim().toLowerCase();
          const found = departments.find(
            (d) => d.name.toLowerCase() === deptQuery || (d.code && d.code.toLowerCase() === deptQuery)
          );
          if (found) departmentId = found.id;
        }

        const existing = await prisma.masterProcess.findFirst({
          where: { OR: [{ code }, { title }] },
        });

        if (existing) {
          await prisma.masterProcess.update({
            where: { id: existing.id },
            data: {
              title,
              category: row.category || existing.category,
              slaHours: row.slaHours !== undefined ? Number(row.slaHours) : existing.slaHours,
              description: row.description || existing.description,
              departmentId: departmentId || existing.departmentId,
            },
          });
        } else {
          await prisma.masterProcess.create({
            data: {
              title,
              code,
              category: row.category || 'CORE',
              slaHours: row.slaHours !== undefined ? Number(row.slaHours) : 24,
              description: row.description ? String(row.description).trim() : null,
              departmentId: departmentId || (departments.length > 0 ? departments[0].id : null),
            },
          });
        }
        importedCount++;
      } catch (err: any) {
        errors.push(`Dòng ${i + 1}: ${err.message || 'Lỗi không xác định'}`);
      }
    }

    return sendSuccess(
      res,
      { importedCount, total: items.length, errors },
      `Đã nhập thành công ${importedCount}/${items.length} quy trình`
    );
  } catch (err) {
    next(err);
  }
});

export default router;
