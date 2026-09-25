import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Download,
  Save,
  ChevronRight,
  Building2,
  Shield,
  Key,
  Users,
  Trophy,
  Plus,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { StrategyAssessmentData } from '../types/index.js';

interface StrategyAssessmentPageProps {
  onNavigate?: (path: string) => void;
}

export const StrategyAssessmentPage: React.FC<StrategyAssessmentPageProps> = ({ onNavigate }) => {
  const [organization, setOrganization] = useState('Công ty');
  const [stage, setStage] = useState('Giai đoạn 1');
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  const [vision, setVision] = useState('');
  const [companyStrengths, setCompanyStrengths] = useState<string[]>([]);
  const [competitorStrengths, setCompetitorStrengths] = useState<string[]>([]);
  const [industrySuccessFactors, setIndustrySuccessFactors] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch real assessment data from server
  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<StrategyAssessmentData>(
        `/strategy-assessment?organization=${encodeURIComponent(organization)}&stage=${encodeURIComponent(stage)}`
      );
      setVision(data.vision || '');
      setCompanyStrengths(data.companyStrengths || []);
      setCompetitorStrengths(data.competitorStrengths || []);
      setIndustrySuccessFactors(data.industrySuccessFactors || []);
      setCompetitors(data.competitors || []);
      setCompetitiveAdvantage(data.competitiveAdvantage || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải dữ liệu chiến lược' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, stage]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setNotification(null);
      await apiClient('/strategy-assessment', {
        method: 'POST',
        body: JSON.stringify({
          organization,
          stage,
          vision,
          companyStrengths,
          competitorStrengths,
          industrySuccessFactors,
          competitors,
          competitiveAdvantage,
        }),
      });
      setNotification({ type: 'success', message: 'Lưu Canvas Chiến lược thành công vào cơ sở dữ liệu!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lưu thất bại' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    placeholder = 'Mục mới...'
  ) => {
    const text = prompt('Nhập nội dung mới:', placeholder);
    if (text && text.trim()) {
      setList([...list, text.trim()]);
    }
  };

  const handleRemoveItem = (
    index: number,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Top Bar matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">BƯỚC 1 ĐÁNH GIÁ</h1>

          {/* Org & Stage Selector */}
          <div className="flex items-center gap-2">
            <select
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none shadow-xs"
            >
              <option value="Công ty">Tổ chức: Công ty</option>
              <option value="Chi nhánh Miền Bắc">Tổ chức: Chi nhánh Miền Bắc</option>
            </select>

            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none shadow-xs"
            >
              <option value="Giai đoạn 1">Giai đoạn 1</option>
              <option value="Giai đoạn 2">Giai đoạn 2</option>
              <option value="Giai đoạn 3">Giai đoạn 3</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Segmented Control */}
          <div className="bg-slate-200 p-0.5 rounded-lg flex items-center text-xs font-medium">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'overview'
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'detail'
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chi tiết
            </button>
          </div>

          <button
            onClick={loadData}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => alert('Xuất bản đồ chiến lược PDF / Image')}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Xuất"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu'}</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('/swot')}
            className="px-3.5 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white flex items-center gap-1 transition shadow-xs text-xs font-semibold"
            title="Chuyển tiếp sang Bước 2: Phân tích SWOT"
          >
            <span>Bước 2: SWOT</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Interactive Strategy Canvas */}
      <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#eef6ff] via-[#f4f9ff] to-[#ffffff] border border-blue-100 p-6 md:p-8 min-h-[640px] shadow-sm overflow-hidden flex flex-col justify-between">
        {/* Subtle radial tech background lines */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50%" cy="50%" r="200" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="50%" cy="50%" r="350" fill="none" stroke="#93c5fd" strokeWidth="1" strokeDasharray="8 8" />
            <line x1="15%" y1="20%" x2="50%" y2="50%" stroke="#93c5fd" strokeWidth="1.5" />
            <line x1="85%" y1="20%" x2="50%" y2="50%" stroke="#93c5fd" strokeWidth="1.5" />
            <line x1="15%" y1="70%" x2="50%" y2="50%" stroke="#93c5fd" strokeWidth="1.5" />
            <line x1="85%" y1="70%" x2="50%" y2="50%" stroke="#93c5fd" strokeWidth="1.5" />
            <line x1="50%" y1="85%" x2="50%" y2="50%" stroke="#93c5fd" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Top Nodes Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Node 1: Điểm mạnh công ty */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Điểm mạnh công ty
              </span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#1677ff] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 space-y-1.5 min-h-[90px]">
              {companyStrengths.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 group">
                  <span className="text-slate-700">• {item}</span>
                  <button
                    onClick={() => handleRemoveItem(idx, companyStrengths, setCompanyStrengths)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddItem(companyStrengths, setCompanyStrengths, 'Điểm mạnh mới...')}
                className="w-full py-1 text-center border border-dashed border-blue-200 rounded text-[11px] text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> Thêm điểm mạnh
              </button>
            </div>
          </div>

          {/* Node 2: Yếu tố thành công ngành */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                YẾU TỐ THÀNH CÔNG NGÀNH
              </span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#1677ff] flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 space-y-1.5 min-h-[90px]">
              {industrySuccessFactors.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 group">
                  <span className="text-slate-700">• {item}</span>
                  <button
                    onClick={() => handleRemoveItem(idx, industrySuccessFactors, setIndustrySuccessFactors)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddItem(industrySuccessFactors, setIndustrySuccessFactors, 'Yếu tố thành công mới...')}
                className="w-full py-1 text-center border border-dashed border-blue-200 rounded text-[11px] text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> Thêm yếu tố ngành
              </button>
            </div>
          </div>
        </div>

        {/* Center 3D Vision Hub */}
        <div className="my-6 flex flex-col items-center justify-center relative z-20">
          <div className="text-sm font-bold text-[#1677ff] uppercase tracking-wider mb-2 drop-shadow-xs">
            Bức tranh tầm nhìn
          </div>

          {/* Central 3D Podium Graphic */}
          <div className="w-48 h-32 rounded-2xl bg-gradient-to-b from-blue-500 to-indigo-600 shadow-xl border-4 border-white flex flex-col items-center justify-center p-3 text-center text-white relative">
            <div className="text-[10px] font-semibold tracking-wider text-blue-100 uppercase">
              TẦM NHÌN CHIẾN LƯỢC
            </div>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Nhập bức tranh tầm nhìn doanh nghiệp..."
              rows={2}
              className="w-full bg-white/20 text-white placeholder-blue-100/70 text-xs text-center rounded p-1 mt-1 outline-none resize-none border border-white/30 focus:bg-white/30"
            />
          </div>
        </div>

        {/* Middle & Bottom Nodes Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Node 3: Điểm mạnh đối thủ */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Điểm mạnh đối thủ
              </span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#1677ff] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 space-y-1.5 min-h-[90px]">
              {competitorStrengths.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 group">
                  <span className="text-slate-700">• {item}</span>
                  <button
                    onClick={() => handleRemoveItem(idx, competitorStrengths, setCompetitorStrengths)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddItem(competitorStrengths, setCompetitorStrengths, 'Điểm mạnh đối thủ...')}
                className="w-full py-1 text-center border border-dashed border-blue-200 rounded text-[11px] text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> Thêm điểm mạnh đối thủ
              </button>
            </div>
          </div>

          {/* Node 5: Lợi thế cạnh tranh của doanh nghiệp */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                LỢI THẾ CẠNH TRANH
              </span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#1677ff] flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 space-y-1.5 min-h-[90px]">
              {competitiveAdvantage.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 group">
                  <span className="text-slate-700">• {item}</span>
                  <button
                    onClick={() => handleRemoveItem(idx, competitiveAdvantage, setCompetitiveAdvantage)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddItem(competitiveAdvantage, setCompetitiveAdvantage, 'Lợi thế cạnh tranh mới...')}
                className="w-full py-1 text-center border border-dashed border-blue-200 rounded text-[11px] text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> Thêm lợi thế
              </button>
            </div>
          </div>

          {/* Node 4: Đối thủ */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Đối thủ
              </span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-[#1677ff] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 space-y-1.5 min-h-[90px]">
              {competitors.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 group">
                  <span className="text-slate-700">• {item}</span>
                  <button
                    onClick={() => handleRemoveItem(idx, competitors, setCompetitors)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddItem(competitors, setCompetitors, 'Tên đối thủ...')}
                className="w-full py-1 text-center border border-dashed border-blue-200 rounded text-[11px] text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> Thêm đối thủ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
