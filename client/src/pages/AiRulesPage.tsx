import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  RotateCw,
  Search,
  Filter,
  Check,
  X,
  Target,
  Zap,
  TrendingUp,
  Users,
  Cpu,
  Building2,
  Briefcase,
  HelpCircle,
  ArrowRight,
  Trash2,
  Compass
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface AiKpiRule {
  id: string;
  industry: string;
  position: string;
  perspective: string;
  suggestedKpi: string;
  formula: string | null;
  unit: string;
  weight: number;
}

const INDUSTRIES = [
  { value: 'ALL', label: 'Tất cả các ngành' },
  { value: 'TECHNOLOGY', label: 'Công nghệ thông tin & Phần mềm' },
  { value: 'RETAIL', label: 'Bán lẻ & Thương mại điện tử' },
  { value: 'MANUFACTURING', label: 'Sản xuất & Chế tạo' },
  { value: 'FINANCE', label: 'Tài chính & Ngân hàng' },
  { value: 'GENERAL', label: 'Tổng hợp / Đa ngành nghề' },
];

const POSITIONS = [
  { value: 'ALL', label: 'Tất cả chức danh' },
  { value: 'CEO', label: 'Tổng Giám Đốc / Ban Điều Hành' },
  { value: 'DEV', label: 'Kỹ sư Phần mềm / IT' },
  { value: 'SALES', label: 'Kinh doanh & Phát triển thị trường' },
  { value: 'HR', label: 'Quản trị Nhân sự & Đào tạo' },
  { value: 'ACCOUNTANT', label: 'Kế toán & Tài chính' },
  { value: 'MARKETING', label: 'Tiếp thị & Truyền thông số' },
];

const PERSPECTIVES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  FINANCIAL: { label: 'Tài chính (Financial)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '💰' },
  CUSTOMER: { label: 'Khách hàng (Customer)', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '👥' },
  INTERNAL_PROCESS: { label: 'Quy trình nội bộ (Internal)', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: '⚙️' },
  LEARNING_GROWTH: { label: 'Học hỏi & Phát triển (Learning)', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '🚀' },
};

