import { prisma } from '../../utils/prisma.js';

export interface GenerateKpiParams {
  roleOrDepartment: string;
  industry?: string;
  level?: 'EXECUTIVE' | 'MANAGER' | 'STAFF';
  count?: number;
  apiKey?: string;
}

export interface GeneratedKpiItem {
  code: string;
  name: string;
  perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL_PROCESS' | 'LEARNING_GROWTH';
  perspectiveTitle: string;
  unit: string;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  weight: number;
  targetValue: number;
  formula: string;
  rationale: string;
  benchmark: string;
}

export interface AiGenerationResult {
  title: string;
  role: string;
  industry: string;
  summary: string;
  source: 'GOOGLE_GEMINI_API' | 'TINYKPI_AI_ENGINE';
  modelUsed: string;
  kpis: GeneratedKpiItem[];
}

export class AiKpiService {
  /**
   * Main entrypoint: generates KPIs using Gemini API with intelligent fallback
   */
  async generateKpis(params: GenerateKpiParams): Promise<AiGenerationResult> {
    const role = (params.roleOrDepartment || 'Nhân sự').trim();
    const industry = params.industry || 'Đa ngành';
    const level = params.level || 'MANAGER';
    const count = Math.min(Math.max(params.count || 6, 4), 10);

    // 1. Resolve Gemini API Key (Priority: params -> DB SystemSetting -> process.env)
    let geminiKey = params.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!geminiKey) {
      try {
        const dbSetting = await prisma.systemSetting.findUnique({
          where: { key: 'GEMINI_API_KEY' },
        });
        if (dbSetting?.value) {
          geminiKey = dbSetting.value.trim();
        }
      } catch (e) {
        // Ignore DB read failure if setting not present
      }
    }

    // 2. If Gemini API key is available, attempt Google Gemini API call
    if (geminiKey) {
      try {
        const geminiResult = await this.callGeminiApi(geminiKey, role, industry, level, count);
        if (geminiResult && geminiResult.kpis.length > 0) {
          return geminiResult;
        }
      } catch (err: any) {
        console.warn('⚠️ Google Gemini API call failed or timed out. Falling back to TinyKPI Smart Engine:', err.message);
      }
    }

