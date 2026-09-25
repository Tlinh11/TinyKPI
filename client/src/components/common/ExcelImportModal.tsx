import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { readExcelFile, downloadExcelTemplate } from '../../utils/excel.js';

export interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateFileName: string;
  templateHeaders: string[];
  exampleRows: Record<string, any>[];
  headerMapping: Record<string, string>;
  requiredFields: { key: string; label: string }[];
  previewColumns: { key: string; label: string }[];
  onConfirmImport: (rows: any[]) => Promise<{ success: boolean; message?: string; count?: number }>;
  notes?: string[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  title,
  templateFileName,
  templateHeaders,
  exampleRows,
  headerMapping,
  requiredFields,
  previewColumns,
  onConfirmImport,
  notes = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    downloadExcelTemplate({
      headers: templateHeaders,
      exampleRows,
      fileName: templateFileName,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMsg('Vui lòng chọn file định dạng Excel (.xlsx hoặc .xls)');
      return;
    }

    setErrorMsg(null);
    setResultMsg(null);
    setSelectedFile(file);
    setIsReading(true);

    try {
      const rows = await readExcelFile(file, headerMapping);
      if (rows.length === 0) {
        setErrorMsg('File Excel không có dòng dữ liệu nào.');
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đọc file Excel');
    } finally {
      setIsReading(false);
    }
  };

  const validateRow = (row: any): string[] => {
    const missing: string[] = [];
    requiredFields.forEach((req) => {
      const val = row[req.key];
      if (val === undefined || val === null || String(val).trim() === '') {
        missing.push(req.label);
      }
    });
    return missing;
  };

  const handleConfirm = async () => {
    if (parsedRows.length === 0) return;

    // Check if any row has missing required fields
    const invalidRows = parsedRows.filter((r) => validateRow(r).length > 0);
    if (invalidRows.length > 0) {
      if (
        !confirm(
          `Có ${invalidRows.length} dòng thiếu thông tin bắt buộc. Hệ thống sẽ bỏ qua các dòng không hợp lệ này. Bạn có muốn tiếp tục?`
        )
      ) {
        return;
      }
    }

    const validRows = parsedRows.filter((r) => validateRow(r).length === 0);
    if (validRows.length === 0) {
      setErrorMsg('Không có dòng dữ liệu hợp lệ nào để nhập.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await onConfirmImport(validRows);
      if (res.success) {
        setResultMsg({
          type: 'success',
          text: res.message || `Đã nhập thành công ${res.count || validRows.length} bản ghi vào hệ thống!`,
        });
        setTimeout(() => {
          handleReset();
          onClose();
        }, 1800);
      } else {
        setResultMsg({
          type: 'error',
          text: res.message || 'Nhập dữ liệu thất bại.',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi nhập dữ liệu vào hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setErrorMsg(null);
    setResultMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{title}</h2>
              <p className="text-xs text-slate-500">Đọc và nhập dữ liệu tự động từ bảng tính Excel (.xlsx)</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Step 1 & 2 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Download Template */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-blue-700 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Bước 1: Tải file mẫu chuẩn</span>
                </div>
                <p className="text-slate-600 mt-1.5 leading-relaxed">
                  Tải file mẫu Excel chuẩn có sẵn tiêu đề cột và các dòng dữ liệu ví dụ để điền nhanh và tránh sai sót.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full py-2 px-3 rounded-lg bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Tải file Excel mẫu (.xlsx)</span>
              </button>
            </div>

            {/* Step 2: Upload File */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Bước 2: Chọn file đã điền dữ liệu</span>
                </div>
                <p className="text-slate-600 mt-1.5 leading-relaxed">
                  Chọn file <code className="text-slate-700 font-mono bg-slate-200/60 px-1 py-0.5 rounded">.xlsx</code> từ máy tính của bạn để hệ thống tự động nhận diện và trích xuất.
                </p>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-lg bg-[#1677ff] hover:bg-[#4096ff] text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>{selectedFile ? 'Đổi file khác...' : 'Chọn file Excel từ máy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes.length > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
              <div className="font-semibold flex items-center gap-1 text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Lưu ý khi nhập dữ liệu:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                {notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultMsg && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 font-medium ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resultMsg.text}</span>
            </div>
          )}

          {/* Preview Section */}
          {isReading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-7 h-7 text-[#1677ff] animate-spin" />
              <span>Đang đọc và phân tích cấu trúc file Excel...</span>
            </div>
          )}

          {!isReading && parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Dữ liệu xem trước (Preview):</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-[11px]">
                    {parsedRows.length} bản ghi
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500 text-[11px] truncate max-w-xs">{selectedFile?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Xóa bỏ
                </button>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-2.5 w-10 text-center border-r border-slate-200">#</th>
                      <th className="py-2 px-2 w-14 text-center border-r border-slate-200">Hợp lệ</th>
                      {previewColumns.map((col) => (
                        <th key={col.key} className="py-2 px-3 border-r border-slate-200 last:border-r-0">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 100).map((row, idx) => {
                      const missingFields = validateRow(row);
                      const isValid = missingFields.length === 0;

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 transition ${
                            !isValid ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <td className="py-2 px-2.5 text-center text-slate-400 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-slate-100">
                            {isValid ? (
                              <span className="inline-flex items-center text-emerald-600" title="Hợp lệ">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center text-amber-600 cursor-help"
                                title={`Thiếu: ${missingFields.join(', ')}`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </td>
                          {previewColumns.map((col) => (
                            <td key={col.key} className="py-2 px-3 border-r border-slate-100 last:border-r-0 truncate max-w-[200px]">
                              {row[col.key] !== undefined && row[col.key] !== '' ? (
                                String(row[col.key])
                              ) : (
                                <span className="text-slate-300 italic">(trống)</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 100 && (
                <p className="text-[10px] text-slate-400 italic">
                  * Đang hiển thị trước 100 bản ghi đầu tiên trong tổng số {parsedRows.length} bản ghi.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedRows.length === 0 || isSubmitting}
            className={`px-5 py-2 rounded-lg font-semibold text-white shadow-xs flex items-center gap-2 transition ${
              parsedRows.length === 0 || isSubmitting
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý nhập dữ liệu...</span>
              </>
            ) : (
              <>
                <span>Xác nhận nhập {parsedRows.length > 0 ? `(${parsedRows.length} dòng)` : ''}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
