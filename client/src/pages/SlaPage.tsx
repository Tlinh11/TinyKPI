import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  Search,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Check,
  Folder
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface SlaItem {
  id: string;
  taskType: string;
  durationHours: number;
  status: string;
}

interface SlaGroup {
  id: string;
  name: string;
  description?: string;
  items: SlaItem[];
}

export const SlaPage: React.FC = () => {
  const [groups, setGroups] = useState<SlaGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SlaGroup | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Group Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  // Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [taskType, setTaskType] = useState('');
  const [durationHours, setDurationHours] = useState('4');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSlaData = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<SlaGroup[]>('/sla');
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroup(data[0]);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải danh mục SLA' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlaData();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      await apiClient('/sla/groups', {
        method: 'POST',
        body: JSON.stringify({ name: groupName.trim(), description: groupDesc.trim() || undefined }),
      });
      setNotification({ type: 'success', message: 'Thêm nhóm SLA thành công' });
      setIsGroupModalOpen(false);
      setGroupName('');
      setGroupDesc('');
      loadSlaData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thêm nhóm SLA' });
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !taskType.trim()) return;

    try {
      await apiClient('/sla/items', {
        method: 'POST',
        body: JSON.stringify({
          groupId: selectedGroup.id,
          taskType: taskType.trim(),
          durationHours: parseFloat(durationHours) || 24,
        }),
      });
      setNotification({ type: 'success', message: 'Thêm công việc SLA thành công' });
      setIsItemModalOpen(false);
      setTaskType('');
      loadSlaData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thêm công việc' });
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Title & Action Bar matching TopKPI screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">QUẢN LÝ SLA</h1>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên nhóm..."
              className="w-full py-1.5 pl-3 pr-8 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={loadSlaData}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhóm gốc</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Split Panels matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Tên nhóm SLA (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-[#fafafa] px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-700">
            Tên nhóm SLA
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Chưa có nhóm SLA
              </div>
            ) : (
              filteredGroups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setSelectedGroup(g)}
                  className={`p-3.5 text-xs cursor-pointer flex items-center justify-between transition ${
                    selectedGroup?.id === g.id
                      ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold border-l-4 border-[#1677ff]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{g.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-normal">
                    {g.items?.length || 0}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Bảng công việc SLA (2 cols) */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="bg-[#fafafa] px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Chi tiết cam kết SLA — {selectedGroup?.name || 'Chọn nhóm bên trái'}
            </span>
            {selectedGroup && (
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1 bg-[#1677ff] text-white text-xs font-medium rounded-lg hover:bg-[#4096ff] transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm loại công việc</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50/50 text-slate-600 font-medium border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">STT</th>
                  <th className="py-2.5 px-4">Loại công việc</th>
                  <th className="py-2.5 px-4 w-40 text-center">Thời gian SLA</th>
                  <th className="py-2.5 px-4 w-28 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!selectedGroup || !selectedGroup.items || selectedGroup.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-400">
                      Chọn nhóm bên trái hoặc thêm mới công việc SLA
                    </td>
                  </tr>
                ) : (
                  selectedGroup.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3 px-4 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{item.taskType}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-[#1677ff] font-semibold text-[11px]">
                          <Clock className="w-3 h-3" />
                          {item.durationHours} giờ
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Đang áp dụng
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Thêm nhóm gốc */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Thêm nhóm SLA gốc</h2>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên nhóm SLA *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  placeholder="VD: Hỗ trợ kỹ thuật..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  rows={2}
                  placeholder="Mô tả phạm vi cam kết SLA..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Thêm nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm công việc SLA */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Thêm loại công việc SLA</h2>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loại công việc *</label>
                <input
                  type="text"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  required
                  placeholder="VD: Khắc phục sự cố mạng..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian cam kết (Giờ) *</label>
                <input
                  type="number"
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
