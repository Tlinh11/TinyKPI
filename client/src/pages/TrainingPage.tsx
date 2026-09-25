import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  FileText,
  Search,
} from 'lucide-react';
import { api } from '../api/client.js';

interface Lesson {
  title: string;
  duration: string;
  content?: string;
}

interface TrainingCourse {
  id: string;
  title: string;
  code: string;
  category: string;
  description?: string;
  duration: string;
  lessons: Lesson[];
}

export const TrainingPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<{ [key: string]: boolean }>({});

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/training/courses');
      if (res.data?.success) {
        setCourses(res.data.data || []);
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

  const handleOpenCourse = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setActiveLessonIdx(0);
  };

  const toggleLessonDone = (idx: number) => {
    if (!selectedCourse) return;
    const key = `${selectedCourse.id}-${idx}`;
    setCompletedLessons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>ĐÀO TẠO & HỌC TẬP TRỰC TUYẾN</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Thư viện Giáo trình & Khóa học TinyKPI</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cung cấp bài giảng chuẩn hóa về quy trình nghiệp vụ, phương pháp luận BSC và chuẩn cam kết SLA.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('/exams')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Đến phòng Thi Sát Hạch</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học theo tên, phân loại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-hidden"
          />
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">Đang tải danh mục khóa học...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-6 flex flex-col justify-between space-y-4 group border-t-4 border-t-blue-600"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {course.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-bold">{course.code}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                  {course.description || 'Khóa học cung cấp kiến thức nền tảng và hướng dẫn thực thi.'}
                </p>

                {/* Lessons summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.lessons?.length || 0} bài học</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.duration}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleOpenCourse(course)}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Vào học ngay</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Course Lesson Player Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[650px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleIn">
            {/* Top Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {selectedCourse.category}
                </span>
                <h2 className="text-sm font-bold text-slate-900">{selectedCourse.title}</h2>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Content: Player (Left) & Lessons List (Right) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
              {/* Left Lesson Viewer (2 Cols) */}
              <div className="md:col-span-2 p-6 overflow-y-auto space-y-4 bg-white flex flex-col justify-between">
                <div>
                  <div className="aspect-video bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-800 rounded-xl flex items-center justify-center text-white relative shadow-inner overflow-hidden">
                    <div className="text-center space-y-2 p-4">
                      <PlayCircle className="w-14 h-14 mx-auto text-blue-400/90 hover:scale-110 transition cursor-pointer" />
                      <div className="text-xs font-bold text-slate-200">
                        {selectedCourse.lessons[activeLessonIdx]?.title}
                      </div>
                      <span className="text-[10px] text-blue-300">
                        Thời lượng: {selectedCourse.lessons[activeLessonIdx]?.duration}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedCourse.lessons[activeLessonIdx]?.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Nội dung bài học hướng dẫn chi tiết quy chuẩn vận hành, cách phối hợp các phòng ban và tuân thủ các quy tắc cốt lõi của TinyKPI.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setActiveLessonIdx((prev) => Math.max(0, prev - 1))}
                    disabled={activeLessonIdx === 0}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    Bài trước
                  </button>

                  <button
                    onClick={() => toggleLessonDone(activeLessonIdx)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
                      completedLessons[`${selectedCourse.id}-${activeLessonIdx}`]
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {completedLessons[`${selectedCourse.id}-${activeLessonIdx}`]
                        ? 'Đã hoàn thành'
                        : 'Đánh dấu đã học'}
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveLessonIdx((prev) =>
                        Math.min((selectedCourse.lessons?.length || 1) - 1, prev + 1)
                      )
                    }
                    disabled={activeLessonIdx === (selectedCourse.lessons?.length || 1) - 1}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-40"
                  >
                    Bài tiếp theo
                  </button>
                </div>
              </div>

              {/* Right Playlist (1 Col) */}
              <div className="bg-slate-50 border-l border-slate-100 p-4 overflow-y-auto space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Danh sách bài học
                </div>

                {selectedCourse.lessons.map((lesson, idx) => {
                  const isCurrent = idx === activeLessonIdx;
                  const isDone = completedLessons[`${selectedCourse.id}-${idx}`];
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveLessonIdx(idx)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                        isCurrent
                          ? 'border-blue-500 bg-white shadow-xs font-bold text-blue-900 ring-1 ring-blue-400'
                          : 'border-slate-200 hover:bg-white text-slate-700'
                      }`}
                    >
                      <span className="w-5 text-center font-bold text-slate-400 shrink-0">{idx + 1}</span>
                      <div className="flex-1">
                        <div className="line-clamp-2 leading-snug">{lesson.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-normal mt-1">
                          <span>{lesson.duration}</span>
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
