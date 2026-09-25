import React, { useState } from 'react';
import { Users, Bell, Grid, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenUserDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenUserDrawer,
}) => {
  const { user } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('Công ty');
  const [showAppLauncher, setShowAppLauncher] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'LK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left section: Toggle & Org Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition"
          title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Organization Selector */}
        <div className="relative">
          <div
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 select-none border border-transparent hover:border-slate-200 transition"
          >
            <span className="text-slate-500">Tổ chức:</span>
            <span className="font-semibold text-slate-800">{selectedOrg}</span>
            <Users className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <span className="text-[10px] text-slate-400 ml-0.5">⌄</span>
          </div>

          {showOrgDropdown && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 animate-fadeIn">
              <div
                onClick={() => {
                  setSelectedOrg('Công ty');
                  setShowOrgDropdown(false);
                }}
                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center justify-between cursor-pointer"
              >
                <span>Công ty (Mặc định)</span>
                {selectedOrg === 'Công ty' && <Check className="w-3.5 h-3.5 text-[#1677ff]" />}
              </div>
              <div
                onClick={() => {
                  setSelectedOrg('Chi nhánh Miền Bắc');
                  setShowOrgDropdown(false);
                }}
                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 flex items-center justify-between cursor-pointer"
              >
                <span>Chi nhánh Miền Bắc</span>
                {selectedOrg === 'Chi nhánh Miền Bắc' && <Check className="w-3.5 h-3.5 text-[#1677ff]" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Apps, Notifications, User Avatar */}
      <div className="flex items-center gap-3">
        {/* App Launcher (9 dots icon) */}
        <div className="relative">
          <button
            onClick={() => setShowAppLauncher(!showAppLauncher)}
            className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Danh mục phân hệ"
          >
            <Grid className="w-4 h-4" />
          </button>

          {showAppLauncher && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-50">
              <div className="text-xs font-semibold text-slate-500 mb-2 px-1">PHÂN HỆ TINYKPI</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <a href="#/dashboard" onClick={() => setShowAppLauncher(false)} className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 flex flex-col items-center gap-1 text-center font-medium text-blue-700">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">BSC</div>
                  <span>Chiến lược BSC</span>
                </a>
                <a href="#/master-process" onClick={() => setShowAppLauncher(false)} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex flex-col items-center gap-1 text-center font-medium">
                  <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">SOP</div>
                  <span>Quy trình Lõi</span>
                </a>
                <a href="#/sla" onClick={() => setShowAppLauncher(false)} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex flex-col items-center gap-1 text-center font-medium">
                  <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">SLA</div>
                  <span>Quản lý SLA</span>
                </a>
                <a href="#/employees" onClick={() => setShowAppLauncher(false)} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex flex-col items-center gap-1 text-center font-medium">
                  <div className="w-6 h-6 rounded bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">HR</div>
                  <span>Cơ cấu Nhân sự</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          onClick={() => alert('Không có thông báo mới')}
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative"
          title="Thông báo"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* User Avatar LK */}
        <button
          onClick={onOpenUserDrawer}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-sm hover:ring-2 hover:ring-blue-400 transition"
          title="Tài khoản cá nhân"
        >
          {getInitials(user?.fullName)}
        </button>
      </div>

      {/* Floating Ticket Button on the Right Edge */}
      <div
        onClick={() => alert('Hệ thống Ticket phản hồi TinyKPI: 1900-xxxx')}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-[11px] font-bold tracking-widest py-3 px-1 rounded-l-md shadow-lg cursor-pointer select-none z-40 [writing-mode:vertical-rl] transition"
      >
        TICKET
      </div>
    </header>
  );
};
