import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Download,
  Save,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Lightbulb,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface SwotItem {
  id: string;
  type: 'STRENGTH' | 'WEAKNESS' | 'OPPORTUNITY' | 'THREAT';
  content: string;
  order: number;
}

interface SwotResponse {
  organization: string;
  stage: string;
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
}

interface SwotAnalysisPageProps {
  onNavigate: (path: string) => void;
}

export const SwotAnalysisPage: React.FC<SwotAnalysisPageProps> = ({ onNavigate }) => {
  const [organization, setOrganization] = useState('Công ty');
  const [stage, setStage] = useState('Giai đoạn 1');
  const [data, setData] = useState<SwotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'STRENGTH' | 'WEAKNESS' | 'OPPORTUNITY' | 'THREAT'>('STRENGTH');
  const [itemContent, setItemContent] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSwot = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<SwotResponse>(
        `/bsc/swot?organization=${encodeURIComponent(organization)}&stage=${encodeURIComponent(stage)}`
      );
      setData(res);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải phân tích SWOT' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSwot();
  }, [organization, stage]);

  const handleOpenAddModal = (type: 'STRENGTH' | 'WEAKNESS' | 'OPPORTUNITY' | 'THREAT') => {
    setModalType(type);
    setItemContent('');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemContent.trim()) return;

    try {
      await apiClient('/bsc/swot', {
        method: 'POST',
        body: JSON.stringify({
          organization,
          stage,
          type: modalType,
          content: itemContent.trim(),
        }),
      });

      setNotification({ type: 'success', message: 'Thêm mục SWOT thành công vào cơ sở dữ liệu' });
      setIsModalOpen(false);
      setItemContent('');
      loadSwot();
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thêm mục SWOT' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await apiClient(`/bsc/swot/${id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa mục SWOT' });
      loadSwot();
      setTimeout(() => setNotification(null), 2500);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'STRENGTH':
        return '(S) ĐIỂM MẠNH CÔNG TY';
      case 'WEAKNESS':
        return '(W) ĐIỂM YẾU CÔNG TY';
      case 'OPPORTUNITY':
        return '(O) CƠ HỘI';
      case 'THREAT':
        return '(T) THÁCH THỨC';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header matching TopKPI B2 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">B2: PHÂN TÍCH SWOT</h1>

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

        {/* Action Buttons matching screenshot */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/dashboard/step1')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bước 1</span>
          </button>

          <button
            onClick={loadSwot}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => alert('Xuất ma trận SWOT PDF / Excel')}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Xuất dữ liệu"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setNotification({ type: 'success', message: 'Tất cả mục SWOT đã được lưu đồng bộ cơ sở dữ liệu!' });
              setTimeout(() => setNotification(null), 3000);
            }}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu</span>
          </button>

          <button
            onClick={() => onNavigate('/strategy-formulation')}
            className="px-3.5 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white flex items-center gap-1 transition shadow-xs text-xs font-semibold"
            title="Chuyển sang Bước 3: Xây dựng Chiến lược SO/WO/ST/WT"
          >
            <span>Bước 3</span>
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

      {/* 4 Quadrants matching authentic TopKPI UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quadrant 1: S - Điểm mạnh */}
        <div className="bg-[#f8f9fa] rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-[#1677ff] uppercase tracking-wider">
                (S) ĐIỂM MẠNH CÔNG TY
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-500 shadow-2xs"
                  title="Gợi ý AI"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenAddModal('STRENGTH')}
                  className="w-7 h-7 rounded-lg bg-white border border-blue-200 text-[#1677ff] hover:bg-blue-50 flex items-center justify-center shadow-2xs"
                  title="Thêm điểm mạnh"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              {data?.strengths.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có mục nào. Nhấn (+) để thêm điểm mạnh.
                </div>
              ) : (
                data?.strengths.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 shadow-2xs group hover:border-blue-300 transition"
                  >
                    <span className="font-medium">• {item.content}</span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-0.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quadrant 2: W - Điểm yếu */}
        <div className="bg-[#f8f9fa] rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-[#1677ff] uppercase tracking-wider">
                (W) ĐIỂM YẾU CÔNG TY
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-500 shadow-2xs"
                  title="Gợi ý AI"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenAddModal('WEAKNESS')}
                  className="w-7 h-7 rounded-lg bg-white border border-blue-200 text-[#1677ff] hover:bg-blue-50 flex items-center justify-center shadow-2xs"
                  title="Thêm điểm yếu"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              {data?.weaknesses.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có mục nào. Nhấn (+) để thêm điểm yếu.
                </div>
              ) : (
                data?.weaknesses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 shadow-2xs group hover:border-blue-300 transition"
                  >
                    <span className="font-medium">• {item.content}</span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-0.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quadrant 3: O - Cơ hội */}
        <div className="bg-[#f8f9fa] rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-[#1677ff] uppercase tracking-wider">
                (O) CƠ HỘI
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-500 shadow-2xs"
                  title="Gợi ý AI"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenAddModal('OPPORTUNITY')}
                  className="w-7 h-7 rounded-lg bg-white border border-blue-200 text-[#1677ff] hover:bg-blue-50 flex items-center justify-center shadow-2xs"
                  title="Thêm cơ hội"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              {data?.opportunities.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có mục nào. Nhấn (+) để thêm cơ hội.
                </div>
              ) : (
                data?.opportunities.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 shadow-2xs group hover:border-blue-300 transition"
                  >
                    <span className="font-medium">• {item.content}</span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-0.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quadrant 4: T - Thách thức */}
        <div className="bg-[#f8f9fa] rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-[#1677ff] uppercase tracking-wider">
                (T) THÁCH THỨC
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-500 shadow-2xs"
                  title="Gợi ý AI"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenAddModal('THREAT')}
                  className="w-7 h-7 rounded-lg bg-white border border-blue-200 text-[#1677ff] hover:bg-blue-50 flex items-center justify-center shadow-2xs"
                  title="Thêm thách thức"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              {data?.threats.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Chưa có mục nào. Nhấn (+) để thêm thách thức.
                </div>
              ) : (
                data?.threats.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 shadow-2xs group hover:border-blue-300 transition"
                  >
                    <span className="font-medium">• {item.content}</span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-0.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thêm Mục SWOT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Thêm vào {getTypeName(modalType)}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung chi tiết *</label>
                <textarea
                  value={itemContent}
                  onChange={(e) => setItemContent(e.target.value)}
                  required
                  rows={3}
                  autoFocus
                  placeholder="Nhập nội dung phân tích..."
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
                  Lưu vào SWOT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
