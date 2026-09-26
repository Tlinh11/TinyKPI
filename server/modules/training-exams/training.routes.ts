import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { authGuard, AuthenticatedRequest } from '../../middleware/authGuard.js';
import { AppError } from '../../middleware/errorHandler.js';
import { trainingExamService } from './training-exam.service.js';

const router = Router();
router.use(authGuard);

// ==========================================
// 1. QUESTION SETS (NGÂN HÀNG CÂU HỎI)
// ==========================================

// GET /api/exams/question-sets or /api/exam-bank/question-sets
router.get('/question-sets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sets = await trainingExamService.getQuestionSets();
    return sendSuccess(res, sets);
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/question-sets/:id
router.get('/question-sets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const set = await trainingExamService.getQuestionSetById(req.params.id as string);
    if (!set) {
      throw new AppError('Không tìm thấy bộ câu hỏi', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, set);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/question-sets
router.post('/question-sets', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const saved = await trainingExamService.saveQuestionSet(req.body);
    return sendSuccess(res, saved, 'Lưu bộ câu hỏi thành công', 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/exams/question-sets/:id
router.put('/question-sets/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const saved = await trainingExamService.saveQuestionSet({ ...req.body, id: req.params.id as string });
    return sendSuccess(res, saved, 'Cập nhật bộ câu hỏi thành công');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/exams/question-sets/:id
router.delete('/question-sets/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await trainingExamService.deleteQuestionSet(req.params.id as string);
    return sendSuccess(res, { id: req.params.id }, 'Đã xóa bộ câu hỏi');
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 2. EXAM TESTS (ĐỀ THI)
// ==========================================

// GET /api/exams/tests or /api/exam-bank/tests
router.get('/tests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tests = await trainingExamService.getExamTests();
    return sendSuccess(res, tests);
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/tests/:id
router.get('/tests/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const test = await trainingExamService.getExamTestById(req.params.id as string);
    if (!test) {
      throw new AppError('Không tìm thấy đề thi', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, test);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/tests
router.post('/tests', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const saved = await trainingExamService.saveExamTest(req.body);
    return sendSuccess(res, saved, 'Tạo đề thi thành công', 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/exams/tests/:id
router.put('/tests/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const saved = await trainingExamService.saveExamTest({ ...req.body, id: req.params.id as string });
    return sendSuccess(res, saved, 'Cập nhật đề thi thành công');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/exams/tests/:id
router.delete('/tests/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await trainingExamService.deleteExamTest(req.params.id as string);
    return sendSuccess(res, { id: req.params.id }, 'Đã xóa đề thi');
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 3. EXAM CAMPAIGNS (ĐỢT THI QUY TRÌNH)
// ==========================================

// GET /api/exams/campaigns
router.get('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaigns = await trainingExamService.getCampaigns();
    return sendSuccess(res, campaigns);
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/campaigns/:id
router.get('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const campaign = await trainingExamService.getCampaignById(req.params.id as string);
    if (!campaign) {
      throw new AppError('Không tìm thấy đợt thi', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, campaign);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/campaigns
router.post('/campaigns', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const saved = await trainingExamService.saveCampaign(req.body);
    return sendSuccess(res, saved, 'Tạo đợt thi thành công', 201);
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/campaigns/:id/submit
router.post('/campaigns/:id/submit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || req.user?.id || 'user-admin';
    const { answers, durationSeconds } = req.body;
    const result = await trainingExamService.submitCampaignExam(
      req.params.id as string,
      userId,
      answers || {},
      Number(durationSeconds) || 60
    );
    return sendSuccess(
      res,
      result,
      result.passed ? 'Chúc mừng! Bạn đã đạt yêu cầu bài thi.' : 'Rất tiếc! Điểm chưa đạt chuẩn tối thiểu (>= 70).'
    );
  } catch (err) {
    next(err);
  }
});

// Backward compatibility: GET /api/exams/questions
router.get('/questions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sets = await trainingExamService.getQuestionSets();
    let questions: any[] = [];
    sets.forEach((s) => {
      questions = questions.concat(s.questions);
    });
    return sendSuccess(res, questions);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. TRAINING COURSES & LESSONS (GIÁO TRÌNH)
// ==========================================

// GET /api/training/courses
router.get('/courses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await trainingExamService.getCourses();
    return sendSuccess(res, courses);
  } catch (err) {
    next(err);
  }
});

// GET /api/training/courses/:id
router.get('/courses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await trainingExamService.getCourseById(req.params.id as string);
    if (!course) {
      throw new AppError('Không tìm thấy giáo trình', 404, 'NOT_FOUND');
    }
    return sendSuccess(res, course);
  } catch (err) {
    next(err);
  }
});

// POST /api/training/courses
router.post('/courses', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const saved = await trainingExamService.saveCourse(req.body);
    return sendSuccess(res, saved, 'Lưu giáo trình thành công', 201);
  } catch (err) {
    next(err);
  }
});

// PUT /api/training/courses/:id
router.put('/courses/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const saved = await trainingExamService.saveCourse({ ...req.body, id: req.params.id as string });
    return sendSuccess(res, saved, 'Cập nhật giáo trình thành công');
  } catch (err) {
    next(err);
  }
});

// POST /api/training/courses/:id/lessons/:lessonId/complete
router.post('/courses/:id/lessons/:lessonId/complete', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await trainingExamService.markLessonCompleted(req.params.id as string, req.params.lessonId as string);
    return sendSuccess(res, updated, 'Đã hoàn thành bài học');
  } catch (err) {
    next(err);
  }
});

export default router;
