import React, { useState, useEffect } from 'react';
import {
  MailCheck,
  Send,
  Save,
  RotateCw,
  Server,
  Bell,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Sliders,
  HelpCircle,
  Radio,
  FileText
} from 'lucide-react';
import { apiClient } from '../api/client.js';

interface SystemSetting {
  id?: string;
  key: string;
  value: string;
  group: string;
}

export const EmailSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '587',
    SMTP_USER: 'notifications@tinykpi.com',
    SMTP_PASS: '••••••••••••',
    SMTP_SECURE: 'tls',
    NOTIFY_TASK_DUE: 'true',
    NOTIFY_SLA_ALERT: 'true',
    NOTIFY_EXAM_SCHEDULE: 'true',
    NOTIFY_BSC_REPORT: 'true',
    COMPANY_NAME: 'TinyKPI Enterprise System',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<SystemSetting[]>('/settings/system');
      const map: Record<string, string> = {};
      data.forEach((s) => {
        map[s.key] = s.value;
      });
      setSettings((prev) => ({ ...prev, ...map }));
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải cấu hình hệ thống' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true',
    }));
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      setNotification(null);

      const payload = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        group: key.startsWith('SMTP') ? 'EMAIL' : key.startsWith('NOTIFY') ? 'NOTIFICATION' : 'GENERAL',
      }));

      await apiClient('/settings/system', {
        method: 'PUT',
        body: JSON.stringify({ settings: payload }),
      });

      setNotification({ type: 'success', message: 'Đã lưu toàn bộ cấu hình máy chủ Email và Kịch bản thông báo!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi lưu cấu hình' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      const res = await apiClient<{ success: boolean; recipient: string; smtpLog: string }>('/settings/system/test-email', {
        method: 'POST',
        body: JSON.stringify({ testRecipient: testEmailAddress || undefined }),
      });

      setTestResult(res.smtpLog);
      setNotification({ type: 'success', message: `Gửi email kiểm thử thành công tới ${res.recipient}!` });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Không thể kết nối máy chủ SMTP' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-800 via-teal-800 to-blue-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl">
            <MailCheck className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Cấu hình Email SMTP & Kịch bản Thông báo (Alerts & SMTP)</h1>
            <p className="text-cyan-100 text-xs mt-0.5">
              Thiết lập thông số máy chủ gửi email nội bộ và kích hoạt các kịch bản cảnh báo hạn định SLA, Task
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-white text-teal-800 hover:bg-teal-50 rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Đang lưu...' : 'Lưu toàn bộ cấu hình'}
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

      {/* Main Grid: SMTP Config vs Notification Triggers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: SMTP Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Server className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Máy chủ gửi thư SMTP (Outgoing Mail Server)</h2>
                <p className="text-xs text-slate-500">Cấu hình kết nối giao thức Simple Mail Transfer Protocol</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Máy chủ SMTP Host</label>
                  <input
                    type="text"
                    value={settings.SMTP_HOST || ''}
                    onChange={(e) => handleChange('SMTP_HOST', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cổng kết nối (Port)</label>
                  <input
                    type="text"
                    value={settings.SMTP_PORT || ''}
                    onChange={(e) => handleChange('SMTP_PORT', e.target.value)}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tài khoản gửi thư (Username / Email)</label>
                <input
                  type="email"
                  value={settings.SMTP_USER || ''}
                  onChange={(e) => handleChange('SMTP_USER', e.target.value)}
                  placeholder="notifications@yourcompany.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu ứng dụng (App Password)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.SMTP_PASS || ''}
                    onChange={(e) => handleChange('SMTP_PASS', e.target.value)}
                    placeholder="Nhập mã ứng dụng 16 ký tự..."
                    className="w-full pr-10 px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giao thức bảo mật (Encryption)</label>
                <div className="flex items-center gap-4 pt-1">
                  {['tls', 'ssl', 'none'].map((sec) => (
                    <label key={sec} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 uppercase">
                      <input
                        type="radio"
                        name="secure"
                        checked={settings.SMTP_SECURE === sec}
                        onChange={() => handleChange('SMTP_SECURE', sec)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span>{sec}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Connection Box */}
            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-teal-600" />
                  Kiểm tra kết nối gửi thư (Send Test Email)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Nhập email nhận thử nghiệm (mặc định email hiện tại)..."
                  className="flex-1 px-3 py-2 bg-white border border-teal-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={isTesting}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Đang gửi...' : 'Gửi thử'}
                </button>
              </div>

              {testResult && (
                <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg mt-2">
                  {testResult}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notification Triggers (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bell className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Kịch bản Cảnh báo & Thông báo Tự động</h2>
                <p className="text-xs text-slate-500">Tự động kích hoạt email dựa trên sự kiện vận hành</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Trigger 1: SLA Alert */}
              <div className="p-3.5 rounded-xl border border-slate-200 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition">
                <div>
                  <div className="text-xs font-bold text-slate-800">Cảnh báo vi phạm SLA liên phòng ban</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gửi cảnh báo khẩn cấp tới Trưởng bộ phận khi ticket SLA vượt quá 80% thời hạn cam kết
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('NOTIFY_SLA_ALERT')}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    settings.NOTIFY_SLA_ALERT === 'true' ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      settings.NOTIFY_SLA_ALERT === 'true' ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Trigger 2: Task Due */}
              <div className="p-3.5 rounded-xl border border-slate-200 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition">
                <div>
                  <div className="text-xs font-bold text-slate-800">Nhắc hạn chót công việc trước 24 giờ</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tự động gửi email điểm tin công việc sắp đến deadline cho nhân sự được phân công
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('NOTIFY_TASK_DUE')}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    settings.NOTIFY_TASK_DUE === 'true' ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      settings.NOTIFY_TASK_DUE === 'true' ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Trigger 3: Exam Schedule */}
              <div className="p-3.5 rounded-xl border border-slate-200 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition">
                <div>
                  <div className="text-xs font-bold text-slate-800">Thông báo mở kỳ thi khảo sát quy trình</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gửi thư mời dự thi và liên kết làm bài thi quy trình chuẩn SOP khi có đợt khảo thí mới
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('NOTIFY_EXAM_SCHEDULE')}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    settings.NOTIFY_EXAM_SCHEDULE === 'true' ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      settings.NOTIFY_EXAM_SCHEDULE === 'true' ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Trigger 4: BSC Report */}
              <div className="p-3.5 rounded-xl border border-slate-200 flex items-start justify-between gap-3 hover:bg-slate-50/60 transition">
                <div>
                  <div className="text-xs font-bold text-slate-800">Báo cáo tổng hợp Thẻ điểm BSC định kỳ</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gửi tóm tắt chỉ số tài chính, khách hàng và quy trình hàng tháng tới Ban Giám Đốc
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('NOTIFY_BSC_REPORT')}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    settings.NOTIFY_BSC_REPORT === 'true' ? 'bg-teal-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      settings.NOTIFY_BSC_REPORT === 'true' ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* General Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-600" />
              Thông tin Doanh nghiệp hiển thị trên Email
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đơn vị chủ quản</label>
              <input
                type="text"
                value={settings.COMPANY_NAME || ''}
                onChange={(e) => handleChange('COMPANY_NAME', e.target.value)}
                placeholder="TinyKPI Enterprise System..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
