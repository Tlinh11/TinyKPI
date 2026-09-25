import React, { useState } from 'react';
import {
  RotateCw,
  LayoutGrid,
  Filter,
  Download,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Target,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  ChevronRight,
  Compass,
  FileSpreadsheet,
  Workflow,
  HelpCircle,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

interface DailyTask {
  id: string;
  title: string;
  dueTime: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  department: string;
  isDone: boolean;
}

const INITIAL_TASKS: DailyTask[] = [
  {
    id: 'T-1',
    title: 'Duyệt cập nhật chỉ số KPI Quý 3 phòng Kinh doanh',
    dueTime: '11:30',
    priority: 'HIGH',
    department: 'Sales & Marketing',
    isDone: false,
  },
  {
    id: 'T-2',
    title: 'Đánh giá SLA Quy trình Hỗ trợ kỹ thuật tuần 38',
    dueTime: '14:00',
    priority: 'HIGH',
    department: 'Kỹ thuật',
    isDone: false,
  },
  {
    id: 'T-3',
    title: 'Họp điều chỉnh mục tiêu viễn cảnh Khách hàng BSC',
    dueTime: '16:30',
    priority: 'MEDIUM',
    department: 'Ban Giám Đốc',
    isDone: false,
  },
  {
    id: 'T-4',
    title: 'Gửi báo cáo phân tích độ lệch KPI lên Neon DB',
    dueTime: '09:00',
    priority: 'LOW',
    department: 'Nhân sự',
    isDone: true,
  },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<DailyTask[]>(INITIAL_TASKS);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('PENDING');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'PENDING') return !t.isDone;
    if (taskFilter === 'DONE') return t.isDone;
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>HỆ THỐNG ĐIỀU HÀNH CHIẾN LƯỢC</span>
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Tổng Quan Chiến Lược & Hiệu Suất TinyKPI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi chu trình khép kín: Canvas ➔ SWOT ➔ Xây dựng Chiến lược ➔ Bản đồ BSC ➔ Thẻ điểm & Báo cáo.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            className={`btn-interactive w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-2xs ${
              isRefreshing ? 'animate-spin text-blue-600' : ''
            }`}
            title="Làm mới dữ liệu"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('/reports')}
            className="btn-interactive inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Báo cáo Phân tích</span>
          </button>

          <button
            onClick={() => onNavigate('/bsc-scorecard')}
            className="btn-interactive inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold shadow-sm transition"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Thẻ Điểm BSC</span>
          </button>
        </div>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="card-hover-elevate bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Doanh thu Thực hiện</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums">16.2 tỷ</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                +12.4%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Đạt 108% so với kế hoạch quý 3</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card-hover-elevate bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Tuân thủ Thời hạn SLA</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums">92.0%</span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                Mục tiêu 95%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">112 / 120 phiếu xử lý đúng hạn cam kết</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card-hover-elevate bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Mục tiêu BSC Đạt chuẩn</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums">18 / 20</span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">
                90.0%
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Phân bổ đều qua 4 viễn cảnh Kaplan</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card-hover-elevate bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Chỉ số Sức khỏe Vận hành</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-indigo-600 tabular-nums">94.6</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                Hạng A
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Đồng bộ tự động từ Neon Cloud DB</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Strategic 5-Step Pipeline (3 Cols) + Daily Work Action Center (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 cols: 5-step strategic roadmap */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900">
                  LỘ TRÌNH 5 BƯỚC HOẠCH ĐỊNH CHIẾN LƯỢC BSC & KPI
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Chu trình tích hợp kết nối liền mạch từ tầm nhìn, phân tích ma trận đến sơ đồ nguyên nhân - kết quả.
              </p>
            </div>

            <button
              onClick={() => onNavigate('/dashboard/step1')}
              className="btn-interactive inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition shrink-0"
            >
              <span>Bắt đầu Bước 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Connected Step Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Step 1 */}
            <div
              onClick={() => onNavigate('/dashboard/step1')}
              className="card-hover-elevate btn-interactive p-4 rounded-xl border border-blue-200/80 bg-gradient-to-b from-blue-50/60 to-white flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-blue-700 px-2 py-0.5 rounded-md bg-blue-100 border border-blue-200">
                    BƯỚC 1
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã hoàn thành thiết lập" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-blue-600 transition">
                  Đánh giá Chiến lược
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  Canvas 5 thành tố & Bức tranh tầm nhìn doanh nghiệp
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-blue-100/60 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                <span>Vào thực hiện</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => onNavigate('/swot')}
              className="card-hover-elevate btn-interactive p-4 rounded-xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/60 to-white flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-100 border border-indigo-200">
                    BƯỚC 2
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã hoàn thành phân tích" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-indigo-600 transition">
                  Phân tích SWOT
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  Điểm mạnh, Điểm yếu, Cơ hội và Thách thức cạnh tranh
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-indigo-100/60 flex items-center justify-between text-[11px] font-semibold text-indigo-600">
                <span>Vào thực hiện</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => onNavigate('/strategy-formulation')}
              className="card-hover-elevate btn-interactive p-4 rounded-xl border border-purple-200/80 bg-gradient-to-b from-purple-50/60 to-white flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-purple-700 px-2 py-0.5 rounded-md bg-purple-100 border border-purple-200">
                    BƯỚC 3
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đang vận hành" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-purple-600 transition">
                  Xây dựng Chiến lược
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  Ma trận SO, WO, ST, WT và lựa chọn giải pháp cốt lõi
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-purple-100/60 flex items-center justify-between text-[11px] font-semibold text-purple-600">
                <span>Vào thực hiện</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Step 4 */}
            <div
              onClick={() => onNavigate('/strategy-map')}
              className="card-hover-elevate btn-interactive p-4 rounded-xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-white flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200">
                    BƯỚC 4
                  </span>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Trọng tâm thực thi" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-emerald-600 transition">
                  Bản đồ Chiến lược
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  Mô hình hóa quan hệ nhân quả 4 viễn cảnh BSC
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-emerald-100/60 flex items-center justify-between text-[11px] font-semibold text-emerald-600">
                <span>Vào thực hiện</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Step 5 */}
            <div
              onClick={() => onNavigate('/bsc-scorecard')}
              className="card-hover-elevate btn-interactive p-4 rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/60 to-white flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-amber-700 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-200">
                    BƯỚC 5
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Báo cáo liên tục" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-amber-600 transition">
                  Đo lường & Báo cáo
                </h3>
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  Thẻ điểm cân bằng Scorecard & Quản lý Báo cáo BSC
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-amber-100/60 flex items-center justify-between text-[11px] font-semibold text-amber-600">
                <span>Vào thực hiện</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </div>

          {/* Quick Module Shortcuts Banner */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">Phím tắt nhanh phân hệ:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onNavigate('/master-process')}
                className="btn-interactive px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-400 hover:text-blue-600 transition shadow-2xs"
              >
                Quy trình Lõi
              </button>
              <button
                onClick={() => onNavigate('/sla')}
                className="btn-interactive px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-400 hover:text-blue-600 transition shadow-2xs"
              >
                Giám sát SLA
              </button>
              <button
                onClick={() => onNavigate('/calendar')}
                className="btn-interactive px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-400 hover:text-blue-600 transition shadow-2xs"
              >
                Lịch làm việc
              </button>
              <button
                onClick={() => onNavigate('/org-chart')}
                className="btn-interactive px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-400 hover:text-blue-600 transition shadow-2xs"
              >
                Sơ đồ Tổ chức
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 col: Daily Tasks & Priority Center */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Việc Trong Ngày
                </h3>
                <span className="text-[11px] text-slate-400">
                  {tasks.filter((t) => !t.isDone).length} nhiệm vụ cần xử lý
                </span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg mt-3 text-[11px] font-medium">
              <button
                onClick={() => setTaskFilter('PENDING')}
                className={`flex-1 py-1 rounded-md text-center transition ${
                  taskFilter === 'PENDING'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chờ xử lý ({tasks.filter((t) => !t.isDone).length})
              </button>
              <button
                onClick={() => setTaskFilter('DONE')}
                className={`flex-1 py-1 rounded-md text-center transition ${
                  taskFilter === 'DONE'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã xong ({tasks.filter((t) => t.isDone).length})
              </button>
            </div>

            {/* Task Items */}
            <div className="mt-3.5 space-y-2.5 max-h-[380px] overflow-y-auto pr-0.5">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-70" />
                  <span>Không còn công việc nào trong danh mục này</span>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`card-hover-elevate p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                      task.isDone
                        ? 'bg-slate-50/70 border-slate-200/60 opacity-60'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        task.isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                      }`}
                    >
                      {task.isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-semibold leading-snug ${
                          task.isDone ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 flex-wrap">
                        <span className="font-mono font-medium text-slate-500">
                          {task.dueTime}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 truncate">{task.department}</span>
                        {task.priority === 'HIGH' && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            Khẩn cấp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Mark All Done Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Hạn chót: Hôm nay</span>
            <button
              onClick={() => onNavigate('/tasks')}
              className="btn-interactive text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
