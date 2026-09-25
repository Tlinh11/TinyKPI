import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  TrendingUp,
  Building2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Check
} from 'lucide-react';
import { exportToExcel } from '../utils/excel.js';

interface ReportRow {
  code: string;
  title: string;
  department: string;
  target: string;
  actual: string;
  targetNum: number;
  actualNum: number;
  unit: string;
  variance: string;
  varianceNum: number;
  status: 'SURPASSED' | 'NEAR_TARGET' | 'ATTENTION';
}

const INITIAL_REPORT_DATA: ReportRow[] = [
  {
    code: 'KPI-FIN-001',
    title: 'Tăng trưởng Doanh thu Toàn công ty',
    department: 'Kinh doanh & Tiếp thị',
    target: '15.0%',
    actual: '16.2%',
    targetNum: 15.0,
    actualNum: 16.2,
    unit: '%',
    variance: '+1.2%',
    varianceNum: 1.2,
    status: 'SURPASSED',
  },
  {
    code: 'KPI-FIN-002',
    title: 'Tỷ suất Lợi nhuận gộp sau thuế',
    department: 'Ban Giám Đốc',
    target: '22.0%',
    actual: '20.5%',
    targetNum: 22.0,
    actualNum: 20.5,
    unit: '%',
    variance: '-1.5%',
    varianceNum: -1.5,
    status: 'NEAR_TARGET',
  },
  {
    code: 'KPI-CUST-001',
    title: 'Chỉ số Hài lòng Khách hàng (CSAT)',
    department: 'Kỹ thuật & Công nghệ',
    target: '90.0%',
    actual: '94.0%',
    targetNum: 90.0,
    actualNum: 94.0,
    unit: '%',
    variance: '+4.0%',
    varianceNum: 4.0,
    status: 'SURPASSED',
  },
  {
    code: 'KPI-PROC-001',
    title: 'Tỷ lệ Tuân thủ Thời gian Cam kết SLA',
    department: 'Kỹ thuật & Công nghệ',
    target: '95.0%',
    actual: '92.0%',
    targetNum: 95.0,
    actualNum: 92.0,
    unit: '%',
    variance: '-3.0%',
    varianceNum: -3.0,
    status: 'ATTENTION',
  },
  {
    code: 'KPI-LEARN-001',
    title: 'Số giờ đào tạo nội bộ trung bình/nhân viên',
    department: 'Nhân sự & Đào tạo',
    target: '24 giờ',
    actual: '26 giờ',
    targetNum: 24,
    actualNum: 26,
    unit: 'giờ',
    variance: '+2 giờ',
    varianceNum: 2,
    status: 'SURPASSED',
  },
];

