import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  ArrowRight,
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle,
  Circle,
  X,
  Check,
  AlertCircle,
  Trophy,
  Compass
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { StrategyAssessmentData } from '../types/index.js';

interface StrategyItem {
  id: string;
  type: 'SO' | 'WO' | 'ST' | 'WT';
  title: string;
  description?: string;
  isSelected: boolean;
  order: number;
}

interface StrategyMatrixResponse {
  organization: string;
  stage: string;
  so: StrategyItem[];
  wo: StrategyItem[];
  st: StrategyItem[];
  wt: StrategyItem[];
  totalStrategies: number;
  selectedStrategies: number;
}

interface StrategyFormulationPageProps {
  onNavigate: (path: string) => void;
}

export const StrategyFormulationPage: React.FC<StrategyFormulationPageProps> = ({ onNavigate }) => {
  const [organization, setOrganization] = useState('Công ty');
  const [stage, setStage] = useState('Giai đoạn 1');
  const [matrixData, setMatrixData] = useState<StrategyMatrixResponse | null>(null);
  const [assessmentData, setAssessmentData] = useState<StrategyAssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Create Strategy
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'SO' | 'WO' | 'ST' | 'WT'>('SO');
  const [strategyTitle, setStrategyTitle] = useState('');
  const [strategyDesc, setStrategyDesc] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [matrixRes, assessRes] = await Promise.all([
        apiClient<StrategyMatrixResponse>(
          `/bsc/strategy-matrix?organization=${encodeURIComponent(organization)}&stage=${encodeURIComponent(stage)}`
        ),
        apiClient<StrategyAssessmentData>(
          `/strategy-assessment?organization=${encodeURIComponent(organization)}&stage=${encodeURIComponent(stage)}`
        ),
      ]);
      setMatrixData(matrixRes);
      setAssessmentData(assessRes);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải dữ liệu chiến lược' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, stage]);

  const handleOpenModal = (type: 'SO' | 'WO' | 'ST' | 'WT') => {
    setModalType(type);
    setStrategyTitle('');
    setStrategyDesc('');
    setIsModalOpen(true);
  };

  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategyTitle.trim()) return;

    try {
      await apiClient('/bsc/strategy-matrix', {
        method: 'POST',
        body: JSON.stringify({
          organization,
          stage,
          type: modalType,
          title: strategyTitle.trim(),
          description: strategyDesc.trim() || undefined,
          isSelected: true,
        }),
      });

      setNotification({ type: 'success', message: 'Tạo chiến lược thành công và tự động đánh dấu lựa chọn!' });
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi lưu chiến lược' });
    }
  };

  const handleToggleSelect = async (item: StrategyItem) => {
    try {
      await apiClient(`/bsc/strategy-matrix/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isSelected: !item.isSelected,
        }),
      });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Cập nhật lựa chọn thất bại' });
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa chiến lược này?')) return;
    try {
      await apiClient(`/bsc/strategy-matrix/${id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa chiến lược' });
      loadData();
      setTimeout(() => setNotification(null), 2500);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  const renderSection = (
    title: string,
    subtitle: string,
    type: 'SO' | 'WO' | 'ST' | 'WT',
    items: StrategyItem[]
  ) => (
    <div className="bg-[#f8f9fa] rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <h2 className="text-xs font-bold text-[#1677ff] uppercase tracking-wider">{title}</h2>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>

        <button
          onClick={() => handleOpenModal(type)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-[#1677ff] hover:bg-blue-50 bg-white text-xs font-semibold shadow-2xs transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo chiến lược</span>
        </button>
      </div>

      <div className="mt-3.5 space-y-2.5">
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200">
            Chưa có chiến lược nào. Nhấn "Tạo chiến lược" để bắt đầu.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                item.isSelected
                  ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                  : 'bg-white border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <button
                  onClick={() => handleToggleSelect(item)}
                  className="mt-0.5 text-[#1677ff] hover:scale-110 transition shrink-0"
                  title={item.isSelected ? 'Đang chọn cho Bản đồ chiến lược' : 'Bấm để chọn cho Bản đồ'}
                >
                  {item.isSelected ? (
                    <CheckCircle className="w-4 h-4 fill-blue-600 text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                  )}
                  {item.isSelected && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-[#1677ff]">
                      Đã chọn đưa vào Bản đồ BSC
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDeleteStrategy(item.id)}
                className="text-slate-300 hover:text-red-500 p-1 transition shrink-0"
                title="Xóa chiến lược"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top Header matching TopKPI Bước 2 Xây dựng chiến lược */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#1677ff]">
                BƯỚC 3
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                XÂY DỰNG & LỰA CHỌN CHIẾN LƯỢC
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kết hợp ma trận SWOT để thiết lập các phương án chiến lược SO, WO, ST, WT và lựa chọn chiến lược trọng tâm.
            </p>
          </div>
        </div>

        {/* Action Buttons matching screenshot */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/swot')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bước 2: SWOT</span>
          </button>

          <button
            onClick={loadData}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setNotification({ type: 'success', message: 'Đã lưu cấu hình ma trận chiến lược thành công!' });
              setTimeout(() => setNotification(null), 3000);
            }}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu</span>
          </button>

          <button
            onClick={() => onNavigate('/strategy-map')}
            className="px-3.5 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white flex items-center gap-1 transition shadow-xs text-xs font-semibold"
            title="Chuyển sang Bước 4: Bản đồ Chiến lược 4 viễn cảnh"
          >
            <span>Bước 4: Bản đồ BSC</span>
            <ArrowRight className="w-4 h-4" />
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

      {/* Top Box: Lợi thế cạnh tranh của doanh nghiệp matching screenshot */}
      <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              LỢI THẾ CẠNH TRANH CỦA DOANH NGHIỆP
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Được kế thừa tự động từ Bước 1 Đánh giá</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {assessmentData?.competitiveAdvantage && assessmentData.competitiveAdvantage.length > 0 ? (
            assessmentData.competitiveAdvantage.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-medium flex items-center gap-1.5 shadow-2xs"
              >
                <Compass className="w-3.5 h-3.5 text-amber-600" />
                {item}
              </span>
            ))
          ) : (
            <div className="text-xs text-slate-400 py-1">
              Chưa có lợi thế cạnh tranh được nhập từ Bước 1 Đánh giá.
            </div>
          )}
        </div>
      </div>

      {/* Strategy Summary Pills */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-600">
        <div>
          Tổng số chiến lược đã lập: <b className="text-slate-900">{matrixData?.totalStrategies || 0}</b>
        </div>
        <div>
          Số chiến lược được chọn vào bản đồ BSC: <b className="text-[#1677ff]">{matrixData?.selectedStrategies || 0}</b>
        </div>
      </div>

      {/* 4 Quadrants of Strategy Matrix */}
      <div className="space-y-4">
        {renderSection(
          'CHIẾN LƯỢC SO (Strengths - Opportunities)',
          'Sử dụng các điểm mạnh nội bộ để tận dụng các cơ hội từ thị trường bên ngoài',
          'SO',
          matrixData?.so || []
        )}

        {renderSection(
          'CHIẾN LƯỢC WO (Weaknesses - Opportunities)',
          'Khắc phục các điểm yếu bằng cách đón đầu các cơ hội phát triển mới',
          'WO',
          matrixData?.wo || []
        )}

        {renderSection(
          'CHIẾN LƯỢC ST (Strengths - Threats)',
          'Sử dụng thế mạnh của tổ chức để phòng thủ, hóa giải các thách thức và cạnh tranh',
          'ST',
          matrixData?.st || []
        )}

        {renderSection(
          'CHIẾN LƯỢC WT (Weaknesses - Threats)',
          'Giảm thiểu các điểm yếu nội tại và né tránh các hiểm họa từ môi trường kinh doanh',
          'WT',
          matrixData?.wt || []
        )}
      </div>

      {/* Modal Tạo Chiến lược */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Thêm Chiến lược {modalType}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStrategy} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhóm chiến lược
                </label>
                <select
                  value={modalType}
                  onChange={(e) => setModalType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white font-semibold text-[#1677ff]"
                >
                  <option value="SO">CHIẾN LƯỢC SO (Điểm mạnh & Cơ hội)</option>
                  <option value="WO">CHIẾN LƯỢC WO (Điểm yếu & Cơ hội)</option>
                  <option value="ST">CHIẾN LƯỢC ST (Điểm mạnh & Thách thức)</option>
                  <option value="WT">CHIẾN LƯỢC WT (Điểm yếu & Thách thức)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên chiến lược trọng tâm *
                </label>
                <input
                  type="text"
                  value={strategyTitle}
                  onChange={(e) => setStrategyTitle(e.target.value)}
                  required
                  autoFocus
                  placeholder="VD: Mở rộng kênh phân phối trực tuyến..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả và giải pháp thực thi</label>
                <textarea
                  value={strategyDesc}
                  onChange={(e) => setStrategyDesc(e.target.value)}
                  rows={3}
                  placeholder="Diễn giải chi tiết cách tiếp cận và mục tiêu kỳ vọng..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Lưu chiến lược
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
