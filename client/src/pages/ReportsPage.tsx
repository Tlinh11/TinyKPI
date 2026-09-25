import React, { useState } from 'react';
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
} from 'lucide-react';

export const ReportsPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [period, setPeriod] = useState('Q3-2026');
  const [reportType, setReportType] = useState('ALL');

  const reportData = [
    {
      code: 'KPI-FIN-001',
      title: 'Tăng trưởng Doanh thu Toàn công ty',
      department: 'Kinh doanh & Tiếp thị',
      target: '15.0%',
      actual: '16.2%',
      variance: '+1.2%',
      status: 'SURPASSED',
    },
    {
      code: 'KPI-FIN-002',
      title: 'Tỷ suất Lợi nhuận gộp sau thuế',
      department: 'Ban Giám Đốc',
      target: '22.0%',
      actual: '20.5%',
      variance: '-1.5%',
      status: 'NEAR_TARGET',
    },
    {
      code: 'KPI-CUST-001',
      title: 'Chỉ số Hài lòng Khách hàng (CSAT)',
      department: 'Kỹ thuật & Công nghệ',
      target: '90.0%',
      actual: '94.0%',
      variance: '+4.0%',
      status: 'SURPASSED',
    },
    {
      code: 'KPI-PROC-001',
      title: 'Tỷ lệ Tuân thủ Thời gian Cam kết SLA',
      department: 'Kỹ thuật & Công nghệ',
      target: '95.0%',
      actual: '92.0%',
      variance: '-3.0%',
      status: 'ATTENTION',
    },
    {
      code: 'KPI-LEARN-001',
      title: 'Số giờ đào tạo nội bộ trung bình/nhân viên',
      department: 'Nhân sự & Đào tạo',
      target: '24 giờ',
      actual: '26 giờ',
      variance: '+2 giờ',
      status: 'SURPASSED',
    },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Mã KPI,Tên chỉ số,Phòng ban,Kế hoạch,Thực hiện,Độ lệch']
        .concat(
          reportData.map(
            (r) => `"${r.code}","${r.title}","${r.department}","${r.target}","${r.actual}","${r.variance}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Hieu_Suat_TinyKPI_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>PHÂN TÍCH & BÁO CÁO TỔNG HỢP</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Báo cáo Phân tích Độ lệch KPI & Hiệu suất</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu thực thi chiến lược, so sánh kế hoạch với thực tế và xuất báo cáo quản trị.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In báo cáo</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1677ff] hover:bg-[#4096ff] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-600">Kỳ báo cáo:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 outline-hidden"
          >
            <option value="Q3-2026">Quý 3 / 2026 (Hiện tại)</option>
            <option value="Q2-2026">Quý 2 / 2026</option>
            <option value="Q1-2026">Quý 1 / 2026</option>
            <option value="2026">Cả năm 2026</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Dữ liệu được đồng bộ từ <span className="font-bold text-slate-700">Neon Cloud Database</span>
        </div>
      </div>

      {/* Performance Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Bảng So sánh Mục tiêu Kế hoạch & Thực tế</h2>
          <span className="text-xs text-slate-500">5 chỉ số trọng yếu</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Mã KPI</th>
              <th className="py-3 px-4">Tên mục tiêu / Chỉ số</th>
              <th className="py-3 px-3">Phòng ban</th>
              <th className="py-3 px-3">Kế hoạch</th>
              <th className="py-3 px-3">Thực hiện</th>
              <th className="py-3 px-3">Độ lệch (Variance)</th>
              <th className="py-3 px-3 text-right">Đánh giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map((row) => (
              <tr key={row.code} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-700">{row.code}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{row.title}</td>
                <td className="py-3 px-3 text-slate-600">{row.department}</td>
                <td className="py-3 px-3 font-semibold text-slate-700">{row.target}</td>
                <td className="py-3 px-3 font-black text-slate-900">{row.actual}</td>
                <td className="py-3 px-3 font-bold">
                  {row.variance.startsWith('+') ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      {row.variance}
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-0.5">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {row.variance}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  {row.status === 'SURPASSED' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      Vượt chỉ tiêu
                    </span>
                  ) : row.status === 'NEAR_TARGET' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      Đạt mục tiêu
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      Cần cải thiện
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
