import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  RotateCw,
  Search,
  Check,
  X,
  Target,
  Zap,
  Building2,
  Briefcase,
  ArrowRight,
  Trash2,
  Download,
  Key,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Layers,
  Bot,
  BrainCircuit,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { exportToExcel } from '../utils/excel.js';

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

interface GeneratedKpiItem {
  code: string;
  name: string;
  perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL_PROCESS' | 'LEARNING_GROWTH';
  perspectiveTitle: string;
  unit: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  weight: number;
  targetValue: number;
  formula: string;
  rationale: string;
  benchmark: string;
}

interface AiGenerationResult {
  title: string;
  role: string;
  industry: string;
  summary: string;
  source: 'GOOGLE_GEMINI_API' | 'TINYKPI_AI_ENGINE';
  modelUsed: string;
  kpis: GeneratedKpiItem[];
}

const INDUSTRIES = [
  { value: 'ALL', label: 'Tất cả các ngành' },
  { value: 'TECHNOLOGY', label: 'Công nghệ thông tin & Phần mềm' },
  { value: 'RETAIL', label: 'Bán lẻ & Thương mại điện tử' },
  { value: 'MANUFACTURING', label: 'Sản xuất & Chế tạo' },
  { value: 'FINANCE', label: 'Tài chính & Ngân hàng' },
  { value: 'HEALTHCARE', label: 'Y tế & Dược phẩm' },
  { value: 'EDUCATION', label: 'Giáo dục & Đào tạo' },
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

const SAMPLE_PROMPTS = [
  { role: 'Trưởng phòng Kinh doanh Bán lẻ', ind: 'RETAIL', lvl: 'MANAGER' as const },
  { role: 'Marketing Lead & Growth Hacker', ind: 'TECHNOLOGY', lvl: 'MANAGER' as const },
  { role: 'Kỹ sư Phần mềm Senior / Tech Lead', ind: 'TECHNOLOGY', lvl: 'STAFF' as const },
  { role: 'Trưởng phòng Nhân sự & Tuyển dụng', ind: 'GENERAL', lvl: 'MANAGER' as const },
  { role: 'Giám đốc Tài chính CFO', ind: 'FINANCE', lvl: 'EXECUTIVE' as const },
  { role: 'Trưởng phòng Vận hành & SLA', ind: 'GENERAL', lvl: 'MANAGER' as const },
];

export const AiRulesPage: React.FC = () => {
  const [rules, setRules] = useState<AiKpiRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manual Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [industry, setIndustry] = useState('TECHNOLOGY');
  const [position, setPosition] = useState('DEV');
  const [perspective, setPerspective] = useState('INTERNAL_PROCESS');
  const [suggestedKpi, setSuggestedKpi] = useState('');
  const [formula, setFormula] = useState('');
  const [unit, setUnit] = useState('%');
  const [weight, setWeight] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Interactive Generator State
  const [aiRoleInput, setAiRoleInput] = useState('Trưởng phòng Kinh doanh Bán lẻ');
  const [aiIndustry, setAiIndustry] = useState('RETAIL');
  const [aiLevel, setAiLevel] = useState<'EXECUTIVE' | 'MANAGER' | 'STAFF'>('MANAGER');
  const [aiCount, setAiCount] = useState<number>(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<AiGenerationResult | null>(null);
  const [selectedKpiCodes, setSelectedKpiCodes] = useState<string[]>([]);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [isApplyingScorecard, setIsApplyingScorecard] = useState(false);

  // Gemini API Key Config State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedApiKey, setSavedApiKey] = useState<string>(() => localStorage.getItem('TINYKPI_GEMINI_API_KEY') || '');

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

  // Handle AI KPI Generation
  const handleGenerateKpis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiRoleInput.trim()) {
      setNotification({ type: 'error', message: 'Vui lòng nhập chức danh hoặc bộ phận cần gợi ý' });
      return;
    }

    try {
      setIsGenerating(true);
      setNotification(null);

      const result = await apiClient<AiGenerationResult>('/settings/ai-rules/generate', {
        method: 'POST',
        body: JSON.stringify({
          roleOrDepartment: aiRoleInput.trim(),
          industry: aiIndustry,
          level: aiLevel,
          count: aiCount,
          apiKey: savedApiKey || undefined,
        }),
      });

      setGenerationResult(result);
      setSelectedKpiCodes(result.kpis.map((k) => k.code));
      setNotification({
        type: 'success',
        message: `Đã sinh thành công ${result.kpis.length} chỉ số KPI bằng ${
          result.source === 'GOOGLE_GEMINI_API' ? 'Google Gemini 1.5 Flash' : 'Động cơ AI TinyKPI'
        }!`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi khi gọi AI gợi ý KPI' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle selection of individual KPI
  const toggleKpiSelection = (code: string) => {
    setSelectedKpiCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (!generationResult) return;
    if (selectedKpiCodes.length === generationResult.kpis.length) {
      setSelectedKpiCodes([]);
    } else {
      setSelectedKpiCodes(generationResult.kpis.map((k) => k.code));
    }
  };

  // Bulk save generated KPIs into ai_kpi_rules
  const handleBulkSaveRules = async () => {
    if (!generationResult) return;
    const toSave = generationResult.kpis.filter((k) => selectedKpiCodes.includes(k.code));
    if (toSave.length === 0) {
      setNotification({ type: 'error', message: 'Vui lòng chọn ít nhất 1 chỉ số để lưu' });
      return;
    }

    try {
      setIsSavingRules(true);
      const res = await apiClient<{ createdCount: number }>('/settings/ai-rules/bulk-save', {
        method: 'POST',
        body: JSON.stringify({
          rules: toSave,
          industry: aiIndustry,
          position: aiLevel,
        }),
      });

      setNotification({
        type: 'success',
        message: `Đã lưu thành công ${res.createdCount} chỉ số vào Danh mục Quy tắc AI!`,
      });
      loadRules();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi lưu quy tắc' });
    } finally {
      setIsSavingRules(false);
    }
  };

  // Directly apply generated KPIs to BSC Scorecard indicators
  const handleApplyToScorecard = async () => {
    if (!generationResult) return;
    const toApply = generationResult.kpis.filter((k) => selectedKpiCodes.includes(k.code));
    if (toApply.length === 0) {
      setNotification({ type: 'error', message: 'Vui lòng chọn ít nhất 1 chỉ số để áp dụng' });
      return;
    }

    try {
      setIsApplyingScorecard(true);
      const res = await apiClient<{ insertedCount: number }>('/settings/ai-rules/apply-to-kpis', {
        method: 'POST',
        body: JSON.stringify({ kpis: toApply }),
      });

      setNotification({
        type: 'success',
        message: `Đã gán thành công ${res.insertedCount} chỉ số KPI trực tiếp vào Thẻ điểm BSC! Bạn có thể xem ngay tại mục B5: Thẻ điểm BSC.`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi gán vào Thẻ điểm BSC' });
    } finally {
      setIsApplyingScorecard(false);
    }
  };

  // Export generated KPIs to Excel
  const handleExportGeneratedExcel = () => {
    if (!generationResult) return;
    const toExport = generationResult.kpis.filter((k) => selectedKpiCodes.includes(k.code));
    if (toExport.length === 0) {
      setNotification({ type: 'error', message: 'Vui lòng chọn ít nhất 1 chỉ số để xuất Excel' });
      return;
    }

    exportToExcel({
      data: toExport,
      fileName: `Goi_Y_KPI_AI_${generationResult.role.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Gợi ý KPI từ AI',
      columns: [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Viễn cảnh BSC', key: 'perspectiveTitle', width: 22 },
        { header: 'Mã KPI', key: 'code', width: 16 },
        { header: 'Tên chỉ số KPI', key: 'name', width: 35 },
        { header: 'Đơn vị tính', key: 'unit', width: 12 },
        { header: 'Tần suất đo', key: 'frequency', width: 14, format: (f) => (f === 'MONTHLY' ? 'Tháng' : f === 'QUARTERLY' ? 'Quý' : 'Năm') },
        { header: 'Trọng số (%)', key: 'weight', width: 14, format: (w) => `${w}%` },
        { header: 'Chỉ tiêu đề xuất', key: 'targetValue', width: 16 },
        { header: 'Công thức tính toán', key: 'formula', width: 36 },
        { header: 'Lý do khuyến nghị', key: 'rationale', width: 36 },
        { header: 'Chuẩn ngành (Benchmark)', key: 'benchmark', width: 30 },
      ],
    });

    setNotification({
      type: 'success',
      message: `Đã xuất ${toExport.length} chỉ số KPI gợi ý ra file Excel (.xlsx) thành công!`,
    });
  };

  // Save custom Gemini API Key
  const handleSaveApiKey = () => {
    const key = apiKeyInput.trim();
    if (key) {
      localStorage.setItem('TINYKPI_GEMINI_API_KEY', key);
      setSavedApiKey(key);
      setNotification({ type: 'success', message: 'Đã lưu Google Gemini API Key thành công!' });
    } else {
      localStorage.removeItem('TINYKPI_GEMINI_API_KEY');
      setSavedApiKey('');
      setNotification({ type: 'success', message: 'Đã xóa API Key. Hệ thống sẽ dùng Động cơ AI Cốt lõi TinyKPI.' });
    }
    setIsKeyModalOpen(false);
  };

  const handleSaveManualRule = async (e: React.FormEvent) => {
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

  const filteredRules = rules.filter(
    (r) =>
      r.suggestedKpi.toLowerCase().includes(search.toLowerCase()) ||
      r.formula?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
            <Sparkles className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Quy tắc AI Gợi ý KPI & Mục tiêu BSC (Smart KPI Rules)</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-amber-200 backdrop-blur-xs flex items-center gap-1">
                <Bot className="w-3 h-3" />
                {savedApiKey ? 'Google Gemini AI Connected' : 'TinyKPI Expert AI Engine'}
              </span>
            </div>
            <p className="text-amber-100 text-xs mt-0.5">
              Động cơ khuyến nghị chỉ số hiệu suất chuẩn quốc tế dựa trên ngành nghề kinh doanh và cấp bậc chức danh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setApiKeyInput(savedApiKey);
              setIsKeyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition border border-white/20"
            title="Cài đặt Google Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-300" />
            <span>{savedApiKey ? 'Gemini Key: Đã lưu' : 'Cấu hình Gemini API'}</span>
          </button>

          <button
            onClick={loadRules}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-orange-700 hover:bg-orange-50 rounded-lg text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Thêm quy tắc mới
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-medium animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🤖 INTERACTIVE AI KPI GENERATOR SECTION                        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-lg p-5 md:p-6 space-y-5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/60 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Trợ Lý AI Gợi Ý Bộ Chỉ Số KPI Tự Động (AI Smart KPI Generator)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                  Phân bổ 4 Viễn Cảnh BSC
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập bất kỳ chức danh nào, AI sẽ phân tích chuỗi giá trị và đề xuất bộ KPI chuẩn định lượng kèm công thức
              </p>
            </div>
          </div>
        </div>

        {/* Generator Input Form */}
        <form onSubmit={handleGenerateKpis} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Input Role */}
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chức danh / Vị trí hoặc Phòng ban <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={aiRoleInput}
                  onChange={(e) => setAiRoleInput(e.target.value)}
                  placeholder="Ví dụ: Trưởng phòng Kinh doanh Bán lẻ FMCG, Kỹ sư Cầu nối BrSE..."
                  className="w-full py-2.5 pl-3 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-slate-900 shadow-inner"
                />
                <Sparkles className="w-4 h-4 text-orange-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Industry Selector */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngành nghề</label>
              <select
                value={aiIndustry}
                onChange={(e) => setAiIndustry(e.target.value)}
                className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-slate-800"
              >
                {INDUSTRIES.filter((i) => i.value !== 'ALL').map((ind) => (
                  <option key={ind.value} value={ind.value}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Selector */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cấp bậc</label>
              <select
                value={aiLevel}
                onChange={(e) => setAiLevel(e.target.value as any)}
                className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 focus:bg-white font-medium text-slate-800"
              >
                <option value="EXECUTIVE">Ban Điều Hành (C-Level)</option>
                <option value="MANAGER">Quản lý cấp trung (Manager)</option>
                <option value="STAFF">Chuyên viên (Staff)</option>
              </select>
            </div>

            {/* Generate Action Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Đang sinh...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Sinh bộ KPI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Prompt Badges */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 pt-1">
            <span className="font-semibold text-slate-700">Gợi ý nhanh:</span>
            {SAMPLE_PROMPTS.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAiRoleInput(sp.role);
                  setAiIndustry(sp.ind);
                  setAiLevel(sp.lvl);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 text-slate-600 transition"
              >
                {sp.role}
              </button>
            ))}
          </div>
        </form>

        {/* AI Result Display Panel */}
        {isGenerating && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3 border border-orange-100 rounded-2xl bg-orange-50/30 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg animate-bounce">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-slate-800">
                {savedApiKey ? 'Google Gemini 1.5 Flash' : 'Động cơ AI TinyKPI'} đang thiết lập bộ chỉ số...
              </p>
              <p className="text-[11px] text-slate-500">
                Cân bằng trọng số và phân bổ vào 4 viễn cảnh Tài chính, Khách hàng, Quy trình và Con người
              </p>
            </div>
          </div>
        )}

        {!isGenerating && generationResult && (
          <div className="space-y-4 pt-2 border-t border-slate-100 animate-fadeIn">
            {/* Result Header Bar */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-xl text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-amber-300">{generationResult.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/20">
                    {generationResult.modelUsed}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedKpiCodes.length}/{generationResult.kpis.length} chỉ số đã chọn
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-4xl">
                  {generationResult.summary}
                </p>
              </div>

              {/* Action Buttons on AI Result */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition flex items-center gap-1.5"
                >
                  {selectedKpiCodes.length === generationResult.kpis.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-amber-300" />
                      <span>Bỏ chọn</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Chọn tất cả</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBulkSaveRules}
                  disabled={isSavingRules || selectedKpiCodes.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Lưu các chỉ số đã chọn thành quy tắc AI Rules"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isSavingRules ? 'Đang lưu...' : 'Lưu vào AI Rules'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyToScorecard}
                  disabled={isApplyingScorecard || selectedKpiCodes.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Đưa trực tiếp các chỉ số này vào Thẻ điểm BSC"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isApplyingScorecard ? 'Đang gán...' : 'Gán vào Thẻ điểm BSC'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportGeneratedExcel}
                  disabled={selectedKpiCodes.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Xuất các chỉ số này ra file Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGenerationResult(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition"
                  title="Đóng kết quả AI"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Generated KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generationResult.kpis.map((kpi) => {
                const isSelected = selectedKpiCodes.includes(kpi.code);
                const pInfo = PERSPECTIVES[kpi.perspective] || PERSPECTIVES.INTERNAL_PROCESS;

                return (
                  <div
                    key={kpi.code}
                    onClick={() => toggleKpiSelection(kpi.code)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/30 shadow-md ring-2 ring-orange-200'
                        : 'border-slate-200 bg-white hover:border-slate-300 opacity-70'
                    }`}
                  >
                    <div>
                      {/* Top perspective badge & checkbox */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${pInfo.bg} ${pInfo.color}`}
                        >
                          <span>{pInfo.icon}</span>
                          <span>{pInfo.label.split('(')[0]}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400">{kpi.code}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by card click
                            className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* KPI Name */}
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{kpi.name}</h4>

                      {/* Key stats pill row */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          Trọng số: <strong className="text-orange-600">{kpi.weight}%</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          ĐVT: <strong>{kpi.unit}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          Chỉ tiêu: <strong className="text-emerald-600">{kpi.targetValue}</strong>
                        </span>
                      </div>

                      {/* Formula */}
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px]">
                        <span className="text-slate-400 font-semibold block text-[10px]">CÔNG THỨC:</span>
                        <code className="text-slate-800 font-mono text-[10px] break-words">{kpi.formula}</code>
                      </div>

                      {/* Rationale */}
                      <p className="mt-2 text-[11px] text-slate-600 leading-relaxed italic">
                        "{kpi.rationale}"
                      </p>
                    </div>

                    {/* Benchmark Footer */}
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1">
                      <Target className="w-3 h-3 text-orange-500 shrink-0" />
                      <span className="truncate">Chuẩn ngành: {kpi.benchmark}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 📁 EXISTING SYSTEM RULES (DATABASE REPOSITORY)                 */}
      {/* ============================================================== */}
      <div className="space-y-4">
        {/* Selectors Bar: Industry & Position */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Lọc ngành:</span>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
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
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
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
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">Không tìm thấy quy tắc AI nào phù hợp với bộ lọc hiện tại.</p>
              <button
                onClick={() => {
                  setSelectedIndustry('ALL');
                  setSelectedPosition('ALL');
                  setSearch('');
                }}
                className="mt-2 text-xs text-orange-600 hover:underline font-semibold"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredRules.map((rule) => {
              const pInfo = PERSPECTIVES[rule.perspective] || PERSPECTIVES.INTERNAL_PROCESS;

              return (
                <div
                  key={rule.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${pInfo.bg} ${pInfo.color}`}
                      >
                        <span>{pInfo.icon}</span>
                        <span>{pInfo.label.split('(')[0]}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {rule.position}
                        </span>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                          title="Xóa quy tắc"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 leading-snug">{rule.suggestedKpi}</h3>

                    {rule.formula && (
                      <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-mono text-slate-700">
                        <span className="text-slate-400 font-semibold block text-[10px]">CÔNG THỨC:</span>
                        {rule.formula}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>ĐVT: <strong className="text-slate-800">{rule.unit}</strong></span>
                      <span>Trọng số: <strong className="text-orange-600">{rule.weight}%</strong></span>
                    </div>

                    <button
                      onClick={() => {
                        setNotification({
                          type: 'success',
                          message: `Đã sao chép chỉ số "${rule.suggestedKpi}" vào bộ nhớ tạm thành công!`,
                        });
                      }}
                      className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold hover:underline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 🔑 GEMINI API KEY MODAL                                        */}
      {/* ============================================================== */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Key className="w-4 h-4 text-orange-600" />
                <span>Cấu hình Google Gemini API Key</span>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                TinyKPI tích hợp trực tiếp với mô hình <strong>Gemini 1.5 Flash</strong> của Google để sinh các bộ chỉ số KPI chuyên sâu theo thời gian thực.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * API Key được lưu an toàn trong trình duyệt hoặc biến môi trường máy chủ. Để trống để sử dụng Động cơ AI Cốt lõi sẵn có của TinyKPI.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] space-y-1">
                <span className="font-bold">Chưa có API Key?</span>
                <p>
                  Bạn có thể lấy Google Gemini API Key hoàn toàn miễn phí tại{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold underline inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ➕ MANUAL NEW RULE MODAL                                        */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Thêm quy tắc gợi ý KPI mới</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualRule} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngành nghề</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {INDUSTRIES.filter((i) => i.value !== 'ALL').map((ind) => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chức danh</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {POSITIONS.filter((p) => p.value !== 'ALL').map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Viễn cảnh BSC</label>
                <select
                  value={perspective}
                  onChange={(e) => setPerspective(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Công thức tính toán</label>
                <input
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="Ví dụ: (Số khách mua lại / Tổng khách hàng) * 100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none font-mono"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none"
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
