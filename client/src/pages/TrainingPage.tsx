import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  Search,
  Plus,
  RotateCw,
  Edit3,
  Trash2,
  Video,
  Layers,
  Sparkles,
  Award,
  ArrowRight,
  AlertCircle,
  Inbox,
  Check,
} from 'lucide-react';
import { api } from '../api/client.js';

interface LessonItem {
  id: string;
  orderNum: number;
  title: string;
  type: 'TEXT' | 'VIDEO' | 'PDF';
  duration: string;
  content?: string;
  mediaUrl?: string;
  isCompleted?: boolean;
}

interface TrainingCourseItem {
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

export const TrainingPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  // Mode: Quản lý giáo trình (Admin/Manager) OR Học giáo trình (Learner)
  const [activeMode, setActiveMode] = useState<'MANAGE' | 'LEARN'>('MANAGE');

  const [courses, setCourses] = useState<TrainingCourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState('proc-no1');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('course-test-01');

  // Accordion state
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>('les-01');

  // Add / Edit Lesson Modal
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    type: 'TEXT' as 'TEXT' | 'VIDEO' | 'PDF',
    duration: '~5 phút',
    content: '',
    mediaUrl: '',
  });

  // Learner state
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/training/courses');
      if (res.data?.success) {
        const list = res.data.data || [];
        setCourses(list);
        if (list.length > 0 && !selectedCourseId) {
          setSelectedCourseId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch training courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Lesson handlers
  const handleOpenAddLessonModal = (lesson?: LessonItem) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonFormData({
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        content: lesson.content || '',
        mediaUrl: lesson.mediaUrl || '',
      });
    } else {
      setEditingLesson(null);
      const nextNum = (selectedCourse?.lessons?.length || 0) + 1;
      setLessonFormData({
        title: `${nextNum}. Bài học mới`,
        type: 'TEXT',
        duration: '~5 phút',
        content: '',
        mediaUrl: '',
      });
    }
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    let updatedLessons = [...(selectedCourse.lessons || [])];

    if (editingLesson) {
      updatedLessons = updatedLessons.map((l) =>
        l.id === editingLesson.id ? { ...l, ...lessonFormData } : l
      );
    } else {
      const newLesson: LessonItem = {
        id: `les-${Date.now()}`,
        orderNum: updatedLessons.length + 1,
        title: lessonFormData.title,
        type: lessonFormData.type,
        duration: lessonFormData.duration,
        content: lessonFormData.content,
        mediaUrl: lessonFormData.mediaUrl,
        isCompleted: false,
      };
      updatedLessons.push(newLesson);
    }

    try {
      const res = await api.put(`/api/training/courses/${selectedCourse.id}`, {
        ...selectedCourse,
        lessons: updatedLessons,
        lessonsCount: updatedLessons.length,
      });
      if (res.data?.success) {
        setIsLessonModalOpen(false);
        fetchCourses();
      }
    } catch (err: any) {
      alert('Lỗi lưu bài học: ' + err.message);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài học này?')) return;
    if (!selectedCourse) return;

    const updatedLessons = selectedCourse.lessons.filter((l) => l.id !== lessonId);
    try {
      await api.put(`/api/training/courses/${selectedCourse.id}`, {
        ...selectedCourse,
        lessons: updatedLessons,
        lessonsCount: updatedLessons.length,
      });
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkCompleted = async (lessonId: string) => {
    if (!selectedCourse) return;
    try {
      const res = await api.post(`/api/training/courses/${selectedCourse.id}/lessons/${lessonId}/complete`);
      if (res.data?.success) {
        fetchCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans select-none animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
            Quản lý & Học giáo trình Quy trình
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chuẩn hóa hệ thống tài liệu đào tạo SOP, theo dõi tiến độ nhân sự và kết nối trực tiếp với bài thi sát hạch.
          </p>
        </div>

        {/* Process & Version Bar */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="text-xs text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 outline-hidden shadow-2xs font-medium"
          >
            <option value="proc-no1">No1 - Quy trình thử nghiệm</option>
            <option value="proc-kpi">Quy trình Đánh giá KPI</option>
            <option value="proc-sla">Quy trình Quản lý SLA</option>
          </select>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 shadow-2xs font-medium">
            <span>Draft mặc định</span>
            <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded border border-slate-200">
              Draft
            </span>
          </div>

          <button
            onClick={fetchCourses}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg shadow-2xs transition"
            title="Làm mới dữ liệu"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {activeMode === 'MANAGE' && (
            <button
              onClick={() => handleOpenAddLessonModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bài học mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveMode('MANAGE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition ${
            activeMode === 'MANAGE'
              ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Quản lý giáo trình (Admin / SOP)</span>
        </button>

        <button
          onClick={() => setActiveMode('LEARN')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition ${
            activeMode === 'LEARN'
              ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span>Học giáo trình (Học viên)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: QUẢN LÝ GIÁO TRÌNH (2 COLUMNS MATCHING SCREENSHOT) */}
      {/* ======================================================== */}
      {activeMode === 'MANAGE' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT COLUMN: DANH SÁCH GIÁO TRÌNH (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh sách giáo trình ({courses.length})
            </h2>

            <div className="space-y-2">
              {courses.map((course) => {
                const isSelected = course.id === selectedCourse?.id;
                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-white border-[#1677ff] shadow-md ring-1 ring-blue-100'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-semibold text-slate-400">{course.code}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 rounded">
                        Nháp
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mt-1 leading-snug">{course.title}</h3>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {course.lessonsCount || course.lessons?.length || 0} bài học
                      </span>
                      <span className="font-mono font-bold text-slate-600">{course.progressPercent}% hoàn thành</span>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-[#1677ff] h-full transition-all duration-300"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: ACCORDION BÀI HỌC (8 cols) */}
          <div className="md:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {selectedCourse?.title || 'Chi tiết giáo trình'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Quy trình: {selectedCourse?.processTitle} • {selectedCourse?.version}
                </p>
              </div>

              <button
                onClick={() => handleOpenAddLessonModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1677ff] bg-blue-50/70 hover:bg-blue-100 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm bài học</span>
              </button>
            </div>

            {/* Lesson Accordion List */}
            <div className="space-y-3">
              {(!selectedCourse?.lessons || selectedCourse.lessons.length === 0) ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Giáo trình này chưa có bài học nào. Hãy nhấp "Thêm bài học" để soạn thảo.
                </div>
              ) : (
                selectedCourse.lessons.map((lesson, idx) => {
                  const isExpanded = expandedLessonId === lesson.id;
                  return (
                    <div
                      key={lesson.id || idx}
                      className="border border-slate-200 rounded-xl overflow-hidden transition shadow-2xs"
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                        className="p-3.5 bg-slate-50/80 hover:bg-slate-100/70 flex items-center justify-between cursor-pointer transition select-none"
                      >
                        <div className="flex items-center gap-3">
                          {/* Blue circle number */}
                          <div className="w-7 h-7 rounded-full bg-[#1677ff] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-2xs">
                            {idx + 1}
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-snug">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.2 text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded">
                                {lesson.type === 'VIDEO' ? 'Video' : lesson.type === 'PDF' ? 'PDF' : 'Văn bản'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {lesson.duration || '~5 phút'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddLessonModal(lesson);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="Sửa bài học"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLesson(lesson.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Xóa bài học"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="text-slate-400 ml-1">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Accordion Content Body */}
                      {isExpanded && (
                        <div className="p-5 bg-white border-t border-slate-100 text-xs text-slate-700 space-y-4 animate-fadeIn">
                          {lesson.content ? (
                            <div
                              className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: lesson.content }}
                            />
                          ) : (
                            <p className="text-slate-400 italic">Chưa có nội dung chi tiết cho bài học này.</p>
                          )}

                          {lesson.mediaUrl && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                              <span className="text-slate-600 truncate font-mono">Tài liệu: {lesson.mediaUrl}</span>
                              <a
                                href={lesson.mediaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 font-semibold hover:underline shrink-0 ml-2"
                              >
                                Mở xem
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: HỌC GIÁO TRÌNH (LEARNER VIEW MATCHING SCREENSHOT 2) */}
      {/* ======================================================== */}
      {activeMode === 'LEARN' && (
        <div className="space-y-6">
          {/* Check if user has active course or show authentic Empty State */}
          {!selectedCourse || selectedCourse.lessons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs py-20 px-6 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <BookOpen className="w-10 h-10 stroke-[1.5]" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Chưa có giáo trình đang hoạt động được gán cho bạn
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Vui lòng liên hệ Trưởng bộ phận hoặc Quản trị viên để được cấp quyền học tập theo đúng lộ trình công danh.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Lesson Content Reader */}
              <div className="md:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
                {(() => {
                  const curL = selectedCourse.lessons[activeLessonIdx] || selectedCourse.lessons[0];
                  return (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1677ff] text-white flex items-center justify-center font-bold text-xs">
                            {activeLessonIdx + 1}
                          </span>
                          <h2 className="text-sm font-bold text-slate-800">{curL.title}</h2>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{curL.duration}</span>
                      </div>

                      {/* Content */}
                      <div
                        className="prose prose-sm max-w-none text-slate-700 leading-relaxed text-xs"
                        dangerouslySetInnerHTML={{
                          __html: curL.content || '<p>Chưa có nội dung văn bản cho bài học này.</p>',
                        }}
                      />

                      {/* Action buttons */}
                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => handleMarkCompleted(curL.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                            curL.isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{curL.isCompleted ? 'Đã hoàn thành bài học' : 'Đánh dấu đã hoàn thành'}</span>
                        </button>

                        <button
                          onClick={() => onNavigate ? onNavigate('/exams') : window.location.hash = '/exams'}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-bold rounded-lg shadow-sm transition"
                        >
                          <span>Làm bài kiểm tra quy trình ngay</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Course Progress & Curriculum Navigator */}
              <div className="md:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{selectedCourse.title}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span>Tiến độ học tập</span>
                    <span className="font-bold text-[#1677ff] font-mono">{selectedCourse.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#1677ff] h-full transition-all duration-300"
                      style={{ width: `${selectedCourse.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Các bài học trong khóa ({selectedCourse.lessons.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedCourse.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        onClick={() => setActiveLessonIdx(idx)}
                        className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer text-xs transition border ${
                          activeLessonIdx === idx
                            ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-bold'
                            : 'bg-white border-slate-200/70 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-slate-400">{idx + 1}.</span>
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        {lesson.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: THÊM / SỬA BÀI HỌC GIÁO TRÌNH */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-scaleUp">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
              </h3>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Tiêu đề bài học *</label>
                <input
                  type="text"
                  required
                  value={lessonFormData.title}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                  placeholder="VD: 1. Hướng dẫn tiếp nhận và duyệt báo giá"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:border-[#1677ff] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Loại bài học</label>
                  <select
                    value={lessonFormData.type}
                    onChange={(e) =>
                      setLessonFormData({
                        ...lessonFormData,
                        type: e.target.value as 'TEXT' | 'VIDEO' | 'PDF',
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                  >
                    <option value="TEXT">Văn bản SOP</option>
                    <option value="VIDEO">Video hướng dẫn</option>
                    <option value="PDF">Tài liệu PDF đính kèm</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Thời lượng ước tính</label>
                  <input
                    type="text"
                    value={lessonFormData.duration}
                    onChange={(e) => setLessonFormData({ ...lessonFormData, duration: e.target.value })}
                    placeholder="VD: ~5 phút"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Nội dung chi tiết (HTML)</label>
                <textarea
                  rows={5}
                  value={lessonFormData.content}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, content: e.target.value })}
                  placeholder="Nhập hướng dẫn quy trình chi tiết..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">URL Media / Video (optional)</label>
                <input
                  type="text"
                  value={lessonFormData.mediaUrl}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, mediaUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md outline-hidden focus:border-[#1677ff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white font-semibold rounded-md shadow-xs"
                >
                  Lưu bài học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