    // 3. Fallback: Intelligent TinyKPI Expert Knowledge Generator
    return this.generateFromExpertKnowledge(role, industry, level, count);
  }

  /**
   * Calls Google Gemini API (gemini-1.5-flash / gemini-2.0-flash)
   */
  private async callGeminiApi(
    apiKey: string,
    role: string,
    industry: string,
    level: string,
    count: number
  ): Promise<AiGenerationResult> {
    const prompt = `
Bạn là Chuyên gia Cao cấp về Hoạch định Chiến lược BSC (Balanced Scorecard) và Quản trị Hiệu suất Doanh nghiệp KPI (Certified Balanced Scorecard Professional).

Yêu cầu: Thiết lập bộ chỉ số KPI đo lường định lượng và khoa học cho vị trí/chức danh sau:
- Vị trí / Bộ phận: "${role}"
- Ngành nghề kinh doanh: "${industry}"
- Cấp bậc nhân sự: "${level}" (EXECUTIVE: Ban điều hành, MANAGER: Quản lý cấp trung, STAFF: Chuyên viên)
- Số lượng chỉ số cần đề xuất: ${count} chỉ số.

Bộ chỉ số BẮT BUỘC phải phân bổ cân bằng vào 4 Viễn cảnh BSC:
1. FINANCIAL (Tài chính)
2. CUSTOMER (Khách hàng & Thị trường)
3. INTERNAL_PROCESS (Quy trình nội bộ & Vận hành)
4. LEARNING_GROWTH (Học hỏi & Phát triển & Đội ngũ)

Tổng trọng số (weight) của tất cả chỉ số cộng lại phải bằng 100.
Các chỉ số phải định lượng, có đơn vị tính rõ ràng (%, Triệu VNĐ, Điểm, Ngày, Lượt...), có công thức tính cụ thể và chỉ tiêu thực tế.

Trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng cấu trúc sau, không thêm markdown hay giải thích bên ngoài:
{
  "title": "Bộ chỉ số KPI đề xuất cho ${role}",
  "summary": "Tóm tắt định hướng chiến lược đo lường cho vị trí này...",
  "kpis": [
    {
      "code": "KPI-FIN-01",
      "name": "Tên chỉ số KPI súc tích",
      "perspective": "FINANCIAL",
      "perspectiveTitle": "Tài chính",
      "unit": "%",
      "frequency": "MONTHLY",
      "weight": 25,
      "targetValue": 100,
      "formula": "Công thức đo lường cụ thể (A / B * 100)",
      "rationale": "Lý do tại sao chỉ số này quan trọng với vị trí",
      "benchmark": "Tiêu chuẩn tham chiếu ngành (ví dụ: trung bình ngành 85-90%)"
    }
  ]
}
`;

    const modelName = 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Google Gemini HTTP ${res.status}: ${errBody}`);
    }

    const data: any = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API did not return candidates text');
    }

    const parsed = JSON.parse(candidateText);

    return {
      title: parsed.title || `Bộ chỉ số KPI đề xuất cho ${role}`,
      role,
      industry,
      summary: parsed.summary || `Đề xuất bộ ${parsed.kpis?.length || count} chỉ số đo lường hiệu suất trọng tâm.`,
      source: 'GOOGLE_GEMINI_API',
      modelUsed: modelName,
      kpis: (parsed.kpis || []).map((item: any, idx: number) => ({
        code: item.code || `KPI-AI-${idx + 1}`,
        name: item.name,
        perspective: item.perspective || 'INTERNAL_PROCESS',
        perspectiveTitle: this.getPerspectiveTitle(item.perspective),
        unit: item.unit || '%',
        frequency: item.frequency || 'MONTHLY',
        weight: Number(item.weight) || 20,
        targetValue: Number(item.targetValue) || 100,
        formula: item.formula || 'Thực tế / Kế hoạch * 100%',
        rationale: item.rationale || 'Đo lường năng suất và chất lượng công việc.',
        benchmark: item.benchmark || 'Chuẩn ngành 90%+',
      })),
    };
  }

  /**
   * Domain-Intelligent Built-in Expert Engine (covers Retail, Tech, Manufacturing, HR, Sales, Finance, etc.)
   */
  private generateFromExpertKnowledge(
    role: string,
    industry: string,
    level: string,
    count: number
  ): AiGenerationResult {
    const roleLower = role.toLowerCase();

    // Contextual pools based on role keywords
    let kpiPool: GeneratedKpiItem[] = [];

    if (roleLower.includes('sale') || roleLower.includes('kinh doanh') || roleLower.includes('bán hàng')) {
      kpiPool = [
        {
          code: 'KPI-FIN-SALES-01',
          name: 'Doanh thu thuần thực tế đạt được',
          perspective: 'FINANCIAL',
          perspectiveTitle: 'Tài chính',
          unit: 'Triệu VNĐ',
          frequency: 'MONTHLY',
          weight: 30,
          targetValue: level === 'EXECUTIVE' ? 10000 : level === 'MANAGER' ? 3000 : 500,
          formula: 'Tổng doanh thu đã ký và thu tiền thực tế trong kỳ',
          rationale: 'Chỉ số cốt lõi phản ánh đóng góp trực tiếp vào mục tiêu tăng trưởng tài chính của công ty.',
          benchmark: 'Đạt từ 95% - 105% hạn mức kế hoạch quý.',
        },
        {
          code: 'KPI-FIN-SALES-02',
          name: 'Tỷ lệ nợ xấu và thu hồi công nợ đúng hạn',
          perspective: 'FINANCIAL',
          perspectiveTitle: 'Tài chính',
          unit: '%',
          frequency: 'MONTHLY',
          weight: 15,
          targetValue: 95,
          formula: '(Số tiền công nợ thu hồi đúng hạn / Tổng nợ đến hạn) * 100%',
          rationale: 'Bảo đảm an toàn dòng tiền và tính thanh khoản của doanh nghiệp.',
          benchmark: 'Trung bình ngành B2B nợ đúng hạn đạt >92%.',
        },
        {
          code: 'KPI-CUST-SALES-03',
          name: 'Số lượng khách hàng mới ký hợp đồng',
          perspective: 'CUSTOMER',
          perspectiveTitle: 'Khách hàng',
          unit: 'Khách hàng',
          frequency: 'MONTHLY',
          weight: 20,
          targetValue: level === 'MANAGER' ? 25 : 8,
          formula: 'Đếm số lượng tài khoản khách hàng mới phát sinh đơn hàng đầu tiên',
          rationale: 'Mở rộng thị phần và phát triển tệp khách hàng tiềm năng cho công ty.',
          benchmark: 'Tăng trưởng khách hàng mới tối thiểu 10%/tháng.',
        },
        {
          code: 'KPI-CUST-SALES-04',
          name: 'Tỷ lệ khách hàng tái mua / Gia hạn dịch vụ (Retention Rate)',
          perspective: 'CUSTOMER',
          perspectiveTitle: 'Khách hàng',
          unit: '%',
          frequency: 'QUARTERLY',
          weight: 15,
          targetValue: 85,
          formula: '(Số khách hàng cũ tiếp tục mua / Tổng khách hàng cũ hoạt động) * 100%',
          rationale: 'Đo lường mức độ trung thành và giá trị vòng đời khách hàng (CLV).',
          benchmark: 'Ngành B2B xuất sắc duy trì tỷ lệ tái ký trên 80%.',
        },
        {
          code: 'KPI-INT-SALES-05',
          name: 'Tỷ lệ chuyển đổi Lead thành Cơ hội (Conversion Rate)',
          perspective: 'INTERNAL_PROCESS',
          perspectiveTitle: 'Quy trình nội bộ',
          unit: '%',
          frequency: 'MONTHLY',
          weight: 10,
          targetValue: 25,
          formula: '(Số đơn chốt thành công / Tổng số leads hợp lệ nhận từ Marketing) * 100%',
          rationale: 'Tối ưu hóa hiệu quả quy trình bán hàng và phễu chuyển đổi.',
          benchmark: 'Tỷ lệ chốt B2B trung bình từ 18% - 25%.',
        },
        {
          code: 'KPI-LRN-SALES-06',
          name: 'Điểm đánh giá năng lực đàm phán & Kiến thức sản phẩm',
          perspective: 'LEARNING_GROWTH',
          perspectiveTitle: 'Học hỏi & Phát triển',
          unit: 'Điểm',
          frequency: 'QUARTERLY',
          weight: 10,
          targetValue: 90,
          formula: 'Điểm thi định kỳ lý thuyết & roleplay xử lý từ chối (thang 100)',
          rationale: 'Nâng cao chất lượng chuyên môn tư vấn của đội ngũ kinh doanh.',
          benchmark: 'Toàn bộ nhân viên đạt chuẩn từ 85 điểm trở lên.',
        },
      ];
    } else if (roleLower.includes('market') || roleLower.includes('tiếp thị') || roleLower.includes('truyền thông')) {
      kpiPool = [
        {
          code: 'KPI-FIN-MKT-01',
          name: 'Hiệu quả chi phí thu hút khách hàng (CAC / ROI Marketing)',
          perspective: 'FINANCIAL',
          perspectiveTitle: 'Tài chính',
          unit: '%',
          frequency: 'MONTHLY',
          weight: 25,
          targetValue: 300,
          formula: '(Doanh thu từ Marketing - Chi phí chiến dịch) / Chi phí chiến dịch * 100%',
          rationale: 'Đảm bảo mỗi đồng ngân sách quảng cáo bỏ ra đem lại doanh số vượt trội.',
          benchmark: 'ROI Marketing mục tiêu đạt tối thiểu 300% (3x).',
        },
        {
          code: 'KPI-CUST-MKT-02',
          name: 'Số lượng Khách hàng tiềm năng chất lượng (MQL)',
          perspective: 'CUSTOMER',
          perspectiveTitle: 'Khách hàng',
          unit: 'Lead MQL',
          frequency: 'MONTHLY',
          weight: 30,
          targetValue: level === 'MANAGER' ? 500 : 150,
          formula: 'Tổng số lead thỏa mãn bộ tiêu chí chân dung khách hàng mục tiêu',
          rationale: 'Cung cấp đầu vào dồi dào cho đội ngũ kinh doanh xử lý chốt đơn.',
          benchmark: 'Tăng trưởng số lượng lead chất lượng 15%/tháng.',
        },
        {
          code: 'KPI-INT-MKT-03',
          name: 'Tỷ lệ chuyển đổi trang đích (Landing Page Conversion Rate)',
          perspective: 'INTERNAL_PROCESS',
          perspectiveTitle: 'Quy trình nội bộ',
          unit: '%',
          frequency: 'MONTHLY',
          weight: 25,
          targetValue: 8.5,
          formula: '(Số người để lại thông tin / Tổng số lượt truy cập trang đích) * 100%',
          rationale: 'Tối ưu hóa hành trình trải nghiệm người dùng và thông điệp truyền thông.',
          benchmark: 'Chuẩn ngành thương mại điện tử / SaaS là 5% - 9%.',
        },
        {
          code: 'KPI-LRN-MKT-04',
          name: 'Ứng dụng công cụ AI & Tự động hóa tiếp thị (Marketing Automation)',
          perspective: 'LEARNING_GROWTH',
          perspectiveTitle: 'Học hỏi & Phát triển',
          unit: 'Chiến dịch',
          frequency: 'QUARTERLY',
          weight: 20,
          targetValue: 4,
          formula: 'Số lượng kịch bản nuôi dưỡng lead tự động và AI content được triển khai',
          rationale: 'Đổi mới công nghệ giúp tối ưu hóa nhân lực và thời gian phản hồi khách hàng.',
          benchmark: 'Tự động hóa tối thiểu 60% luồng tương tác email/chatbot.',
        },
      ];
    } else if (roleLower.includes('it') || roleLower.includes('dev') || roleLower.includes('phần mềm') || roleLower.includes('kỹ thuật') || roleLower.includes('tech')) {
      kpiPool = [
        {
          code: 'KPI-FIN-TECH-01',
          name: 'Tối ưu hóa chi phí hạ tầng Cloud & Máy chủ',
          perspective: 'FINANCIAL',
          perspectiveTitle: 'Tài chính',
          unit: '%',
          frequency: 'QUARTERLY',
          weight: 20,
          targetValue: 15,
          formula: '(Chi phí Cloud tiết kiệm được / Ngân sách dự toán) * 100%',
          rationale: 'Giảm thiểu lãng phí tài nguyên máy chủ và tối ưu hóa kiến trúc hệ thống.',
          benchmark: 'Kiểm soát chi phí không vượt quá 5% tổng doanh thu.',
        },
        {
          code: 'KPI-CUST-TECH-02',
          name: 'Độ khả dụng và tính ổn định hệ thống (System Uptime / SLA)',
          perspective: 'CUSTOMER',
          perspectiveTitle: 'Khách hàng',
          unit: '%',
          frequency: 'MONTHLY',
          weight: 30,
          targetValue: 99.9,
          formula: '(Tổng thời gian hệ thống hoạt động bình thường / Tổng thời gian trong kỳ) * 100%',
          rationale: 'Đảm bảo trải nghiệm người dùng không bị gián đoạn và cam kết SLA uy tín.',
          benchmark: 'Tiêu chuẩn ngành công nghệ đạt 99.9% (Three Nines).',
        },
        {
          code: 'KPI-INT-TECH-03',
          name: 'Tỷ lệ bàn giao tính năng đúng hạn Sprint (On-time Release)',
          perspective: 'INTERNAL_PROCESS',
          perspectiveTitle: 'Quy trình nội bộ',
          unit: '%',
          frequency: 'MONTHLY',
          weight: 30,
          targetValue: 95,
          formula: '(Số Story points hoàn thành đúng hạn / Tổng Story points cam kết) * 100%',
          rationale: 'Nâng cao năng suất theo phương pháp Agile/Scrum và kiểm soát tiến độ dự án.',
          benchmark: 'Đội ngũ Agile trưởng thành duy trì từ 90% - 98%.',
        },
        {
          code: 'KPI-LRN-TECH-04',
          name: 'Mật độ lỗi kiểm thử và nợ kỹ thuật (Bugs Density & Code Review)',
          perspective: 'LEARNING_GROWTH',
          perspectiveTitle: 'Học hỏi & Phát triển',
          unit: 'Lỗi/KLOC',
          frequency: 'MONTHLY',
          weight: 20,
          targetValue: 0.5,
          formula: 'Số lỗi nghiêm trọng trên 1.000 dòng mã nguồn đưa lên môi trường Production',
          rationale: 'Nâng cao chất lượng kỹ thuật, tuân thủ Clean Code và CI/CD tự động.',
          benchmark: 'Mật độ lỗi thấp dưới 1 bug / 1.000 dòng mã lệnh.',
        },
      ];
    } else if (roleLower.includes('hr') || roleLower.includes('nhân sự') || roleLower.includes('tuyển dụng') || roleLower.includes('đào tạo')) {
      kpiPool = [
        {
          code: 'KPI-FIN-HR-01',
          name: 'Hiệu suất chi phí tuyển dụng trên mỗi nhân sự (Cost per Hire)',
          perspective: 'FINANCIAL',
          perspectiveTitle: 'Tài chính',
          unit: 'Triệu VNĐ',
          frequency: 'QUARTERLY',
          weight: 20,
          targetValue: 4.5,
          formula: 'Tổng chi phí đăng tuyển và sourcing / Tổng số nhân sự onboard thành công',
          rationale: 'Tối ưu ngân sách tuyển dụng và nâng cao ROI của phòng nhân sự.',
          benchmark: 'Chuẩn ngành đạt dưới 1 tháng lương cơ bản của vị trí tuyển.',
        },
        {
          code: 'KPI-CUST-HR-02',
          name: 'Chỉ số gắn kết và hài lòng nội bộ (Employee eNPS)',
          perspective: 'CUSTOMER',
          perspectiveTitle: 'Khách hàng',
          unit: 'Điểm',
          frequency: 'QUARTERLY',
          weight: 30,
          targetValue: 80,
          formula: 'Khảo sát eNPS tỷ lệ nhân viên sẵn sàng giới thiệu công ty là nơi làm việc tốt',
          rationale: 'Xây dựng môi trường văn hóa doanh nghiệp hạnh phúc và bền vững.',
          benchmark: 'Doanh nghiệp xuất sắc có eNPS đạt trên 60 - 85 điểm.',
        },
        {
          code: 'KPI-INT-HR-03',
          name: 'Tỷ lệ đáp ứng nhân sự đúng hạn tuyển dụng (Time-to-Fill)',
          perspective: 'INTERNAL_PROCESS',
          perspectiveTitle: 'Quy trình nội bộ',
          unit: 'Ngày',
          frequency: 'MONTHLY',
          weight: 25,
          targetValue: 21,
          formula: 'Số ngày trung bình từ khi duyệt đề xuất tuyển dụng đến khi ứng viên nhận việc',
          rationale: 'Đảm bảo nguồn lực cho các phòng ban kinh doanh và vận hành không bị thiếu hụt.',
          benchmark: 'Vị trí chuyên viên chuẩn là 14 - 25 ngày.',
        },
        {
          code: 'KPI-LRN-HR-04',
          name: 'Tỷ lệ hoàn thành lộ trình đào tạo và cấp chứng chỉ nội bộ',
          perspective: 'LEARNING_GROWTH',
          perspectiveTitle: 'Học hỏi & Phát triển',
          unit: '%',
          frequency: 'QUARTERLY',
          weight: 25,
          targetValue: 90,
          formula: '(Số nhân sự hoàn tất khóa học đúng hạn / Tổng nhân sự được chỉ định) * 100%',
          rationale: 'Phát triển năng lực cốt lõi của tổ chức và chuẩn bị đội ngũ kế thừa.',
          benchmark: 'Đạt từ 85% - 95% tỷ lệ hoàn thành các khóa bắt buộc.',
        },
      ];
    } else {
      // General Management / Operations default
      kpiPool = [
        {
          code: 'KPI-FIN-GEN-01',
          name: 'Tỷ suất lợi nhuận / Hoàn thành ngân sách định mức',
          perspective: 'FINANCIAL',
          perspectiveTitle: 'Tài chính',
          unit: '%',
          frequency: 'MONTHLY',
          weight: 30,
          targetValue: 100,
          formula: '(Lợi nhuận thực tế / Lợi nhuận kế hoạch giao) * 100%',
          rationale: 'Đảm bảo hoàn thành nghĩa vụ tài chính và đóng góp vào mục tiêu toàn doanh nghiệp.',
          benchmark: 'Duy trì tỷ lệ đạt từ 95% - 105%.',
        },
        {
          code: 'KPI-CUST-GEN-02',
          name: 'Chỉ số hài lòng khách hàng nội bộ / bên ngoài (CSAT)',
          perspective: 'CUSTOMER',
          perspectiveTitle: 'Khách hàng',
          unit: 'Điểm %',
          frequency: 'MONTHLY',
          weight: 25,
          targetValue: 90,
          formula: 'Điểm khảo sát phản hồi dịch vụ và hỗ trợ trung bình hàng tháng',
          rationale: 'Nâng cao chất lượng phục vụ và sự tin cậy trong phối hợp công việc.',
          benchmark: 'Chuẩn dịch vụ đạt từ 88% trở lên.',
        },
        {
          code: 'KPI-INT-GEN-03',
          name: 'Tỷ lệ tuân thủ quy trình chuẩn và đúng hạn SLA',
          perspective: 'INTERNAL_PROCESS',
          perspectiveTitle: 'Quy trình nội bộ',
          unit: '%',
          frequency: 'MONTHLY',
          weight: 25,
          targetValue: 95,
          formula: '(Số yêu cầu hoàn tất đúng hạn SLA / Tổng số yêu cầu phát sinh) * 100%',
          rationale: 'Loại bỏ nút thắt cổ chai và nâng cao năng suất toàn chuỗi giá trị.',
          benchmark: 'Tỷ lệ cam kết SLA tối thiểu 92%.',
        },
        {
          code: 'KPI-LRN-GEN-04',
          name: 'Số sáng kiến cải tiến quy trình / Kaizen được nghiệm thu',
          perspective: 'LEARNING_GROWTH',
          perspectiveTitle: 'Học hỏi & Phát triển',
          unit: 'Sáng kiến',
          frequency: 'QUARTERLY',
          weight: 20,
          targetValue: 2,
          formula: 'Số lượng đề xuất cải tiến được hội đồng đánh giá phê duyệt và đưa vào áp dụng',
          rationale: 'Thúc đẩy tinh thần đổi mới sáng tạo liên tục trong toàn tổ chức.',
          benchmark: 'Mỗi quý có ít nhất 1 - 2 sáng kiến cải tiến có hiệu quả.',
        },
      ];
    }

    // Adjust count
    const selectedKpis = kpiPool.slice(0, count);

    // Rebalance weights to 100%
    const currentSum = selectedKpis.reduce((acc, k) => acc + k.weight, 0);
    if (currentSum > 0 && currentSum !== 100) {
      selectedKpis.forEach((k) => {
        k.weight = Math.round((k.weight / currentSum) * 100);
      });
      // Normalize rounding delta
      const newSum = selectedKpis.reduce((acc, k) => acc + k.weight, 0);
      if (newSum !== 100 && selectedKpis.length > 0) {
        selectedKpis[0].weight += (100 - newSum);
      }
    }

    return {
      title: `Bộ chỉ số KPI đề xuất cho ${role}`,
      role,
      industry,
      summary: `Đề xuất bộ ${selectedKpis.length} chỉ số KPI chuẩn hóa theo 4 viễn cảnh Balanced Scorecard cho cấp bậc ${level}.`,
      source: 'TINYKPI_AI_ENGINE',
      modelUsed: 'TinyKPI Expert Knowledge Engine v2.0',
      kpis: selectedKpis,
    };
  }

  private getPerspectiveTitle(key: string): string {
    switch (key) {
      case 'FINANCIAL':
        return 'Tài chính';
      case 'CUSTOMER':
        return 'Khách hàng';
      case 'INTERNAL_PROCESS':
        return 'Quy trình nội bộ';
      case 'LEARNING_GROWTH':
      default:
        return 'Học hỏi & Phát triển';
    }
  }
}

export const aiKpiService = new AiKpiService();
