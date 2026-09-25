import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  key: keyof T | string;
  width?: number;
  format?: (value: any, item: T) => any;
}

/**
 * Export data to an Excel .xlsx file with styled column widths
 */
export function exportToExcel<T extends Record<string, any>>({
  data,
  columns,
  fileName,
  sheetName = 'Dữ liệu',
}: {
  data: T[];
  columns: ExportColumn<T>[];
  fileName: string;
  sheetName?: string;
}): void {
  // 1. Transform data according to columns
  const transformedData = data.map((item, index) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      let val = item[col.key];
      if (col.key === 'stt' || col.key === 'index') {
        val = index + 1;
      } else if (col.format) {
        val = col.format(val, item);
      }
      row[col.header] = val !== undefined && val !== null ? val : '';
    });
    return row;
  });

  // 2. Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(transformedData);

  // 3. Set column widths automatically or from configuration
  worksheet['!cols'] = columns.map((col) => {
    if (col.width) return { wch: col.width };
    // Estimate width based on header length
    const maxContentLen = Math.max(
      col.header.length,
      ...data.slice(0, 50).map((d) => {
        const v = col.format ? col.format(d[col.key], d) : d[col.key];
        return v ? String(v).length : 0;
      })
    );
    return { wch: Math.min(Math.max(maxContentLen + 3, 12), 45) };
  });

  // 4. Create workbook and trigger download
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const finalName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

/**
 * Read and parse an Excel .xlsx file into typed objects
 */
export async function readExcelFile<T = Record<string, any>>(
  file: File,
  headerMapping?: Record<string, string>
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
          raw: false,
        });

        if (!headerMapping) {
          return resolve(rawRows as T[]);
        }

        // Map Vietnamese or human-readable column headers to internal keys
        const mappedRows = rawRows.map((raw) => {
          const item: Record<string, any> = {};
          Object.entries(raw).forEach(([colHeader, val]) => {
            const cleanHeader = colHeader.trim();
            const targetKey = headerMapping[cleanHeader] || cleanHeader;
            item[targetKey] = typeof val === 'string' ? val.trim() : val;
          });
          return item;
        });

        resolve(mappedRows as T[]);
      } catch (err) {
        reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file .xlsx'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file từ hệ thống'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate and download an empty sample .xlsx template file with predefined headers and example rows
 */
export function downloadExcelTemplate({
  headers,
  exampleRows,
  fileName,
  sheetName = 'Mẫu nhập liệu',
}: {
  headers: string[];
  exampleRows?: Record<string, any>[];
  fileName: string;
  sheetName?: string;
}): void {
  const data = exampleRows && exampleRows.length > 0 ? exampleRows : [headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {})];
  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = headers.map((h) => ({
    wch: Math.max(h.length + 5, 16),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const finalName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}
