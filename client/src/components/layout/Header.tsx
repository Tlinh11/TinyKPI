import React, { useState, useRef, useEffect } from 'react';
import { Users, Bell, Grid, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { NotificationDropdown } from './NotificationDropdown.js';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenUserDrawer: () => void;
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenUserDrawer,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('Công ty');
  const [showAppLauncher, setShowAppLauncher] = useState(false);

  const orgRef = useRef<HTMLDivElement>(null);

  const appLauncherRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setShowOrgDropdown(false);
      }
      if (appLauncherRef.current && !appLauncherRef.current.contains(event.target as Node)) {
        setShowAppLauncher(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'LK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left section: Toggle & Org Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="btn-interactive w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Organization Selector */}
        <div className="relative" ref={orgRef}>
          <div
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 select-none border border-transparent hover:border-slate-200 transition"
          >
            <span className="text-slate-400">Tổ chức:</span>
            <span className="font-semibold text-slate-900">{selectedOrg}</span>
            <Users className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <span className="text-[10px] text-slate-400 ml-0.5">⌄</span>
          </div>

          {showOrgDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-slideDown">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Chọn cơ cấu tổ chức
              </div>
              <div
                onClick={() => {
                  setSelectedOrg('Công ty');
                  setShowOrgDropdown(false);
                }}
                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between cursor-pointer transition"
              >
                <span className="font-medium">Công ty (Mặc định)</span>
                {selectedOrg === 'Công ty' && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
              </div>
              <div
                onClick={() => {
                  setSelectedOrg('Chi nhánh Miền Bắc');
                  setShowOrgDropdown(false);
                }}
                className="px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between cursor-pointer transition"
              >
                <span className="font-medium">Chi nhánh Miền Bắc</span>
                {selectedOrg === 'Chi nhánh Miền Bắc' && <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Apps, Notifications, User Avatar */}
      <div className="flex items-center gap-2.5">
        {/* App Launcher (9 dots icon) */}
        <div className="relative" ref={appLauncherRef}>
          <button
            onClick={() => setShowAppLauncher(!showAppLauncher)}
            className="btn-interactive w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Danh mục phân hệ"
          >
            <Grid className="w-4 h-4" />
          </button>

          {showAppLauncher && (
            <div className="absolute right-0 top-full mt-2 w-68 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 z-50 animate-slideDown">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                PHÂN HỆ HỆ THỐNG TINYKPI
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <a
                  href="#/dashboard"
                  onClick={() => setShowAppLauncher(false)}
                  className="card-hover-elevate p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100/70 border border-blue-100 flex flex-col items-center gap-1.5 text-center font-semibold text-blue-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                    BSC
                  </div>
                  <span>Chiến lược BSC</span>
                </a>
                <a
                  href="#/master-process"
                  onClick={() => setShowAppLauncher(false)}
                  className="card-hover-elevate p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex flex-col items-center gap-1.5 text-center font-semibold text-slate-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                    SOP
                  </div>
                  <span>Quy trình Lõi</span>
                </a>
                <a
                  href="#/sla"
                  onClick={() => setShowAppLauncher(false)}
                  className="card-hover-elevate p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex flex-col items-center gap-1.5 text-center font-semibold text-slate-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                    SLA
                  </div>
                  <span>Quản lý SLA</span>
                </a>
                <a
                  href="#/employees"
                  onClick={() => setShowAppLauncher(false)}
                  className="card-hover-elevate p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex flex-col items-center gap-1.5 text-center font-semibold text-slate-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
                    HR
                  </div>
                  <span>Cơ cấu Nhân sự</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Hub */}
        <NotificationDropdown onNavigate={onNavigate} />

        {/* User Avatar LK */}
        <button
          onClick={onOpenUserDrawer}
          className="btn-interactive w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-2xs hover:ring-2 hover:ring-blue-400 transition"
          title="Tài khoản cá nhân"
        >
          {getInitials(user?.fullName)}
        </button>
      </div>
    </header>
  );
};

