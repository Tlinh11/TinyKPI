import React, { useState, useEffect } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  History,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Plus,
  Search,
  Calendar,
  Copy,
  Send,
  FileSpreadsheet,
  X,
  Check,
  Trash2,
  Users,
  Eye,
  ArrowLeft,
  Layers,
  Inbox,
  ArrowUp,
  ArrowDown,
  Target,
  FileText,
} from 'lucide-react';
import { api } from '../api/client.js';
import { ExcelImportModal } from '../components/common/ExcelImportModal.js';

interface CampaignParticipant {
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

interface ExamCampaign {
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

interface ExamTest {
  id: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  passingScore: number;
  maxScore: number;
  description?: string;
}

interface ExamQuestionItem {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  options: { id: string; label: string; text: string; isCorrect?: boolean; matchTarget?: string }[];
  points: number;
  feedbackCorrect?: string;
  feedbackWrong?: string;
  explanation?: string;
  correctBlankWord?: string;
  hotspotZone?: string;
}

const SAMPLE_EMPLOYEES: CampaignParticipant[] = [
  {
    userId: 'emp-01',
    fullName: 'Lê Thuận Khánh',
    email: 'Thuankhanh.hust@gmail.com',
    position: 'Tổng Giám đốc (CEO)',
    department: 'Ban Giám Đốc',
    status: 'NOT_STARTED',
  },
  {
    userId: 'emp-02',
    fullName: 'Trần Thị Thu Hà',
    email: 'ha.tran@tinykpi.com',
    position: 'Trưởng phòng Nhân sự',
    department: 'Phòng Hành chính - Nhân sự',
    status: 'NOT_STARTED',
  },
  {
    userId: 'emp-03',
    fullName: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@tinykpi.com',
    position: 'Kỹ sư Phần mềm Cao cấp',
    department: 'Phòng Công nghệ Thông tin',
    status: 'NOT_STARTED',
  },
  {
    userId: 'emp-04',
    fullName: 'Phạm Hồng Nhung',
    email: 'nhung.pham@tinykpi.com',
    position: 'Chuyên viên Kiểm soát Quy trình SOP',
    department: 'Phòng Quản lý Chất lượng & Quy trình',
    status: 'NOT_STARTED',
  },
  {
    userId: 'emp-05',
    fullName: 'Hoàng Quốc Bảo',
    email: 'bao.hoang@tinykpi.com',
    position: 'Chuyên viên Mua sắm & SLA',
    department: 'Phòng Cung ứng & Mua sắm',
    status: 'NOT_STARTED',
  },
];

export const ExamsPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  // Main view data
  const [campaigns, setCampaigns] = useState<ExamCampaign[]>([]);
  const [examTests, setExamTests] = useState<ExamTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState('proc-no1');

