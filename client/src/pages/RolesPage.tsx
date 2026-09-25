import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Users,
  Lock,
  RotateCw,
  Save,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
  KeyRound
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface Permission {
  id: string;
  name: string;
  module: string;
  description: string;
}

interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  rolePermissions: RolePermission[];
  _count?: {
    users: number;
  };
}

const MODULE_LABELS: Record<string, { label: string; desc: string; icon: string }> = {
  users: { label: 'Quản lý Nhân sự', desc: 'Xem danh sách, thêm, sửa, phân quyền nhân viên', icon: '👤' },
  departments: { label: 'Cơ cấu Tổ chức', desc: 'Quản lý phòng ban, sơ đồ cây và bổ nhiệm trưởng bộ phận', icon: '🏢' },
  positions: { label: 'Chức danh & Chức vụ', desc: 'Thiết lập danh mục chức danh và cấp bậc', icon: '💼' },
  bsc: { label: 'Chiến lược BSC & KPI', desc: '5 bước chiến lược, bản đồ chiến lược và thẻ điểm cân bằng', icon: '🎯' },
  processes: { label: 'Quy trình lõi (SOP)', desc: 'Thiết kế luồng quy trình Master Process & biểu mẫu', icon: '⚡' },
  sla: { label: 'Cam kết SLA Nội bộ', desc: 'Thiết lập chỉ tiêu chất lượng dịch vụ & xử lý vi phạm', icon: '⏱️' },
  tasks: { label: 'Hộp thư & Giao việc', desc: 'Phân công, tiếp nhận và giám sát tiến độ công việc', icon: '📬' },
  calendar: { label: 'Lịch công tác', desc: 'Lịch họp, lịch làm việc tuần & sự kiện toàn công ty', icon: '📅' },
  monitoring: { label: 'Giám sát Realtime', desc: 'Theo dõi tiến độ trực tiếp và cảnh báo tắc nghẽn', icon: '📊' },
  exams: { label: 'Khảo thí & Thi', desc: 'Ngân hàng đề thi, tạo kỳ thi quy trình và chấm điểm', icon: '📝' },
  training: { label: 'Giáo trình & Đào tạo', desc: 'Quản lý khóa học, tài liệu đào tạo nội bộ', icon: '🎓' },
  settings: { label: 'Cấu hình Hệ thống', desc: 'Thiết lập phân quyền, email SMTP và hệ số AI', icon: '⚙️' },
  audit: { label: 'Nhật ký Kiểm toán', desc: 'Xem vết thao tác người dùng và nhật ký an ninh', icon: '🛡️' },
};

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State for Create/Edit Role
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rolesData, permsData] = await Promise.all([
        apiClient<Role[]>('/settings/roles'),
        apiClient<Permission[]>('/settings/permissions'),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);

      // Default select the first role or keep current
      if (rolesData.length > 0) {
        const current = selectedRole ? rolesData.find((r) => r.id === selectedRole.id) || rolesData[0] : rolesData[0];
        setSelectedRole(current);
        setSelectedPermissionIds(new Set(current.rolePermissions.map((rp) => rp.permissionId)));
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải dữ liệu phân quyền' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissionIds(new Set(role.rolePermissions.map((rp) => rp.permissionId)));
    setNotification(null);
  };

  const handleTogglePermission = (permId: string) => {
    if (selectedRole?.name === 'Admin') return; // Admin has full access
    const next = new Set(selectedPermissionIds);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedPermissionIds(next);
  };

  const handleToggleModule = (moduleKey: string) => {
    if (selectedRole?.name === 'Admin') return;
    const modulePerms = permissions.filter((p) => p.module === moduleKey);
    const allSelected = modulePerms.every((p) => selectedPermissionIds.has(p.id));

    const next = new Set(selectedPermissionIds);
    if (allSelected) {
      modulePerms.forEach((p) => next.delete(p.id));
    } else {
      modulePerms.forEach((p) => next.add(p.id));
    }
    setSelectedPermissionIds(next);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    try {
      setIsSaving(true);
      setNotification(null);
      await apiClient(`/settings/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionIds: Array.from(selectedPermissionIds) }),
      });
      setNotification({ type: 'success', message: `Đã lưu ma trận phân quyền cho nhóm '${selectedRole.name}'` });
      // Reload roles to refresh state
      const rolesData = await apiClient<Role[]>('/settings/roles');
      setRoles(rolesData);
      const updated = rolesData.find((r) => r.id === selectedRole.id);
      if (updated) setSelectedRole(updated);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Không thể lưu phân quyền' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    try {
      if (editingRole) {
        await apiClient(`/settings/roles/${editingRole.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: roleName.trim(), description: roleDesc.trim() || undefined }),
        });
        setNotification({ type: 'success', message: 'Cập nhật nhóm quyền thành công' });
      } else {
        await apiClient('/settings/roles', {
          method: 'POST',
          body: JSON.stringify({ name: roleName.trim(), description: roleDesc.trim() || undefined }),
        });
        setNotification({ type: 'success', message: 'Tạo nhóm quyền mới thành công' });
      }
      setIsRoleModalOpen(false);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi thao tác nhóm quyền' });
    }
  };

  const handleDeleteRole = async (role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    if (['Admin', 'Manager', 'Staff', 'User'].includes(role.name)) {
      alert('Không thể xóa các nhóm quyền hệ thống mặc định!');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa nhóm quyền "${role.name}"?`)) return;

    try {
      await apiClient(`/settings/roles/${role.id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: `Đã xóa nhóm quyền ${role.name}` });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi xóa nhóm quyền' });
    }
  };

  // Group permissions by module
  const groupedPermissions: Record<string, Permission[]> = {};
  permissions.forEach((p) => {
    if (!groupedPermissions[p.module]) {
      groupedPermissions[p.module] = [];
    }
    groupedPermissions[p.module].push(p);
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
              <KeyRound className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Quản trị Nhóm quyền & Ma trận Phân quyền (RBAC)</h1>
              <p className="text-blue-100 text-xs mt-0.5">
                Thiết lập vai trò, phân định ranh giới chức năng và cấp quyền truy cập chi tiết cho từng bộ phận
              </p>
            </div>
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
            onClick={handleOpenCreateRole}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Thêm nhóm quyền
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
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Roles List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Danh sách Nhóm Quyền</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                {roles.length} nhóm
              </span>
            </div>

            <div className="p-2 space-y-1.5 max-h-[680px] overflow-y-auto">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                const isSystemRole = ['Admin', 'Manager', 'Staff', 'User'].includes(r.name);
                const permCount = r.rolePermissions?.length || 0;
                const userCount = r._count?.users || 0;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRole(r)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                            r.name === 'Admin'
                              ? 'bg-rose-100 text-rose-700'
                              : r.name === 'Manager'
                              ? 'bg-purple-100 text-purple-700'
                              : r.name === 'Staff'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{r.name}</span>
                            {isSystemRole && (
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {r.description || 'Chưa có mô tả vai trò'}
                          </p>
                        </div>
                      </div>

                      {!isSystemRole && (
                        <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                          <button
                            onClick={(e) => handleOpenEditRole(r, e)}
                            className="p-1 hover:bg-slate-200 text-slate-500 rounded"
                            title="Sửa nhóm quyền"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteRole(r, e)}
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded"
                            title="Xóa nhóm quyền"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100/80">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{userCount} thành viên</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-blue-700">
                        <Lock className="w-3 h-3" />
                        <span>{permCount} quyền</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Principle Card */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Nguyên tắc RBAC (Role-Based Access Control)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              - <strong>Admin:</strong> Có toàn quyền thực thi, bypass qua mọi lớp kiểm tra quyền hạn.
              <br />
              - <strong>Manager / Staff:</strong> Quyền hạn được kiểm tra tự động trên từng API backend và giao diện người dùng.
              <br />
              - Nhấn <strong>"Lưu thay đổi ma trận"</strong> sau khi tick chọn quyền để áp dụng tức thì.
            </p>
          </div>
        </div>

        {/* Right Column: Permission Matrix (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRole ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Ma trận Phân quyền cho: <span className="text-blue-600">{selectedRole.name}</span>
                    </h2>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Đang kích hoạt {selectedPermissionIds.size} / {permissions.length} quyền khả dụng
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedRole.name !== 'Admin' && (
                    <button
                      onClick={handleSavePermissions}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi ma trận'}
                    </button>
                  )}
                  {selectedRole.name === 'Admin' && (
                    <span className="text-xs font-semibold bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Quyền tối cao (Bypass)
                    </span>
                  )}
                </div>
              </div>

              {/* Module List with Accordion/Grid */}
              <div className="p-5 divide-y divide-slate-100 max-h-[720px] overflow-y-auto space-y-5">
                {Object.keys(groupedPermissions).map((moduleKey) => {
                  const modulePerms = groupedPermissions[moduleKey];
                  const moduleMeta = MODULE_LABELS[moduleKey] || {
                    label: moduleKey.toUpperCase(),
                    desc: 'Các hành động thuộc phân hệ',
                    icon: '📦',
                  };
                  const allSelected = modulePerms.every((p) => selectedPermissionIds.has(p.id));
                  const someSelected = modulePerms.some((p) => selectedPermissionIds.has(p.id));

                  return (
                    <div key={moduleKey} className="pt-4 first:pt-0">
                      <div className="flex items-center justify-between pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{moduleMeta.icon}</span>
                          <div>
                            <h3 className="text-xs font-bold text-slate-800">{moduleMeta.label}</h3>
                            <p className="text-[11px] text-slate-400">{moduleMeta.desc}</p>
                          </div>
                        </div>

                        {selectedRole.name !== 'Admin' && (
                          <button
                            onClick={() => handleToggleModule(moduleKey)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition"
                          >
                            {allSelected ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5" />
                                Bỏ chọn tất cả
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5" />
                                Chọn tất cả ({modulePerms.length})
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                        {modulePerms.map((perm) => {
                          const isChecked = selectedRole.name === 'Admin' || selectedPermissionIds.has(perm.id);

                          return (
                            <label
                              key={perm.id}
                              onClick={(e) => {
                                if (selectedRole.name === 'Admin') {
                                  e.preventDefault();
                                  return;
                                }
                              }}
                              className={`flex items-start gap-3 p-3 rounded-lg border text-left cursor-pointer transition ${
                                isChecked
                                  ? 'bg-blue-50/40 border-blue-200'
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                              } ${selectedRole.name === 'Admin' ? 'cursor-not-allowed opacity-90' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={selectedRole.name === 'Admin'}
                                onChange={() => handleTogglePermission(perm.id)}
                                className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-slate-800">{perm.description}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.name}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              Vui lòng chọn một nhóm quyền để cấu hình ma trận
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create/Edit Role */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  {editingRole ? 'Chỉnh sửa Nhóm quyền' : 'Tạo Nhóm quyền Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên nhóm quyền <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Ví dụ: Quality Assurance Lead, HR Specialist..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả vai trò & phạm vi</label>
                <textarea
                  rows={3}
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Mô tả trách nhiệm và đối tượng người dùng áp dụng nhóm quyền này..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  {editingRole ? 'Lưu cập nhật' : 'Tạo vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
