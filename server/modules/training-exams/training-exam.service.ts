import { prisma } from '../../utils/prisma.js';

export interface QuestionOption {
  id: string;
  label: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
}

export type QuestionType = 'TN1' | 'TNn' | 'DS' | 'DIEN' | 'GHEP' | 'XEP' | 'HOTSPOT';

export interface ExamQuestionItem {
  id: string;
  setId: string;
  type: QuestionType;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  options: QuestionOption[];
  points: number;
  feedbackCorrect?: string;
  feedbackWrong?: string;
  explanation?: string;
  stepId?: string;
  orderIndex: number;
}

export interface QuestionSet {
  id: string;
  title: string;
  processId: string;
  processTitle: string;
  version: string;
  totalQuestions: number;
  totalPoints: number;
  questions: ExamQuestionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamTest {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  processId: string;
  processTitle: string;
  questionSetId?: string;
  description?: string;
  totalQuestions: number;
  durationMinutes: number;
  maxAttempts: number;
  maxScore: number;
  passingScore: number;
  questionOrder: 'SHUFFLE' | 'SEQUENTIAL';
  displayMode: 'ALL_STEPS' | 'BY_STEP';
  passingNote?: string;
  invitedCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignParticipant {
  userId: string;
  fullName: string;
  email: string;
  position: string;
  department: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED';
  score?: number;
  passed?: boolean;
  submittedAt?: string;
}

export interface ExamCampaign {
  id: string;
  title: string;
  testId: string;
  testTitle: string;
  description?: string;
  inviteDate: string;
  startDate: string;
  endDate: string;
  remindDate1?: string;
  remindDate2?: string;
  remindDate3?: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  targetDepartments: string[];
  targetPositions: string[];
  participants: CampaignParticipant[];
  submissionsCount: number;
  passedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonItem {
  id: string;
  orderNum: number;
  title: string;
  type: 'TEXT' | 'VIDEO' | 'PDF';
  duration: string;
  content?: string;
  mediaUrl?: string;
  isCompleted?: boolean;
}

export interface TrainingCourseItem {
  id: string;
  code: string;
  title: string;
  processId: string;
  processTitle: string;
  version: string;
  isDraft: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  lessonsCount: number;
  progressPercent: number;
  description?: string;
  lessons: LessonItem[];
  createdAt: string;
  updatedAt: string;
}

// ---------------- SEED DATA MATCHING SCREENSHOTS ----------------

const DEFAULT_QUESTION_SETS: QuestionSet[] = [
  {
    id: 'set-test-01',
    title: 'Test',
    processId: 'proc-no1',
    processTitle: 'No1 - Quy trình thử nghiệm',
    version: 'Draft mặc định',
    totalQuestions: 1,
    totalPoints: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-test-01',
        setId: 'set-test-01',
        type: 'TN1',
        title: '1. Thử nghiệm',
        content: 'Thử nghiệm',
        points: 1,
        feedbackCorrect: 'Chính xác! Rất tốt.',
        feedbackWrong: 'Chưa đúng. Hãy xem lại trang 12.',
        explanation: 'Đây là câu hỏi thử nghiệm kiểm tra tính chính xác của quy trình vận hành SOP No1.',
        orderIndex: 1,
        options: [
          { id: 'opt-a', label: 'A', text: 'A', isCorrect: false },
          { id: 'opt-b', label: 'B', text: 'B', isCorrect: false },
          { id: 'opt-c', label: 'C', text: 'C', isCorrect: true },
          { id: 'opt-d', label: 'D', text: 'D', isCorrect: false },
        ],
      },
    ],
  },
];

const DEFAULT_EXAM_TESTS: ExamTest[] = [
  {
    id: 'test-exam-01',
    title: 'Test',
    status: 'OPEN',
    processId: 'proc-no1',
    processTitle: 'No1 - Quy trình thử nghiệm',
    questionSetId: 'set-test-01',
    description: 'Bài kiểm tra năng lực quy trình thử nghiệm No1 dành cho toàn bộ nhân sự vận hành.',
    totalQuestions: 1,
    durationMinutes: 30,
    maxAttempts: 0,
    maxScore: 100,
    passingScore: 70,
    questionOrder: 'SHUFFLE',
    displayMode: 'ALL_STEPS',
    passingNote: 'Điểm số từ 70/100 trở lên đạt chứng chỉ nghiệp vụ.',
    invitedCount: 0,
    tags: ['1 câu', '30 phút', '70/100 điểm', 'Test'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_CAMPAIGNS: ExamCampaign[] = [
  {
    id: 'camp-test-01',
    title: 'Đợt khảo sát Quy trình No1 - Tháng 09/2026',
    testId: 'test-exam-01',
    testTitle: 'Test',
    description: 'Khảo sát và sát hạch nghiệp vụ định kỳ theo chuẩn quy trình SOP No1.',
    inviteDate: '26/09/2026',
    startDate: '26/09/2026',
    endDate: '03/10/2026',
    remindDate1: '28/09/2026',
    remindDate2: '30/09/2026',
    remindDate3: '02/10/2026',
    status: 'IN_PROGRESS',
    targetDepartments: ['Tất cả'],
    targetPositions: ['Tất cả'],
    participants: [
      {
        userId: 'user-admin',
        fullName: 'Lê Thuận Khánh',
        email: 'Thuankhanh.hust@gmail.com',
        position: 'Tổng Giám đốc (CEO)',
        department: 'Ban Giám Đốc',
        status: 'NOT_STARTED',
      },
      {
        userId: 'user-hr',
        fullName: 'Trần Thị Thu Hà',
        email: 'ha.tran@tinykpi.com',
        position: 'Trưởng phòng Nhân sự',
        department: 'Phòng Hành chính - Nhân sự',
        status: 'NOT_STARTED',
      },
      {
        userId: 'user-dev',
        fullName: 'Nguyễn Văn Minh',
        email: 'minh.nguyen@tinykpi.com',
        position: 'Kỹ sư Phần mềm Cao cấp',
        department: 'Phòng Công nghệ Thông tin',
        status: 'NOT_STARTED',
      },
    ],
    submissionsCount: 0,
    passedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_COURSES: TrainingCourseItem[] = [
  {
    id: 'course-test-01',
    code: 'GT-NO1-01',
    title: 'Giáo trình No1 - Quy trình thử nghiệm',
    processId: 'proc-no1',
    processTitle: 'No1 - Quy trình thử nghiệm',
    version: 'Draft mặc định',
    isDraft: true,
    status: 'DRAFT',
    lessonsCount: 1,
    progressPercent: 0,
    description: 'Tài liệu hướng dẫn chi tiết các bước vận hành chuẩn hóa theo Quy trình thử nghiệm No1.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lessons: [
      {
        id: 'les-01',
        orderNum: 1,
        title: 'Giới thiệu tổng quan quy trình thử nghiệm No1',
        type: 'TEXT',
        duration: '~5 phút',
        content: `<h3>1. Mục tiêu quy trình</h3>
<p>Quy trình thử nghiệm No1 nhằm chuẩn hóa các bước thực thi, phối hợp liên phòng ban và đảm bảo tuân thủ cam kết SLA.</p>
<h3>2. Các bước thực hiện</h3>
<ul>
  <li><strong>Bước 1:</strong> Tiếp nhận yêu cầu và thẩm định thông tin sơ bộ.</li>
  <li><strong>Bước 2:</strong> Phân công nhân sự phụ trách và thiết lập thời hạn xử lý.</li>
  <li><strong>Bước 3:</strong> Tiến hành nghiệm thu kết quả và đánh giá năng lực theo chuẩn KPI.</li>
</ul>`,
        isCompleted: false,
      },
    ],
  },
];

// ---------------- SERVICE CLASS ----------------

export class TrainingExamService {
  // ---- Helper Storage ----
  private async getSetting<T>(key: string, defaultVal: T): Promise<T> {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key } });
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
    } catch {
      // ignore
    }
    return defaultVal;
  }

  private async saveSetting<T>(key: string, value: T): Promise<void> {
    try {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value), group: 'TRAINING_EXAMS' },
      });
    } catch {
      // ignore
    }
  }

  // ================= QUESTION SETS =================
  async getQuestionSets(): Promise<QuestionSet[]> {
    return this.getSetting<QuestionSet[]>('training_question_sets', DEFAULT_QUESTION_SETS);
  }

  async getQuestionSetById(id: string): Promise<QuestionSet | null> {
    const sets = await this.getQuestionSets();
    return sets.find((s) => s.id === id) || null;
  }

  async saveQuestionSet(set: Partial<QuestionSet> & { id?: string }): Promise<QuestionSet> {
    const sets = await this.getQuestionSets();
    const now = new Date().toISOString();

    if (set.id && sets.some((s) => s.id === set.id)) {
      const index = sets.findIndex((s) => s.id === set.id);
      const existing = sets[index];
      const updated: QuestionSet = {
        ...existing,
        ...set,
        updatedAt: now,
      };
      if (updated.questions) {
        updated.totalQuestions = updated.questions.length;
        updated.totalPoints = updated.questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0);
      }
      sets[index] = updated;
      await this.saveSetting('training_question_sets', sets);
      return updated;
    } else {
      const newId = set.id || `set-${Date.now()}`;
      const newSet: QuestionSet = {
        id: newId,
        title: set.title || 'Bộ câu hỏi mới',
        processId: set.processId || 'proc-no1',
        processTitle: set.processTitle || 'No1 - Quy trình thử nghiệm',
        version: set.version || 'Draft mặc định',
        totalQuestions: set.questions?.length || 0,
        totalPoints: set.questions?.reduce((sum, q) => sum + (Number(q.points) || 1), 0) || 0,
        questions: set.questions || [],
        createdAt: now,
        updatedAt: now,
      };
      sets.unshift(newSet);
      await this.saveSetting('training_question_sets', sets);
      return newSet;
    }
  }

  async deleteQuestionSet(id: string): Promise<boolean> {
    const sets = await this.getQuestionSets();
    const filtered = sets.filter((s) => s.id !== id);
    await this.saveSetting('training_question_sets', filtered);
    return true;
  }

  // ================= EXAM TESTS =================
  async getExamTests(): Promise<ExamTest[]> {
    return this.getSetting<ExamTest[]>('training_exam_tests', DEFAULT_EXAM_TESTS);
  }

  async getExamTestById(id: string): Promise<ExamTest | null> {
    const tests = await this.getExamTests();
    return tests.find((t) => t.id === id) || null;
  }

  async saveExamTest(test: Partial<ExamTest> & { id?: string }): Promise<ExamTest> {
    const tests = await this.getExamTests();
    const now = new Date().toISOString();

    const tags: string[] = [
      `${test.totalQuestions || 1} câu`,
      `${test.durationMinutes || 30} phút`,
      `${test.passingScore || 70}/${test.maxScore || 100} điểm`,
      test.title || 'Test',
    ];

    if (test.id && tests.some((t) => t.id === test.id)) {
      const index = tests.findIndex((t) => t.id === test.id);
      const updated: ExamTest = {
        ...tests[index],
        ...test,
        tags,
        updatedAt: now,
      };
      tests[index] = updated;
      await this.saveSetting('training_exam_tests', tests);
      return updated;
    } else {
      const newTest: ExamTest = {
        id: test.id || `test-${Date.now()}`,
        title: test.title || 'Đề thi mới',
        status: test.status || 'OPEN',
        processId: test.processId || 'proc-no1',
        processTitle: test.processTitle || 'No1 - Quy trình thử nghiệm',
        questionSetId: test.questionSetId || 'set-test-01',
        description: test.description || '',
        totalQuestions: Number(test.totalQuestions) || 1,
        durationMinutes: Number(test.durationMinutes) || 30,
        maxAttempts: Number(test.maxAttempts) || 0,
        maxScore: Number(test.maxScore) || 100,
        passingScore: Number(test.passingScore) || 70,
        questionOrder: test.questionOrder || 'SHUFFLE',
        displayMode: test.displayMode || 'ALL_STEPS',
        passingNote: test.passingNote || '',
        invitedCount: test.invitedCount || 0,
        tags,
        createdAt: now,
        updatedAt: now,
      };
      tests.unshift(newTest);
      await this.saveSetting('training_exam_tests', tests);
      return newTest;
    }
  }

  async deleteExamTest(id: string): Promise<boolean> {
    const tests = await this.getExamTests();
    const filtered = tests.filter((t) => t.id !== id);
    await this.saveSetting('training_exam_tests', filtered);
    return true;
  }

  // ================= CAMPAIGNS (ĐỢT THI) =================
  async getCampaigns(): Promise<ExamCampaign[]> {
    return this.getSetting<ExamCampaign[]>('training_campaigns', DEFAULT_CAMPAIGNS);
  }

  async getCampaignById(id: string): Promise<ExamCampaign | null> {
    const camps = await this.getCampaigns();
    return camps.find((c) => c.id === id) || null;
  }

  async saveCampaign(campaign: Partial<ExamCampaign> & { id?: string }): Promise<ExamCampaign> {
    const camps = await this.getCampaigns();
    const now = new Date().toISOString();

    if (campaign.id && camps.some((c) => c.id === campaign.id)) {
      const idx = camps.findIndex((c) => c.id === campaign.id);
      const existing = camps[idx];
      const updated: ExamCampaign = {
        ...existing,
        ...campaign,
        updatedAt: now,
      };
      camps[idx] = updated;
      await this.saveSetting('training_campaigns', camps);
      return updated;
    } else {
      const newCamp: ExamCampaign = {
        id: campaign.id || `camp-${Date.now()}`,
        title: campaign.title || 'Đợt thi mới',
        testId: campaign.testId || 'test-exam-01',
        testTitle: campaign.testTitle || 'Test',
        description: campaign.description || '',
        inviteDate: campaign.inviteDate || '26/09/2026',
        startDate: campaign.startDate || '26/09/2026',
        endDate: campaign.endDate || '03/10/2026',
        remindDate1: campaign.remindDate1 || '',
        remindDate2: campaign.remindDate2 || '',
        remindDate3: campaign.remindDate3 || '',
        status: campaign.status || 'IN_PROGRESS',
        targetDepartments: campaign.targetDepartments || ['Tất cả'],
        targetPositions: campaign.targetPositions || ['Tất cả'],
        participants: campaign.participants || [],
        submissionsCount: campaign.submissionsCount || 0,
        passedCount: campaign.passedCount || 0,
        createdAt: now,
        updatedAt: now,
      };
      camps.unshift(newCamp);
      await this.saveSetting('training_campaigns', camps);
      return newCamp;
    }
  }

  async submitCampaignExam(
    campaignId: string,
    userId: string,
    answers: Record<string, any>,
    durationSeconds: number
  ): Promise<{ score: number; passed: boolean; correctCount: number; total: number; feedback: any[] }> {
    const camps = await this.getCampaigns();
    const camp = camps.find((c) => c.id === campaignId);
    const sets = await this.getQuestionSets();

    let allQuestions: ExamQuestionItem[] = [];
    sets.forEach((s) => {
      allQuestions = allQuestions.concat(s.questions);
    });

    if (allQuestions.length === 0) {
      allQuestions = DEFAULT_QUESTION_SETS[0].questions;
    }

    let correctCount = 0;
    const feedbackList: any[] = [];

    allQuestions.forEach((q) => {
      const userAns = answers[q.id];
      let isCorrect = false;

      if (q.type === 'TN1' || q.type === 'DS') {
        const correctOpt = q.options.find((o) => o.isCorrect);
        if (correctOpt && userAns === correctOpt.id) {
          isCorrect = true;
        }
      } else if (q.type === 'TNn') {
        const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
        const userIds = Array.isArray(userAns) ? [...userAns].sort() : [];
        if (JSON.stringify(correctIds) === JSON.stringify(userIds)) {
          isCorrect = true;
        }
      } else {
        if (userAns !== undefined && userAns !== null && userAns !== '') {
          isCorrect = true;
        }
      }

      if (isCorrect) correctCount++;
      feedbackList.push({
        questionId: q.id,
        isCorrect,
        explanation: q.explanation || (isCorrect ? q.feedbackCorrect : q.feedbackWrong),
      });
    });

    const total = allQuestions.length;
    const rawScore = total > 0 ? (correctCount / total) * 100 : 0;
    const score = Math.round(rawScore * 10) / 10;
    const passed = score >= 70;

    if (camp) {
      const pIdx = camp.participants.findIndex((p) => p.userId === userId || p.email === userId);
      if (pIdx >= 0) {
        camp.participants[pIdx].status = 'SUBMITTED';
        camp.participants[pIdx].score = score;
        camp.participants[pIdx].passed = passed;
        camp.participants[pIdx].submittedAt = new Date().toISOString();
      }
      camp.submissionsCount = camp.participants.filter((p) => p.status === 'SUBMITTED').length;
      camp.passedCount = camp.participants.filter((p) => p.passed).length;
      await this.saveSetting('training_campaigns', camps);
    }

    return {
      score,
      passed,
      correctCount,
      total,
      feedback: feedbackList,
    };
  }

  // ================= CURRICULUMS & LESSONS =================
  async getCourses(): Promise<TrainingCourseItem[]> {
    return this.getSetting<TrainingCourseItem[]>('training_courses', DEFAULT_COURSES);
  }

  async getCourseById(id: string): Promise<TrainingCourseItem | null> {
    const courses = await this.getCourses();
    return courses.find((c) => c.id === id) || null;
  }

  async saveCourse(course: Partial<TrainingCourseItem> & { id?: string }): Promise<TrainingCourseItem> {
    const courses = await this.getCourses();
    const now = new Date().toISOString();

    if (course.id && courses.some((c) => c.id === course.id)) {
      const idx = courses.findIndex((c) => c.id === course.id);
      const updated: TrainingCourseItem = {
        ...courses[idx],
        ...course,
        lessonsCount: course.lessons ? course.lessons.length : courses[idx].lessonsCount,
        updatedAt: now,
      };
      courses[idx] = updated;
      await this.saveSetting('training_courses', courses);
      return updated;
    } else {
      const newCourse: TrainingCourseItem = {
        id: course.id || `course-${Date.now()}`,
        code: course.code || `GT-${Date.now().toString().slice(-4)}`,
        title: course.title || 'Giáo trình mới',
        processId: course.processId || 'proc-no1',
        processTitle: course.processTitle || 'No1 - Quy trình thử nghiệm',
        version: course.version || 'Draft mặc định',
        isDraft: course.isDraft !== undefined ? course.isDraft : true,
        status: course.status || 'DRAFT',
        lessonsCount: course.lessons?.length || 1,
        progressPercent: 0,
        description: course.description || '',
        lessons: course.lessons || [],
        createdAt: now,
        updatedAt: now,
      };
      courses.unshift(newCourse);
      await this.saveSetting('training_courses', courses);
      return newCourse;
    }
  }

  async markLessonCompleted(courseId: string, lessonId: string): Promise<TrainingCourseItem | null> {
    const courses = await this.getCourses();
    const course = courses.find((c) => c.id === courseId);
    if (!course) return null;

    const lesson = course.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      lesson.isCompleted = true;
    }

    const completedCount = course.lessons.filter((l) => l.isCompleted).length;
    course.progressPercent = course.lessons.length > 0 ? Math.round((completedCount / course.lessons.length) * 100) : 0;
    course.updatedAt = new Date().toISOString();

    await this.saveSetting('training_courses', courses);
    return course;
  }
}

export const trainingExamService = new TrainingExamService();
