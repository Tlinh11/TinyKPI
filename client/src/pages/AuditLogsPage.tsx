import React, { useState, useEffect } from 'react';
import { RotateCw, ShieldCheck, History } from 'lucide-react';
import { apiClient } from '../api/client.js';

interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
}

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient<{ items: AuditLog[] }>('/audit-logs?limit=50');
      setLogs(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">CREATE</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">UPDATE</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold text-[10px]">DELETE</span>;
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">LOGIN</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#1677ff]" />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">NHẬT KÝ KIỂM TOÁN HỆ THỐNG</h1>
        </div>

        <button
          onClick={loadLogs}
          className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-[#fafafa] text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-44">Thời gian</th>
              <th className="py-3 px-4 w-48">Tài khoản</th>
              <th className="py-3 px-4 w-28 text-center">Hành động</th>
              <th className="py-3 px-4 w-36">Đối tượng</th>
              <th className="py-3 px-4">Chi tiết thay đổi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  Chưa có nhật ký nào được ghi nhận
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{log.userEmail || 'Hệ thống'}</td>
                  <td className="py-2.5 px-4 text-center">{getActionBadge(log.action)}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-700">{log.entity}</td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 break-all">
                    {log.newValue || log.oldValue || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
