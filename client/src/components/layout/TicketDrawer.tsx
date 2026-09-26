import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LifeBuoy,
  X,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileQuestion,
  Phone,
  Mail,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Filter,
  Trash2,
  Check,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';

export interface SupportTicket {
  id: string;
  code: string;
  title: string;
  category: 'BUG' | 'FEATURE' | 'CONSULTING' | 'ACCESS' | 'GUIDE';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  module: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  userId?: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  response?: string;
  resolvedAt?: string;
}

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY' | 'HOTLINE'>('NEW');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('BUG');
  const [priority, setPriority] = useState<SupportTicket['priority']>('MEDIUM');
  const [moduleName, setModuleName] = useState('Chiến lược BSC (5 Bước)');
  const [description, setDescription] = useState('');

  // History filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<SupportTicket[]>('/tickets');
      if (Array.isArray(res)) {
        setTickets(res);
      }
    } catch (err) {
      console.warn('Could not load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setNotification({ type: 'error', message: 'Vui lòng nhập tiêu đề và nội dung mô tả chi tiết' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiClient<SupportTicket>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          category,
          priority,
          module: moduleName,
          description: description.trim(),
        }),
      });

      setNotification({
        type: 'success',
        message: `Gửi Ticket thành công! Mã số yêu cầu: ${res.code}. Đội ngũ hỗ trợ sẽ phản hồi theo chuẩn SLA.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('BUG');
      setPriority('MEDIUM');
      loadTickets();

      // Switch to history tab after 1.5s
      setTimeout(() => {
        setActiveTab('HISTORY');
        setNotification(null);
      }, 1600);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi gửi Ticket hỗ trợ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await apiClient(`/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadTickets();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Bạn có muốn xóa Ticket này?')) return;
    try {
      await apiClient(`/tickets/${ticketId}`, { method: 'DELETE' });
      loadTickets();
    } catch (err: any) {
      alert(err.message || 'Lỗi xóa');
    }
  };

  if (!isOpen) return null;

  const getCategoryMeta = (cat: SupportTicket['category']) => {
    switch (cat) {
      case 'BUG':
        return { label: 'Sự cố kỹ thuật', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'FEATURE':
        return { label: 'Đề xuất tính năng', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'CONSULTING':
        return { label: 'Tư vấn KPI/BSC', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'ACCESS':
        return { label: 'Cấp quyền & Tài khoản', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'GUIDE':
      default:
        return { label: 'Hướng dẫn sử dụng', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const getPriorityMeta = (pri: SupportTicket['priority']) => {
    switch (pri) {
      case 'URGENT':
        return { label: 'Khẩn cấp (SLA 1-2h)', color: 'bg-red-500 text-white' };
      case 'HIGH':
        return { label: 'Cao (SLA 4h)', color: 'bg-orange-500 text-white' };
      case 'MEDIUM':
        return { label: 'Trung bình (SLA 24h)', color: 'bg-blue-500 text-white' };
      case 'LOW':
      default:
        return { label: 'Thấp (SLA 48h)', color: 'bg-slate-400 text-white' };
    }
  };

  const getStatusBadge = (st: SupportTicket['status']) => {
    switch (st) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Chờ tiếp nhận
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            Đang xử lý
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Đã giải quyết
          </span>
        );
      case 'CLOSED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Đã đóng
          </span>
        );
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'OPEN') return t.status === 'OPEN';
    if (statusFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (statusFilter === 'RESOLVED') return t.status === 'RESOLVED' || t.status === 'CLOSED';
    return true;
  });

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-50">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between h-full">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-200">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Trung Tâm Hỗ Trợ & Ticket Phản Hồi</h2>
                  <p className="text-[11px] text-slate-500">Tiếp nhận sự cố kỹ thuật & tư vấn nghiệp vụ TinyKPI 24/7</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTab('NEW');
                  setNotification(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'NEW'
                    ? 'bg-white text-[#1677ff] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Ticket mới</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('HISTORY');
                  setNotification(null);
                  loadTickets();
                }}
                className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'HISTORY'
                    ? 'bg-white text-[#1677ff] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Lịch sử ({tickets.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('HOTLINE');
                  setNotification(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'HOTLINE'
                    ? 'bg-white text-[#1677ff] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hotline & Docs</span>
              </button>
            </div>
          </div>

          {/* Drawer Body Area */}
          <div className="flex-1 overflow-y-auto p-5">
            {notification && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${
                  notification.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
            )}

            {/* TAB 1: GỬI TICKET MỚI */}
            {activeTab === 'NEW' && (
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Loại yêu cầu hỗ trợ *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'BUG', label: '🐛 Báo lỗi sự cố', desc: 'Lỗi phần mềm, tính toán' },
                      { id: 'FEATURE', label: '💡 Đề xuất tính năng', desc: 'Cải tiến & mở rộng' },
                      { id: 'CONSULTING', label: '📊 Tư vấn KPI/BSC', desc: 'Xây dựng chỉ số hiệu suất' },
                      { id: 'ACCESS', label: '🔐 Quyền & Tài khoản', desc: 'Phân quyền, tài khoản' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCategory(item.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          category === item.id
                            ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-100'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-800">{item.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority & Module */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mức độ ưu tiên *
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] focus:ring-2 focus:ring-blue-50 bg-white font-medium cursor-pointer"
                    >
                      <option value="URGENT">🔴 Khẩn cấp (SLA 1-2h)</option>
                      <option value="HIGH">🟠 Cao (SLA 4h)</option>
                      <option value="MEDIUM">🔵 Trung bình (SLA 24h)</option>
                      <option value="LOW">🟢 Thấp (SLA 48h)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phân hệ liên quan
                    </label>
                    <select
                      value={moduleName}
                      onChange={(e) => setModuleName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] focus:ring-2 focus:ring-blue-50 bg-white font-medium cursor-pointer"
                    >
                      <option value="Chiến lược BSC (5 Bước)">Chiến lược BSC (5 Bước)</option>
                      <option value="Quy trình Master Process">Quy trình Master Process</option>
                      <option value="Quản lý Cam kết SLA">Quản lý Cam kết SLA</option>
                      <option value="Hộp thư công việc & Tasks">Hộp thư công việc & Tasks</option>
                      <option value="Cơ cấu Nhân sự & Phòng ban">Cơ cấu Nhân sự & Phòng ban</option>
                      <option value="Báo cáo & Phân tích KPI">Báo cáo & Phân tích KPI</option>
                      <option value="Quy tắc AI gợi ý KPI">Quy tắc AI gợi ý KPI</option>
                      <option value="Hệ thống chung">Hệ thống chung</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    <span className="text-red-500 mr-0.5">*</span> Tiêu đề yêu cầu
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="VD: Không tính toán được điểm hoàn thành KPI tại viễn cảnh Tài chính..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] focus:ring-2 focus:ring-blue-50 transition"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    <span className="text-red-500 mr-0.5">*</span> Mô tả chi tiết vấn đề hoặc nội dung cần tư vấn
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Mô tả cụ thể các bước thực hiện, thông báo lỗi nếu có, hoặc các chỉ số KPI cần chuyên gia TOPPION hỗ trợ..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] focus:ring-2 focus:ring-blue-50 resize-none transition"
                  />
                </div>

                {/* Contact auto-info preview */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    Thông tin người yêu cầu (Tự động liên kết):
                  </div>
                  <div>Họ tên: <span className="font-medium text-slate-800">{user?.fullName || 'Lê Thuận Khánh'}</span></div>
                  <div>Email: <span className="font-medium text-slate-800">{user?.email || 'Thuankhanh.hust@gmail.com'}</span></div>
                  <div className="text-[10px] text-slate-400">Đường dẫn hiện tại: {window.location.hash || '#/dashboard'}</div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-[#1677ff] hover:bg-[#4096ff] text-white font-semibold text-xs transition shadow-md shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Đang gửi Ticket...' : 'Gửi Phiếu Yêu Cầu Hỗ Trợ'}</span>
                </button>
              </form>
            )}

            {/* TAB 2: LỊCH SỬ TICKET */}
            {activeTab === 'HISTORY' && (
              <div className="space-y-3">
                {/* Filter */}
                <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-semibold pb-1 scrollbar-none">
                  {[
                    { id: 'ALL', label: `Tất cả (${tickets.length})` },
                    { id: 'OPEN', label: 'Chờ tiếp nhận' },
                    { id: 'IN_PROGRESS', label: 'Đang xử lý' },
                    { id: 'RESOLVED', label: 'Đã giải quyết' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-full shrink-0 transition cursor-pointer ${
                        statusFilter === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {isLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                    <span>Đang tải lịch sử Ticket...</span>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Chưa có Ticket nào</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Bấm tab "Gửi Ticket mới" nếu bạn cần hỗ trợ kỹ thuật.</p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const catMeta = getCategoryMeta(t.category);
                    const priMeta = getPriorityMeta(t.priority);

                    return (
                      <div
                        key={t.id}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-blue-300 transition space-y-2.5"
                      >
                        {/* Top row */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {t.code}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priMeta.color}`}>
                              {t.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(t.status)}
                            <button
                              onClick={() => handleDeleteTicket(t.id)}
                              className="text-slate-300 hover:text-red-500 p-0.5 transition cursor-pointer"
                              title="Xóa Ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Desc */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{t.title}</h4>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                            {t.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                            <span>Phân hệ: <b className="text-slate-600">{t.module}</b></span>
                            <span>•</span>
                            <span>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        {/* Response Block from Support */}
                        {t.response && (
                          <div className="bg-blue-50/80 border-l-3 border-blue-500 p-2.5 rounded-r-lg text-xs space-y-1">
                            <div className="text-[10px] font-bold text-blue-800 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-blue-600" />
                              <span>Phản hồi từ Đội ngũ Kỹ thuật TinyKPI:</span>
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed">{t.response}</p>
                          </div>
                        )}

                        {/* Quick Action Footer */}
                        {t.status === 'RESOLVED' && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Sự cố đã được xử lý xong
                            </span>
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'CLOSED')}
                              className="text-slate-500 hover:text-slate-800 text-[10px] font-medium underline cursor-pointer"
                            >
                              Xác nhận đóng ticket
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: HOTLINE & TÀI LIỆU */}
            {activeTab === 'HOTLINE' && (
              <div className="space-y-4 text-xs">
                {/* Contact Card */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white rounded-2xl border border-blue-200 p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Tổng Đài Hỗ Trợ Kỹ Thuật & Nghiệp Vụ</h4>
                      <p className="text-[11px] text-slate-500">Đội ngũ chuyên gia TOPPION & TinyKPI</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-blue-100/80 text-[11px]">
                    <div className="flex items-center justify-between py-1 border-b border-blue-100/50">
                      <span className="text-slate-500">Hotline 24/7:</span>
                      <a href="tel:19006886" className="font-bold text-[#1677ff] hover:underline text-xs">
                        1900-6886
                      </a>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-blue-100/50">
                      <span className="text-slate-500">Email tiếp nhận sự cố:</span>
                      <a href="mailto:support@tinykpi.vn" className="font-semibold text-slate-800 hover:underline">
                        support@tinykpi.vn
                      </a>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Thời gian làm việc:</span>
                      <span className="font-medium text-slate-700">T2 - T6 (08:00 - 18:00)</span>
                    </div>
                  </div>
                </div>

                {/* Cam kết SLA */}
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Tiêu Chuẩn Cam Kết Dịch Vụ (SLA Support)
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
                    <li><b className="text-red-600">Khẩn cấp:</b> Tiếp nhận và phản hồi giải pháp trong <b>30 - 60 phút</b>.</li>
                    <li><b className="text-orange-600">Ưu tiên cao:</b> Hoàn tất khắc phục hoặc xử lý tạm thời dưới <b>4 giờ</b>.</li>
                    <li><b className="text-blue-600">Tiêu chuẩn:</b> Giải quyết trong vòng <b>24 giờ làm việc</b>.</li>
                  </ul>
                </div>

                {/* Quick Docs links */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">Tài Liệu Hướng Dẫn Nhanh</h4>
                  <div className="space-y-1.5">
                    {[
                      { title: 'Quy trình 5 bước xây dựng Chiến lược BSC chuẩn', link: '#/dashboard/step1' },
                      { title: 'Hướng dẫn chuẩn hóa Master Process & Cam kết SLA', link: '#/master-process' },
                      { title: 'Tích hợp Trợ lý AI Google Gemini đề xuất bộ chỉ số KPI', link: '#/ai-rules' },
                      { title: 'Xuất & Nhập dữ liệu hàng loạt bằng file Excel (.xlsx)', link: '#/reports' },
                    ].map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.link}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 hover:border-blue-400 transition text-[11px] font-medium text-slate-700 hover:text-[#1677ff]"
                      >
                        <span className="truncate pr-2">📖 {doc.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-center text-[10px] text-slate-400 font-medium">
            Hệ thống TinyKPI Platform • Version 2026.09-linux • TOPPION Consulting
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
