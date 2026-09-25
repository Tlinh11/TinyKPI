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
  Building,
  FolderTree,
  Download,
  Upload
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { Department } from '../types/index.js';
import { exportToExcel } from '../utils/excel.js';
import { ExcelImportModal } from '../components/common/ExcelImportModal.js';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [syncId, setSyncId] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [type, setType] = useState('DEPARTMENT');
  const [order, setOrder] = useState(1);
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDepartments = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<Department[]>('/departments');
      setDepartments(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải danh sách bộ phận' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenCreateModal = (parent?: Department) => {
    setEditingDept(null);
    setName('');
    setCode(`BP-${Math.floor(100 + Math.random() * 900)}`);
    setSyncId('');
    setAbbreviation('');
    setParentId(parent ? parent.id : (departments.length > 0 ? departments[0].id : ''));
    setType('DEPARTMENT');
    setOrder(departments.length + 1);
    setDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code || '');
    setSyncId(dept.syncId || '');
    setAbbreviation(dept.abbreviation || '');
    setParentId(dept.parentId || '');
    setType(dept.type || 'DEPARTMENT');
    setOrder(dept.order || 1);
    setDescription(dept.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Vui lòng nhập Tên bộ phận');
      return;
    }

    try {
      setFormLoading(true);
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        syncId: syncId.trim() || undefined,
        abbreviation: abbreviation.trim() || undefined,
        parentId: parentId || null,
        type,
        order: Number(order),
        description: description.trim() || undefined,
      };

      if (editingDept) {
        await apiClient(`/departments/${editingDept.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setNotification({ type: 'success', message: 'Cập nhật bộ phận thành công' });
      } else {
        await apiClient('/departments', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setNotification({ type: 'success', message: 'Thêm bộ phận mới thành công' });
      }

      setIsModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      setFormError(err.message || 'Lưu thất bại');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bộ phận "${dept.name}"?`)) return;
    try {
      await apiClient(`/departments/${dept.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa bộ phận' });
      loadDepartments();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
  );

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleExportExcel = () => {
    if (departments.length === 0) {
      setNotification({ type: 'error', message: 'Không có dữ liệu phòng ban để xuất Excel' });
      return;
    }

    exportToExcel<Department>({
      data: departments,
      fileName: `Danh_Sach_Phong_Ban_TinyKPI_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Phòng ban',
      columns: [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã phòng ban', key: 'code', width: 16 },
        { header: 'Tên bộ phận / Phòng ban', key: 'name', width: 28 },
        { header: 'Viết tắt', key: 'abbreviation', width: 14 },
        { header: 'Phân loại', key: 'type', width: 16, format: (t) => (t === 'COMPANY' ? 'Công ty' : t === 'SUBSIDIARY' ? 'Chi nhánh' : 'Phòng ban') },
        { header: 'Thứ tự', key: 'order', width: 10 },
        { header: 'Mô tả', key: 'description', width: 30 },
      ],
    });
    setNotification({ type: 'success', message: `Đã xuất ${departments.length} bộ phận ra file Excel (.xlsx) thành công!` });
  };

  const handleConfirmImport = async (rows: any[]) => {
    const res = await apiClient<{ importedCount: number; errors: string[] }>('/departments/bulk', {
      method: 'POST',
      body: JSON.stringify(rows),
    });
    loadDepartments();
    return {
      success: true,
      count: res.importedCount,
      message: `Đã nhập thành công ${res.importedCount} phòng ban vào hệ sinh thái TinyKPI!`,
    };
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Bar matching TopKPI screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">QUẢN LÝ BỘ PHẬN</h1>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, ..."
              className="w-full py-1.5 pl-3 pr-8 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={loadDepartments}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
            title="Xuất file Excel danh sách phòng ban"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
            title="Nhập danh sách phòng ban từ file Excel"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
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

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-[#fafafa] text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Tên phòng ban / Bộ phận</th>
              <th className="py-3 px-4 w-32">Mã bộ phận</th>
              <th className="py-3 px-4 w-40">Trực thuộc</th>
              <th className="py-3 px-4 w-28 text-center">Trạng thái</th>
              <th className="py-3 px-4 w-28 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDepartments.map((dept) => {
              const isChild = !!dept.parentId;
              return (
                <tr key={dept.id} className="hover:bg-blue-50/40 transition">
                  <td className="py-3 px-4">
                    <div className={`flex items-center gap-2 ${isChild ? 'pl-6 font-normal' : 'font-bold text-slate-900'}`}>
                      {isChild ? (
                        <span className="text-slate-300">↳</span>
                      ) : (
                        <Building className="w-4 h-4 text-[#1677ff]" />
                      )}
                      <span>{dept.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{dept.code || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{dept.parent?.name || 'Gốc (Công ty)'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                      Thủ công
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenCreateModal(dept)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Thêm bộ phận con"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(dept)}
                        className="text-slate-400 hover:text-blue-600 p-1"
                        title="Sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm bộ phận mới matching create_department_modal_1790300545657.png */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingDept ? 'Chỉnh sửa bộ phận' : 'Thêm bộ phận mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDepartment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-red-500 mr-0.5">*</span> Tên bộ phận
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên bộ phận..."
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sync ID ℹ</label>
                  <input
                    type="text"
                    value={syncId}
                    onChange={(e) => setSyncId(e.target.value)}
                    placeholder="Nhập Sync ID..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên viết tắt</label>
                  <input
                    type="text"
                    value={abbreviation}
                    onChange={(e) => setAbbreviation(e.target.value)}
                    placeholder="Nhập tên viết tắt..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span className="text-red-500 mr-0.5">*</span> Bộ phận cha
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                >
                  <option value="">Công ty (Cấp cao nhất)</option>
                  {departments
                    .filter((d) => !editingDept || d.id !== editingDept.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Nhập mô tả..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Loại</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                  >
                    <option value="DEPARTMENT">Bộ phận</option>
                    <option value="SUBSIDIARY">Chi nhánh</option>
                    <option value="COMPANY">Công ty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vị trí</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
                  {formLoading ? 'Đang lưu...' : (editingDept ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Nhập danh sách Phòng ban từ Excel"
        templateFileName="Mau_Nhap_Phong_Ban_TinyKPI.xlsx"
        templateHeaders={[
          'Mã phòng ban',
          'Tên bộ phận / Phòng ban',
          'Viết tắt',
          'Loại bộ phận',
          'Thứ tự',
          'Mô tả'
        ]}
        exampleRows={[
          {
            'Mã phòng ban': 'PB-001',
            'Tên bộ phận / Phòng ban': 'Khối Kinh Doanh & Tiếp Thị',
            'Viết tắt': 'KDTT',
            'Loại bộ phận': 'DEPARTMENT',
            'Thứ tự': 1,
            'Mô tả': 'Quản lý phát triển khách hàng và thị trường'
          },
          {
            'Mã phòng ban': 'PB-002',
            'Tên bộ phận / Phòng ban': 'Phòng Tài Chính - Kế Toán',
            'Viết tắt': 'TCKT',
            'Loại bộ phận': 'DEPARTMENT',
            'Thứ tự': 2,
            'Mô tả': 'Quản lý thu chi và lập báo cáo tài chính'
          }
        ]}
        headerMapping={{
          'Mã phòng ban': 'code',
          'Mã bộ phận': 'code',
          'Mã PB': 'code',
          'Tên bộ phận / Phòng ban': 'name',
          'Tên bộ phận': 'name',
          'Tên phòng ban': 'name',
          'Viết tắt': 'abbreviation',
          'Loại bộ phận': 'type',
          'Loại': 'type',
          'Thứ tự': 'order',
          'Vị trí': 'order',
          'Mô tả': 'description'
        }}
        requiredFields={[
          { key: 'name', label: 'Tên bộ phận / Phòng ban' }
        ]}
        previewColumns={[
          { key: 'code', label: 'Mã PB' },
          { key: 'name', label: 'Tên bộ phận' },
          { key: 'abbreviation', label: 'Viết tắt' },
          { key: 'type', label: 'Loại' },
          { key: 'order', label: 'Thứ tự' }
        ]}
        notes={[
          'Trường "Tên bộ phận / Phòng ban" là bắt buộc.',
          'Nếu để trống "Mã phòng ban", hệ thống sẽ tự động tạo mã định danh.',
          'Loại bộ phận có thể nhận: COMPANY (Công ty), SUBSIDIARY (Chi nhánh), DEPARTMENT (Phòng ban).'
        ]}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
};
