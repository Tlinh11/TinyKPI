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
  BookOpen,
  GraduationCap,
  Users,
  FileCode,
  Sparkles,
  MailCheck,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  ShieldCheck,
  Smartphone
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

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-200 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Logo */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-center">
          <div
            onClick={() => onNavigate('/dashboard')}
            className="cursor-pointer"
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isActive('/dashboard')
                  ? 'bg-[#e6f4ff] text-[#1677ff]'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Dashboard BSC</span>}
            </button>
          </div>

          {/* Section: CHIẾN LƯỢC BSC */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-[#1677ff] uppercase tracking-wider px-3 mb-1.5 flex items-center justify-between">
                <span>CHIẾN LƯỢC BSC</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-[#1677ff]">5 Bước</span>
              </div>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => onNavigate('/dashboard/step1')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/dashboard/step1')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="B1: Đánh giá Chiến lược"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-blue-600">B1</span>
                {!isCollapsed && <span className="truncate">Đánh giá Chiến lược</span>}
              </button>

              <button
                onClick={() => onNavigate('/swot')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/swot')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="B2: Phân tích SWOT"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-indigo-600">B2</span>
                {!isCollapsed && <span className="truncate">Phân tích SWOT</span>}
              </button>

              <button
                onClick={() => onNavigate('/strategy-formulation')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/strategy-formulation')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="B3: Xây dựng Chiến lược"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-purple-600">B3</span>
                {!isCollapsed && <span className="truncate">Xây dựng Chiến lược</span>}
              </button>

              <button
                onClick={() => onNavigate('/strategy-map')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/strategy-map')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="B4: Bản đồ Chiến lược"
              >
                <span className="w-4 text-center font-mono font-bold text-[10px] text-emerald-600">B4</span>
                {!isCollapsed && <span className="truncate">Bản đồ Chiến lược</span>}
              </button>

              <button
                onClick={() => onNavigate('/bsc-scorecard')}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive('/bsc-scorecard')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/master-process')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Master Process"
              >
                <Workflow className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Master Process</span>}
              </button>

              <button
                onClick={() => onNavigate('/sla')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/sla')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Quản lý SLA"
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Quản lý SLA</span>}
              </button>

              <button
                onClick={() => onNavigate('/calendar')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/calendar')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Quản lý lịch làm việc"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Quản lý lịch làm việc</span>}
              </button>

              <button
                onClick={() => onNavigate('/tasks')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/tasks')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Hộp thư công việc"
              >
                <Mail className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Hộp thư công việc</span>}
              </button>

              <button
                onClick={() => onNavigate('/monitoring')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/monitoring')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Monitoring"
              >
                <Activity className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Monitoring</span>}
              </button>

              <button
                onClick={() => onNavigate('/reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/reports')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Phân tích & Báo cáo"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Phân tích & Báo cáo</span>}
              </button>

              <button
                onClick={() => onNavigate('/exam-bank')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/exam-bank')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Ngân hàng câu hỏi & Đề thi"
              >
                <ListTodo className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Ngân hàng câu hỏi & Đề thi</span>}
              </button>

              <button
                onClick={() => onNavigate('/exams')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/exams')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Thi Quy Trình"
              >
                <Award className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Thi Quy Trình</span>}
              </button>

              <button
                onClick={() => onNavigate('/training')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive('/training')
                    ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Quản lý & Học giáo trình"
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Học giáo trình trực tuyến</span>}
              </button>
            </div>
          </div>

          {/* Section 2: THIẾT LẬP */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                THIẾT LẬP
              </div>
            )}

            {/* Cơ cấu tổ chức Accordion */}
            <div>
              <button
                onClick={() => setOrgOpen(!orgOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
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
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition ${
                      isActive('/departments')
                        ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Danh Sách Bộ Phận
                  </button>

                  <button
                    onClick={() => onNavigate('/positions')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition ${
                      isActive('/positions')
                        ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Danh Sách Chức vụ
                  </button>

                  <button
                    onClick={() => onNavigate('/employees')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition ${
                      isActive('/employees')
                        ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Danh Sách Nhân Viên
                  </button>

                  <button
                    onClick={() => onNavigate('/org-chart')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition ${
                      isActive('/org-chart')
                        ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Sơ đồ tổ chức
                  </button>
                  <button
                    onClick={() => onNavigate('/employees/on-leave')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition ${
                      isActive('/employees/on-leave')
                        ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nghỉ dài hạn
                  </button>
                  <button
                    onClick={() => onNavigate('/roles')}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition ${
                      isActive('/roles')
                        ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition mt-0.5 ${
                isActive('/forms')
                  ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Quản lý biểu mẫu"
            >
              <FileCode className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Quản lý biểu mẫu</span>}
            </button>

            <button
              onClick={() => onNavigate('/ai-rules')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive('/ai-rules')
                  ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Quy tắc AI"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
              {!isCollapsed && <span>Quy tắc AI</span>}
            </button>

            <button
              onClick={() => onNavigate('/email-settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive('/email-settings')
                  ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Cấu hình Email"
            >
              <MailCheck className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Cấu hình Email</span>}
            </button>

            <button
              onClick={() => onNavigate('/audit-logs')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isActive('/audit-logs')
                  ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Nhật ký kiểm toán"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
              {!isCollapsed && <span>Nhật ký kiểm toán</span>}
            </button>
          </div>
        </div>

        {/* Bottom Section: License & Version */}
        {!isCollapsed && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col items-center text-center">
            <div className="w-10 h-10 mb-1 flex items-center justify-center text-blue-500">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="text-[11px] text-slate-400 font-medium">License</div>
            <div className="text-xs font-semibold text-[#1677ff] mt-0.5">8DDD-6938-961F-4A2F</div>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="mt-3 px-4 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs transition"
            >
              Clear Cache
            </button>

            <div className="mt-4 text-[10px] text-slate-400">Version: 2026.09.8152-linux</div>
          </div>
        )}
      </div>
    </aside>
  );
};
