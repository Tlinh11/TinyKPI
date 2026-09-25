import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  X,
  Workflow,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api/client.js';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIdx: number;
  explanation?: string;
  process?: { title: string; code?: string };
}

export const ExamBankPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctIdx: 0,
    explanation: '',
  });

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/exams/questions');
      if (res.data?.success) {
        setQuestions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim()) return;

    try {
      const res = await api.post('/api/exams/questions', formData);
      if (res.data?.success) {
        setShowModal(false);
        setFormData({ question: '', options: ['', '', '', ''], correctIdx: 0, explanation: '' });
        fetchQuestions();
      }
    } catch (err) {
      console.error('Failed to create question:', err);
    }
  };

  const filteredQuestions = questions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.explanation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 mb-1">
            <ListTodo className="w-4 h-4" />
            <span>NGÂN HÀNG CÂU HỎI & KHẢO THÍ SOP</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ngân hàng Đề thi & Câu hỏi Quy trình</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị các câu hỏi sát hạch kiến thức quy trình lõi, chuẩn hóa vận hành TinyKPI.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm câu hỏi mới</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 outline-hidden"
          />
        </div>
      </div>

      {/* Question Cards */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">Đang tải ngân hàng câu hỏi từ Neon DB...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-snug">{q.question}</h3>
                    {q.process && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-semibold mt-1">
                        <Workflow className="w-3 h-3" />
                        <span>{q.process.title}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-9">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = optIdx === q.correctIdx;
                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>
                        <span className="font-mono mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                        {opt}
                      </span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="ml-9 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-800">
                  <span className="font-bold">Giải thích: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}

          {filteredQuestions.length === 0 && (
            <div className="bg-white p-8 text-center text-xs text-slate-400 rounded-xl border border-slate-200">
              Không tìm thấy câu hỏi phù hợp.
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Thêm câu hỏi mới vào ngân hàng đề</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung câu hỏi *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Nhập nội dung câu hỏi khảo thí..."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Các phương án trả lời *</label>
                {formData.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 text-center font-bold text-xs text-slate-500">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Phương án ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...formData.options];
                        newOpts[i] = e.target.value;
                        setFormData({ ...formData, options: newOpts });
                      }}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                    />
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={formData.correctIdx === i}
                      onChange={() => setFormData({ ...formData, correctIdx: i })}
                      title="Chọn phương án đúng"
                      className="w-4 h-4 text-blue-600"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giải thích đáp án</label>
                <input
                  type="text"
                  placeholder="Giải thích lý do phương án đúng..."
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
                >
                  Lưu câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
