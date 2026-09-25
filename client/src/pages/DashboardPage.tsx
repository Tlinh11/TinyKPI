import React from 'react';
import { RotateCw, LayoutGrid, Filter, Download, ArrowRight, Inbox } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">DASHBOARD</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
            title="Dạng xem"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <button
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
            title="Bộ lọc"
          >
            <Filter className="w-4 h-4" />
          </button>

          <button
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
            title="Xuất file"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('/bsc-scorecard')}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition"
          >
            Báo Cáo BSC
          </button>
        </div>
      </div>

      {/* Main Grid: Empty Goal Banner & Daily Tasks Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
        {/* Center Canvas Area (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div className="text-center space-y-3 py-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">QUY TRÌNH HOẠCH ĐỊNH CHIẾN LƯỢC BSC & KPI</h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Hệ thống hóa toàn diện chu trình từ Đánh giá Canvas, Phân tích SWOT, Thiết lập Ma trận Chiến lược đến Bản đồ Chiến lược 4 viễn cảnh và Thẻ điểm cân bằng đo lường.
            </p>
            <div>
              <button
                onClick={() => onNavigate('/dashboard/step1')}
                className="px-6 py-2 rounded-xl bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-2"
              >
                <span>Bắt đầu từ Bước 1: Đánh giá</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 5 Steps Interactive Pipeline Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            {/* Step 1 */}
            <div
              onClick={() => onNavigate('/dashboard/step1')}
              className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <span className="font-mono font-bold text-[10px] text-blue-600 px-1.5 py-0.5 rounded bg-blue-100">BƯỚC 1</span>
                <h3 className="text-xs font-bold text-slate-900 mt-2 group-hover:text-[#1677ff] transition">Đánh giá Chiến lược</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Canvas 5 thành tố & Bức tranh tầm nhìn doanh nghiệp</p>
              </div>
              <span className="text-[10px] font-semibold text-[#1677ff] mt-3 inline-flex items-center gap-0.5">Khám phá ›</span>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => onNavigate('/swot')}
              className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <span className="font-mono font-bold text-[10px] text-indigo-600 px-1.5 py-0.5 rounded bg-indigo-100">BƯỚC 2</span>
                <h3 className="text-xs font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition">Phân tích SWOT</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Điểm mạnh, Điểm yếu, Cơ hội và Thách thức cạnh tranh</p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-600 mt-3 inline-flex items-center gap-0.5">Khám phá ›</span>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => onNavigate('/strategy-formulation')}
              className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <span className="font-mono font-bold text-[10px] text-purple-600 px-1.5 py-0.5 rounded bg-purple-100">BƯỚC 3</span>
                <h3 className="text-xs font-bold text-slate-900 mt-2 group-hover:text-purple-600 transition">Xây dựng Chiến lược</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Ma trận SO, WO, ST, WT và lựa chọn giải pháp cốt lõi</p>
              </div>
              <span className="text-[10px] font-semibold text-purple-600 mt-3 inline-flex items-center gap-0.5">Khám phá ›</span>
            </div>

            {/* Step 4 */}
            <div
              onClick={() => onNavigate('/strategy-map')}
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <span className="font-mono font-bold text-[10px] text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-100">BƯỚC 4</span>
                <h3 className="text-xs font-bold text-slate-900 mt-2 group-hover:text-emerald-600 transition">Bản đồ Chiến lược</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Mô hình hóa quan hệ nhân quả 4 viễn cảnh BSC</p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 mt-3 inline-flex items-center gap-0.5">Khám phá ›</span>
            </div>

            {/* Step 5 */}
            <div
              onClick={() => onNavigate('/bsc-scorecard')}
              className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <span className="font-mono font-bold text-[10px] text-amber-600 px-1.5 py-0.5 rounded bg-amber-100">BƯỚC 5</span>
                <h3 className="text-xs font-bold text-slate-900 mt-2 group-hover:text-amber-600 transition">Đo lường & Báo cáo</h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Thẻ điểm cân bằng Scorecard & Quản lý Báo cáo BSC</p>
              </div>
              <span className="text-[10px] font-semibold text-amber-600 mt-3 inline-flex items-center gap-0.5">Khám phá ›</span>
            </div>
          </div>
        </div>

        {/* Right Widget: Việc trong ngày (1 col) */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col">
          <div className="text-xs font-bold text-slate-800 pb-3 border-b border-slate-100">
            Việc trong ngày
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
              <Inbox className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Chưa có công việc trong ngày</p>
          </div>
        </div>
      </div>
    </div>
  );
};
