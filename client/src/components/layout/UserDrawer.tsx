import React, { useState } from 'react';
import { X, Key, Globe, Menu, LogOut, Check, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../api/client.js';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [hideHeaderOnScroll, setHideHeaderOnScroll] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Change password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  if (!isOpen && !showPasswordModal) return null;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwdError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setPwdLoading(true);
      await apiClient('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setPwdSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPwdSuccess(null);
      }, 1500);
    } catch (err: any) {
      setPwdError(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[360px] bg-white shadow-2xl z-50 transform transition-transform duration-200 ease-in-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Tài khoản</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex flex-col items-center pt-8 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-orange-500 text-white flex items-center justify-center text-2xl font-bold shadow-md">
              {getInitials(user?.fullName)}
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">{user?.fullName || 'Người dùng'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email || 'email@example.com'}</p>

            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-xs font-medium">
              <Key className="w-3 h-3" />
              <span>{user?.role || 'Staff'}</span>
            </div>
          </div>

          {/* Settings Section */}
          <div className="mt-6">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              CÀI ĐẶT
            </span>

            <div className="mt-3 space-y-1">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition text-sm text-slate-700"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span>Thay đổi Mật khẩu</span>
                </div>
                <span className="text-slate-400 text-xs">›</span>
              </button>

              <button
                onClick={() => alert('Hệ thống hiện tại hỗ trợ Tiếng Việt mặc định.')}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition text-sm text-slate-700"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>Ngôn ngữ</span>
                </div>
                <span className="text-xs text-slate-500">Tiếng Việt ›</span>
              </button>

              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <Menu className="w-4 h-4 text-slate-500" />
                  <span>Ẩn header khi cuộn</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideHeaderOnScroll}
                    onChange={(e) => setHideHeaderOnScroll(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1677ff]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Logout Button */}
        <div className="p-6 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full py-2.5 px-4 border border-slate-200 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-medium text-sm transition flex items-center justify-center gap-2"
          >
            <span>Đăng xuất</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Đổi mật khẩu tài khoản</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwdError && (
              <div className="mt-3 p-2.5 rounded bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="mt-3 p-2.5 rounded bg-green-50 text-green-700 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu hiện tại *
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu mới * (Tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xác nhận mật khẩu mới *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2 text-xs font-medium text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-sm disabled:opacity-60"
                >
                  {pwdLoading ? 'Đang lưu...' : 'Xác nhận đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
