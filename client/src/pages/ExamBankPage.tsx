import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Edit3,
  Plus,
  RotateCw,
  Search,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Save,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Video,
  GripVertical,
  Check,
  X,
  AlertCircle,
  Sliders,
  Settings,
  ArrowLeft,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Code,
} from 'lucide-react';
import { api } from '../api/client.js';

// Types
export type QuestionType = 'TN1' | 'TNn' | 'DS' | 'DIEN' | 'GHEP' | 'XEP' | 'HOTSPOT';

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
  matchTarget?: string; // For GHEP
}

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
  correctBlankWord?: string; // For DIEN
  hotspotZone?: string; // For HOTSPOT
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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

const QUESTION_TYPES_CONFIG: {
  type: QuestionType;
  code: string;
  name: string;
  desc: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    type: 'TN1',
    code: 'TN1',
    name: 'Trắc nghiệm (1 đáp án)',
    desc: 'Loại câu hỏi 1 đáp án là dạng câu hỏi mà chỉ có một phương án đúng duy nhất. Người làm bài chỉ được chọn một đáp án.',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
  },
  {
    type: 'TNn',
    code: 'TNn',
    name: 'Trắc nghiệm (nhiều đáp án)',
    desc: 'Câu hỏi có thể có từ 2 phương án đúng trở lên. Người làm bài cần tích chọn đầy đủ tất cả phương án hợp lệ.',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
  },
  {
    type: 'DS',
    code: 'Đ/S',
    name: 'Đúng / Sai',
    desc: 'Đưa ra một nhận định và yêu cầu người làm xác định xem nhận định đó là Đúng hay Sai theo chuẩn SOP.',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
  },
  {
    type: 'DIEN',
    code: 'Điền',
    name: 'Điền từ',
    desc: 'Yêu cầu điền thuật ngữ, thông số hoặc từ khóa chính xác vào vị trí chỗ trống trong câu.',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
  },
  {
    type: 'GHEP',
    code: 'Ghép',
    name: 'Ghép cặp',
    desc: 'Ghép nối các mục ở Cột A với nội dung giải thích hoặc hành động tương ứng ở Cột B.',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700',
  },
  {
    type: 'XEP',
    code: 'Xếp',
    name: 'Sắp xếp thứ tự',
    desc: 'Kéo thả để sắp xếp các bước thực thi theo đúng trình tự diễn tiến của quy trình vận hành.',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
  },
  {
    type: 'HOTSPOT',
    code: 'Ảnh',
    name: 'Điểm ảnh (Hotspot)',
    desc: 'Yêu cầu người làm bài nhấp chuột vào đúng vị trí hoặc vùng thao tác trên hình ảnh giao diện SOP.',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
  },
];

