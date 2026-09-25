import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Building2,
  RefreshCw,
  Award,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { api } from '../api/client.js';

interface MonitoringData {
  kpiOverview: {
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    reviewTasks: number;
    completionRate: number;
    overallBscHealth: number;
    slaComplianceRate: number;
  };
  departmentStats: Array<{
    id: string;
    name: string;
    code: string;
    userCount: number;
    totalTasks: number;
    doneTasks: number;
    avgProgress: number;
    status: 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK';
  }>;
  perspectiveStats: Array<{
    perspective: string;
    objectiveCount: number;
    score: number;
    status: string;
  }>;
  recentAlerts: Array<{
    id: string;
    level: string;
    text: string;
    time: string;
  }>;
}

export const MonitoringPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitoring = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/api/monitoring/overview');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  const getPerspectiveTitle = (p: string) => {
    switch (p) {
      case 'FINANCIAL':
        return 'Tài chính (Financial)';
      case 'CUSTOMER':
        return 'Khách hàng (Customer)';
      case 'INTERNAL_PROCESS':
        return 'Quy trình nội bộ (Processes)';
      default:
        return 'Học hỏi & Phát triển (Learning)';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'EXCELLENT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Xuất sắc</span>;
      case 'ON_TRACK':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Đúng tiến độ</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Cần lưu ý</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>MONITORING KPI & VẬN HÀNH REALTIME</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Giám sát Hiệu suất Thời gian thực</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật tức thời chỉ số sức khỏe chiến lược BSC, mức độ tuân thủ SLA và tiến độ phòng ban.
          </p>
        </div>

        <button
          onClick={fetchMonitoring}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">Đang đồng bộ dữ liệu giám sát...</span>
        </div>
      ) : (
        <>
          {/* Key KPI Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall BSC Health */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <span className="text-xs font-bold tracking-wider uppercase text-blue-200">
                  Chỉ số Sức khỏe BSC Tổng thể
                </span>
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="text-5xl font-black">{data.kpiOverview.overallBscHealth}</span>
                  <span className="text-2xl font-bold text-blue-300">/ 100</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Tăng trưởng +3.5% so với cùng kỳ tháng trước</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
                <span>Trạng thái: Hoạt động tối ưu</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>

            {/* SLA Adherence */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Tỷ lệ Tuân thủ Cam kết SLA
                </span>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-5xl font-black text-emerald-600">
                    {data.kpiOverview.slaComplianceRate}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Xử lý yêu cầu nghiệp vụ và hoàn thành đúng hạn cam kết SLA tiêu chuẩn.
                </p>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${data.kpiOverview.slaComplianceRate}%` }}
                />
              </div>
            </div>

            {/* Task Completion */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
                  Tiến độ Hoàn thành Tác vụ
                </span>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-5xl font-black text-blue-600">{data.kpiOverview.completionRate}%</span>
                  <span className="text-xs text-slate-500 font-bold">
                    ({data.kpiOverview.doneTasks}/{data.kpiOverview.totalTasks} việc)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400">Đang làm</div>
                    <div className="font-bold text-blue-600">{data.kpiOverview.inProgressTasks}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Chờ duyệt</div>
                    <div className="font-bold text-purple-600">{data.kpiOverview.reviewTasks}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Chưa bắt đầu</div>
                    <div className="font-bold text-slate-600">{data.kpiOverview.todoTasks}</div>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${data.kpiOverview.completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Perspectives Scorecard Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Chỉ số Đo lường theo 4 Viễn cảnh Chiến lược BSC</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {data.perspectiveStats.map((p) => (
                <div key={p.perspective} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-bold text-slate-700 truncate">{getPerspectiveTitle(p.perspective)}</div>
                  <div className="flex items-baseline justify-between mt-3">
                    <span className="text-2xl font-black text-slate-900">{p.score}%</span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {p.status}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.score}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 font-medium">
                    {p.objectiveCount} mục tiêu chiến lược
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Performance Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-600" />
                <span>Tiến độ Thực hiện theo Phòng ban / Bộ phận</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">5 bộ phận trực thuộc</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tên phòng ban</th>
                  <th className="py-3 px-3">Mã</th>
                  <th className="py-3 px-3">Nhân sự</th>
                  <th className="py-3 px-3">Số công việc</th>
                  <th className="py-3 px-4">Tiến độ trung bình</th>
                  <th className="py-3 px-3 text-right">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.departmentStats.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{dept.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{dept.code || '—'}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{dept.userCount} người</td>
                    <td className="py-3 px-3 text-slate-700">
                      {dept.doneTasks}/{dept.totalTasks} việc
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dept.avgProgress >= 80
                                ? 'bg-emerald-500'
                                : dept.avgProgress >= 50
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${dept.avgProgress}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 w-10 text-right">{dept.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">{getStatusBadge(dept.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
