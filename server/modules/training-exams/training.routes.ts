import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma.js';
import { sendSuccess } from '../../utils/response.js';
import { authGuard, AuthenticatedRequest } from '../../middleware/authGuard.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();
router.use(authGuard);

// ---------------- EXAMS & QUESTIONS ----------------

// GET /api/exams/questions
router.get('/questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions = await prisma.examQuestion.findMany({
      include: {
        process: { select: { id: true, title: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = questions.map((q) => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    }));

    return sendSuccess(res, parsed);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/questions
router.post('/questions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { question, options, correctIdx, explanation, processId } = req.body;
    if (!question || !options || !Array.isArray(options)) {
      throw new AppError('Câu hỏi và danh sách lựa chọn là bắt buộc', 400, 'VALIDATION_ERROR');
    }

    const created = await prisma.examQuestion.create({
      data: {
        question,
        options: JSON.stringify(options),
        correctIdx: Number(correctIdx) || 0,
        explanation: explanation || null,
        processId: processId || null,
      },
    });

    return sendSuccess(res, created, 'Thêm câu hỏi thành công', 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/submit
router.post('/submit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { answers, duration } = req.body; // answers: { [questionId]: selectedIdx }

    const questions = await prisma.examQuestion.findMany();
    let correctCount = 0;

    questions.forEach((q) => {
      const selected = answers?.[q.id];
      if (selected !== undefined && Number(selected) === q.correctIdx) {
        correctCount++;
      }
    });

    const total = questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 10 * 10) / 10 : 0;
    const passed = score >= 7.0;

    const submission = await prisma.examSubmission.create({
      data: {
        userId,
        score,
        total,
        passed,
        duration: Number(duration) || 60,
      },
    });

    return sendSuccess(
      res,
      {
        ...submission,
        correctCount,
        total,
      },
      passed ? 'Chúc mừng! Bạn đã đạt yêu cầu bài thi.' : 'Rất tiếc! Điểm chưa đạt chuẩn tối thiểu.'
    );
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/history
router.get('/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const submissions = await prisma.examSubmission.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return sendSuccess(res, submissions);
  } catch (err) {
    next(err);
  }
});

// ---------------- TRAINING COURSES ----------------

// GET /api/training/courses
router.get('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await prisma.trainingCourse.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsed = courses.map((c) => ({
      ...c,
      lessons: typeof c.lessonsJson === 'string' ? JSON.parse(c.lessonsJson) : c.lessonsJson,
    }));

    return sendSuccess(res, parsed);
  } catch (err) {
    next(err);
  }
});

// GET /api/training/courses/:id
router.get('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const course = await prisma.trainingCourse.findUnique({
      where: { id },
    });
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404, 'NOT_FOUND');
    }

    return sendSuccess(res, {
      ...course,
      lessons: typeof course.lessonsJson === 'string' ? JSON.parse(course.lessonsJson) : course.lessonsJson,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
