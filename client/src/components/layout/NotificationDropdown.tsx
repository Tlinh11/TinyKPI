import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Target,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../api/client.js';

export interface AppNotification {
  id: string;
  type: 'SLA_BREACH' | 'SLA_WARNING' | 'TASK_ASSIGNED' | 'TASK_APPROVAL' | 'KPI_UPDATE' | 'KPI_WARNING' | 'SYSTEM';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  metadata?: Record<string, any>;
}

interface NotificationDropdownProps {
  onNavigate?: (path: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'SLA' | 'TASKS' | 'KPI'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<{ notifications: AppNotification[]; unreadCount: number }>('/notifications');
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 60s
    const timer = setInterval(fetchNotifications, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient(`/notifications/${id}`, { method: 'DELETE' });
      const target = notifications.find((n) => n.id === id);
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (onNavigate && notification.link) {
      onNavigate(notification.link);
    } else if (notification.link) {
      window.location.hash = notification.link;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const now = Date.now();
      const past = new Date(isoString).getTime();
      const diffMinutes = Math.floor((now - past) / (1000 * 60));

      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    } catch {
      return 'Gần đây';
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'SLA_BREACH':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'SLA_WARNING':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'TASK_APPROVAL':
      case 'TASK_ASSIGNED':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'KPI_WARNING':
      case 'KPI_UPDATE':
        return <Target className="w-4 h-4 text-purple-600" />;
      case 'SYSTEM':
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getIconBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'SLA_BREACH':
        return 'bg-red-100/80 border-red-200';
      case 'SLA_WARNING':
        return 'bg-amber-100/80 border-amber-200';
      case 'TASK_APPROVAL':
      case 'TASK_ASSIGNED':
        return 'bg-blue-100/80 border-blue-200';
      case 'KPI_WARNING':
      case 'KPI_UPDATE':
        return 'bg-purple-100/80 border-purple-200';
      case 'SYSTEM':
      default:
        return 'bg-emerald-100/80 border-emerald-200';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'SLA') return n.type === 'SLA_BREACH' || n.type === 'SLA_WARNING';
    if (filter === 'TASKS') return n.type === 'TASK_ASSIGNED' || n.type === 'TASK_APPROVAL';
    if (filter === 'KPI') return n.type === 'KPI_UPDATE' || n.type === 'KPI_WARNING' || n.type === 'SYSTEM';
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition relative ${
          isOpen ? 'bg-blue-50 text-[#1677ff]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
        title="Trung tâm Thông báo"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 animate-ping opacity-75" />
          </>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1677ff] flex items-center justify-center font-bold">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 leading-tight">Trung tâm Thông báo</h3>
                <p className="text-[10px] text-slate-500">
                  {unreadCount > 0 ? (
                    <span className="text-blue-600 font-semibold">{unreadCount} thông báo chưa đọc</span>
                  ) : (
                    'Tất cả đã được xử lý'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchNotifications}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                title="Làm mới"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-blue-600 hover:bg-blue-50 transition"
                  title="Đánh dấu tất cả là đã đọc"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Đã đọc</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                title="Đóng"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 border-b border-slate-100 bg-white flex items-center gap-1 overflow-x-auto text-[10px] font-semibold scrollbar-none">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'UNREAD', label: `Chưa đọc (${unreadCount})` },
              { id: 'SLA', label: 'SLA' },
              { id: 'TASKS', label: 'Nhiệm vụ' },
              { id: 'KPI', label: 'KPI & AI' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-full shrink-0 transition ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Không có thông báo nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Bạn đã nắm bắt mọi thông tin trong hệ thống!</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 group relative ${
                    !notif.isRead ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Category Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getIconBg(
                      notif.type
                    )}`}
                  >
                    {getIcon(notif.type)}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs leading-snug truncate ${
                          !notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[9px] font-semibold text-[#1677ff] group-hover:underline flex items-center gap-0.5">
                        Xem chi tiết <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator & Dismiss button */}
                  <div className="absolute right-2.5 top-3 flex items-center gap-1">
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-2xs" title="Chưa đọc" />
                    )}
                    <button
                      onClick={(e) => handleDismiss(notif.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition p-0.5 rounded"
                      title="Ẩn thông báo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs font-semibold">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onNavigate) onNavigate('/tasks');
                else window.location.hash = '/tasks';
              }}
              className="text-[#1677ff] hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Xem Hộp thư công việc</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                if (onNavigate) onNavigate('/sla');
                else window.location.hash = '/sla';
              }}
              className="text-slate-500 hover:text-slate-800 text-[11px]"
            >
              Giám sát SLA ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