export const ExamBankPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'EXAMS'>('EXAMS');
  const [isEditorMode, setIsEditorMode] = useState<boolean>(false);
  const [currentEditingSet, setCurrentEditingSet] = useState<QuestionSet | null>(null);

  // Data states
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [examTests, setExamTests] = useState<ExamTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProcess, setSelectedProcess] = useState<string>('proc-no1');
  const [selectedDraft, setSelectedDraft] = useState<string>('draft-default');

  // Slide-over Drawer "Tạo đề thi"
  const [isCreateTestDrawerOpen, setIsCreateTestDrawerOpen] = useState<boolean>(false);
  const [testForm, setTestForm] = useState({
    title: '',
    status: 'OPEN' as 'OPEN' | 'CLOSED',
    processId: 'proc-no1',
    processTitle: 'No1 - Quy trình thử nghiệm',
    questionSetId: '',
    description: '',
    totalQuestions: 10,
    durationMinutes: 30,
    maxAttempts: 0,
    maxScore: 100,
    passingScore: 70,
    questionOrder: 'SHUFFLE' as 'SHUFFLE' | 'SEQUENTIAL',
    displayMode: 'ALL_STEPS' as 'ALL_STEPS' | 'BY_STEP',
    passingNote: '',
  });

  // Editor states
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState<boolean>(false);

  // Drag and drop state for Question list in Column 1
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Refs for upload inputs and content textarea
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [setsRes, testsRes] = await Promise.all([
        api.get('/api/exam-bank/question-sets'),
        api.get('/api/exam-bank/tests'),
      ]);
      if (setsRes.data?.success) setQuestionSets(setsRes.data.data || []);
      if (testsRes.data?.success) setExamTests(testsRes.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu ngân hàng đề thi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for Test Creation
  const handleOpenCreateTestDrawer = () => {
    setTestForm({
      title: '',
      status: 'OPEN',
      processId: 'proc-no1',
      processTitle: 'No1 - Quy trình thử nghiệm',
      questionSetId: '',
      description: '',
      totalQuestions: 10,
      durationMinutes: 30,
      maxAttempts: 0,
      maxScore: 100,
      passingScore: 70,
      questionOrder: 'SHUFFLE',
      displayMode: 'ALL_STEPS',
      passingNote: '',
    });
    setIsCreateTestDrawerOpen(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.title.trim()) {
      alert('Vui lòng nhập tên đề thi!');
      return;
    }
    try {
      const res = await api.post('/api/exam-bank/tests', testForm);
      if (res.data?.success) {
        setIsCreateTestDrawerOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert('Lỗi tạo đề thi: ' + (err.message || ''));
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đề thi này?')) return;
    try {
      await api.delete(`/api/exam-bank/tests/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Question Sets & Editor
  const handleOpenEditor = (set?: QuestionSet) => {
    if (set) {
      setCurrentEditingSet(JSON.parse(JSON.stringify(set)));
    } else {
      const newSet: QuestionSet = {
        id: `set-${Date.now()}`,
        title: 'Bộ câu hỏi mới',
        processId: 'proc-no1',
        processTitle: 'No1 - Quy trình thử nghiệm',
        version: 'Draft mặc định',
        totalQuestions: 1,
        totalPoints: 1,
        questions: [
          {
            id: `q-${Date.now()}`,
            setId: '',
            type: 'TN1',
            title: '1. Thử nghiệm',
            content: 'Thử nghiệm',
            points: 1,
            feedbackCorrect: 'Chính xác! Rất tốt.',
            feedbackWrong: 'Chưa đúng. Hãy xem lại trang 12.',
            explanation: '',
            orderIndex: 1,
            options: [
              { id: 'opt-1', label: 'A', text: 'A', isCorrect: false },
              { id: 'opt-2', label: 'B', text: 'B', isCorrect: false },
              { id: 'opt-3', label: 'C', text: 'C', isCorrect: true },
              { id: 'opt-4', label: 'D', text: 'D', isCorrect: false },
            ],
          },
        ],
      };
      setCurrentEditingSet(newSet);
    }
    setActiveQuestionIdx(0);
    setIsEditorMode(true);
  };

  const handleSaveSet = async () => {
    if (!currentEditingSet) return;
    try {
      const res = await api.post('/api/exam-bank/question-sets', currentEditingSet);
      if (res.data?.success) {
        alert('Lưu bộ câu hỏi thành công!');
        fetchData();
      }
    } catch (err: any) {
      alert('Lỗi khi lưu: ' + err.message);
    }
  };

  const handleDeleteSet = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bộ câu hỏi này?')) return;
    try {
      await api.delete(`/api/exam-bank/question-sets/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop handlers for questions in Column 1
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx || !currentEditingSet) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const questions = [...currentEditingSet.questions];
    const [moved] = questions.splice(draggedIdx, 1);
    questions.splice(targetIdx, 0, moved);
    questions.forEach((q, i) => {
      q.orderIndex = i + 1;
    });
    setCurrentEditingSet({ ...currentEditingSet, questions });
    setActiveQuestionIdx(targetIdx);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Question editing actions
  const handleAddQuestion = (type: QuestionType) => {
    if (!currentEditingSet) return;
    const count = currentEditingSet.questions.length + 1;
    const cfg = QUESTION_TYPES_CONFIG.find((c) => c.type === type);

    let defaultOptions: QuestionOption[] = [
      { id: 'opt-1', label: 'A', text: '', isCorrect: true },
      { id: 'opt-2', label: 'B', text: '', isCorrect: false },
      { id: 'opt-3', label: 'C', text: '', isCorrect: false },
      { id: 'opt-4', label: 'D', text: '', isCorrect: false },
    ];

    if (type === 'DS') {
      defaultOptions = [
        { id: 'opt-true', label: 'A', text: 'Đúng', isCorrect: true },
        { id: 'opt-false', label: 'B', text: 'Sai', isCorrect: false },
      ];
    } else if (type === 'XEP') {
      defaultOptions = [
        { id: 'opt-1', label: '1', text: 'Bước 1: Tiếp nhận yêu cầu', isCorrect: true },
        { id: 'opt-2', label: '2', text: 'Bước 2: Phê duyệt sơ bộ', isCorrect: true },
        { id: 'opt-3', label: '3', text: 'Bước 3: Thực thi quy trình', isCorrect: true },
      ];
    } else if (type === 'GHEP') {
      defaultOptions = [
        { id: 'opt-1', label: 'A', text: 'Bước 1', matchTarget: 'Tiếp nhận thông tin' },
        { id: 'opt-2', label: 'B', text: 'Bước 2', matchTarget: 'Thẩm định hồ sơ' },
        { id: 'opt-3', label: 'C', text: 'Bước 3', matchTarget: 'Bàn giao nghiệm thu' },
      ];
    }

    const newQ: ExamQuestionItem = {
      id: `q-${Date.now()}`,
      setId: currentEditingSet.id,
      type,
      title: `${count}. Câu hỏi ${cfg?.name || ''}`,
      content: '',
      points: 1,
      orderIndex: count,
      feedbackCorrect: 'Chính xác! Rất tốt.',
      feedbackWrong: 'Chưa đúng. Vui lòng xem lại tài liệu.',
      correctBlankWord: type === 'DIEN' ? 'SLA' : undefined,
      hotspotZone: type === 'HOTSPOT' ? 'Vùng nút Phê duyệt góc phải' : undefined,
      options: defaultOptions,
    };

    setCurrentEditingSet({
      ...currentEditingSet,
      questions: [...currentEditingSet.questions, newQ],
      totalQuestions: count,
      totalPoints: currentEditingSet.totalPoints + 1,
    });
    setActiveQuestionIdx(currentEditingSet.questions.length);
    setIsTypeDropdownOpen(false);
  };

  const handleUpdateCurrentQuestion = (fields: Partial<ExamQuestionItem>) => {
    if (!currentEditingSet) return;
    const updated = [...currentEditingSet.questions];
    updated[activeQuestionIdx] = { ...updated[activeQuestionIdx], ...fields };
    setCurrentEditingSet({
      ...currentEditingSet,
      questions: updated,
    });
  };

  const handleDeleteQuestion = (idx: number) => {
    if (!currentEditingSet) return;
    if (currentEditingSet.questions.length <= 1) {
      alert('Bộ câu hỏi phải có ít nhất 1 câu hỏi!');
      return;
    }
    const updated = currentEditingSet.questions.filter((_, i) => i !== idx);
    setCurrentEditingSet({
      ...currentEditingSet,
      questions: updated,
      totalQuestions: updated.length,
    });
    if (activeQuestionIdx >= updated.length) {
      setActiveQuestionIdx(updated.length - 1);
    }
  };

  const handleAddOption = () => {
    if (!currentEditingSet) return;
    const q = currentEditingSet.questions[activeQuestionIdx];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const nextLabel = letters[q.options.length] || `P${q.options.length + 1}`;
    const newOptions = [
      ...q.options,
      { id: `opt-${Date.now()}`, label: nextLabel, text: '', isCorrect: false },
    ];
    handleUpdateCurrentQuestion({ options: newOptions });
  };

  const handleUpdateOption = (optIdx: number, fields: Partial<QuestionOption>) => {
    if (!currentEditingSet) return;
    const q = currentEditingSet.questions[activeQuestionIdx];
    const updated = [...q.options];
    updated[optIdx] = { ...updated[optIdx], ...fields };
    handleUpdateCurrentQuestion({ options: updated });
  };

  const handleSetCorrectOption = (optIdx: number) => {
    if (!currentEditingSet) return;
    const q = currentEditingSet.questions[activeQuestionIdx];
    if (q.type === 'TNn') {
      const updated = q.options.map((opt, i) => (i === optIdx ? { ...opt, isCorrect: !opt.isCorrect } : opt));
      handleUpdateCurrentQuestion({ options: updated });
    } else {
      const updated = q.options.map((opt, i) => ({ ...opt, isCorrect: i === optIdx }));
      handleUpdateCurrentQuestion({ options: updated });
    }
  };

  const handleDeleteOption = (optIdx: number) => {
    if (!currentEditingSet) return;
    const q = currentEditingSet.questions[activeQuestionIdx];
    if (q.options.length <= 2) {
      alert('Câu hỏi trắc nghiệm cần ít nhất 2 phương án!');
      return;
    }
    const updated = q.options.filter((_, i) => i !== optIdx);
    handleUpdateCurrentQuestion({ options: updated });
  };

  // Reordering steps for XEP type
  const handleMoveOptionOrder = (optIdx: number, direction: 'up' | 'down') => {
    if (!currentEditingSet) return;
    const q = currentEditingSet.questions[activeQuestionIdx];
    const options = [...q.options];
    if (direction === 'up' && optIdx > 0) {
      const temp = options[optIdx];
      options[optIdx] = options[optIdx - 1];
      options[optIdx - 1] = temp;
    } else if (direction === 'down' && optIdx < options.length - 1) {
      const temp = options[optIdx];
      options[optIdx] = options[optIdx + 1];
      options[optIdx + 1] = temp;
    }
    options.forEach((opt, i) => {
      opt.label = `${i + 1}`;
    });
    handleUpdateCurrentQuestion({ options });
  };

  // Rich Text Formatting helper
  const handleFormatText = (wrapper: 'b' | 'i' | 'u' | 'list') => {
    const textarea = contentInputRef.current;
    if (!textarea || !currentEditingSet) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end) || 'văn bản mẫu';

    let formatted = '';
    if (wrapper === 'b') formatted = `<strong>${selected}</strong>`;
    else if (wrapper === 'i') formatted = `<em>${selected}</em>`;
    else if (wrapper === 'u') formatted = `<u>${selected}</u>`;
    else if (wrapper === 'list') formatted = `\n<ul>\n  <li>${selected}</li>\n</ul>\n`;

    const newContent = currentText.substring(0, start) + formatted + currentText.substring(end);
    handleUpdateCurrentQuestion({ content: newContent });
  };

  // Local file upload handlers
  const handleFileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        handleUpdateCurrentQuestion({ imageUrl: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        handleUpdateCurrentQuestion({ videoUrl: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  // ---------------- VIEW 1: SOẠN THẢO BỘ CÂU HỎI (3 CỘT) ----------------
  if (isEditorMode && currentEditingSet) {
    const curQ = currentEditingSet.questions[activeQuestionIdx] || currentEditingSet.questions[0];
    const typeCfg = QUESTION_TYPES_CONFIG.find((t) => t.type === curQ?.type) || QUESTION_TYPES_CONFIG[0];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none animate-fadeIn">
        {/* Hidden File Pickers */}
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleFileImage} className="hidden" />
        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleFileVideo} className="hidden" />

        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditorMode(false)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Danh sách bộ câu hỏi</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Tên bộ câu hỏi *</span>
              <input
                type="text"
                value={currentEditingSet.title}
                onChange={(e) => setCurrentEditingSet({ ...currentEditingSet, title: e.target.value })}
                className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-[#1677ff] rounded-md px-3 py-1 outline-hidden w-64 transition"
                placeholder="Nhập tên bộ câu hỏi..."
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentEditingSet.processTitle}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">{currentEditingSet.version}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Preview Button */}
            <button
              onClick={() => setPreviewModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md shadow-xs transition"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveSet}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-medium rounded-md shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu</span>
            </button>

            {/* Add Question Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-medium rounded-md shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm câu hỏi</span>
                <span className="text-[10px] ml-0.5">▼</span>
              </button>

              {isTypeDropdownOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn">
                  {QUESTION_TYPES_CONFIG.map((cfg) => (
                    <button
                      key={cfg.type}
                      onClick={() => handleAddQuestion(cfg.type)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50/60 flex items-center justify-between group transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 text-center py-0.5 text-[10px] font-bold rounded ${cfg.badgeBg} ${cfg.badgeText}`}
                        >
                          {cfg.code}
                        </span>
                        <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
                          {cfg.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Info Banner */}
        <div className="bg-blue-50/80 border-b border-blue-100 px-6 py-2 text-xs text-blue-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Chọn loại câu hỏi và điểm số ở panel bên phải, soạn nội dung + đáp án ở giữa, dùng nút Preview để xem trước như học viên. Bạn có thể kéo thả chuột để sắp xếp lại vị trí câu hỏi ở cột bên trái.
          </span>
        </div>

        {/* 3 Columns Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* COLUMN 1: QUESTION LIST WITH DRAG & DROP (LEFT) */}
          <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Câu hỏi ({currentEditingSet.questions.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Tổng: {currentEditingSet.questions.reduce((sum, q) => sum + (Number(q.points) || 1), 0)} điểm
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-transparent">
              {currentEditingSet.questions.map((q, idx) => {
                const cfg = QUESTION_TYPES_CONFIG.find((c) => c.type === q.type) || QUESTION_TYPES_CONFIG[0];
                const isActive = idx === activeQuestionIdx;
                const isDragOver = dragOverIdx === idx;
                return (
                  <div
                    key={q.id || idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    onClick={() => setActiveQuestionIdx(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-grab active:cursor-grabbing transition border ${
                      isDragOver ? 'border-t-2 border-blue-500 bg-blue-50/40' : ''
                    } ${
                      isActive
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 shrink-0" />
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {cfg.code}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {idx + 1}. {q.title ? q.title.replace(/^\d+\.\s*/, '') : 'Chưa có tiêu đề'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{q.points || 1} điểm</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(idx);
                      }}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded transition"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* COLUMN 2: QUESTION EDITOR (CENTER) */}
          <main className="flex-1 bg-white overflow-y-auto p-6 flex flex-col space-y-5 border-r border-slate-200">
            {/* Header info of question */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${typeCfg.badgeBg} ${typeCfg.badgeText}`}>
                {typeCfg.name}
              </span>
              <span className="text-xs font-bold text-slate-700">Câu {activeQuestionIdx + 1}</span>
            </div>

            {/* Question Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Nội dung câu hỏi</label>
                {showHtmlPreview && (
                  <span className="text-[11px] text-blue-600 font-medium">Chế độ xem trước HTML</span>
                )}
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 border border-slate-200 bg-slate-50/80 px-2 py-1 rounded-t-md text-slate-600 text-xs">
                <button
                  type="button"
                  onClick={() => handleFormatText('b')}
                  className="px-2 py-1 hover:bg-slate-200 rounded font-bold"
                  title="In đậm (Bold)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('i')}
                  className="px-2 py-1 hover:bg-slate-200 rounded italic"
                  title="In nghiêng (Italic)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('u')}
                  className="px-2 py-1 hover:bg-slate-200 rounded underline"
                  title="Gạch chân (Underline)"
                >
                  U
                </button>
                <span className="text-slate-300 mx-1">|</span>
                <button
                  type="button"
                  onClick={() => handleFormatText('list')}
                  className="px-2 py-1 hover:bg-slate-200 rounded"
                  title="Thêm danh sách"
                >
                  • Danh sách
                </button>
                <span className="text-slate-300 mx-1">|</span>
                <button
                  type="button"
                  onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                  className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 transition ${
                    showHtmlPreview ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                  title="Bật/Tắt xem trước HTML"
                >
                  <Code className="w-3 h-3" />
                  <span>Mã HTML</span>
                </button>
              </div>

              {showHtmlPreview ? (
                <div
                  className="w-full min-h-[100px] p-3 border border-t-0 border-slate-200 rounded-b-md bg-slate-50 text-xs text-slate-800 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: curQ.content || '<p class="text-slate-400">Chưa có nội dung</p>' }}
                />
              ) : (
                <textarea
                  ref={contentInputRef}
                  rows={4}
                  value={curQ.content}
                  onChange={(e) => handleUpdateCurrentQuestion({ content: e.target.value })}
                  className="w-full text-sm text-slate-800 p-3 border border-t-0 border-slate-200 rounded-b-md focus:border-[#1677ff] outline-hidden resize-y transition"
                  placeholder="Nhập nội dung đề bài câu hỏi tại đây..."
                />
              )}
            </div>

            {/* Media Upload URLs & Local Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50 text-xs">
                <span className="px-3 py-2 text-slate-500 flex items-center gap-1 shrink-0 font-medium">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  URL ảnh:
                </span>
                <input
                  type="text"
                  value={curQ.imageUrl || ''}
                  onChange={(e) => handleUpdateCurrentQuestion({ imageUrl: e.target.value })}
                  placeholder="https://... hoặc tải lên"
                  className="flex-1 px-2 py-1.5 text-xs bg-transparent outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border-l border-slate-200 text-slate-600 font-medium shrink-0 flex items-center gap-1 transition"
                  title="Chọn ảnh từ máy tính"
                >
                  Upload ▾
                </button>
              </div>

              <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50 text-xs">
                <span className="px-3 py-2 text-slate-500 flex items-center gap-1 shrink-0 font-medium">
                  <Video className="w-3.5 h-3.5 text-slate-400" />
                  URL video:
                </span>
                <input
                  type="text"
                  value={curQ.videoUrl || ''}
                  onChange={(e) => handleUpdateCurrentQuestion({ videoUrl: e.target.value })}
                  placeholder="https://... hoặc tải lên"
                  className="flex-1 px-2 py-1.5 text-xs bg-transparent outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border-l border-slate-200 text-slate-600 font-medium shrink-0 flex items-center gap-1 transition"
                  title="Chọn video từ máy tính"
                >
                  Upload ▾
                </button>
              </div>
            </div>

            {/* Image Preview Thumbnail if attached */}
            {curQ.imageUrl && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={curQ.imageUrl}
                    alt="Preview"
                    className="w-16 h-12 object-cover rounded border border-slate-300"
                  />
                  <span className="text-xs text-slate-500 font-mono truncate max-w-xs">{curQ.imageUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateCurrentQuestion({ imageUrl: '' })}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1"
                >
                  Xóa ảnh
                </button>
              </div>
            )}

            {/* Answer Options Configuration for all 7 Types */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Cấu hình đáp án & Tiêu chí chấm</label>
                <span className="text-[11px] text-slate-400">
                  {curQ.type === 'TNn'
                    ? 'Tích chọn vào các ô checkbox là đáp án đúng.'
                    : curQ.type === 'DS'
                    ? 'Chọn Đúng hoặc Sai làm đáp án chuẩn.'
                    : curQ.type === 'DIEN'
                    ? 'Nhập từ khóa hoặc thuật ngữ cần điền vào ô bên dưới.'
                    : curQ.type === 'XEP'
                    ? 'Sử dụng nút mũi tên ↑ ↓ để định hình thứ tự chuẩn của quy trình.'
                    : curQ.type === 'GHEP'
                    ? 'Nhập cặp tương ứng giữa Cột A và Cột B.'
                    : curQ.type === 'HOTSPOT'
                    ? 'Xác định tên vùng thao tác / tọa độ trên hình ảnh giao diện.'
                    : 'Chọn radio vào đáp án đúng duy nhất.'}
                </span>
              </div>

              {/* DẠNG 1 & 2: TN1 & TNn */}
              {(curQ.type === 'TN1' || curQ.type === 'TNn') && (
                <div className="space-y-2">
                  {curQ.options.map((opt, optIdx) => (
                    <div
                      key={opt.id || optIdx}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition ${
                        opt.isCorrect ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(optIdx)}
                        className={`w-5 h-5 ${
                          curQ.type === 'TNn' ? 'rounded-md' : 'rounded-full'
                        } flex items-center justify-center border transition shrink-0 ${
                          opt.isCorrect
                            ? 'bg-[#1677ff] border-[#1677ff] text-white'
                            : 'border-slate-300 bg-white hover:border-blue-400'
                        }`}
                      >
                        {opt.isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <span className="text-xs font-bold text-slate-600 w-4 shrink-0">{opt.label}</span>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOption(optIdx, { text: e.target.value })}
                        placeholder={`Nội dung lựa chọn ${opt.label}...`}
                        className="flex-1 text-xs text-slate-800 bg-white border border-slate-200 focus:border-[#1677ff] rounded-md px-3 py-1.5 outline-hidden transition"
                      />

                      <input
                        type="text"
                        value={opt.imageUrl || ''}
                        onChange={(e) => handleUpdateOption(optIdx, { imageUrl: e.target.value })}
                        placeholder="URL ảnh (tùy chọn)"
                        className="w-40 text-xs text-slate-500 bg-white border border-slate-200 focus:border-[#1677ff] rounded-md px-2.5 py-1.5 outline-hidden transition hidden md:block"
                      />

                      <button
                        type="button"
                        onClick={() => handleDeleteOption(optIdx)}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded transition shrink-0"
                        title="Xóa lựa chọn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#1677ff] hover:text-[#4096ff] bg-blue-50/50 hover:bg-blue-50 border border-dashed border-blue-200 px-3 py-1.5 rounded-md transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm đáp án</span>
                  </button>
                </div>
              )}

              {/* DẠNG 3: Đ/S (Đúng / Sai) */}
              {curQ.type === 'DS' && (
                <div className="grid grid-cols-2 gap-4">
                  {curQ.options.map((opt, optIdx) => (
                    <div
                      key={opt.id}
                      onClick={() => handleSetCorrectOption(optIdx)}
                      className={`p-4 rounded-xl border text-center cursor-pointer transition ${
                        opt.isCorrect
                          ? 'border-[#1677ff] bg-blue-50/80 shadow-xs ring-2 ring-blue-300'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-800">{opt.text}</span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {opt.isCorrect ? '✓ Được chọn làm đáp án đúng' : 'Nhấp để đặt làm đáp án đúng'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* DẠNG 4: DIEN (Điền từ) */}
              {curQ.type === 'DIEN' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Từ khóa / Thuật ngữ chính xác cần điền vào ô trống:
                  </label>
                  <input
                    type="text"
                    value={curQ.correctBlankWord || ''}
                    onChange={(e) => handleUpdateCurrentQuestion({ correctBlankWord: e.target.value })}
                    placeholder="VD: SLA 24h hoặc Chỉ số KPI"
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md px-3 py-2 outline-hidden focus:border-[#1677ff]"
                  />
                  <p className="text-[11px] text-slate-400">
                    Thí sinh sẽ được chấm điểm đúng khi nhập chuỗi văn bản trùng khớp (không phân biệt hoa/thường).
                  </p>
                </div>
              )}

              {/* DẠNG 5: XEP (Sắp xếp thứ tự) */}
              {curQ.type === 'XEP' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Thiết lập trình tự chuẩn của các bước (Dùng mũi tên ↑ ↓ để di chuyển vị trí):
                  </p>
                  {curQ.options.map((opt, optIdx) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {optIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOption(optIdx, { text: e.target.value })}
                        placeholder={`Mô tả bước ${optIdx + 1}...`}
                        className="flex-1 text-xs bg-white border border-slate-200 rounded px-2.5 py-1.5 outline-hidden"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={optIdx === 0}
                          onClick={() => handleMoveOptionOrder(optIdx, 'up')}
                          className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                          title="Lên trên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={optIdx === curQ.options.length - 1}
                          onClick={() => handleMoveOptionOrder(optIdx, 'down')}
                          className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                          title="Xuống dưới"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm bước mới
                  </button>
                </div>
              )}

              {/* DẠNG 6: GHEP (Ghép cặp) */}
              {curQ.type === 'GHEP' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600 px-1">
                    <span>Mục ở Cột A</span>
                    <span>Nội dung tương ứng ở Cột B</span>
                  </div>
                  {curQ.options.map((opt, optIdx) => (
                    <div key={opt.id} className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleUpdateOption(optIdx, { text: e.target.value })}
                        placeholder={`Mục A${optIdx + 1}...`}
                        className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={opt.matchTarget || ''}
                          onChange={(e) => handleUpdateOption(optIdx, { matchTarget: e.target.value })}
                          placeholder={`Khái niệm tương ứng B${optIdx + 1}...`}
                          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(optIdx)}
                          className="text-slate-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm cặp ghép nối
                  </button>
                </div>
              )}

              {/* DẠNG 7: HOTSPOT (Điểm ảnh) */}
              {curQ.type === 'HOTSPOT' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Vùng thao tác chuẩn cần nhấp trên hình ảnh (Hotspot Zone):
                  </label>
                  <input
                    type="text"
                    value={curQ.hotspotZone || ''}
                    onChange={(e) => handleUpdateCurrentQuestion({ hotspotZone: e.target.value })}
                    placeholder="VD: Nút 'Ký duyệt SLA' trên thanh công cụ trên cùng"
                    className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md px-3 py-2 outline-hidden focus:border-[#1677ff]"
                  />
                  <p className="text-[11px] text-slate-400">
                    Vui lòng tải lên ảnh giao diện quy trình ở ô "URL ảnh" bên trên để thí sinh quan sát và nhấp chọn.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* COLUMN 3: QUESTION CONFIGURATION (RIGHT) */}
          <aside className="w-80 bg-slate-50/60 overflow-y-auto p-5 flex flex-col space-y-4 shrink-0">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200">
              Cấu hình câu hỏi
            </h3>

            {/* Question Type Selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Loại câu hỏi</label>
              <select
                value={curQ.type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  handleUpdateCurrentQuestion({ type: newType });
                }}
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md px-3 py-2 outline-hidden focus:border-[#1677ff]"
              >
                {QUESTION_TYPES_CONFIG.map((cfg) => (
                  <option key={cfg.type} value={cfg.type}>
                    {cfg.name} ({cfg.code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal bg-white p-2 rounded border border-slate-100">
                {typeCfg.desc}
              </p>
            </div>

            {/* Points */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Điểm số</label>
              <input
                type="number"
                min={1}
                max={100}
                value={curQ.points}
                onChange={(e) => handleUpdateCurrentQuestion({ points: Number(e.target.value) || 1 })}
                className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-md px-3 py-1.5 outline-hidden focus:border-[#1677ff]"
              />
            </div>

            {/* Feedback Correct */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Feedback khi đúng</label>
              <textarea
                rows={2}
                value={curQ.feedbackCorrect || ''}
                onChange={(e) => handleUpdateCurrentQuestion({ feedbackCorrect: e.target.value })}
                placeholder="VD: Chính xác! Rất tốt."
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md p-2.5 outline-hidden focus:border-[#1677ff]"
              />
            </div>

            {/* Feedback Wrong */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Feedback khi sai</label>
              <textarea
                rows={2}
                value={curQ.feedbackWrong || ''}
                onChange={(e) => handleUpdateCurrentQuestion({ feedbackWrong: e.target.value })}
                placeholder="VD: Chưa đúng. Hãy xem lại trang 12."
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md p-2.5 outline-hidden focus:border-[#1677ff]"
              />
            </div>

            {/* Explanation / Notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Ghi chú / Giải thích</label>
              <textarea
                rows={3}
                value={curQ.explanation || ''}
                onChange={(e) => handleUpdateCurrentQuestion({ explanation: e.target.value })}
                placeholder="Giải thích chi tiết căn cứ đáp án theo chuẩn quy trình SOP..."
                className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-md p-2.5 outline-hidden focus:border-[#1677ff]"
              />
            </div>
          </aside>
        </div>

        {/* PREVIEW MODAL */}
        {previewModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scaleUp">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-800">
                    Preview: {currentEditingSet.title} (Giao diện thí sinh)
                  </span>
                </div>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold ${typeCfg.badgeBg} ${typeCfg.badgeText}`}>
                    {typeCfg.code}
                  </span>
                  <span className="font-bold text-slate-700">Câu {activeQuestionIdx + 1}:</span>
                  <div
                    className="text-slate-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: curQ.content || 'Nội dung câu hỏi mẫu' }}
                  />
                </div>

                {curQ.imageUrl && (
                  <div className="my-2">
                    <img src={curQ.imageUrl} alt="Diagram" className="max-h-52 rounded border border-slate-200 mx-auto" />
                  </div>
                )}

                <div className="space-y-2 pl-4">
                  {curQ.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        opt.isCorrect ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-600">{opt.label}.</span>
                        <span className="text-slate-800">{opt.text || `Lựa chọn ${opt.label}`}</span>
                      </div>
                      {opt.isCorrect && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Đáp án đúng
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {curQ.explanation && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-xs text-amber-900">
                    <strong>Giải thích:</strong> {curQ.explanation}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
                >
                  Đóng Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- VIEW 2: MAIN LIST TABS (EXAMS & QUESTION SETS) ----------------
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans select-none animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
            Ngân hàng câu hỏi & Đề thi
          </h1>
        </div>

        {/* Process & Version Filter Bar */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 outline-hidden shadow-2xs font-medium"
          >
            <option value="proc-no1">No1 - Quy trình thử nghiệm</option>
            <option value="proc-kpi">Quy trình Đánh giá KPI & Thẻ điểm BSC</option>
            <option value="proc-sla">Quy trình Cam kết Thời gian SLA Mua sắm</option>
          </select>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 shadow-2xs font-medium">
            <span>Draft mặc định</span>
            <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded border border-slate-200">
              Draft
            </span>
          </div>

          <button
            onClick={fetchData}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg shadow-2xs transition"
            title="Làm mới dữ liệu"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {activeTab === 'EXAMS' ? (
            <button
              onClick={handleOpenCreateTestDrawer}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề thi</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenEditor()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bộ câu hỏi</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('QUESTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition ${
            activeTab === 'QUESTIONS'
              ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Ngân hàng câu hỏi</span>
        </button>

        <button
          onClick={() => setActiveTab('EXAMS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition ${
            activeTab === 'EXAMS'
              ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4 text-slate-500" />
          <span>Đề thi</span>
        </button>
      </div>

      {/* TAB CONTENT 1: ĐỀ THI (EXAMS) */}
      {activeTab === 'EXAMS' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-5">Tên đề thi</th>
                <th className="py-3 px-5 text-center">Cấu hình</th>
                <th className="py-3 px-5 text-center">Người đã mời</th>
                <th className="py-3 px-5 text-center">Trạng thái</th>
                <th className="py-3 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {examTests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có đề thi nào được tạo. Nhấp "Tạo đề thi" để bắt đầu.
                  </td>
                </tr>
              ) : (
                examTests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-5 font-bold text-slate-800">{t.title}</td>

                    {/* Cấu hình tags */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-50 text-sky-600 border border-sky-200 rounded">
                          {t.totalQuestions} câu
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 rounded">
                          {t.durationMinutes} phút
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">
                          {t.passingScore}/{t.maxScore} điểm
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                          {t.title}
                        </span>
                      </div>
                    </td>

                    {/* Người đã mời */}
                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-md">
                        {t.invitedCount || 0}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full">
                        {t.status === 'OPEN' ? 'Đang mở' : 'Đóng'}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button
                          onClick={() => {
                            setTestForm({
                              title: t.title,
                              status: t.status === 'OPEN' ? 'OPEN' : 'CLOSED',
                              processId: t.processId,
                              processTitle: t.processTitle,
                              questionSetId: t.questionSetId || '',
                              description: t.description || '',
                              totalQuestions: t.totalQuestions,
                              durationMinutes: t.durationMinutes,
                              maxAttempts: t.maxAttempts,
                              maxScore: t.maxScore,
                              passingScore: t.passingScore,
                              questionOrder: t.questionOrder,
                              displayMode: t.displayMode,
                              passingNote: t.passingNote || '',
                            });
                            setIsCreateTestDrawerOpen(true);
                          }}
                          className="hover:text-blue-600 p-1 transition"
                          title="Sửa đề thi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTest(t.id)}
                          className="hover:text-rose-600 p-1 transition"
                          title="Xóa đề thi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs text-slate-500">
            <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-6 h-6 flex items-center justify-center rounded border border-[#1677ff] text-[#1677ff] font-bold font-mono">
              1
            </span>
            <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: NGÂN HÀNG CÂU HỎI (QUESTION SETS) */}
      {activeTab === 'QUESTIONS' && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-5">Tên bộ câu hỏi</th>
                <th className="py-3 px-5">Quy trình</th>
                <th className="py-3 px-5 text-center">Số câu</th>
                <th className="py-3 px-5 text-center">Tổng điểm</th>
                <th className="py-3 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questionSets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có bộ câu hỏi nào. Nhấp "Tạo bộ câu hỏi" để bắt đầu soạn.
                  </td>
                </tr>
              ) : (
                questionSets.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition group">
                    <td
                      onClick={() => handleOpenEditor(s)}
                      className="py-3.5 px-5 font-bold text-[#1677ff] hover:underline cursor-pointer"
                    >
                      {s.title}
                    </td>

                    <td className="py-3.5 px-5 text-slate-600">
                      <span className="px-2.5 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded">
                        {s.processTitle}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded">
                        {s.totalQuestions}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-center">
                      <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                        {s.totalPoints} đ
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditor(s)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-md shadow-2xs transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Soạn thảo</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSet(s.id)}
                          className="text-slate-300 hover:text-rose-600 p-1.5 rounded transition"
                          title="Xóa bộ câu hỏi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs text-slate-500">
            <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-6 h-6 flex items-center justify-center rounded border border-[#1677ff] text-[#1677ff] font-bold font-mono">
              1
            </span>
            <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: TẠO ĐỀ THI (DRAWER FROM RIGHT) */}
      {isCreateTestDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsCreateTestDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col animate-slideLeft">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreateTestDrawerOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Tạo đề thi</h2>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveTest} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
                {/* SECTION 1: ĐỀ THI */}
                <div className="space-y-4">
                  <div className="text-center font-bold text-[11px] text-slate-400 uppercase tracking-widest relative">
                    <span className="bg-white px-3 relative z-10">ĐỀ THI</span>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-200 -z-0" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Tên đề thi *</label>
                    <input
                      type="text"
                      required
                      value={testForm.title}
                      onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                      placeholder="VD: Kiểm tra nghiệp vụ mua hàng"
                      className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-md focus:bg-white focus:border-[#1677ff] outline-hidden transition"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Trạng thái (optional)</span>
                    <button
                      type="button"
                      onClick={() =>
                        setTestForm({ ...testForm, status: testForm.status === 'OPEN' ? 'CLOSED' : 'OPEN' })
                      }
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                        testForm.status === 'OPEN'
                          ? 'bg-[#1677ff] text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <span>{testForm.status === 'OPEN' ? 'Đang mở' : 'Đóng'}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                          testForm.status === 'OPEN' ? 'translate-x-1' : '-translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Quy trình (optional)</label>
                      <select
                        value={testForm.processId}
                        onChange={(e) => setTestForm({ ...testForm, processId: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                      >
                        <option value="proc-no1">No1 - Quy trình thử nghiệm</option>
                        <option value="proc-kpi">Quy trình Đánh giá KPI</option>
                        <option value="proc-sla">Quy trình Quản lý SLA</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Bộ câu hỏi (optional)</label>
                      <select
                        value={testForm.questionSetId}
                        onChange={(e) => setTestForm({ ...testForm, questionSetId: e.target.value })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                      >
                        <option value="">Tất cả bộ câu hỏi của quy trình</option>
                        {questionSets.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.totalQuestions} câu)
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400">Để trống = lấy từ tất cả bộ của quy trình</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Mô tả (optional)</label>
                    <textarea
                      rows={2}
                      value={testForm.description}
                      onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                      placeholder="Mô tả ngắn về đề thi"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                    />
                  </div>
                </div>

                {/* SECTION 2: QUY TẮC LÀM BÀI */}
                <div className="space-y-4 pt-2">
                  <div className="text-center font-bold text-[11px] text-slate-400 uppercase tracking-widest relative">
                    <span className="bg-white px-3 relative z-10">QUY TẮC LÀM BÀI</span>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-200 -z-0" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Số câu hỏi</label>
                      <input
                        type="number"
                        min={1}
                        value={testForm.totalQuestions}
                        onChange={(e) => setTestForm({ ...testForm, totalQuestions: Number(e.target.value) || 1 })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff] font-mono text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Thời gian (phút)</label>
                      <input
                        type="number"
                        min={0}
                        value={testForm.durationMinutes}
                        onChange={(e) => setTestForm({ ...testForm, durationMinutes: Number(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff] font-mono text-center"
                      />
                      <p className="text-[10px] text-slate-400 text-center">0 = không giới hạn</p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Số lần thi</label>
                      <input
                        type="number"
                        min={0}
                        value={testForm.maxAttempts}
                        onChange={(e) => setTestForm({ ...testForm, maxAttempts: Number(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff] font-mono text-center"
                      />
                      <p className="text-[10px] text-slate-400 text-center">0 = không giới hạn</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Điểm tối đa</label>
                      <input
                        type="number"
                        value={testForm.maxScore}
                        onChange={(e) => setTestForm({ ...testForm, maxScore: Number(e.target.value) || 100 })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff] font-mono text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Điểm đạt (≥)</label>
                      <input
                        type="number"
                        value={testForm.passingScore}
                        onChange={(e) => setTestForm({ ...testForm, passingScore: Number(e.target.value) || 70 })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff] font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: TRÌNH BÀY CÂU HỎI */}
                <div className="space-y-4 pt-2">
                  <div className="text-center font-bold text-[11px] text-slate-400 uppercase tracking-widest relative">
                    <span className="bg-white px-3 relative z-10">TRÌNH BÀY CÂU HỎI</span>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-200 -z-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Thứ tự câu hỏi</label>
                      <select
                        value={testForm.questionOrder}
                        onChange={(e) =>
                          setTestForm({ ...testForm, questionOrder: e.target.value as 'SHUFFLE' | 'SEQUENTIAL' })
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                      >
                        <option value="SHUFFLE">Xáo trộn câu hỏi</option>
                        <option value="SEQUENTIAL">Theo thứ tự tạo</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">Hiển thị câu hỏi</label>
                      <select
                        value={testForm.displayMode}
                        onChange={(e) =>
                          setTestForm({ ...testForm, displayMode: e.target.value as 'ALL_STEPS' | 'BY_STEP' })
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                      >
                        <option value="ALL_STEPS">Câu hỏi của tất cả các bước</option>
                        <option value="BY_STEP">Theo từng bước</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Ghi chú ngưỡng đạt (optional)</label>
                    <textarea
                      rows={2}
                      value={testForm.passingNote}
                      onChange={(e) => setTestForm({ ...testForm, passingNote: e.target.value })}
                      placeholder="Mô tả ngưỡng đạt (tùy chọn)"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setIsCreateTestDrawerOpen(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-md transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white font-semibold rounded-md shadow-xs transition"
                  >
                    Tạo mới
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
