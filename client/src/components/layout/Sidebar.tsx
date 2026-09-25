import React, { useState } from 'react';
import {
  Workflow,
  HelpCircle,
  Calendar,
  Mail,
  Activity,
  FileSpreadsheet,
  ListTodo,
  Award,
  GraduationCap,
  Users,
  FileCode,
  Sparkles,
  MailCheck,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { ToppionLogo } from '../common/ToppionLogo.js';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isCollapsed,
}) => {
  const [orgOpen, setOrgOpen] = useState(true);

  const isActive = (path: string) => currentPath === path;

  const navItemClass = (path: string) =>
    `btn-interactive w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
      isActive(path)
        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
    }`;

  const stepItemClass = (path: string) =>
    `btn-interactive w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
      isActive(path)
        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
    }`;

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-200 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Logo */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-center">
          <div
            onClick={() => onNavigate('/dashboard')}
            className="btn-interactive cursor-pointer"
          >
            <ToppionLogo size="sm" showText={!isCollapsed} layout="horizontal" />
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Quick Dashboard */}
          <div>
            <button
              onClick={() => onNavigate('/dashboard')}
              className={navItemClass('/dashboard')}
              title="Dashboard BSC"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-blue-600" />
              {!isCollapsed && <span>Dashboard BSC</span>}
            </button>
          </div>

          {/* Section: CHIẾN LƯỢC BSC */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
                <span>CHIẾN LƯỢC BSC</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">
                  5 Bước
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => onNavigate('/dashboard/step1')}
                className={stepItemClass('/dashboard/step1')}
                title="B1: Đánh giá Chiến lược"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-blue-600">B1</span>
                {!isCollapsed && <span className="truncate">Đánh giá Chiến lược</span>}
              </button>

              <button
                onClick={() => onNavigate('/swot')}
                className={stepItemClass('/swot')}
                title="B2: Phân tích SWOT"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-indigo-600">B2</span>
                {!isCollapsed && <span className="truncate">Phân tích SWOT</span>}
              </button>

              <button
                onClick={() => onNavigate('/strategy-formulation')}
                className={stepItemClass('/strategy-formulation')}
                title="B3: Xây dựng Chiến lược"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-purple-600">B3</span>
                {!isCollapsed && <span className="truncate">Xây dựng Chiến lược</span>}
              </button>

              <button
                onClick={() => onNavigate('/strategy-map')}
                className={stepItemClass('/strategy-map')}
                title="B4: Bản đồ Chiến lược"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-emerald-600">B4</span>
                {!isCollapsed && <span className="truncate">Bản đồ Chiến lược</span>}
              </button>

              <button
                onClick={() => onNavigate('/bsc-scorecard')}
                className={stepItemClass('/bsc-scorecard')}
                title="B5: Báo cáo & Thẻ điểm BSC"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-amber-600">B5</span>
                {!isCollapsed && <span className="truncate">Báo cáo & Thẻ điểm BSC</span>}
              </button>
            </div>
          </div>

          {/* Section 1: TRIỂN KHAI QUY TRÌNH */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                TRIỂN KHAI QUY TRÌNH
              </div>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => onNavigate('/master-process')}
                className={navItemClass('/master-process')}
                title="Master Process"
              >
                <Workflow className="w-4 h-4 shrink-0 text-indigo-600" />
                {!isCollapsed && <span>Master Process</span>}
              </button>

              <button
                onClick={() => onNavigate('/sla')}
                className={navItemClass('/sla')}
                title="Quản lý SLA"
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                {!isCollapsed && <span>Quản lý SLA</span>}
              </button>

              <button
                onClick={() => onNavigate('/calendar')}
                className={navItemClass('/calendar')}
                title="Quản lý lịch làm việc"
              >
                <Calendar className="w-4 h-4 shrink-0 text-blue-500" />
                {!isCollapsed && <span>Quản lý lịch làm việc</span>}
              </button>

              <button
                onClick={() => onNavigate('/tasks')}
                className={navItemClass('/tasks')}
                title="Hộp thư công việc"
              >
                <Mail className="w-4 h-4 shrink-0 text-rose-500" />
                {!isCollapsed && <span>Hộp thư công việc</span>}
              </button>

              <button
                onClick={() => onNavigate('/monitoring')}
                className={navItemClass('/monitoring')}
                title="Monitoring"
              >
                <Activity className="w-4 h-4 shrink-0 text-teal-600" />
                {!isCollapsed && <span>Monitoring</span>}
              </button>

              <button
                onClick={() => onNavigate('/reports')}
                className={navItemClass('/reports')}
                title="Phân tích & Báo cáo"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-amber-600" />
                {!isCollapsed && <span>Phân tích & Báo cáo</span>}
              </button>

              <button
                onClick={() => onNavigate('/exam-bank')}
                className={navItemClass('/exam-bank')}
                title="Ngân hàng câu hỏi & Đề thi"
              >
                <ListTodo className="w-4 h-4 shrink-0 text-purple-600" />
                {!isCollapsed && <span>Ngân hàng đề thi</span>}
              </button>

              <button
                onClick={() => onNavigate('/exams')}
                className={navItemClass('/exams')}
                title="Thi Quy Trình"
              >
                <Award className="w-4 h-4 shrink-0 text-orange-500" />
                {!isCollapsed && <span>Thi Quy Trình</span>}
              </button>

              <button
                onClick={() => onNavigate('/training')}
                className={navItemClass('/training')}
                title="Quản lý & Học giáo trình"
              >
                <GraduationCap className="w-4 h-4 shrink-0 text-indigo-500" />
                {!isCollapsed && <span>Học giáo trình trực tuyến</span>}
              </button>
            </div>
          </div>

          {/* Section 2: THIẾT LẬP */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                THIẾT LẬP HỆ THỐNG
              </div>
            )}

            {/* Cơ cấu tổ chức Accordion */}
            <div>
              <button
                onClick={() => setOrgOpen(!orgOpen)}
                className="btn-interactive w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-slate-600 shrink-0" />
                  {!isCollapsed && <span>Cơ cấu tổ chức</span>}
                </div>
                {!isCollapsed && (
                  orgOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {orgOpen && !isCollapsed && (
                <div className="pl-7 pr-2 py-1 space-y-0.5 animate-fadeIn">
                  <button
                    onClick={() => onNavigate('/departments')}
                    className={`btn-interactive w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      isActive('/departments')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Danh Sách Bộ Phận
                  </button>

                  <button
                    onClick={() => onNavigate('/positions')}
                    className={`btn-interactive w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      isActive('/positions')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Danh Sách Chức vụ
                  </button>

                  <button
                    onClick={() => onNavigate('/employees')}
                    className={`btn-interactive w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      isActive('/employees')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Danh Sách Nhân Viên
                  </button>

                  <button
                    onClick={() => onNavigate('/org-chart')}
                    className={`btn-interactive w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      isActive('/org-chart')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Sơ đồ tổ chức
                  </button>
                  <button
                    onClick={() => onNavigate('/employees/on-leave')}
                    className={`btn-interactive w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      isActive('/employees/on-leave')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nghỉ dài hạn
                  </button>
                  <button
                    onClick={() => onNavigate('/roles')}
                    className={`btn-interactive w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      isActive('/roles')
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nhóm quyền
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('/forms')}
              className={navItemClass('/forms')}
              title="Quản lý biểu mẫu"
            >
              <FileCode className="w-4 h-4 shrink-0 text-slate-500" />
              {!isCollapsed && <span>Quản lý biểu mẫu</span>}
            </button>

            <button
              onClick={() => onNavigate('/ai-rules')}
              className={navItemClass('/ai-rules')}
              title="Quy tắc AI"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              {!isCollapsed && <span>Quy tắc AI</span>}
            </button>

            <button
              onClick={() => onNavigate('/email-settings')}
              className={navItemClass('/email-settings')}
              title="Cấu hình Email"
            >
              <MailCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              {!isCollapsed && <span>Cấu hình Email</span>}
            </button>

            <button
              onClick={() => onNavigate('/audit-logs')}
              className={navItemClass('/audit-logs')}
              title="Nhật ký kiểm toán"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
              {!isCollapsed && <span>Nhật ký kiểm toán</span>}
            </button>
          </div>
        </div>

        {/* Bottom Section: License & Version */}
        {!isCollapsed && (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Bản quyền phần mềm</div>
            <div className="font-mono text-[11px] font-bold text-blue-600 mt-0.5">8DDD-6938-961F-4A2F</div>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="btn-interactive mt-2.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold shadow-2xs transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Xóa bộ nhớ đệm</span>
            </button>

            <div className="mt-2 text-[9px] text-slate-400">TinyKPI v2026.09-linux</div>
          </div>
        )}
      </div>
    </aside>
  );
};
