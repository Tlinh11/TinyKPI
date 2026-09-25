import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  MoreHorizontal,
  Search,
  X,
  Edit2,
  Trash2,
  Inbox,
  AlertCircle,
  Check,
  Calendar,
  Download,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { Department, Position } from '../types/index.js';
import { exportToExcel } from '../utils/excel.js';
import { ExcelImportModal } from '../components/common/ExcelImportModal.js';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  username: string;
  employeeCode?: string;
  abbreviation?: string;
  gender?: string;
  phone?: string;
  avatar?: string;
  role: { id: string; name: string };
  department?: { id: string; name: string; code?: string };
  position?: { id: string; name: string; code?: string };
  startDate?: string;
  kpiStartDate?: string;
  status: string;
}

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [syncId, setSyncId] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [gender, setGender] = useState('Nam');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('Tiếng Việt');
  const [subsystem, setSubsystem] = useState('BSC');
  const [formRoleId, setFormRoleId] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formPosId, setFormPosId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [kpiStartDate, setKpiStartDate] = useState('');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load dropdown lists and employees
  const loadDependencies = async () => {
    try {
      const [deptRes, posRes] = await Promise.all([
        apiClient<Department[]>('/departments'),
        apiClient<Position[]>('/positions'),
      ]);
      setDepartments(deptRes);
      setPositions(posRes);
      if (deptRes.length > 0 && !formDeptId) setFormDeptId(deptRes[0].id);
      if (posRes.length > 0 && !formPosId) setFormPosId(posRes[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (departmentId) query.set('departmentId', departmentId);
      if (positionId) query.set('positionId', positionId);
      if (status) query.set('status', status);

      const res = await apiClient<{ items: Employee[] }>(`/users?${query.toString()}`);
      setEmployees(res.items);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải danh sách nhân viên' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployees();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, departmentId, positionId, roleName, status]);

  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setSyncId('');
    setAbbreviation('');
    setFullName('');
    setEmployeeCode(`NV-${Math.floor(100 + Math.random() * 900)}`);
    setGender('Nam');
    setPhone('');
    setEmail('');
    setUsername('');
    setPassword('12345!');
    setLanguage('Tiếng Việt');
    setSubsystem('BSC');
    setDescription('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setKpiStartDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setSyncId(emp.employeeCode || '');
    setAbbreviation(emp.abbreviation || '');
    setFullName(emp.fullName);
    setEmployeeCode(emp.employeeCode || '');
    setGender(emp.gender || 'Nam');
    setPhone(emp.phone || '');
    setEmail(emp.email);
    setUsername(emp.username);
    setPassword('');
    setFormDeptId(emp.department?.id || '');
    setFormPosId(emp.position?.id || '');
    setStartDate(emp.startDate ? emp.startDate.split('T')[0] : '');
    setKpiStartDate(emp.kpiStartDate ? emp.kpiStartDate.split('T')[0] : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Vui lòng nhập Họ & tên');
      return;
    }
    if (!username.trim()) {
      setFormError('Vui lòng nhập Tên truy cập');
      return;
    }

    try {
      setFormLoading(true);
      const payload: any = {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim() || `${username.trim()}@company.com`,
        employeeCode,
        abbreviation,
        gender,
        phone,
        departmentId: formDeptId || null,
        positionId: formPosId || null,
        startDate: startDate || null,
        kpiStartDate: kpiStartDate || null,
        subsystem,
        language,
        description,
      };

      if (password) {
        payload.password = password;
      }

      if (editingEmployee) {
        await apiClient(`/users/${editingEmployee.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setNotification({ type: 'success', message: 'Cập nhật nhân viên thành công' });
      } else {
        await apiClient('/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setNotification({ type: 'success', message: 'Thêm nhân viên mới thành công' });
      }

      setIsModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Lưu thất bại');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân sự "${emp.fullName}"?`)) return;
    try {
      await apiClient(`/users/${emp.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa nhân sự' });
      loadEmployees();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleExportExcel = () => {
    if (employees.length === 0) {
      setNotification({ type: 'error', message: 'Không có dữ liệu nhân sự để xuất Excel' });
      return;
    }

    exportToExcel<Employee>({
      data: employees,
      fileName: `Danh_Sach_Nhan_Vien_TinyKPI_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Nhân sự',
      columns: [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Mã nhân viên', key: 'employeeCode', width: 16 },
        { header: 'Họ và tên', key: 'fullName', width: 25 },
        { header: 'Tên đăng nhập', key: 'username', width: 18 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Số điện thoại', key: 'phone', width: 16 },
        { header: 'Giới tính', key: 'gender', width: 12 },
        { header: 'Chức danh / Chức vụ', key: 'position', width: 22, format: (p) => p?.name || '' },
        { header: 'Bộ phận / Phòng ban', key: 'department', width: 24, format: (d) => d?.name || '' },
        { header: 'Nhóm quyền', key: 'role', width: 16, format: (r) => r?.name || '' },
        { header: 'Ngày vào làm', key: 'startDate', width: 16, format: (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '') },
        { header: 'Ngày áp dụng KPI', key: 'kpiStartDate', width: 16, format: (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '') },
        { header: 'Trạng thái', key: 'status', width: 16, format: (s) => (s === 'ACTIVE' ? 'Đang làm việc' : 'Đã nghỉ việc') },
      ],
    });
    setNotification({ type: 'success', message: `Đã xuất ${employees.length} nhân sự ra file Excel (.xlsx) thành công!` });
  };

  const handleConfirmImport = async (rows: any[]) => {
    const res = await apiClient<{ importedCount: number; errors: string[] }>('/users/bulk', {
      method: 'POST',
      body: JSON.stringify(rows),
    });
    loadEmployees();
    return {
      success: true,
      count: res.importedCount,
      message: `Đã nhập thành công ${res.importedCount} nhân sự vào hệ sinh thái TinyKPI!`,
    };
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Bar matching TopKPI screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">QUẢN LÝ NHÂN VIÊN</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEmployees}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
            title="Xuất file Excel danh sách nhân viên"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
            title="Nhập danh sách nhân sự từ file Excel"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
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

      {/* Main Table Container with Column Filter Inputs matching screenshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#fafafa] text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-12 text-center border-r border-slate-200/60">STT</th>
                
                {/* Họ & tên with Search Filter */}
                <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-200/60">
                  <div className="mb-1">Họ & tên</div>
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm kiếm ..."
                      className="w-full py-1 pl-2 pr-6 text-xs bg-white border border-slate-200 rounded font-normal outline-none focus:border-[#1677ff]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </th>

                <th className="py-3 px-3 min-w-[110px] border-r border-slate-200/60">Điện thoại</th>

                {/* Chức vụ with Dropdown Filter */}
                <th className="py-2.5 px-3 min-w-[150px] border-r border-slate-200/60">
                  <div className="mb-1">Chức vụ</div>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value)}
                    className="w-full py-1 px-2 text-xs bg-white border border-slate-200 rounded font-normal outline-none focus:border-[#1677ff]"
                  >
                    <option value="">Chọn chức vụ</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Bộ phận with Dropdown Filter */}
                <th className="py-2.5 px-3 min-w-[170px] border-r border-slate-200/60">
                  <div className="mb-1">Bộ phận</div>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full py-1 px-2 text-xs bg-white border border-slate-200 rounded font-normal outline-none focus:border-[#1677ff]"
                  >
                    <option value="">Chọn bộ phận</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </th>

                {/* Nhóm quyền with Dropdown Filter */}
                <th className="py-2.5 px-3 min-w-[130px] border-r border-slate-200/60">
                  <div className="mb-1">Nhóm quyền</div>
                  <select
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full py-1 px-2 text-xs bg-white border border-slate-200 rounded font-normal outline-none focus:border-[#1677ff]"
                  >
                    <option value="">Chọn nhóm quyền</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                  </select>
                </th>

                <th className="py-3 px-3 min-w-[110px] border-r border-slate-200/60">Ngày làm việc</th>
                <th className="py-3 px-3 min-w-[120px] border-r border-slate-200/60">Ngày áp dụng KPI</th>

                {/* Trạng thái Filter */}
                <th className="py-2.5 px-3 min-w-[110px] border-r border-slate-200/60">
                  <div className="mb-1">Trạng thái</div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full py-1 px-2 text-xs bg-white border border-slate-200 rounded font-normal outline-none focus:border-[#1677ff]"
                  >
                    <option value="ACTIVE">Đang làm việc</option>
                    <option value="INACTIVE">Đã nghỉ việc</option>
                  </select>
                </th>

                <th className="py-3 px-3 w-20 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-2 border border-slate-100">
                        <Inbox className="w-7 h-7" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">No data</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-3 text-center text-slate-500">{index + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{emp.fullName}</div>
                      <div className="text-[11px] font-normal text-slate-400">{emp.email}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{emp.phone || '—'}</td>
                    <td className="py-3 px-3 text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                        {emp.position?.name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700">{emp.department?.name || '—'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-[#1677ff] font-medium text-[11px]">
                        {emp.role?.name || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {emp.startDate ? new Date(emp.startDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {emp.kpiStartDate ? new Date(emp.kpiStartDate).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đang làm việc
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="text-slate-400 hover:text-blue-600 p-1"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Chỉnh sửa nhân viên matching create_employee_modal_1790300587226.png */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 md:p-8 border border-slate-100 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="mt-6 space-y-6">
              {/* 2-Column Form Fields matching TopKPI screenshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Left Column */}
                <div className="space-y-3.5">
                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Sync ID ℹ</label>
                    <input
                      type="text"
                      value={syncId}
                      onChange={(e) => setSyncId(e.target.value)}
                      placeholder="Nhập Sync ID"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Tên viết tắt</label>
                    <input
                      type="text"
                      value={abbreviation}
                      onChange={(e) => setAbbreviation(e.target.value)}
                      placeholder="Nhập tên viết tắt"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">
                      <span className="text-red-500 mr-0.5">*</span> Họ & tên
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      required
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Mã nhân viên</label>
                    <input
                      type="text"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      placeholder="Nhập mã nhân viên"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Giới tính</label>
                    <div className="flex items-center gap-6 text-xs text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="Nam"
                          checked={gender === 'Nam'}
                          onChange={(e) => setGender(e.target.value)}
                          className="text-[#1677ff]"
                        />
                        <span>Nam</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="Nữ"
                          checked={gender === 'Nữ'}
                          onChange={(e) => setGender(e.target.value)}
                          className="text-[#1677ff]"
                        />
                        <span>Nữ</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Điện thoại</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">
                      <span className="text-red-500 mr-0.5">*</span> Tên truy cập
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên truy cập"
                      required
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">
                      {editingEmployee ? 'Mật khẩu mới' : '* Mật khẩu mới'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      required={!editingEmployee}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Ngôn ngữ</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                    >
                      <option value="Tiếng Việt">Tiếng Việt</option>
                      <option value="English">English</option>
                    </select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3.5">
                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">
                      <span className="text-red-500 mr-0.5">*</span> Phân hệ
                    </label>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-blue-50 text-[#1677ff] border border-blue-200 text-xs font-semibold flex items-center gap-1">
                        BSC ✕
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">
                      <span className="text-red-500 mr-0.5">*</span> Nhóm quyền
                    </label>
                    <select
                      value={formRoleId}
                      onChange={(e) => setFormRoleId(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                    >
                      <option value="">Chọn nhóm quyền</option>
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">
                      <span className="text-red-500 mr-0.5">*</span> Bộ phận
                    </label>
                    <select
                      value={formDeptId}
                      onChange={(e) => setFormDeptId(e.target.value)}
                      required
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                    >
                      <option value="">Chọn bộ phận</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">
                      <span className="text-red-500 mr-0.5">*</span> Chức vụ
                    </label>
                    <select
                      value={formPosId}
                      onChange={(e) => setFormPosId(e.target.value)}
                      required
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                    >
                      <option value="">Chọn chức vụ</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Ngày làm việc</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-32 text-xs font-semibold text-slate-700">Ngày áp dụng KPI ℹ</label>
                    <input
                      type="date"
                      value={kpiStartDate}
                      onChange={(e) => setKpiStartDate(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Nhập mô tả (tối đa 500 ký tự)"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                    />
                    <div className="text-[10px] text-slate-400 text-right">{description.length} / 500</div>
                  </div>
                </div>
              </div>

              {/* Sub-table: Kiêm nhiệm phòng ban */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">Kiêm nhiệm phòng ban:</span>
                  <button
                    type="button"
                    onClick={() => alert('Thêm dòng kiêm nhiệm')}
                    className="w-6 h-6 rounded bg-[#1677ff] text-white flex items-center justify-center text-sm shadow-xs"
                  >
                    +
                  </button>
                </div>
                <div className="border border-slate-100 rounded-lg p-3 text-center text-xs text-slate-400 bg-slate-50/50">
                  Chưa có bộ phận kiêm nhiệm
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs disabled:opacity-60"
                >
                  {formLoading ? 'Đang lưu...' : 'OK'}
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
        title="Nhập danh sách Nhân viên từ Excel"
        templateFileName="Mau_Nhap_Nhan_Vien_TinyKPI.xlsx"
        templateHeaders={[
          'Mã NV',
          'Họ và tên',
          'Tên đăng nhập',
          'Email',
          'Số điện thoại',
          'Giới tính',
          'Chức vụ',
          'Bộ phận',
          'Nhóm quyền',
          'Ngày làm việc',
          'Ngày áp dụng KPI',
          'Trạng thái'
        ]}
        exampleRows={[
          {
            'Mã NV': 'NV-001',
            'Họ và tên': 'Nguyễn Văn An',
            'Tên đăng nhập': 'an.nguyen',
            'Email': 'an.nguyen@tinykpi.com',
            'Số điện thoại': '0901234567',
            'Giới tính': 'Nam',
            'Chức vụ': 'Trưởng phòng Kinh doanh',
            'Bộ phận': 'Khối Kinh Doanh & Tiếp Thị',
            'Nhóm quyền': 'Manager',
            'Ngày làm việc': '2025-01-15',
            'Ngày áp dụng KPI': '2025-02-01',
            'Trạng thái': 'Đang làm việc'
          },
          {
            'Mã NV': 'NV-002',
            'Họ và tên': 'Trần Thị Bích',
            'Tên đăng nhập': 'bich.tran',
            'Email': 'bich.tran@tinykpi.com',
            'Số điện thoại': '0988765432',
            'Giới tính': 'Nữ',
            'Chức vụ': 'Chuyên viên Nhân sự',
            'Bộ phận': 'Phòng Nhân sự & Đào tạo',
            'Nhóm quyền': 'Staff',
            'Ngày làm việc': '2025-03-01',
            'Ngày áp dụng KPI': '2025-03-01',
            'Trạng thái': 'Đang làm việc'
          }
        ]}
        headerMapping={{
          'Mã NV': 'employeeCode',
          'Mã nhân viên': 'employeeCode',
          'Họ và tên': 'fullName',
          'Họ tên': 'fullName',
          'Tên đăng nhập': 'username',
          'Email': 'email',
          'Số điện thoại': 'phone',
          'SĐT': 'phone',
          'Giới tính': 'gender',
          'Chức vụ': 'positionName',
          'Bộ phận': 'departmentName',
          'Phòng ban': 'departmentName',
          'Nhóm quyền': 'roleName',
          'Ngày làm việc': 'startDate',
          'Ngày áp dụng KPI': 'kpiStartDate',
          'Trạng thái': 'status'
        }}
        requiredFields={[
          { key: 'fullName', label: 'Họ và tên' }
        ]}
        previewColumns={[
          { key: 'employeeCode', label: 'Mã NV' },
          { key: 'fullName', label: 'Họ và tên' },
          { key: 'username', label: 'Username' },
          { key: 'email', label: 'Email' },
          { key: 'positionName', label: 'Chức vụ' },
          { key: 'departmentName', label: 'Bộ phận' },
          { key: 'status', label: 'Trạng thái' }
        ]}
        notes={[
          'Trường "Họ và tên" là bắt buộc.',
          'Nếu để trống Email hoặc Username, hệ thống sẽ tự sinh tự động theo mã nhân viên.',
          'Mật khẩu ban đầu mặc định của tất cả nhân sự tạo từ Excel là: 12345!',
          'Tên phòng ban và chức vụ sẽ tự động đối soát với cơ sở dữ liệu hiện có.'
        ]}
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
};
