import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Table,
  Upload,
  Settings,
  FolderOpen,
  FileText,
  Workflow,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface Process {
  id: string;
  title: string;
  category: string; // CORE, SUPPORT, DOCUMENT
  code?: string;
  version?: string;
  description?: string;
  department?: { id: string; name: string };
}

export const MasterProcessPage: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<'CORE' | 'SUPPORT' | 'DOCUMENT'>('CORE');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [version, setVersion] = useState('1.0');
  const [description, setDescription] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadProcesses = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<Process[]>('/processes');
      setProcesses(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải quy trình' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  const handleCreateProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await apiClient('/processes', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          category: modalCategory,
          code: code.trim() || undefined,
          version,
          description: description.trim() || undefined,
        }),
      });

      setNotification({ type: 'success', message: 'Thêm quy trình thành công' });
      setIsModalOpen(false);
      setTitle('');
      setCode('');
      setDescription('');
      loadProcesses();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thêm quy trình' });
    }
  };

  const coreProcesses = processes.filter((p) => p.category === 'CORE');
  const supportProcesses = processes.filter((p) => p.category === 'SUPPORT');
  const docProcesses = processes.filter((p) => p.category === 'DOCUMENT');

  return (
    <div className="space-y-4">
      {/* Title & Action Controls matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">MASTER PROCESS</h1>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-56">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm ..."
              className="w-full py-1.5 pl-3 pr-8 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filter dropdown */}
          <select className="py-1.5 px-3 text-xs bg-white border border-slate-200 rounded-lg outline-none text-slate-600 shadow-xs">
            <option>Lọc chức vụ</option>
          </select>

          {/* Table view toggle */}
          <button
            onClick={() => alert('Chế độ xem dạng bảng')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition shadow-xs"
          >
            <Table className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem dạng bảng</span>
          </button>

          {/* Import */}
          <button
            onClick={() => alert('Import Excel / JSON nghiệp vụ TinyKPI')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Excel / JSON</span>
          </button>

          {/* Add Core Button */}
          <button
            onClick={() => {
              setModalCategory('CORE');
              setIsModalOpen(true);
            }}
            className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mới</span>
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

      {/* Group 1: Quy trình lõi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Quy trình lõi</h2>
          <button
            onClick={() => alert('Quản lý nhóm quy trình')}
            className="flex items-center gap-1 px-3 py-1 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Quản lý nhóm</span>
          </button>
        </div>

        <div className="mt-3">
          {coreProcesses.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <FolderOpen className="w-10 h-10 text-slate-300 mb-1" />
              <p className="text-xs text-slate-400">Chưa có quy trình lõi phù hợp với bộ lọc</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coreProcesses.map((p) => (
                <div key={p.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-blue-50/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-[#1677ff]" />
                      {p.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1677ff] text-[10px] font-semibold">
                      v{p.version || '1.0'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description || 'Chưa có mô tả'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Group 2: Quy trình hỗ trợ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Quy trình hỗ trợ</h2>
          <button
            onClick={() => {
              setModalCategory('SUPPORT');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1677ff] text-white text-xs font-medium hover:bg-[#4096ff] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mới</span>
          </button>
        </div>

        <div className="mt-3">
          {supportProcesses.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <FolderOpen className="w-10 h-10 text-slate-300 mb-1" />
              <p className="text-xs text-slate-400">Chưa có quy trình hỗ trợ phù hợp với bộ lọc</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supportProcesses.map((p) => (
                <div key={p.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-blue-50/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                      {p.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                      v{p.version || '1.0'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description || 'Chưa có mô tả'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Group 3: Văn bản */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Văn bản</h2>
          <button
            onClick={() => {
              setModalCategory('DOCUMENT');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1677ff] text-white text-xs font-medium hover:bg-[#4096ff] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm mới</span>
          </button>
        </div>

        <div className="mt-3">
          {docProcesses.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <FolderOpen className="w-10 h-10 text-slate-300 mb-1" />
              <p className="text-xs text-slate-400">Chưa có văn bản nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {docProcesses.map((p) => (
                <div key={p.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-blue-50/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      {p.title}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{p.code || 'DOC-01'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description || 'Chưa có mô tả'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Thêm quy trình */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Thêm {modalCategory === 'CORE' ? 'Quy trình lõi' : modalCategory === 'SUPPORT' ? 'Quy trình hỗ trợ' : 'Văn bản'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProcess} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên quy trình / văn bản *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Nhập tên..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã quy trình</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: QT-01..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phiên bản</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả tóm tắt</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả mục tiêu và phạm vi áp dụng..."
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
