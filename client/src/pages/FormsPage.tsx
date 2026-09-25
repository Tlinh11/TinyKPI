import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Plus,
  Search,
  RotateCw,
  Eye,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  FileText,
  Copy,
  Sliders,
  Tag,
  HelpCircle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface FormTemplate {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  fieldsJson: string;
  status: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, { label: string; badge: string }> = {
  KPI: { label: 'Đánh giá KPI', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  SLA: { label: 'Nghiệm thu SLA', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PROCESS: { label: 'Quy trình SOP', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  HR: { label: 'Nhân sự & Phúc lợi', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  GENERAL: { label: 'Chung', badge: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const FormsPage: React.FC = () => {
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Preview Modal
  const [previewForm, setPreviewForm] = useState<FormTemplate | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Create/Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('KPI');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadForms = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<FormTemplate[]>('/settings/forms');
      setForms(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải danh sách biểu mẫu' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const handleOpenPreview = (form: FormTemplate) => {
    setPreviewForm(form);
    setPreviewValues({});
  };

  const handleOpenCreateModal = () => {
    setEditingForm(null);
    setCode(`FORM-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setCategory('KPI');
    setDescription('');
    setFields([
      { id: 'f1', label: 'Họ và tên người lập', type: 'text', required: true },
      { id: 'f2', label: 'Ngày thực hiện', type: 'date', required: true },
      { id: 'f3', label: 'Ý kiến / Đánh giá tổng hợp', type: 'textarea', required: false },
    ]);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (form: FormTemplate) => {
    setEditingForm(form);
    setCode(form.code);
    setName(form.name);
    setCategory(form.category);
    setDescription(form.description || '');
    try {
      const parsed = JSON.parse(form.fieldsJson);
      setFields(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFields([]);
    }
    setIsEditModalOpen(true);
  };

  const handleAddField = () => {
    const newId = `f_${Date.now()}`;
    setFields((prev) => [
      ...prev,
      { id: newId, label: `Trường thông tin #${prev.length + 1}`, type: 'text', required: false },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || fields.length === 0) {
      alert('Vui lòng nhập đầy đủ mã, tên và ít nhất 1 trường dữ liệu');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        fieldsJson: JSON.stringify(fields),
      };

      if (editingForm) {
        await apiClient(`/settings/forms/${editingForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setNotification({ type: 'success', message: 'Cập nhật biểu mẫu thành công' });
      } else {
        await apiClient('/settings/forms', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setNotification({ type: 'success', message: 'Tạo biểu mẫu điện tử mới thành công' });
      }

      setIsEditModalOpen(false);
      loadForms();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi lưu biểu mẫu' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteForm = async (form: FormTemplate) => {
    if (!confirm(`Bạn có chắc muốn xóa biểu mẫu "${form.name}"?`)) return;

    try {
      await apiClient(`/settings/forms/${form.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa mẫu biểu điện tử' });
      loadForms();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi xóa biểu mẫu' });
    }
  };

  // Filtered
  const filtered = forms.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || f.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
            <FileCode className="w-6 h-6 text-teal-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Quản lý Biểu mẫu Điện tử (Form Builder & Templates)</h1>
            <p className="text-teal-100 text-xs mt-0.5">
              Thiết kế phiếu đánh giá KPI, biên bản nghiệm thu SLA và đơn từ điện tử chuẩn hóa toàn doanh nghiệp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadForms}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Tạo biểu mẫu mới
          </button>
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
            <Check className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar Search & Category Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc mã biểu mẫu..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Phân loại:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-hidden"
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="KPI">Đánh giá KPI</option>
            <option value="SLA">Nghiệm thu SLA</option>
            <option value="PROCESS">Quy trình SOP</option>
            <option value="HR">Nhân sự & Phúc lợi</option>
            <option value="GENERAL">Chung</option>
          </select>
        </div>
      </div>

      {/* Form Templates Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-slate-400">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Đang tải danh mục mẫu biểu...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 text-xs">
            Chưa có biểu mẫu nào trong danh mục này.
          </div>
        ) : (
          filtered.map((form) => {
            const cat = CATEGORY_COLORS[form.category] || CATEGORY_COLORS.GENERAL;
            let fieldCount = 0;
            try {
              fieldCount = JSON.parse(form.fieldsJson).length;
            } catch {}

            return (
              <div
                key={form.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-lg transition p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {form.code}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cat.badge}`}>
                      {cat.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{form.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {form.description || 'Không có mô tả chi tiết'}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{fieldCount} trường thông tin nhập liệu</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenPreview(form)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Xem trước biểu mẫu
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(form)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-md transition"
                      title="Sửa cấu trúc"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteForm(form)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md transition"
                      title="Xóa mẫu biểu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Preview Form */}
      {previewForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewForm.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Mã: {previewForm.code}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewForm(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {previewForm.description && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  {previewForm.description}
                </div>
              )}

              {/* Dynamic Simulated Fields */}
              <div className="space-y-4">
                {(JSON.parse(previewForm.fieldsJson) as FormField[]).map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder="Nhập thông tin..."
                        value={previewValues[field.id] || ''}
                        onChange={(e) => setPreviewValues({ ...previewValues, [field.id]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        placeholder="0"
                        value={previewValues[field.id] || ''}
                        onChange={(e) => setPreviewValues({ ...previewValues, [field.id]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    )}

                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={previewValues[field.id] || ''}
                        onChange={(e) => setPreviewValues({ ...previewValues, [field.id]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        placeholder="Nhập nội dung chi tiết..."
                        value={previewValues[field.id] || ''}
                        onChange={(e) => setPreviewValues({ ...previewValues, [field.id]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        value={previewValues[field.id] || ''}
                        onChange={(e) => setPreviewValues({ ...previewValues, [field.id]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Chọn giá trị --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Chế độ xem trước (Interactive Preview)</span>
              <button
                onClick={() => {
                  alert('Biểu mẫu điện tử đã được điền thử thành công!');
                  setPreviewForm(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Gửi phiếu thử nghiệm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Form Builder (Create/Edit) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  {editingForm ? 'Chỉnh sửa Mẫu Biểu Điện tử' : 'Thiết Kế Mẫu Biểu Mới (Form Builder)'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã biểu mẫu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingForm}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="FORM-KPI-Q1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-hidden disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phân loại danh mục</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="KPI">Đánh giá KPI</option>
                    <option value="SLA">Nghiệm thu SLA</option>
                    <option value="PROCESS">Quy trình SOP</option>
                    <option value="HR">Nhân sự & Phúc lợi</option>
                    <option value="GENERAL">Chung</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên biểu mẫu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Phiếu tự đánh giá hiệu suất..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả mục đích áp dụng</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả phạm vi áp dụng và đối tượng điền phiếu..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                />
              </div>

              {/* Dynamic Field Builder */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    Các trường dữ liệu trong form ({fields.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm trường
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((f, idx) => (
                    <div
                      key={f.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
                    >
                      <span className="text-xs font-mono font-bold text-slate-400 w-6">#{idx + 1}</span>
                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) => {
                          const next = [...fields];
                          next[idx].label = e.target.value;
                          setFields(next);
                        }}
                        placeholder="Tên trường (Label)..."
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden"
                      />

                      <select
                        value={f.type}
                        onChange={(e) => {
                          const next = [...fields];
                          next[idx].type = e.target.value as any;
                          setFields(next);
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden"
                      >
                        <option value="text">Chữ (Text)</option>
                        <option value="number">Số (Number)</option>
                        <option value="date">Ngày tháng (Date)</option>
                        <option value="textarea">Đoạn văn (Textarea)</option>
                        <option value="select">Lựa chọn (Select)</option>
                      </select>

                      <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 px-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={f.required}
                          onChange={(e) => {
                            const next = [...fields];
                            next[idx].required = e.target.checked;
                            setFields(next);
                          }}
                          className="rounded text-emerald-600 border-slate-300"
                        />
                        Bắt buộc
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  {editingForm ? 'Lưu cập nhật' : 'Tạo biểu mẫu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
