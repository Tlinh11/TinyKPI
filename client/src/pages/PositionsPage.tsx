import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  MoreHorizontal,
  Search,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  Briefcase
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { Position } from '../types/index.js';

export const PositionsPage: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [syncId, setSyncId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadPositions = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<Position[]>('/positions');
      setPositions(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải chức vụ' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPos(null);
    setName('');
    setCode(`CV-${Math.floor(100 + Math.random() * 900)}`);
    setSyncId('');
    setDescription('');
    setStatus('ACTIVE');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pos: Position) => {
    setEditingPos(pos);
    setName(pos.name);
    setCode(pos.code || '');
    setSyncId(pos.syncId || '');
    setDescription(pos.description || '');
    setStatus(pos.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Vui lòng nhập Tên chức vụ');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        syncId: syncId.trim() || undefined,
        description: description.trim() || undefined,
        status,
      };

      if (editingPos) {
        await apiClient(`/positions/${editingPos.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setNotification({ type: 'success', message: 'Cập nhật chức vụ thành công' });
      } else {
        await apiClient('/positions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setNotification({ type: 'success', message: 'Thêm chức vụ mới thành công' });
      }

      setIsModalOpen(false);
      loadPositions();
    } catch (err: any) {
      setFormError(err.message || 'Lưu thất bại');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (pos: Position) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chức vụ "${pos.name}"?`)) return;
    try {
      await apiClient(`/positions/${pos.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa chức vụ' });
      loadPositions();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  const filteredPositions = positions.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Title & Action Bar matching TopKPI screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">QUẢN LÝ CHỨC VỤ</h1>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm ..."
              className="w-full py-1.5 pl-3 pr-8 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={loadPositions}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mới</span>
          </button>

          <button className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs">
            <MoreHorizontal className="w-4 h-4" />
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

      {/* Main Table matching screenshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-[#fafafa] text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Tên</th>
              <th className="py-3 px-4">Mô tả</th>
              <th className="py-3 px-4 w-36">SyncID</th>
              <th className="py-3 px-4 w-28 text-center">Trạng thái</th>
              <th className="py-3 px-4 w-28 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPositions.map((pos) => (
              <tr key={pos.id} className="hover:bg-blue-50/40 transition">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{pos.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-500">{pos.description || '—'}</td>
                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{pos.syncId || pos.code || '—'}</td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Hoạt động
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(pos)}
                      className="text-slate-400 hover:text-blue-600 p-1"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(pos)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm chức vụ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingPos ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePosition} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-red-500 mr-0.5">*</span> Tên chức vụ
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên chức vụ..."
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã chức vụ</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Mã chức vụ..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sync ID</label>
                  <input
                    type="text"
                    value={syncId}
                    onChange={(e) => setSyncId(e.target.value)}
                    placeholder="Sync ID..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả chức năng</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả trách nhiệm của chức vụ..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs disabled:opacity-60"
                >
                  {formLoading ? 'Đang lưu...' : (editingPos ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