  // Modal "Thêm mới" Đợt thi
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    testId: '',
    description: '',
    inviteDate: '26/09/2026',
    startDate: '26/09/2026',
    endDate: '03/10/2026',
    remindDate1: '',
    remindDate2: '',
    remindDate3: '',
  });

  // Participant filter states inside Modal
  const [selectAllDept, setSelectAllDept] = useState(true);
  const [selectAllPos, setSelectAllPos] = useState(true);
  const [selectAllEmp, setSelectAllEmp] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<CampaignParticipant[]>([]);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

  // Excel Import Modal state
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Active Exam Taking Player state
  const [activeTakingCampaign, setActiveTakingCampaign] = useState<ExamCampaign | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestionItem[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes
  const [examResult, setExamResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Fetch campaigns and available tests
  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, tRes, qRes] = await Promise.all([
        api.get('/api/exams/campaigns'),
        api.get('/api/exams/tests'),
        api.get('/api/exams/questions'),
      ]);
      if (cRes.data?.success) setCampaigns(cRes.data.data || []);
      if (tRes.data?.success) setExamTests(tRes.data.data || []);
      if (qRes.data?.success) setExamQuestions(qRes.data.data || []);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Timer countdown during exam
  useEffect(() => {
    if (!activeTakingCampaign || examResult || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTakingCampaign, examResult, timeLeft]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    const defaultTest = examTests[0];
    setFormData({
      title: '',
      testId: defaultTest?.id || '',
      description: defaultTest?.description || 'Mô tả đề từ ngân hàng',
      inviteDate: '26/09/2026',
      startDate: '26/09/2026',
      endDate: '03/10/2026',
      remindDate1: '',
      remindDate2: '',
      remindDate3: '',
    });
    setSelectAllDept(true);
    setSelectAllPos(true);
    setSelectAllEmp(false);
    setSelectedParticipants([]);
    setIsAddModalOpen(true);
  };

  const handleTestSelectionChange = (testId: string) => {
    const found = examTests.find((t) => t.id === testId);
    setFormData({
      ...formData,
      testId,
      description: found?.description || 'Mô tả đề từ ngân hàng',
    });
  };

  const handleToggleSelectAllEmp = () => {
    if (selectAllEmp) {
      setSelectAllEmp(false);
      setSelectedParticipants([]);
    } else {
      setSelectAllEmp(true);
      setSelectedParticipants([...SAMPLE_EMPLOYEES]);
    }
  };

  const handleAddParticipant = (emp: CampaignParticipant) => {
    if (selectedParticipants.some((p) => p.userId === emp.userId)) {
      setSelectedParticipants(selectedParticipants.filter((p) => p.userId !== emp.userId));
    } else {
      setSelectedParticipants([...selectedParticipants, emp]);
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants(selectedParticipants.filter((p) => p.userId !== userId));
  };

  // Excel Import Handler
  const handleConfirmExcelImport = async (rows: any[]) => {
    const mapped: CampaignParticipant[] = rows.map((r, i) => ({
      userId: `import-${Date.now()}-${i}`,
      fullName: r.fullName || r['Họ và tên'] || `Thí sinh ${i + 1}`,
      email: r.email || r['Email'] || `candidate${i + 1}@tinykpi.com`,
      position: r.position || r['Chức vụ'] || 'Chuyên viên Vận hành',
      department: r.department || r['Bộ phận'] || 'Phòng Ban Mới',
      status: 'NOT_STARTED',
    }));
    setSelectedParticipants((prev) => [...prev, ...mapped]);
    return {
      success: true,
      count: mapped.length,
      message: `Đã nhập thành công ${mapped.length} thí sinh vào danh sách dự thi!`,
    };
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên đợt thi!');
      return;
    }
    const selectedTest = examTests.find((t) => t.id === formData.testId) || examTests[0];
    try {
      const payload = {
        title: formData.title,
        testId: formData.testId || selectedTest?.id,
        testTitle: selectedTest?.title || 'Test',
        description: formData.description,
        inviteDate: formData.inviteDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        remindDate1: formData.remindDate1,
        remindDate2: formData.remindDate2,
        remindDate3: formData.remindDate3,
        status: 'IN_PROGRESS',
        targetDepartments: selectAllDept ? ['Tất cả'] : ['Tùy chọn'],
        targetPositions: selectAllPos ? ['Tất cả'] : ['Tùy chọn'],
        participants: selectedParticipants.length > 0 ? selectedParticipants : [SAMPLE_EMPLOYEES[0]],
      };

      const res = await api.post('/api/exams/campaigns', payload);
      if (res.data?.success) {
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert('Lỗi tạo đợt thi: ' + (err.message || ''));
    }
  };

  // Exam Player Handlers
  const handleStartExam = (camp: ExamCampaign) => {
    setActiveTakingCampaign(camp);
    setTimeLeft(30 * 60);
    setCurrentQIdx(0);
    setUserAnswers({});
    setExamResult(null);
  };

  const handleAnswerSelect = (qId: string, answerVal: any) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: answerVal,
    }));
  };

  // Multi-select toggle for TNn
  const handleMultiAnswerToggle = (qId: string, optId: string) => {
    const currentList: string[] = Array.isArray(userAnswers[qId]) ? [...userAnswers[qId]] : [];
    if (currentList.includes(optId)) {
      handleAnswerSelect(
        qId,
        currentList.filter((id) => id !== optId)
      );
    } else {
      handleAnswerSelect(qId, [...currentList, optId]);
    }
  };

  // Reorder steps for XEP type
  const handleReorderStep = (qId: string, currentOptions: any[], idx: number, direction: 'up' | 'down') => {
    const items = [...currentOptions];
    if (direction === 'up' && idx > 0) {
      const temp = items[idx];
      items[idx] = items[idx - 1];
      items[idx - 1] = temp;
    } else if (direction === 'down' && idx < items.length - 1) {
      const temp = items[idx];
      items[idx] = items[idx + 1];
      items[idx + 1] = temp;
    }
    handleAnswerSelect(
      qId,
      items.map((it) => it.id)
    );
  };

  const handleSubmitExam = async () => {
    if (!activeTakingCampaign) return;
    try {
      setIsSubmitting(true);
      const res = await api.post(`/api/exams/campaigns/${activeTakingCampaign.id}/submit`, {
        answers: userAnswers,
        durationSeconds: 30 * 60 - timeLeft,
      });
      if (res.data?.success) {
        setExamResult(res.data.data);
        setShowConfirmSubmit(false);
        fetchData();
      }
    } catch (err: any) {
      alert('Lỗi khi nộp bài: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ---------------- VIEW 1: INTERACTIVE EXAM PLAYER ----------------
  if (activeTakingCampaign) {
    const qList = examQuestions.length > 0 ? examQuestions : [
      {
        id: 'q-test-01',
        type: 'TN1',
        title: '1. Thử nghiệm',
        content: 'Thử nghiệm kiểm tra độ chính xác quy trình vận hành SOP No1.',
        points: 1,
        options: [
          { id: 'opt-a', label: 'A', text: 'Phương án A' },
          { id: 'opt-b', label: 'B', text: 'Phương án B' },
          { id: 'opt-c', label: 'C', text: 'Phương án C' },
          { id: 'opt-d', label: 'D', text: 'Phương án D' },
        ],
        explanation: 'Đáp án C là phương án chuẩn xác nhất theo tài liệu SOP.',
      },
    ];
    const currentQ = qList[currentQIdx] || qList[0];
    const totalQ = qList.length;
    const answeredCount = Object.keys(userAnswers).length;

    // RESULT SCREEN
    if (examResult) {
      const isPassed = examResult.passed;
      return (
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center font-sans animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 max-w-2xl w-full p-8 text-center space-y-6">
            <div className="flex justify-center">
              {isPassed ? (
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                  <Award className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-10 h-10" />
                </div>
              )}
            </div>

            <div>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                  isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isPassed ? 'KẾT QUẢ: ĐẠT YÊU CẦU' : 'KẾT QUẢ: CHƯA ĐẠT'}
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-2">{activeTakingCampaign.title}</h2>
              <p className="text-xs text-slate-500 mt-1">Chuẩn điểm đạt tối thiểu: 70/100 điểm</p>
            </div>

            {/* Score circle & breakdown */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 flex items-center justify-around">
              <div>
                <p className="text-xs text-slate-500 font-medium">Điểm số đạt được</p>
                <p className="text-3xl font-extrabold text-[#1677ff] font-mono mt-1">
                  {examResult.score} <span className="text-sm font-normal text-slate-400">/ 100</span>
                </p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Số câu trả lời đúng</p>
                <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">
                  {examResult.correctCount} / {examResult.total} câu
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setActiveTakingCampaign(null);
                  setExamResult(null);
                }}
                className="px-6 py-2.5 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Hoàn tất & Về danh sách đợt thi
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ACTIVE TEST TAKING VIEW WITH 7 QUESTION TYPES
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none animate-fadeIn">
        {/* Top Sticky Test Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm('Bạn có muốn tạm dừng bài thi và quay lại sau?')) {
                  setActiveTakingCampaign(null);
                }
              }}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">{activeTakingCampaign.title}</h1>
              <p className="text-[11px] text-slate-500">
                Đề thi: {activeTakingCampaign.testTitle} • Hoàn thành: {answeredCount}/{totalQ} câu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold shadow-2xs ${
                timeLeft < 300
                  ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-4 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              Nộp bài thi
            </button>
          </div>
        </header>

        {/* Exam Body */}
        <div className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Main Question Area */}
          <main className="flex-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Question Index Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1677ff] bg-blue-50 px-2.5 py-1 rounded">
                    Câu {currentQIdx + 1} / {totalQ}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {currentQ.type === 'TNn'
                      ? 'Trắc nghiệm (nhiều đáp án)'
                      : currentQ.type === 'DS'
                      ? 'Đúng / Sai'
                      : currentQ.type === 'DIEN'
                      ? 'Điền từ vào chỗ trống'
                      : currentQ.type === 'XEP'
                      ? 'Sắp xếp thứ tự các bước'
                      : currentQ.type === 'GHEP'
                      ? 'Ghép cặp khái niệm'
                      : currentQ.type === 'HOTSPOT'
                      ? 'Xác định điểm ảnh (Hotspot)'
                      : 'Trắc nghiệm (1 đáp án)'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Điểm: {currentQ.points || 1} đ</span>
              </div>

              {/* Question Content */}
              <div>
                <h2 className="text-base font-semibold text-slate-800 leading-relaxed">
                  {currentQ.content || currentQ.title}
                </h2>
                {currentQ.imageUrl && (
                  <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <img src={currentQ.imageUrl} alt="SOP Diagram" className="max-h-64 mx-auto rounded" />
                  </div>
                )}
              </div>

              {/* DYNAMIC ANSWER INTERACTION FOR ALL 7 TYPES */}

              {/* 1. TN1: Single Choice Radio */}
              {(!currentQ.type || currentQ.type === 'TN1') && (
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = userAnswers[currentQ.id] === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleAnswerSelect(currentQ.id, opt.id)}
                        className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'border-[#1677ff] bg-blue-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition shrink-0 ${
                            isSelected ? 'bg-[#1677ff] border-[#1677ff] text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{opt.label}.</span>
                        <span className="text-xs text-slate-800 font-medium">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. TNn: Multi Choice Checkbox */}
              {currentQ.type === 'TNn' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-500 italic">Chọn một hoặc nhiều đáp án bạn cho là chính xác:</p>
                  {currentQ.options.map((opt) => {
                    const selectedList: string[] = Array.isArray(userAnswers[currentQ.id]) ? userAnswers[currentQ.id] : [];
                    const isSelected = selectedList.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleMultiAnswerToggle(currentQ.id, opt.id)}
                        className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'border-[#1677ff] bg-blue-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                            isSelected ? 'bg-[#1677ff] border-[#1677ff] text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{opt.label}.</span>
                        <span className="text-xs text-slate-800 font-medium">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. DS: True / False */}
              {currentQ.type === 'DS' && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div
                    onClick={() => handleAnswerSelect(currentQ.id, 'opt-true')}
                    className={`p-6 rounded-xl border text-center cursor-pointer transition ${
                      userAnswers[currentQ.id] === 'opt-true'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md ring-2 ring-emerald-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <span className="text-base font-bold">ĐÚNG</span>
                    <p className="text-[11px] text-slate-500 mt-1">Nhận định theo đúng chuẩn SOP</p>
                  </div>

                  <div
                    onClick={() => handleAnswerSelect(currentQ.id, 'opt-false')}
                    className={`p-6 rounded-xl border text-center cursor-pointer transition ${
                      userAnswers[currentQ.id] === 'opt-false'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 shadow-md ring-2 ring-rose-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <XCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                    <span className="text-base font-bold">SAI</span>
                    <p className="text-[11px] text-slate-500 mt-1">Nhận định vi phạm chuẩn SOP</p>
                  </div>
                </div>
              )}

              {/* 4. DIEN: Fill in the Blank */}
              {currentQ.type === 'DIEN' && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nhập câu trả lời hoặc từ khóa còn thiếu:
                  </label>
                  <input
                    type="text"
                    value={userAnswers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value)}
                    placeholder="Nhập câu trả lời của bạn..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:border-[#1677ff] outline-hidden shadow-2xs font-medium"
                  />
                  <p className="text-[11px] text-slate-400">
                    Gợi ý: Điền đúng từ ngữ chuyên môn hoặc thông số quy định trong quy trình.
                  </p>
                </div>
              )}

              {/* 5. XEP: Order Steps Sequence */}
              {currentQ.type === 'XEP' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-500">
                    Sắp xếp lại trình tự các bước theo đúng diễn tiến của quy trình (Dùng nút ↑ ↓):
                  </p>
                  <div className="space-y-2">
                    {currentQ.options.map((opt, optIdx) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs"
                      >
                        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {optIdx + 1}
                        </span>
                        <span className="flex-1 text-xs text-slate-800 font-medium">{opt.text}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={optIdx === 0}
                            onClick={() => handleReorderStep(currentQ.id, currentQ.options, optIdx, 'up')}
                            className="p-1 hover:bg-slate-100 rounded border border-slate-200 disabled:opacity-30"
                            title="Lên trên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={optIdx === currentQ.options.length - 1}
                            onClick={() => handleReorderStep(currentQ.id, currentQ.options, optIdx, 'down')}
                            className="p-1 hover:bg-slate-100 rounded border border-slate-200 disabled:opacity-30"
                            title="Xuống dưới"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. GHEP: Match Pairs */}
              {currentQ.type === 'GHEP' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-500">Ghép nối các mục ở Cột A với nội dung thích hợp ở Cột B:</p>
                  <div className="space-y-2">
                    {currentQ.options.map((opt) => (
                      <div key={opt.id} className="grid grid-cols-2 gap-3 items-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-xs font-semibold text-slate-700">{opt.text}</div>
                        <select
                          value={userAnswers[currentQ.id]?.[opt.id] || ''}
                          onChange={(e) => {
                            const prev = userAnswers[currentQ.id] || {};
                            handleAnswerSelect(currentQ.id, { ...prev, [opt.id]: e.target.value });
                          }}
                          className="text-xs p-1.5 bg-white border border-slate-200 rounded outline-hidden focus:border-[#1677ff]"
                        >
                          <option value="">-- Chọn ghép nối --</option>
                          {currentQ.options.map((targetOpt) => (
                            <option key={targetOpt.id} value={targetOpt.matchTarget || targetOpt.text}>
                              {targetOpt.matchTarget || targetOpt.text}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. HOTSPOT: Click Target Zone */}
              {currentQ.type === 'HOTSPOT' && (
                <div className="space-y-3 pt-2">
                  <div
                    onClick={() => handleAnswerSelect(currentQ.id, 'hotspot-confirmed')}
                    className={`p-4 rounded-xl border text-center cursor-pointer transition ${
                      userAnswers[currentQ.id] === 'hotspot-confirmed'
                        ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Target className="w-8 h-8 text-rose-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-800">
                      {userAnswers[currentQ.id] === 'hotspot-confirmed'
                        ? '✓ Đã nhấp chọn định vị vùng thao tác trên hình ảnh'
                        : 'Nhấp chuột vào hình ảnh bên trên để định vị vùng thao tác'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons at bottom */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-8">
              <button
                disabled={currentQIdx === 0}
                onClick={() => setCurrentQIdx((prev) => prev - 1)}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <button
                disabled={currentQIdx === totalQ - 1}
                onClick={() => setCurrentQIdx((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-medium rounded-lg disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </main>

          {/* Right Question Palette */}
          <aside className="w-full md:w-64 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 shrink-0 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh sách câu hỏi</h3>
            <div className="grid grid-cols-5 gap-2">
              {qList.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQIdx;
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setCurrentQIdx(idx)}
                    className={`h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center border ${
                      isCurrent
                        ? 'border-[#1677ff] bg-blue-100 text-[#1677ff] ring-2 ring-blue-300'
                        : isAnswered
                        ? 'bg-[#1677ff] border-[#1677ff] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#1677ff]" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300" />
                <span>Chưa trả lời</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Submit Confirmation Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-[#1677ff] mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Xác nhận nộp bài thi?</h3>
              <p className="text-xs text-slate-500">
                Bạn đã trả lời <strong className="text-slate-800">{answeredCount}/{totalQ}</strong> câu hỏi. Sau khi nộp bài, hệ thống sẽ tự động tính điểm và đánh giá chuẩn đạt ($\ge 70$đ).
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Đang chấm điểm...' : 'Đồng ý nộp'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- VIEW 2: CAMPAIGNS LIST & MODAL ----------------
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans select-none animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
            Thi quy trình & Sát hạch Năng lực
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổ chức các đợt thi khảo sát kiến thức quy trình SOP, phân công thí sinh và theo dõi tỷ lệ đạt chuẩn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 outline-hidden shadow-2xs font-medium"
          >
            <option value="proc-no1">No1 - Quy trình thử nghiệm</option>
            <option value="proc-kpi">Quy trình Đánh giá KPI</option>
            <option value="proc-sla">Quy trình Quản lý SLA</option>
          </select>

          <button
            onClick={fetchData}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg shadow-2xs transition"
            title="Làm mới dữ liệu"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mới đợt thi</span>
          </button>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="py-3 px-5">Tên đợt thi</th>
              <th className="py-3 px-5">Đề thi áp dụng</th>
              <th className="py-3 px-5 text-center">Thời gian thi</th>
              <th className="py-3 px-5 text-center">Thí sinh (Nộp/Mời)</th>
              <th className="py-3 px-5 text-center">Tỷ lệ đạt (≥70đ)</th>
              <th className="py-3 px-5 text-center">Trạng thái</th>
              <th className="py-3 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Chưa có đợt thi nào. Nhấp "Thêm mới đợt thi" để tạo đợt khảo sát.
                </td>
              </tr>
            ) : (
              campaigns.map((camp) => {
                const totalParticipants = camp.participants?.length || 0;
                const submitted = camp.submissionsCount || 0;
                const passed = camp.passedCount || 0;
                const passRate = submitted > 0 ? Math.round((passed / submitted) * 100) : 0;

                return (
                  <tr key={camp.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      <div>{camp.title}</div>
                      {camp.description && (
                        <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{camp.description}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded">
                        {camp.testTitle}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-center text-slate-600 font-mono text-[11px]">
                      {camp.startDate} - {camp.endDate}
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded text-slate-700">
                        {submitted} / {totalParticipants}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2 py-0.5 text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded">
                        {passRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full">
                        Đang diễn ra
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartExam(camp)}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-2xs transition"
                          title="Làm bài thi thử nghiệm"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Vào thi</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: THÊM MỚI ĐỢT THI (MATCHING EXACT 100% USER'S SCREENSHOT) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Thêm mới</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-6 text-xs text-slate-700">
              {/* TOP SECTION: 2 COLUMNS (General info & Dates) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      <span className="text-rose-500 font-bold">* </span>Tên Đợt Thi:
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nhập tên đợt thi"
                      className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-[#1677ff] outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">
                      <span className="text-rose-500 font-bold">* </span>Chọn đề thi:
                    </label>
                    <select
                      value={formData.testId}
                      onChange={(e) => handleTestSelectionChange(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                    >
                      <option value="">Chọn quy trình trên thanh công cụ</option>
                      {examTests.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.totalQuestions} câu, {t.durationMinutes} phút)
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Chọn quy trình trên thanh công cụ để tải đề từ Ngân hàng đề thi
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Mô tả đề:</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả đề từ ngân hàng"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                    />
                  </div>
                </div>

                {/* Right Column: Dates & Reminders */}
                <div className="space-y-2.5">
                  {/* Ngày mời tham gia */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700 w-36 shrink-0">Ngày mời tham gia:</label>
                    <div className="flex items-center border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 flex-1">
                      <input
                        type="text"
                        value={formData.inviteDate}
                        onChange={(e) => setFormData({ ...formData, inviteDate: e.target.value })}
                        className="w-full bg-transparent outline-hidden font-mono text-slate-700 text-xs"
                      />
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Copy className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Send className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Ngày bắt đầu */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700 w-36 shrink-0">
                      <span className="text-rose-500 font-bold">* </span>Ngày bắt đầu:
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 flex-1">
                      <input
                        type="text"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full bg-transparent outline-hidden font-mono text-slate-700 text-xs"
                      />
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Copy className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Send className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Ngày kết thúc */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700 w-36 shrink-0">
                      <span className="text-rose-500 font-bold">* </span>Ngày kết thúc:
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 flex-1">
                      <input
                        type="text"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full bg-transparent outline-hidden font-mono text-slate-700 text-xs"
                      />
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Copy className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Send className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Ngày nhắc lần 1 */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700 w-36 shrink-0">Ngày nhắc lần 1:</label>
                    <div className="flex items-center border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 flex-1">
                      <input
                        type="text"
                        placeholder="Chọn ngày"
                        value={formData.remindDate1}
                        onChange={(e) => setFormData({ ...formData, remindDate1: e.target.value })}
                        className="w-full bg-transparent outline-hidden font-mono text-slate-700 text-xs"
                      />
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Copy className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Send className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Ngày nhắc lần 2 */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700 w-36 shrink-0">Ngày nhắc lần 2:</label>
                    <div className="flex items-center border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 flex-1">
                      <input
                        type="text"
                        placeholder="Chọn ngày"
                        value={formData.remindDate2}
                        onChange={(e) => setFormData({ ...formData, remindDate2: e.target.value })}
                        className="w-full bg-transparent outline-hidden font-mono text-slate-700 text-xs"
                      />
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Copy className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Send className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Ngày nhắc lần 3 */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="font-semibold text-slate-700 w-36 shrink-0">Ngày nhắc lần 3:</label>
                    <div className="flex items-center border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 flex-1">
                      <input
                        type="text"
                        placeholder="Chọn ngày"
                        value={formData.remindDate3}
                        onChange={(e) => setFormData({ ...formData, remindDate3: e.target.value })}
                        className="w-full bg-transparent outline-hidden font-mono text-slate-700 text-xs"
                      />
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <Calendar className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Copy className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                        <Send className="w-3.5 h-3.5 hover:text-blue-600 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note Line from Screenshot */}
              <p className="text-[11px] text-slate-400 leading-normal">
                Lưu ý: lưu sẽ xóa các lời mời trạng thái "chưa làm" hiện có của đề này, rồi tạo lại theo danh sách bên dưới. Người đã có lượt thi (đang làm / đã nộp) không bị ghi đè.
              </p>

              {/* SECTION HEADER: BLUE BAR (Người tham gia + Import Excel) */}
              <div className="bg-[#1677ff] text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
                <span className="font-bold text-xs">Người tham gia</span>
                <button
                  type="button"
                  onClick={() => setIsExcelModalOpen(true)}
                  className="bg-white text-slate-800 hover:bg-slate-100 text-xs font-semibold px-3 py-1 rounded shadow-2xs flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Import Excel</span>
                  <span className="text-[10px]">▼</span>
                </button>
              </div>

              {/* FILTER SELECTORS 3 COLUMNS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 border border-t-0 border-slate-200 rounded-b-lg">
                {/* Bộ phận */}
                <div className="space-y-1">
                  <span className="font-semibold text-slate-600 block">Bộ phận</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAllDept}
                      onChange={(e) => setSelectAllDept(e.target.checked)}
                      className="rounded text-[#1677ff]"
                    />
                    <span>Chọn tất cả</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Đã chọn tất cả bộ phận"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-slate-500 outline-hidden"
                  />
                </div>

                {/* Chức vụ */}
                <div className="space-y-1">
                  <span className="font-semibold text-slate-600 block">Chức vụ</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAllPos}
                      onChange={(e) => setSelectAllPos(e.target.checked)}
                      className="rounded text-[#1677ff]"
                    />
                    <span>Chọn tất cả</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Đã chọn tất cả chức vụ"
                    className="w-full p-2 bg-white border border-slate-200 rounded text-slate-500 outline-hidden"
                  />
                </div>

                {/* Nhân viên */}
                <div className="space-y-1 relative">
                  <span className="font-semibold text-slate-600 block">
                    <span className="text-rose-500 font-bold">* </span>Nhân viên
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAllEmp}
                      onChange={handleToggleSelectAllEmp}
                      className="rounded text-[#1677ff]"
                    />
                    <span>Chọn tất cả</span>
                  </label>
                  <div
                    onClick={() => setEmployeeDropdownOpen(!employeeDropdownOpen)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>
                      {selectedParticipants.length > 0
                        ? `Đã chọn (${selectedParticipants.length}) nhân sự`
                        : 'Chọn nhân viên...'}
                    </span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </div>

                  {employeeDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto p-1 z-30 animate-fadeIn">
                      {SAMPLE_EMPLOYEES.map((emp) => {
                        const isChecked = selectedParticipants.some((p) => p.userId === emp.userId);
                        return (
                          <div
                            key={emp.userId}
                            onClick={() => handleAddParticipant(emp)}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 cursor-pointer rounded text-xs"
                          >
                            <input type="checkbox" checked={isChecked} readOnly className="rounded text-[#1677ff]" />
                            <div>
                              <p className="font-semibold text-slate-800">{emp.fullName}</p>
                              <p className="text-[10px] text-slate-400">
                                {emp.position} • {emp.department}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* PARTICIPANT TABLE */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-4 w-12 text-center">STT</th>
                      <th className="py-2.5 px-4">Họ & tên</th>
                      <th className="py-2.5 px-4">Chức vụ</th>
                      <th className="py-2.5 px-4">Bộ phận</th>
                      <th className="py-2.5 px-4 text-center w-20">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <Inbox className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                            <span className="text-xs">No data</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      selectedParticipants.map((p, idx) => (
                        <tr key={p.userId} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{p.fullName}</td>
                          <td className="py-2.5 px-4 text-slate-600">{p.position}</td>
                          <td className="py-2.5 px-4 text-slate-600">{p.department}</td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(p.userId)}
                              className="text-slate-300 hover:text-rose-500 transition p-1"
                              title="Bỏ chọn nhân viên này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-md transition"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-7 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white font-semibold rounded-md shadow-xs transition"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        title="Nhập danh sách Thí sinh dự thi từ Excel (.xlsx)"
        templateFileName="Mau_Danh_Sach_Thi_Sinh_TinyKPI.xlsx"
        templateHeaders={['Họ và tên', 'Email', 'Chức vụ', 'Bộ phận']}
        exampleRows={[
          {
            'Họ và tên': 'Nguyễn Văn An',
            Email: 'an.nguyen@tinykpi.com',
            'Chức vụ': 'Chuyên viên Vận hành SOP',
            'Bộ phận': 'Phòng Quản lý Quy trình',
          },
          {
            'Họ và tên': 'Trần Mai Hoa',
            Email: 'hoa.tran@tinykpi.com',
            'Chức vụ': 'Kế toán viên Mua sắm',
            'Bộ phận': 'Phòng Tài chính - Kế toán',
          },
        ]}
        headerMapping={{
          'Họ và tên': 'fullName',
          Email: 'email',
          'Chức vụ': 'position',
          'Bộ phận': 'department',
        }}
        requiredFields={[
          { key: 'fullName', label: 'Họ và tên' },
          { key: 'email', label: 'Email' },
        ]}
        previewColumns={[
          { key: 'fullName', label: 'Họ & tên' },
          { key: 'email', label: 'Email' },
          { key: 'position', label: 'Chức vụ' },
          { key: 'department', label: 'Bộ phận' },
        ]}
        onConfirmImport={handleConfirmExcelImport}
        notes={[
          'Hệ thống tự động bỏ qua các bản ghi trùng lặp email.',
          'Các thí sinh được nhập từ file Excel sẽ hiển thị trực tiếp tại bảng Người tham gia bên dưới.',
        ]}
      />
    </div>
  );
};
