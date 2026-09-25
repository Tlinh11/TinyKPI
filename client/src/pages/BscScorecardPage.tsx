import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  Check,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { apiClient } from '../api/client.js';
import { Department } from '../types/index.js';
import { exportToExcel } from '../utils/excel.js';

interface KpiIndicator {
  id: string;
  code: string;
  name: string;
  unit: string;
  frequency: string;
  weight: number;
  targetValue: number;
  thresholdValue?: number;
  stretchValue?: number;
  actualValue: number;
  achievementRate: number;
  departmentId?: string;
  department?: { id: string; name: string; code?: string };
  assignedToId?: string;
  assignedTo?: { id: string; fullName: string; email: string };
  status: string;
  note?: string;
}

interface StrategicObjective {
  id: string;
  code?: string;
  title: string;
  perspective: string;
  kpiIndicators: KpiIndicator[];
}

interface PerspectiveGroup {
  key: string;
  title: string;
  objectives: StrategicObjective[];
  averageAchievement: number;
}

interface StrategyMapResponse {
  overallScore: number;
  totalObjectives: number;
  totalKpis: number;
  perspectives: PerspectiveGroup[];
}

interface BscReportItem {
  id: string;
  name: string;
  period: string;
  frequency: string;
  score?: number;
  status: string;
  description?: string;
  createdAt: string;
}

interface BscScorecardPageProps {
  onNavigate: (path: string) => void;
}

