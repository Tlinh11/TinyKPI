import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  RotateCw,
  UserX,
  Snowflake,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  X,
  Check,
  UserCheck,
  Filter,
  Calendar,
  FileText
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface LeaveRecord {
  id: string;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string | null;
  status: string; // ACTIVE, COMPLETED
  reason: string | null;
  freezeKpi: boolean;
  approvedBy: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar: string | null;
    status: string;
    department?: { id: string; name: string } | null;
    position?: { id: string; title: string } | null;
  };
}

interface UserOption {
  id: string;
  fullName: string;
  email: string;
  department?: { name: string } | null;
  position?: { title: string } | null;
}

const LEAVE_TYPES: Record<string, { label: string; badge: string; icon: string }> = {
  MATERNITY: { label: 'Nghỉ Thai sản', badge: 'bg-pink-50 text-pink-700 border-pink-200', icon: '🍼' },
  SICK: { label: 'Nghỉ Ốm dài ngày', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🩺' },
  UNPAID: { label: 'Nghỉ Không lương', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: '⏸️' },
  SABBATICAL: { label: 'Tạm hoãn Công tác', badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🛫' },
};

export const LeaveRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<LeaveRecord[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null);

  // Form Fields
  const [userId, setUserId] = useState('');
  const [leaveType, setLeaveType] = useState('MATERNITY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [freezeKpi, setFreezeKpi] = useState(true);
  const [approvedBy, setApprovedBy] = useState('Ban Quản Trị');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [leavesData, usersData] = await Promise.all([
        apiClient<LeaveRecord[]>('/settings/leaves'),
        apiClient<UserOption[]>('/users'),
      ]);
      setRecords(leavesData);
      setUsers(usersData);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải danh sách nghỉ dài hạn' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setUserId(users[0]?.id || '');
    setLeaveType('MATERNITY');
    setStartDate(new Date().toISOString().split('T')[0]);
    // Default 6 months for maternity
    const defaultEnd = new Date();
    defaultEnd.setMonth(defaultEnd.getMonth() + 6);
    setEndDate(defaultEnd.toISOString().split('T')[0]);
    setReason('Nghỉ chế độ thai sản theo quy định nhà nước');
    setFreezeKpi(true);
    setApprovedBy('Ban Giám Đốc & Phòng Nhân Sự');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: LeaveRecord) => {
    setEditingRecord(rec);
    setUserId(rec.userId);
    setLeaveType(rec.leaveType);
    setStartDate(rec.startDate.split('T')[0]);
    setEndDate(rec.endDate ? rec.endDate.split('T')[0] : '');
    setReason(rec.reason || '');
    setFreezeKpi(rec.freezeKpi);
    setApprovedBy(rec.approvedBy || '');
    setIsModalOpen(true);
  };

  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !startDate) return;

    try {
      setIsSubmitting(true);
      if (editingRecord) {
        await apiClient(`/settings/leaves/${editingRecord.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            endDate: endDate ? new Date(endDate).toISOString() : null,
            reason: reason || null,
            approvedBy: approvedBy || null,
          }),
        });
        setNotification({ type: 'success', message: 'Cập nhật bản ghi nghỉ thành công' });
      } else {
        await apiClient('/settings/leaves', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            leaveType,
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : null,
            reason,
            freezeKpi,
            approvedBy,
          }),
        });
        setNotification({ type: 'success', message: 'Đăng ký nghỉ chế độ thành công & đã đóng băng KPI' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thao tác dữ liệu nghỉ' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteLeave = async (rec: LeaveRecord) => {
    if (!confirm(`Xác nhận nhân sự "${rec.user.fullName}" đã kết thúc thời gian nghỉ và trở lại làm việc?`)) {
      return;
    }

    try {
      await apiClient(`/settings/leaves/${rec.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      setNotification({
        type: 'success',
        message: `Đã khôi phục trạng thái hoạt động và kích hoạt lại KPI cho ${rec.user.fullName}`,
      });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi khôi phục trạng thái' });
    }
  };

  const handleDeleteRecord = async (rec: LeaveRecord) => {
    if (!confirm(`Bạn có chắc muốn xóa bản ghi nghỉ dài hạn của ${rec.user.fullName}?`)) return;

    try {
      await apiClient(`/settings/leaves/${rec.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa bản ghi thành công' });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi xóa bản ghi' });
    }
  };

  // Metrics
  const activeLeaves = records.filter((r) => r.status === 'ACTIVE');
  const maternityCount = activeLeaves.filter((r) => r.leaveType === 'MATERNITY').length;
  const sickCount = activeLeaves.filter((r) => r.leaveType === 'SICK').length;
  const otherCount = activeLeaves.length - maternityCount - sickCount;

  // Filtered List
  const filtered = records.filter((r) => {
    const matchSearch =
      r.user?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.user?.email.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || r.leaveType === filterType;
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-800 via-pink-800 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
            <CalendarClock className="w-6 h-6 text-pink-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Quản lý Nhân sự Nghỉ dài hạn & Đóng băng KPI</h1>
            <p className="text-pink-100 text-xs mt-0.5">
              Theo dõi nhân sự nghỉ thai sản, nghỉ ốm dài ngày và tự động đóng băng chỉ tiêu KPI phòng ban
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Đăng ký nghỉ chế độ
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Đang nghỉ dài hạn</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-1">{activeLeaves.length} nhân sự</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5" />
              Đã đóng băng tính chỉ số
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Chế độ thai sản</span>
            <div className="text-2xl font-extrabold text-pink-600 mt-1">{maternityCount} người</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Thời hạn trung bình 6 tháng</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xl">
            🍼
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Nghỉ ốm & Điều trị</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{sickCount} người</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Theo chứng nhận y khoa</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            🩺
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Đã quay lại làm việc</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {records.filter((r) => r.status === 'COMPLETED').length} người
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã khôi phục tính KPI
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên nhân sự, email hoặc lý do..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">Tất cả hình thức nghỉ</option>
            <option value="MATERNITY">Nghỉ thai sản</option>
            <option value="SICK">Nghỉ ốm dài ngày</option>
            <option value="UNPAID">Nghỉ không hưởng lương</option>
            <option value="SABBATICAL">Tạm hoãn công tác</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang nghỉ</option>
            <option value="COMPLETED">Đã quay lại làm việc</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Nhân sự</th>
                <th className="py-3.5 px-4">Hình thức nghỉ</th>
                <th className="py-3.5 px-4">Thời gian nghỉ</th>
                <th className="py-3.5 px-4">Trạng thái KPI</th>
                <th className="py-3.5 px-4">Lý do & Người duyệt</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy nhân sự nghỉ dài hạn nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => {
                  const typeMeta = LEAVE_TYPES[rec.leaveType] || {
                    label: rec.leaveType,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: '📝',
                  };

                  const start = new Date(rec.startDate).toLocaleDateString('vi-VN');
                  const end = rec.endDate ? new Date(rec.endDate).toLocaleDateString('vi-VN') : 'Chưa định';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {rec.user?.avatar ? (
                              <img src={rec.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              rec.user?.fullName?.slice(0, 2).toUpperCase() || 'NV'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{rec.user?.fullName}</div>
                            <div className="text-[11px] text-slate-400">
                              {rec.user?.department?.name || 'N/A'} • {rec.user?.position?.title || 'Nhân viên'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${typeMeta.badge}`}
                        >
                          <span>{typeMeta.icon}</span>
                          <span>{typeMeta.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {start} → {end}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Đăng ký ngày: {new Date(rec.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {rec.freezeKpi ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <Snowflake className="w-3.5 h-3.5 text-sky-500" />
                            Đóng băng KPI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Vẫn tính KPI
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 line-clamp-1">{rec.reason || 'Không ghi rõ lý do'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Duyệt bởi: {rec.approvedBy || 'Ban Quản Trị'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {rec.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Đang nghỉ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đã đi làm lại
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rec.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleCompleteLeave(rec)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-semibold border border-emerald-200 transition"
                              title="Xác nhận nhân sự đã quay lại làm việc"
                            >
                              Đi làm lại
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(rec)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition"
                            title="Sửa bản ghi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md transition"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create/Edit Leave */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  {editingRecord ? 'Cập nhật Bản ghi Nghỉ Chế độ' : 'Đăng ký Nhân sự Nghỉ Dài hạn'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLeave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn nhân sự <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!!editingRecord}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden disabled:bg-slate-100"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email}) - {u.department?.name || 'Chưa gán PB'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hình thức nghỉ chế độ <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!!editingRecord}
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden disabled:bg-slate-100"
                >
                  <option value="MATERNITY">Nghỉ thai sản (Maternity Leave)</option>
                  <option value="SICK">Nghỉ ốm đau / Điều trị dài ngày</option>
                  <option value="UNPAID">Nghỉ không hưởng lương</option>
                  <option value="SABBATICAL">Tạm hoãn hợp đồng / Biệt phái</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày bắt đầu nghỉ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    disabled={!!editingRecord}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-hidden disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày dự kiến trở lại</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do chi tiết & Căn cứ phê duyệt</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Theo Giấy chứng sinh số 124/BVPS hoặc Đơn đề nghị đã duyệt..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Người phê duyệt</label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="Ví dụ: Giám đốc nhân sự..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold text-blue-900">Tự động đóng băng tính chỉ số KPI</div>
                    <div className="text-[10px] text-blue-600">Loại trừ nhân sự khỏi các kỳ đánh giá tháng/quý</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={freezeKpi}
                  onChange={(e) => setFreezeKpi(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  {editingRecord ? 'Lưu cập nhật' : 'Xác nhận đăng ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