export const ReportsPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [period, setPeriod] = useState('Q3-2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Departments list for filter
  const departments = useMemo(() => {
    const set = new Set(INITIAL_REPORT_DATA.map((r) => r.department));
    return Array.from(set);
  }, []);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return INITIAL_REPORT_DATA.filter((row) => {
      const matchSearch =
        row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept = selectedDept === 'ALL' || row.department === selectedDept;
      const matchStatus = selectedStatus === 'ALL' || row.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [searchQuery, selectedDept, selectedStatus]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = INITIAL_REPORT_DATA.length;
    const surpassed = INITIAL_REPORT_DATA.filter((r) => r.status === 'SURPASSED').length;
    const nearTarget = INITIAL_REPORT_DATA.filter((r) => r.status === 'NEAR_TARGET').length;
    const attention = INITIAL_REPORT_DATA.filter((r) => r.status === 'ATTENTION').length;
    const avgCompletion = (
      INITIAL_REPORT_DATA.reduce((acc, curr) => acc + (curr.actualNum / curr.targetNum) * 100, 0) / total
    ).toFixed(1);

    return { total, surpassed, nearTarget, attention, avgCompletion };
  }, []);

  const handleExportExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        exportToExcel({
          data: filteredData,
          fileName: `Bao_Cao_Hieu_Suat_TinyKPI_${period}.xlsx`,
          sheetName: `Báo cáo ${period}`,
          columns: [
            { header: 'Mã KPI', key: 'code', width: 16 },
            { header: 'Tên chỉ số KPI', key: 'title', width: 38 },
            { header: 'Phòng ban phụ trách', key: 'department', width: 26 },
            { header: 'Chỉ tiêu Kế hoạch', key: 'target', width: 18 },
            { header: 'Thực hiện', key: 'actual', width: 18 },
            { header: 'Độ lệch (+/-)', key: 'variance', width: 16 },
            {
              header: 'Trạng thái',
              key: 'status',
              width: 18,
              format: (s) => (s === 'SURPASSED' ? 'Vượt chỉ tiêu' : s === 'NEAR_TARGET' ? 'Đạt mục tiêu' : 'Cần cải thiện'),
            },
          ],
        });
        setExportNotice(`Đã xuất ${filteredData.length} chỉ số ra file Excel thành công!`);
        setTimeout(() => setExportNotice(null), 3500);
      } catch (err: any) {
        setExportNotice('Lỗi khi xuất file Excel');
      } finally {
        setIsExporting(false);
      }
    }, 400);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-semibold tracking-wide mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>PHÂN TÍCH & BÁO CÁO TỔNG HỢP</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Báo Cáo Phân Tích Độ Lệch KPI & Hiệu Suất
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Hệ thống hóa số liệu thực thi chiến lược BSC & KPI, đo lường độ lệch kế hoạch vs thực tế theo thời gian thực từ Neon Cloud.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.print()}
            className="btn-interactive inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
            title="In báo cáo (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">In báo cáo</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting || filteredData.length === 0}
            className="btn-interactive inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1677ff] hover:bg-[#0958d9] active:bg-[#003eb3] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? 'Đang xuất...' : 'Xuất Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-600 hover:text-emerald-900 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* KPI Performance Summary Scorecard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng chỉ số */}
        <div className="card-hover-elevate bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Tổng số chỉ số</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Thuộc 4 phòng ban cốt lõi</div>
          </div>
        </div>

        {/* Card 2: Vượt kế hoạch */}
        <div className="card-hover-elevate bg-white rounded-xl border border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/30 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-emerald-700">Vượt chỉ tiêu</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-700 tabular-nums">{stats.surpassed}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded-full">
                {Math.round((stats.surpassed / stats.total) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-emerald-600/90 mt-0.5">Đạt kết quả xuất sắc</div>
          </div>
        </div>

        {/* Card 3: Đạt mục tiêu */}
        <div className="card-hover-elevate bg-white rounded-xl border border-blue-200/80 bg-gradient-to-br from-white via-white to-blue-50/30 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-blue-700">Đạt mục tiêu</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-700 tabular-nums">{stats.nearTarget}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-100/80 px-1.5 py-0.5 rounded-full">
                {Math.round((stats.nearTarget / stats.total) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-blue-600/90 mt-0.5">Tiệm cận mốc kế hoạch</div>
          </div>
        </div>

        {/* Card 4: Cần cải thiện */}
        <div className="card-hover-elevate bg-white rounded-xl border border-amber-200/80 bg-gradient-to-br from-white via-white to-amber-50/30 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-amber-700">Cần cải thiện</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-700 tabular-nums">{stats.attention}</span>
              <span className="text-xs font-bold text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded-full">
                {Math.round((stats.attention / stats.total) * 100)}%
              </span>
            </div>
            <div className="text-[11px] text-amber-600/90 mt-0.5">Yêu cầu can thiệp SLA</div>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã chỉ số, tên KPI hoặc phòng ban..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Period Selector & Dept dropdown */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 text-[11px] font-medium">Kỳ:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="Q3-2026">Quý 3 / 2026 (Hiện tại)</option>
                <option value="Q2-2026">Quý 2 / 2026</option>
                <option value="Q1-2026">Quý 1 / 2026</option>
                <option value="2026">Cả năm 2026</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Tất cả phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-[11px] font-medium mr-1">Bộ lọc trạng thái:</span>
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'SURPASSED', label: 'Vượt chỉ tiêu', color: 'text-emerald-700' },
              { key: 'NEAR_TARGET', label: 'Đạt mục tiêu', color: 'text-blue-700' },
              { key: 'ATTENTION', label: 'Cần cải thiện', color: 'text-amber-700' },
            ].map((tab) => {
              const isSelected = selectedStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`btn-interactive px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Hiển thị <span className="font-bold text-slate-900 tabular-nums">{filteredData.length}</span> /{' '}
            <span className="tabular-nums">{INITIAL_REPORT_DATA.length}</span> chỉ số
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Chi tiết Chỉ số Độ lệch & Hiệu suất</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Live Neon DB
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Đơn vị tính: %, Giờ, Số lượng
          </span>
        </div>

        {filteredData.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-700">Không tìm thấy chỉ số phù hợp</div>
            <p className="text-xs text-slate-400 mt-1">Hãy thử xóa bộ lọc tìm kiếm hoặc chọn lại trạng thái</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('ALL');
                setSelectedStatus('ALL');
              }}
              className="mt-3 btn-interactive px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#fafafa] border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wide select-none">
                <tr>
                  <th className="py-3 px-4 w-28">Mã KPI</th>
                  <th className="py-3 px-4 min-w-[240px]">Tên chỉ số KPI</th>
                  <th className="py-3 px-3 min-w-[160px]">Phòng ban</th>
                  <th className="py-3 px-3 text-right w-28">Kế hoạch</th>
                  <th className="py-3 px-3 text-right w-28">Thực hiện</th>
                  <th className="py-3 px-3 text-center min-w-[140px]">Tỷ lệ hoàn thành</th>
                  <th className="py-3 px-3 min-w-[120px]">Độ lệch</th>
                  <th className="py-3 px-4 text-center w-32">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => {
                  const rate = Math.round((row.actualNum / row.targetNum) * 100);
                  const isPositive = row.varianceNum >= 0;

                  return (
                    <tr key={row.code} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 tracking-tight">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-white border border-slate-200/80 transition">
                          {row.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                          {row.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Đo lường theo chu kỳ {period}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{row.department}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-700 tabular-nums">
                        {row.target}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-extrabold text-slate-900 tabular-nums text-sm">
                        {row.actual}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                rate >= 100
                                  ? 'bg-emerald-500'
                                  : rate >= 90
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, rate)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-700 w-10 text-right tabular-nums">
                            {rate}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold tabular-nums">
                        {isPositive ? (
                          <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md w-fit border border-emerald-200">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {row.variance}
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md w-fit border border-rose-200">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            {row.variance}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {row.status === 'SURPASSED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            Vượt chỉ tiêu
                          </span>
                        ) : row.status === 'NEAR_TARGET' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Đạt mục tiêu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Cần cải thiện
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guidance Note matching UX Pro Max specs */}
      <div className="bg-slate-100/70 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Báo cáo tuân thủ nguyên tắc <strong>Balanced Scorecard (Kaplan & Norton)</strong>, liên kết trực tiếp với Bản đồ Chiến lược 4 viễn cảnh.
          </span>
        </div>
        <button
          onClick={() => onNavigate?.('/bsc-scorecard')}
          className="btn-interactive text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 shrink-0"
        >
          <span>Xem Thẻ điểm BSC đầy đủ</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