export const AiRulesPage: React.FC = () => {
  const [rules, setRules] = useState<AiKpiRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [industry, setIndustry] = useState('TECHNOLOGY');
  const [position, setPosition] = useState('DEV');
  const [perspective, setPerspective] = useState('INTERNAL_PROCESS');
  const [suggestedKpi, setSuggestedKpi] = useState('');
  const [formula, setFormula] = useState('');
  const [unit, setUnit] = useState('%');
  const [weight, setWeight] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedIndustry !== 'ALL') queryParams.append('industry', selectedIndustry);
      if (selectedPosition !== 'ALL') queryParams.append('position', selectedPosition);

      const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const data = await apiClient<AiKpiRule[]>(`/settings/ai-rules${qs}`);
      setRules(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải quy tắc AI' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [selectedIndustry, selectedPosition]);

  const handleApplyKpi = (rule: AiKpiRule) => {
    setNotification({
      type: 'success',
      message: `Đã sao chép chỉ số "${rule.suggestedKpi}" vào bộ gợi ý Thẻ điểm BSC thành công!`,
    });
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedKpi.trim()) return;

    try {
      setIsSubmitting(true);
      await apiClient('/settings/ai-rules', {
        method: 'POST',
        body: JSON.stringify({
          industry,
          position,
          perspective,
          suggestedKpi: suggestedKpi.trim(),
          formula: formula.trim() || undefined,
          unit,
          weight: Number(weight) || 20,
        }),
      });

      setNotification({ type: 'success', message: 'Thêm quy tắc AI KPI mới thành công' });
      setIsModalOpen(false);
      setSuggestedKpi('');
      setFormula('');
      loadRules();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thêm quy tắc' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (rule: AiKpiRule) => {
    if (!confirm(`Xóa quy tắc gợi ý "${rule.suggestedKpi}"?`)) return;

    try {
      await apiClient(`/settings/ai-rules/${rule.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa quy tắc gợi ý' });
      loadRules();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi xóa quy tắc' });
    }
  };

  const filtered = rules.filter(
    (r) =>
      r.suggestedKpi.toLowerCase().includes(search.toLowerCase()) ||
      r.formula?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
            <Sparkles className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Quy tắc AI Gợi ý KPI & Mục tiêu BSC (Smart KPI Rules)</h1>
            <p className="text-amber-100 text-xs mt-0.5">
              Động cơ khuyến nghị chỉ số hiệu suất chuẩn quốc tế dựa trên ngành nghề kinh doanh và cấp bậc chức danh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRules}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-orange-700 hover:bg-orange-50 rounded-lg text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Thêm quy tắc mới
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selectors Bar: Industry & Position */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Ngành nghề:</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-orange-500"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Chức danh:</span>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-orange-500"
            >
              {POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên chỉ số hoặc công thức..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Suggested KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-orange-600 border-t-transparent rounded-full animate-spin" />
              <span>Đang tính toán các chỉ số gợi ý...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-xs">
            Không có quy tắc gợi ý nào phù hợp với bộ lọc hiện tại. Nhấn "Thêm quy tắc mới" để đóng góp thêm.
          </div>
        ) : (
          filtered.map((rule) => {
            const pMeta = PERSPECTIVES[rule.perspective] || PERSPECTIVES.INTERNAL_PROCESS;

            return (
              <div
                key={rule.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-orange-400 hover:shadow-lg transition p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${pMeta.bg} ${pMeta.color}`}
                    >
                      <span>{pMeta.icon}</span>
                      <span>{pMeta.label}</span>
                    </span>

                    <button
                      onClick={() => handleDeleteRule(rule)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded transition"
                      title="Xóa quy tắc gợi ý"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{rule.suggestedKpi}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">Ngành: {rule.industry}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">Vị trí: {rule.position}</span>
                    </div>
                  </div>

                  {rule.formula && (
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Công thức tính</div>
                      <div className="text-xs font-mono text-slate-700 font-medium">{rule.formula}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1">
                    <span>Đơn vị: <strong className="text-slate-800">{rule.unit}</strong></span>
                    <span>Trọng số khuyến nghị: <strong className="text-orange-600">{rule.weight}%</strong></span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Chuẩn BSC
                  </span>

                  <button
                    onClick={() => handleApplyKpi(rule)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold transition"
                  >
                    Áp dụng vào BSC
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create AI Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-slate-900">Thêm Quy Tắc AI Gợi Ý KPI</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngành nghề</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden"
                  >
                    <option value="TECHNOLOGY">Công nghệ thông tin</option>
                    <option value="RETAIL">Bán lẻ & Thương mại</option>
                    <option value="MANUFACTURING">Sản xuất</option>
                    <option value="FINANCE">Tài chính</option>
                    <option value="GENERAL">Đa ngành</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chức danh</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden"
                  >
                    <option value="CEO">Tổng Giám Đốc</option>
                    <option value="DEV">Lập trình viên / IT</option>
                    <option value="SALES">Nhân viên Sales</option>
                    <option value="HR">Chuyên viên HR</option>
                    <option value="ACCOUNTANT">Kế toán viên</option>
                    <option value="MARKETING">Marketing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Khía cạnh BSC (Perspective)</label>
                <select
                  value={perspective}
                  onChange={(e) => setPerspective(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden"
                >
                  <option value="FINANCIAL">Tài chính (Financial)</option>
                  <option value="CUSTOMER">Khách hàng (Customer)</option>
                  <option value="INTERNAL_PROCESS">Quy trình nội bộ (Internal Process)</option>
                  <option value="LEARNING_GROWTH">Học hỏi & Phát triển (Learning & Growth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên chỉ số KPI gợi ý <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={suggestedKpi}
                  onChange={(e) => setSuggestedKpi(e.target.value)}
                  placeholder="Ví dụ: Tỷ lệ khách hàng quay lại mua hàng (Repeat Purchase Rate)..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Công thức tính toán</label>
                <input
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="Ví dụ: (Số khách mua lại / Tổng khách hàng) * 100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị đo</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="%, Triệu VNĐ, Giờ..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trọng số đề xuất (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  Thêm quy tắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
