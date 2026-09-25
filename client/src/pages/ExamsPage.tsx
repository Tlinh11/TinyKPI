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
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/client.js';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIdx: number;
  explanation?: string;
}

interface SubmissionHistory {
  id: string;
  score: number;
  total: number;
  passed: boolean;
  duration: number;
  createdAt: string;
  user?: { fullName: string };
}

export const ExamsPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [history, setHistory] = useState<SubmissionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam taking state
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);

  const fetchQuestionsAndHistory = async () => {
    try {
      setLoading(true);
      const [qRes, hRes] = await Promise.all([
        api.get('/api/exams/questions'),
        api.get('/api/exams/history'),
      ]);
      if (qRes.data?.success) setQuestions(qRes.data.data || []);
      if (hRes.data?.success) setHistory(hRes.data.data || []);
    } catch (err) {
      console.error('Failed to load exam data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndHistory();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isExamStarted || examResult) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExamStarted, examResult, answers]);

  const handleStartExam = () => {
    setAnswers({});
    setCurrentQIdx(0);
    setTimeLeft(15 * 60);
    setExamResult(null);
    setIsExamStarted(true);
  };

  const handleSelectAnswer = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmitExam = async () => {
    try {
      setIsSubmitting(true);
      const res = await api.post('/api/exams/submit', {
        answers,
        duration: 15 * 60 - timeLeft,
      });
      if (res.data?.success) {
        setExamResult(res.data.data);
        setIsExamStarted(false);
        fetchQuestionsAndHistory();
      }
    } catch (err) {
      console.error('Failed to submit exam:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 mb-1">
            <Award className="w-4 h-4" />
            <span>KHẢO THÍ & ĐÁNH GIÁ NĂNG LỰC QUY TRÌNH</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kỳ thi Sát hạch Quy trình Lõi (SOP)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Đánh giá mức độ thấu hiểu và tuân thủ quy trình vận hành tiêu chuẩn trong toàn doanh nghiệp.
          </p>
        </div>

        {!isExamStarted && (
          <button
            onClick={handleStartExam}
            disabled={questions.length === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>Bắt đầu thi ngay</span>
          </button>
        )}
      </div>

      {/* Main Area */}
      {isExamStarted ? (
        /* ACTIVE EXAM INTERFACE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fadeIn">
          {/* Top Bar: Progress and Timer */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Câu hỏi {currentQIdx + 1} / {questions.length}
              </span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                Bài thi Quy trình Vận hành Chuẩn TinyKPI
              </div>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-1.5 rounded-xl text-sm font-bold font-mono">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Question Box */}
          {questions[currentQIdx] && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 leading-relaxed">
                {questions[currentQIdx].question}
              </h2>

              <div className="space-y-2.5">
                {questions[currentQIdx].options.map((opt, optIdx) => {
                  const isSelected = answers[questions[currentQIdx].id] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectAnswer(questions[currentQIdx].id, optIdx)}
                      className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold ring-1 ring-blue-500'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentQIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentQIdx === 0}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
            >
              Câu trước
            </button>

            <div className="flex items-center gap-1.5">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIdx(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    currentQIdx === i
                      ? 'bg-blue-600 text-white'
                      : answers[q.id] !== undefined
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentQIdx < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Câu tiếp theo
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
              >
                {isSubmitting ? 'Đang nộp bài...' : 'Nộp bài thi'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* EXAM INTRO & HISTORY */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Exam Info Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">Quy chế Bài thi Sát hạch</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bài kiểm tra đánh giá mức độ am hiểu quy trình làm việc, tiêu chuẩn dịch vụ SLA và các bước thực thi chiến lược BSC.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Số lượng câu hỏi:</span>
                <span className="font-bold">{questions.length} câu trắc nghiệm</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Thời gian làm bài:</span>
                <span className="font-bold">15 phút</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Điểm đạt tối thiểu:</span>
                <span className="font-bold text-emerald-600">7.0 / 10.0</span>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              className="w-full py-2.5 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Bắt đầu thi sát hạch</span>
            </button>
          </div>

          {/* Exam History */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <span>Lịch sử Khảo thí Gần đây</span>
              </h2>
              <span className="text-xs text-slate-500">{history.length} lượt thi</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nhân sự dự thi</th>
                  <th className="py-3 px-3">Thời gian thi</th>
                  <th className="py-3 px-3">Thời lượng</th>
                  <th className="py-3 px-3">Điểm số</th>
                  <th className="py-3 px-4 text-right">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{h.user?.fullName || 'Người dùng'}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(h.createdAt).toLocaleDateString('vi-VN')} {new Date(h.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{h.duration}s</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{h.score} / 10</td>
                    <td className="py-3 px-4 text-right">
                      {h.passed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ĐẠT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <XCircle className="w-3.5 h-3.5" />
                          CHƯA ĐẠT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Chưa có lượt thi nào được ghi nhận. Hãy là người đầu tiên tham gia bài thi!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {examResult && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-scaleIn">
            <div
              className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center font-bold ${
                examResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}
            >
              {examResult.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {examResult.passed ? 'Chúc mừng! Bạn đã ĐẠT bài thi' : 'Rất tiếc! Chưa đạt yêu cầu'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {examResult.passed
                  ? 'Bạn đã hoàn thành xuất sắc bài sát hạch quy trình vận hành.'
                  : 'Hãy ôn tập lại tài liệu giáo trình và thử lại sau.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-around">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Điểm số</div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{examResult.score} / 10</div>
              </div>
              <div className="border-r border-slate-200" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Số câu đúng</div>
                <div className="text-2xl font-black text-blue-600 mt-0.5">
                  {examResult.correctCount} / {examResult.total}
                </div>
              </div>
            </div>

            <button
              onClick={() => setExamResult(null)}
              className="w-full py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              Đóng kết quả
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
