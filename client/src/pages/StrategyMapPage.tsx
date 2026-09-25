import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Users,
  Cpu,
  GraduationCap,
  X,
  Target,
  Edit2,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface KpiIndicator {
  id: string;
  code: string;
  name: string;
  unit: string;
  weight: number;
  targetValue: number;
  actualValue: number;
  achievementRate: number;
  status: string;
}

interface StrategicObjective {
  id: string;
  code?: string;
  title: string;
  description?: string;
  perspective: string;
  order: number;
  kpiIndicators: KpiIndicator[];
}

interface PerspectiveGroup {
  key: string;
  title: string;
  description: string;
  objectives: StrategicObjective[];
  kpiCount: number;
  averageAchievement: number;
}

interface StrategyMapResponse {
  organization: string;
  stage: string;
  overallScore: number;
  totalObjectives: number;
  totalKpis: number;
  perspectives: PerspectiveGroup[];
}

interface StrategyMapPageProps {
  onNavigate: (path: string) => void;
}

export const StrategyMapPage: React.FC<StrategyMapPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<StrategyMapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Objective
  const [isObjModalOpen, setIsObjModalOpen] = useState(false);
  const [selectedPerspective, setSelectedPerspective] = useState('FINANCIAL');
  const [objTitle, setObjTitle] = useState('');
  const [objCode, setObjCode] = useState('');
  const [objDesc, setObjDesc] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStrategyMap = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<StrategyMapResponse>('/bsc/strategy-map');
      setData(res);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải bản đồ chiến lược' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStrategyMap();
  }, []);

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objTitle.trim()) return;

    try {
      await apiClient('/bsc/objectives', {
        method: 'POST',
        body: JSON.stringify({
          perspective: selectedPerspective,
          title: objTitle.trim(),
          code: objCode.trim() || undefined,
          description: objDesc.trim() || undefined,
        }),
      });

      setNotification({ type: 'success', message: 'Tạo mục tiêu chiến lược thành công' });
      setIsObjModalOpen(false);
      setObjTitle('');
      setObjCode('');
      setObjDesc('');
      loadStrategyMap();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thêm mục tiêu' });
    }
  };

  const handleDeleteObjective = async (obj: StrategicObjective) => {
    if (!confirm(`Bạn có chắc muốn xóa mục tiêu "${obj.title}"?`)) return;
    try {
      await apiClient(`/bsc/objectives/${obj.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa mục tiêu chiến lược' });
      loadStrategyMap();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  const getPerspectiveMeta = (key: string) => {
    switch (key) {
      case 'FINANCIAL':
        return {
          icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
          color: 'border-blue-200 bg-blue-50/50',
          badge: 'bg-blue-100 text-blue-700',
        };
      case 'CUSTOMER':
        return {
          icon: <Users className="w-4 h-4 text-emerald-600" />,
          color: 'border-emerald-200 bg-emerald-50/50',
          badge: 'bg-emerald-100 text-emerald-700',
        };
      case 'INTERNAL_PROCESS':
        return {
          icon: <Cpu className="w-4 h-4 text-indigo-600" />,
          color: 'border-indigo-200 bg-indigo-50/50',
          badge: 'bg-indigo-100 text-indigo-700',
        };
      case 'LEARNING_GROWTH':
      default:
        return {
          icon: <GraduationCap className="w-4 h-4 text-amber-600" />,
          color: 'border-amber-200 bg-amber-50/50',
          badge: 'bg-amber-100 text-amber-700',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row matching TopKPI B4 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#1677ff]">
              BƯỚC 4
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              B4 BẢN ĐỒ CHIẾN LƯỢC / MỤC TIÊU
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô hình hóa quan hệ nhân quả giữa 4 viễn cảnh: Tài chính, Khách hàng, Quy trình và Năng lực tổ chức.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/strategy-formulation')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bước 3: Chiến lược</span>
          </button>

          <button
            onClick={loadStrategyMap}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('/bsc-scorecard')}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <span>Bước 5: Báo Cáo & KPI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TopKPI Notice Banner matching screenshot */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800 flex items-center gap-2 shadow-2xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          Mục tiêu công ty đã được đồng bộ với cơ sở dữ liệu. Hệ thống tự động tạo <b>"Đầu cá"</b> cho mô hình Xương cá và Thẻ điểm BSC.
        </span>
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

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Điểm hiệu suất BSC</div>
          <div className="text-2xl font-extrabold text-[#1677ff] mt-1">
            {data?.overallScore || 0}%
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Tổng hợp 4 viễn cảnh</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mục tiêu chiến lược</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {data?.totalObjectives || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Phân bổ 4 trụ cột</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chỉ số đo lường (KPI)</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1">
            {data?.totalKpis || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Đã gán chỉ tiêu đo lường</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổ chức & Giai đoạn</div>
          <div className="text-sm font-bold text-slate-800 mt-2 truncate">
            {data?.organization}
          </div>
          <div className="text-[11px] text-[#1677ff] font-medium">{data?.stage}</div>
        </div>
      </div>

      {/* 4 Perspectives Layer Canvas */}
      <div className="space-y-4">
        {data?.perspectives.map((persp) => {
          const meta = getPerspectiveMeta(persp.key);
          return (
            <div
              key={persp.key}
              className={`rounded-2xl border p-5 bg-white shadow-xs transition hover:shadow-md ${meta.color}`}
            >
              {/* Perspective Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                    {meta.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      VIỄN CẢNH {persp.title}
                    </h2>
                    <p className="text-[11px] text-slate-500">{persp.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="text-[11px] text-slate-400 font-medium">Hoàn thành:</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-xs ${meta.badge}`}>
                      {persp.averageAchievement}%
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPerspective(persp.key);
                      setObjCode(`${persp.key === 'FINANCIAL' ? 'TC' : persp.key === 'CUSTOMER' ? 'KH' : persp.key === 'INTERNAL_PROCESS' ? 'QT' : 'PT'}-0${persp.objectives.length + 1}`);
                      setIsObjModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm mục tiêu</span>
                  </button>
                </div>
              </div>

              {/* Objectives Grid */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {persp.objectives.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-white/60 rounded-xl border border-dashed border-slate-200">
                    Chưa có mục tiêu chiến lược nào cho viễn cảnh này. Bấm "Thêm mục tiêu" để khởi tạo.
                  </div>
                ) : (
                  persp.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            {obj.code || 'OBJ'}
                          </span>
                          <button
                            onClick={() => handleDeleteObjective(obj)}
                            className="text-slate-300 hover:text-red-500 p-0.5 transition"
                            title="Xóa mục tiêu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h3 className="mt-2 text-xs font-bold text-slate-900 leading-snug">
                          {obj.title}
                        </h3>
                        {obj.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {obj.description}
                          </p>
                        )}
                      </div>

                      {/* KPI indicators linked */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] mb-2">
                          <span className="font-semibold text-slate-600 flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-blue-500" />
                            {obj.kpiIndicators.length} Chỉ số KPI
                          </span>
                          <button
                            onClick={() => onNavigate('/bsc-scorecard')}
                            className="text-[#1677ff] hover:underline font-medium text-[11px]"
                          >
                            Quản lý KPI ›
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {obj.kpiIndicators.slice(0, 2).map((kpi) => (
                            <div
                              key={kpi.id}
                              className="flex items-center justify-between px-2 py-1 rounded bg-slate-50 text-[10px] text-slate-700 border border-slate-100"
                            >
                              <span className="truncate max-w-[140px] font-medium">• {kpi.name}</span>
                              <span className="font-bold text-[#1677ff]">{kpi.achievementRate}%</span>
                            </div>
                          ))}
                          {obj.kpiIndicators.length > 2 && (
                            <div className="text-[10px] text-slate-400 text-center font-medium">
                              +{obj.kpiIndicators.length - 2} chỉ số khác
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Thêm Mục tiêu Chiến lược */}
      {isObjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Thêm Mục tiêu Chiến lược BSC</h2>
              <button onClick={() => setIsObjModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateObjective} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Viễn cảnh BSC *</label>
                <select
                  value={selectedPerspective}
                  onChange={(e) => setSelectedPerspective(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white font-medium text-slate-800"
                >
                  <option value="FINANCIAL">TÀI CHÍNH (Financial)</option>
                  <option value="CUSTOMER">KHÁCH HÀNG (Customer)</option>
                  <option value="INTERNAL_PROCESS">QUY TRÌNH NỘI BỘ (Internal Process)</option>
                  <option value="LEARNING_GROWTH">HỌC HỎI & PHÁT TRIỂN (Learning & Growth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-red-500 mr-0.5">*</span> Tên mục tiêu chiến lược
                </label>
                <input
                  type="text"
                  value={objTitle}
                  onChange={(e) => setObjTitle(e.target.value)}
                  required
                  placeholder="VD: Gia tăng tỷ suất lợi nhuận trên vốn đầu tư..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã mục tiêu</label>
                <input
                  type="text"
                  value={objCode}
                  onChange={(e) => setObjCode(e.target.value)}
                  placeholder="VD: TC-01, KH-02..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả chi tiết mục tiêu</label>
                <textarea
                  value={objDesc}
                  onChange={(e) => setObjDesc(e.target.value)}
                  rows={3}
                  placeholder="Định hướng và giải pháp trọng tâm..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsObjModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Tạo mục tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
