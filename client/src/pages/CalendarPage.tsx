import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  X,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client.js';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'MEETING' | 'WORK' | 'STRATEGY' | 'DEADLINE';
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location?: string;
  organizer?: { fullName: string; avatar?: string };
}

interface TaskDeadline {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string;
  assignee?: { fullName: string };
}

export const CalendarPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [deadlines, setDeadlines] = useState<TaskDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date('2026-09-25'));
  const [selectedDay, setSelectedDay] = useState<number>(25);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MEETING',
    startTime: '2026-09-26T09:00',
    endTime: '2026-09-26T10:30',
    location: '',
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/calendar/events');
      if (res.data?.success) {
        setEvents(res.data.data?.events || []);
        setDeadlines(res.data.data?.taskDeadlines || []);
      }
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const res = await api.post('/api/calendar/events', formData);
      if (res.data?.success) {
        setShowModal(false);
        setFormData({
          title: '',
          description: '',
          type: 'MEETING',
          startTime: '2026-09-26T09:00',
          endTime: '2026-09-26T10:30',
          location: '',
        });
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'STRATEGY':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'DEADLINE':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'WORK':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1677ff] mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>QUẢN LÝ LỊCH LÀM VIỆC & SỰ KIỆN</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lịch Công tác & Sự kiện TinyKPI</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lên kế hoạch cuộc họp, theo dõi hạn chót hoàn thành nhiệm vụ và các mốc chiến lược.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo lịch sự kiện</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Calendar View (3 Cols) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{monthNames[currentMonth]} {currentYear}</span>
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date('2026-09-25'))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 transition"
              >
                Hôm nay
              </button>
              <button
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 uppercase pb-2">
            <div>Chủ nhật</div>
            <div>Thứ 2</div>
            <div>Thứ 3</div>
            <div>Thứ 4</div>
            <div>Thứ 5</div>
            <div>Thứ 6</div>
            <div>Thứ 7</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for month start offset */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-slate-50/50 rounded-lg border border-dashed border-slate-100" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isToday = day === 25 && currentMonth === 8 && currentYear === 2026;
              const isSelected = selectedDay === day;

              // Find events on this day
              const dayEvents = events.filter((e) => {
                const eDate = new Date(e.startTime);
                return (
                  eDate.getDate() === day &&
                  eDate.getMonth() === currentMonth &&
                  eDate.getFullYear() === currentYear
                );
              });

              // Find deadlines on this day
              const dayDeadlines = deadlines.filter((d) => {
                const dDate = new Date(d.dueDate);
                return (
                  dDate.getDate() === day &&
                  dDate.getMonth() === currentMonth &&
                  dDate.getFullYear() === currentYear
                );
              });

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`h-24 p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-400'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-[#1677ff] text-white shadow-xs'
                          : isSelected
                          ? 'text-blue-600 font-extrabold'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {(dayEvents.length > 0 || dayDeadlines.length > 0) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden mt-1">
                    {dayEvents.slice(0, 1).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] font-semibold truncate px-1 py-0.5 rounded border ${getEventBadge(
                          ev.type
                        )}`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayDeadlines.slice(0, 1).map((dl) => (
                      <div
                        key={dl.id}
                        className="text-[9px] font-bold truncate px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        ⏰ {dl.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Selected Day Details & Deadlines (1 Col) */}
        <div className="space-y-6">
          {/* Selected Day Agenda */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Lịch trình ngày {selectedDay}/{currentMonth + 1}/{currentYear}
            </h3>

            {events
              .filter((e) => new Date(e.startTime).getDate() === selectedDay)
              .map((ev) => (
                <div key={ev.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getEventBadge(ev.type)}`}>
                      {ev.type}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(ev.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 pt-0.5">{ev.title}</div>
                  {ev.description && <div className="text-slate-500 text-[11px] leading-relaxed">{ev.description}</div>}
                  {ev.location && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{ev.location}</span>
                    </div>
                  )}
                </div>
              ))}

            {events.filter((e) => new Date(e.startTime).getDate() === selectedDay).length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">Không có sự kiện nào trong ngày này.</div>
            )}
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Hạn chót công việc sắp tới</span>
            </h3>

            <div className="space-y-2.5">
              {deadlines.slice(0, 5).map((dl) => (
                <div key={dl.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs">
                  <div className="font-semibold text-slate-800 line-clamp-1">{dl.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Phụ trách: {dl.assignee?.fullName || 'Chưa gán'}</span>
                    <span className="text-amber-600 font-bold">{new Date(dl.dueDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Tạo lịch sự kiện / Cuộc họp mới</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tiêu đề sự kiện *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Họp Ban Giám Đốc đối soát BSC..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại sự kiện</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                  >
                    <option value="MEETING">Cuộc họp</option>
                    <option value="STRATEGY">Chiến lược BSC</option>
                    <option value="WORK">Công việc</option>
                    <option value="DEADLINE">Hạn chót</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Địa điểm</label>
                  <input
                    type="text"
                    placeholder="Phòng họp 1 / Online Zoom..."
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả nội dung</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú nội dung trao đổi..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
                >
                  Lưu sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
