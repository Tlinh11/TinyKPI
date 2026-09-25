import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma.js';
import { sendSuccess } from '../../utils/response.js';
import { authGuard, AuthenticatedRequest } from '../../middleware/authGuard.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(authGuard);

// GET /api/calendar/events
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.calendarEvent.findMany({
      include: {
        organizer: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Also fetch tasks with due dates to show as deadlines on calendar
    const tasksWithDeadline = await prisma.task.findMany({
      where: { dueDate: { not: null } },
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        dueDate: true,
        assignee: { select: { fullName: true } },
      },
    });

    return sendSuccess(res, {
      events,
      taskDeadlines: tasksWithDeadline,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/calendar/events
router.post('/events', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const organizerId = req.user?.userId;
    const { title, description, type, startTime, endTime, isAllDay, location } = req.body;

    if (!title || !startTime || !endTime) {
      throw new AppError('Tiêu đề, thời gian bắt đầu và kết thúc là bắt buộc', 400, 'VALIDATION_ERROR');
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || null,
        type: type || 'MEETING',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isAllDay: !!isAllDay,
        location: location || null,
        organizerId,
      },
      include: {
        organizer: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    return sendSuccess(res, event, 'Tạo lịch làm việc thành công', 201);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/calendar/events/:id
router.delete('/events/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await prisma.calendarEvent.delete({ where: { id } });
    return sendSuccess(res, null, 'Đã xóa sự kiện lịch');
  } catch (err) {
    next(err);
  }
});

export default router;