export const BscScorecardPage: React.FC<BscScorecardPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<StrategyMapResponse | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reports, setReports] = useState<BscReportItem[]>([]);
  const [activeTab, setActiveTab] = useState<'scorecard' | 'reports'>('scorecard');
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPerspective, setSelectedPerspective] = useState('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal: Create KPI
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [formObjectiveId, setFormObjectiveId] = useState('');
  const [kpiCode, setKpiCode] = useState('');
  const [kpiName, setKpiName] = useState('');
  const [kpiUnit, setKpiUnit] = useState('%');
  const [kpiWeight, setKpiWeight] = useState('20');
  const [kpiFreq, setKpiFreq] = useState('MONTHLY');
  const [kpiTarget, setKpiTarget] = useState('100');
  const [kpiThreshold, setKpiThreshold] = useState('80');
  const [kpiStretch, setKpiStretch] = useState('120');
  const [kpiDeptId, setKpiDeptId] = useState('');
  const [kpiFormError, setKpiFormError] = useState<string | null>(null);

  // Modal: Create BSC Report
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportPeriod, setReportPeriod] = useState('Quý 2/2026');
  const [reportFreq, setReportFreq] = useState('QUARTERLY');
  const [reportDesc, setReportDesc] = useState('');

  // Modal: Update Actual Value
  const [updatingKpi, setUpdatingKpi] = useState<KpiIndicator | null>(null);
  const [updateActualValue, setUpdateActualValue] = useState('');
  const [updateNote, setUpdateNote] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [mapRes, deptRes, reportRes] = await Promise.all([
        apiClient<StrategyMapResponse>('/bsc/strategy-map'),
        apiClient<Department[]>('/departments'),
        apiClient<BscReportItem[]>('/bsc/reports'),
      ]);
      setData(mapRes);
      setDepartments(deptRes);
      setReports(reportRes);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải dữ liệu báo cáo BSC' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Flatten all KPIs for the master scorecard
  const allObjectives = data?.perspectives.flatMap((p) =>
    p.objectives.map((o) => ({ ...o, perspectiveTitle: p.title, perspectiveKey: p.key }))
  ) || [];

  const allKpis = allObjectives.flatMap((obj) =>
    obj.kpiIndicators.map((kpi) => ({
      ...kpi,
      objectiveTitle: obj.title,
      objectiveCode: obj.code,
      perspectiveTitle: obj.perspectiveTitle,
      perspectiveKey: obj.perspectiveKey,
    }))
  );

  const filteredKpis = allKpis.filter((k) => {
    if (search && !k.name.toLowerCase().includes(search.toLowerCase()) && !k.code.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedPerspective !== 'ALL' && k.perspectiveKey !== selectedPerspective) {
      return false;
    }
    if (selectedDeptId && k.departmentId !== selectedDeptId) {
      return false;
    }
    if (selectedStatus !== 'ALL' && k.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const handleOpenCreateKpiModal = (objId?: string) => {
    setFormObjectiveId(objId || (allObjectives.length > 0 ? allObjectives[0].id : ''));
    setKpiCode(`KPI-${Math.floor(100 + Math.random() * 900)}`);
    setKpiName('');
    setKpiUnit('%');
    setKpiWeight('25');
    setKpiFreq('MONTHLY');
    setKpiTarget('100');
    setKpiThreshold('85');
    setKpiStretch('115');
    setKpiDeptId(departments.length > 0 ? departments[0].id : '');
    setKpiFormError(null);
    setIsKpiModalOpen(true);
  };

  const handleSaveKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setKpiFormError(null);

    if (!kpiName.trim()) {
      setKpiFormError('Vui lòng nhập tên chỉ số KPI');
      return;
    }

    try {
      await apiClient('/bsc/kpis', {
        method: 'POST',
        body: JSON.stringify({
          objectiveId: formObjectiveId,
          code: kpiCode.trim(),
          name: kpiName.trim(),
          unit: kpiUnit,
          frequency: kpiFreq,
          weight: parseFloat(kpiWeight) || 20,
          targetValue: parseFloat(kpiTarget) || 100,
          thresholdValue: kpiThreshold ? parseFloat(kpiThreshold) : undefined,
          stretchValue: kpiStretch ? parseFloat(kpiStretch) : undefined,
          departmentId: kpiDeptId || undefined,
        }),
      });

      setNotification({ type: 'success', message: 'Tạo chỉ số KPI thành công!' });
      setIsKpiModalOpen(false);
      loadData();
    } catch (err: any) {
      setKpiFormError(err.message || 'Lưu chỉ số thất bại');
    }
  };

  const handleOpenUpdateActualModal = (kpi: KpiIndicator) => {
    setUpdatingKpi(kpi);
    setUpdateActualValue(kpi.actualValue.toString());
    setUpdateNote(kpi.note || '');
  };

  const handleSaveActualValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingKpi) return;

    try {
      await apiClient(`/bsc/kpis/${updatingKpi.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          actualValue: parseFloat(updateActualValue) || 0,
          note: updateNote.trim() || undefined,
        }),
      });

      setNotification({ type: 'success', message: 'Cập nhật kết quả thực hiện thành công!' });
      setUpdatingKpi(null);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Cập nhật thất bại' });
    }
  };

  const handleDeleteKpi = async (kpiId: string) => {
    if (!confirm('Bạn có chắc muốn xóa chỉ số KPI này?')) return;
    try {
      await apiClient(`/bsc/kpis/${kpiId}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa chỉ số KPI' });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName.trim() || !reportPeriod.trim()) return;

    try {
      await apiClient('/bsc/reports', {
        method: 'POST',
        body: JSON.stringify({
          name: reportName.trim(),
          period: reportPeriod.trim(),
          frequency: reportFreq,
          score: data?.overallScore || 0,
          description: reportDesc.trim() || undefined,
        }),
      });

      setNotification({ type: 'success', message: 'Tạo báo cáo BSC thành công vào cơ sở dữ liệu!' });
      setIsReportModalOpen(false);
      setReportName('');
      loadData();
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tạo báo cáo' });
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa báo cáo này?')) return;
    try {
      await apiClient(`/bsc/reports/${id}`, { method: 'DELETE' });
      setNotification({ type: 'success', message: 'Đã xóa báo cáo' });
      loadData();
      setTimeout(() => setNotification(null), 2500);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Xóa thất bại' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXCEEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            Vượt kế hoạch
          </span>
        );
      case 'ACHIEVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Đạt mục tiêu
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Cần cải thiện
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" />
            Chưa đạt
          </span>
        );
    }
  };

  const handleExportExcel = () => {
    if (!data || !data.perspectives) {
      setNotification({ type: 'error', message: 'Chưa có dữ liệu thẻ điểm để xuất Excel' });
      return;
    }

    const flatRows: any[] = [];
    let counter = 1;

    data.perspectives.forEach((persp) => {
      persp.objectives.forEach((obj) => {
        if (!obj.kpiIndicators || obj.kpiIndicators.length === 0) {
          flatRows.push({
            stt: counter++,
            perspective: persp.title,
            objective: obj.title,
            kpiCode: '',
            kpiName: '(Chưa gắn KPI)',
            unit: '',
            frequency: '',
            weight: '0%',
            targetValue: 0,
            actualValue: 0,
            achievementRate: '0%',
            status: 'Chưa có dữ liệu'
          });
        } else {
          obj.kpiIndicators.forEach((kpi) => {
            flatRows.push({
              stt: counter++,
              perspective: persp.title,
              objective: obj.title,
              kpiCode: kpi.code,
              kpiName: kpi.name,
              unit: kpi.unit,
              frequency: kpi.frequency === 'MONTHLY' ? 'Tháng' : kpi.frequency === 'QUARTERLY' ? 'Quý' : 'Năm',
              weight: `${kpi.weight}%`,
              targetValue: kpi.targetValue,
              actualValue: kpi.actualValue,
              achievementRate: `${kpi.achievementRate}%`,
              status: kpi.achievementRate >= 100 ? 'Đạt mục tiêu' : kpi.achievementRate >= 80 ? 'Cần cải thiện' : 'Chưa đạt'
            });
          });
        }
      });
    });

    if (flatRows.length === 0) {
      setNotification({ type: 'error', message: 'Không có dữ liệu KPI để xuất' });
      return;
    }

    exportToExcel({
      data: flatRows,
      fileName: `The_Diem_BSC_TinyKPI_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Thẻ điểm BSC',
      columns: [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Viễn cảnh BSC', key: 'perspective', width: 26 },
        { header: 'Mục tiêu chiến lược', key: 'objective', width: 32 },
        { header: 'Mã KPI', key: 'kpiCode', width: 14 },
        { header: 'Tên chỉ số KPI', key: 'kpiName', width: 32 },
        { header: 'ĐVT', key: 'unit', width: 10 },
        { header: 'Tần suất', key: 'frequency', width: 12 },
        { header: 'Trọng số', key: 'weight', width: 12 },
        { header: 'Chỉ tiêu Kế hoạch', key: 'targetValue', width: 18 },
        { header: 'Thực hiện', key: 'actualValue', width: 16 },
        { header: 'Tỷ lệ hoàn thành', key: 'achievementRate', width: 18 },
        { header: 'Đánh giá trạng thái', key: 'status', width: 20 },
      ],
    });

    setNotification({ type: 'success', message: `Đã xuất ${flatRows.length} chỉ số KPI trong Thẻ điểm BSC ra file Excel (.xlsx) thành công!` });
  };

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
              BƯỚC 5: ĐO LƯỜNG & BÁO CÁO
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'scorecard' ? 'B6: ĐO LƯỜNG & CHỈ TIÊU BSC' : 'BÁO CÁO BSC'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeTab === 'scorecard'
              ? 'Bảng cân bằng chỉ tiêu KPI tổng hợp 4 viễn cảnh, theo dõi kế hoạch vs thực hiện và tính điểm hoàn thành tự động.'
              : 'Tổng hợp danh sách các kỳ báo cáo BSC, theo dõi tiến độ và đánh giá điểm tổng thể toàn doanh nghiệp.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="bg-slate-200 p-0.5 rounded-lg flex items-center text-xs font-medium">
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'scorecard'
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thẻ điểm KPI
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'reports'
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh sách Báo cáo
            </button>
          </div>

          <button
            onClick={() => onNavigate('/strategy-map')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bản đồ Bước 4</span>
          </button>

          <button
            onClick={loadData}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-xs"
            title="Làm mới"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs"
            title="Xuất Thẻ điểm BSC ra file Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          {activeTab === 'scorecard' ? (
            <button
              onClick={() => handleOpenCreateKpiModal()}
              className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm KPI mới</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setReportName(`Báo Cáo Hiệu Suất BSC ${reportPeriod}`);
                setIsReportModalOpen(true);
              }}
              className="px-4 py-1.5 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Báo Cáo</span>
            </button>
          )}
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

      {activeTab === 'reports' ? (
        /* Authentic Báo Cáo BSC Table matching TopKPI screenshot */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-[#fafafa] text-slate-700 font-semibold border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">STT</th>
                  <th className="py-3.5 px-4 min-w-[320px]">Tên Báo Cáo</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Thời gian</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Tần suất</th>
                  <th className="py-3.5 px-4 text-center w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <span>Chưa có báo cáo BSC nào được lập</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((r, idx) => (
                    <tr key={r.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs">{r.name}</div>
                        {r.description && (
                          <div className="text-[11px] font-normal text-slate-400 mt-0.5">{r.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{r.period}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1677ff] font-semibold text-[11px] border border-blue-200">
                          {r.frequency === 'MONTHLY' ? 'Hàng tháng' : r.frequency === 'QUARTERLY' ? 'Hàng quý' : 'Hàng năm'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setActiveTab('scorecard')}
                            className="text-xs text-[#1677ff] hover:underline font-semibold"
                            title="Xem chi tiết thẻ điểm"
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="text-slate-400 hover:text-red-600 p-1 transition"
                            title="Xóa báo cáo"
                          >
                            <Trash2 className="w-4 h-4" />
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
      ) : (
        <>
          {/* KPI Performance Summary Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center shadow-md">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Tổng điểm</span>
            <span className="text-2xl font-extrabold">{data?.overallScore || 0}%</span>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">Chỉ số Hiệu suất Cân bằng BSC Toàn Công ty</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đánh giá tự động từ {allKpis.length} chỉ số KPI đang vận hành
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                Vượt KH: {allKpis.filter((k) => k.status === 'EXCEEDED').length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Đạt: {allKpis.filter((k) => k.status === 'ACHIEVED').length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                Cảnh báo: {allKpis.filter((k) => k.status === 'WARNING').length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                Chưa đạt: {allKpis.filter((k) => k.status === 'FAILED').length}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Perspectives Mini Bars */}
        <div className="grid grid-cols-2 gap-3 min-w-[280px]">
          {data?.perspectives.map((p) => (
            <div key={p.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                <span>{p.title}</span>
                <span className="text-[#1677ff]">{p.averageAchievement}%</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1677ff] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, p.averageAchievement)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-56">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã hoặc tên KPI..."
              className="w-full py-1.5 pl-3 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={selectedPerspective}
            onChange={(e) => setSelectedPerspective(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
          >
            <option value="ALL">Tất cả viễn cảnh</option>
            <option value="FINANCIAL">Tài chính</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="INTERNAL_PROCESS">Quy trình nội bộ</option>
            <option value="LEARNING_GROWTH">Học hỏi & Phát triển</option>
          </select>

          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="EXCEEDED">Vượt kế hoạch</option>
            <option value="ACHIEVED">Đạt mục tiêu</option>
            <option value="WARNING">Cần cải thiện</option>
            <option value="FAILED">Chưa đạt</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Hiển thị: <span className="font-bold text-slate-800">{filteredKpis.length}</span> chỉ số KPI
        </div>
      </div>

      {/* Main Scorecard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#fafafa] text-slate-700 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-3 min-w-[120px]">Viễn cảnh</th>
                <th className="py-3 px-3 min-w-[200px]">Mục tiêu chiến lược</th>
                <th className="py-3 px-3 min-w-[90px]">Mã KPI</th>
                <th className="py-3 px-3 min-w-[220px]">Tên chỉ số KPI</th>
                <th className="py-3 px-3 text-center w-20">Đơn vị</th>
                <th className="py-3 px-3 text-center w-20">Trọng số</th>
                <th className="py-3 px-3 text-right min-w-[90px]">Kế hoạch</th>
                <th className="py-3 px-3 text-right min-w-[100px]">Thực hiện</th>
                <th className="py-3 px-3 text-center min-w-[130px]">Tỷ lệ đạt</th>
                <th className="py-3 px-3 min-w-[140px]">Đơn vị phụ trách</th>
                <th className="py-3 px-3 text-center min-w-[120px]">Trạng thái</th>
                <th className="py-3 px-3 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKpis.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center text-slate-400">
                    Chưa có chỉ số KPI nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredKpis.map((kpi, idx) => (
                  <tr key={kpi.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-600 text-[11px]">
                        {kpi.perspectiveTitle}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {kpi.objectiveTitle}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-600 text-[11px]">
                      {kpi.code}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {kpi.name}
                      {kpi.note && (
                        <div className="text-[10px] font-normal text-slate-400 italic mt-0.5">
                          Ghi chú: {kpi.note}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">{kpi.unit}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">{kpi.weight}%</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      {kpi.targetValue.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-[#1677ff]">
                      <button
                        onClick={() => handleOpenUpdateActualModal(kpi)}
                        className="hover:underline hover:text-blue-700 flex items-center justify-end gap-1 ml-auto"
                        title="Bấm để cập nhật kết quả thực hiện"
                      >
                        <span>{kpi.actualValue.toLocaleString('vi-VN')}</span>
                        <Edit2 className="w-3 h-3 text-slate-300" />
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              kpi.achievementRate >= 100
                                ? 'bg-purple-600'
                                : kpi.achievementRate >= 90
                                ? 'bg-emerald-500'
                                : kpi.achievementRate >= 75
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, kpi.achievementRate)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-slate-800 min-w-[42px] text-right">
                          {kpi.achievementRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 text-[11px]">
                      {kpi.department?.name || 'Toàn công ty'}
                    </td>
                    <td className="py-3 px-3 text-center">{getStatusBadge(kpi.status)}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenUpdateActualModal(kpi)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Cập nhật kết quả"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKpi(kpi.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Xóa KPI"
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
    </>
  )}

      {/* Modal Cập nhật Thực hiện KPI */}
      {updatingKpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Cập nhật Kết quả Thực hiện KPI</h2>
              <button onClick={() => setUpdatingKpi(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs">
              <div className="font-bold text-slate-800">{updatingKpi.code} — {updatingKpi.name}</div>
              <div className="text-slate-500 mt-1 flex items-center gap-4">
                <span>Kế hoạch: <b>{updatingKpi.targetValue} {updatingKpi.unit}</b></span>
                <span>Trọng số: <b>{updatingKpi.weight}%</b></span>
              </div>
            </div>

            <form onSubmit={handleSaveActualValue} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giá trị thực tế đạt được ({updatingKpi.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={updateActualValue}
                  onChange={(e) => setUpdateActualValue(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-sm font-bold text-[#1677ff] border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú giải trình (nếu có)</label>
                <textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  rows={3}
                  placeholder="Ghi nhận lý do vượt hoặc chậm tiến độ..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUpdatingKpi(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Lưu kết quả
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Chỉ số KPI Mới */}
      {isKpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Thiết lập Chỉ số Đo lường KPI Mới</h2>
              <button onClick={() => setIsKpiModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {kpiFormError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{kpiFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveKpi} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mục tiêu chiến lược liên kết *</label>
                <select
                  value={formObjectiveId}
                  onChange={(e) => setFormObjectiveId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white font-medium text-slate-800"
                >
                  {allObjectives.map((o) => (
                    <option key={o.id} value={o.id}>
                      [{o.perspectiveTitle}] {o.code ? `${o.code} - ` : ''}{o.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã chỉ số KPI *</label>
                  <input
                    type="text"
                    value={kpiCode}
                    onChange={(e) => setKpiCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    value={kpiUnit}
                    onChange={(e) => setKpiUnit(e.target.value)}
                    placeholder="%, VNĐ, Điểm, Ngày..."
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên chỉ số KPI *</label>
                <input
                  type="text"
                  value={kpiName}
                  onChange={(e) => setKpiName(e.target.value)}
                  placeholder="VD: Tăng trưởng doanh thu thuần..."
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kế hoạch (Target) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kpiTarget}
                    onChange={(e) => setKpiTarget(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trọng số (%) *</label>
                  <input
                    type="number"
                    value={kpiWeight}
                    onChange={(e) => setKpiWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tần suất đo</label>
                  <select
                    value={kpiFreq}
                    onChange={(e) => setKpiFreq(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                  >
                    <option value="MONTHLY">Hàng tháng</option>
                    <option value="QUARTERLY">Hàng quý</option>
                    <option value="YEARLY">Hàng năm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phân bổ cho Phòng ban phụ trách</label>
                <select
                  value={kpiDeptId}
                  onChange={(e) => setKpiDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                >
                  <option value="">Toàn công ty</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsKpiModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Tạo chỉ số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Báo Cáo BSC */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Thiết Lập Kỳ Báo Cáo BSC Mới</h2>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên kỳ báo cáo BSC *
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  required
                  autoFocus
                  placeholder="VD: Báo Cáo BSC Quý 2/2026..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian / Kỳ *</label>
                  <input
                    type="text"
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                    required
                    placeholder="VD: Quý 2/2026, Tháng 4/2026..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tần suất</label>
                  <select
                    value={reportFreq}
                    onChange={(e) => setReportFreq(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] bg-white"
                  >
                    <option value="MONTHLY">Hàng tháng</option>
                    <option value="QUARTERLY">Hàng quý</option>
                    <option value="YEARLY">Hàng năm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả / Phạm vi đánh giá</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  rows={3}
                  placeholder="Ghi nhận phạm vi, đơn vị áp dụng..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#1677ff] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1677ff] hover:bg-[#4096ff] rounded-lg transition shadow-xs"
                >
                  Tạo báo cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
