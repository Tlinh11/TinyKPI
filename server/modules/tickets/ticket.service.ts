import { prisma } from '../../utils/prisma.js';
import { AppError } from '../../utils/response.js';

export interface SupportTicket {
  id: string;
  code: string;
  title: string;
  category: 'BUG' | 'FEATURE' | 'CONSULTING' | 'ACCESS' | 'GUIDE';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  module: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  userId?: string;
  userName?: string;
  userEmail?: string;
  createdAt: string;
  updatedAt: string;
  response?: string;
  resolvedAt?: string;
}

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-default-01',
    code: 'TK-2609-081',
    title: 'Hỗ trợ cấu hình tích hợp AI Gemini cho bộ chỉ số Marketing',
    category: 'CONSULTING',
    priority: 'HIGH',
    module: 'Quy tắc AI (AI Rules)',
    description: 'Cần hỗ trợ thiết lập Gemini API key và tối ưu bộ prompt đề xuất KPI viễn cảnh Khách hàng cho ngành Bán lẻ.',
    status: 'RESOLVED',
    userId: 'user-admin',
    userName: 'Lê Thuận Khánh',
    userEmail: 'Thuankhanh.hust@gmail.com',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    response: 'Đội ngũ kỹ thuật TinyKPI đã hoàn tất tích hợp Google Gemini 1.5 Flash tại phân hệ /ai-rules. Bạn có thể sử dụng ngay.',
    resolvedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ticket-default-02',
    code: 'TK-2609-082',
    title: 'Đề xuất bổ sung công cụ Xuất file Excel chuẩn hóa .xlsx',
    category: 'FEATURE',
    priority: 'MEDIUM',
    module: 'Báo cáo & Thống kê',
    description: 'Mong muốn xuất dữ liệu nhân viên, phòng ban và thẻ điểm BSC ra file Excel để báo cáo định kỳ cho Hội đồng Quản trị.',
    status: 'RESOLVED',
    userId: 'user-admin',
    userName: 'Lê Thuận Khánh',
    userEmail: 'Thuankhanh.hust@gmail.com',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    response: 'Bộ công cụ Excel Suite đầy đủ tính năng Xuất/Nhập (.xlsx) và Template mẫu đã được cập nhật thành công trên toàn hệ thống.',
    resolvedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ticket-default-03',
    code: 'TK-2609-083',
    title: 'Cảnh báo vi phạm thời gian cam kết SLA tại quy trình Pháp lý',
    category: 'BUG',
    priority: 'URGENT',
    module: 'Quản lý SLA',
    description: 'Bước thẩm định hợp đồng mua sắm đối tác đang có nguy cơ trễ hạn cam kết SLA 24h.',
    status: 'IN_PROGRESS',
    userId: 'user-admin',
    userName: 'Lê Thuận Khánh',
    userEmail: 'Thuankhanh.hust@gmail.com',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    response: 'Phòng Pháp chế & Vận hành đang trực tiếp xử lý và điều phối chuyên viên rà soát hợp đồng.',
  },
];

export class TicketService {
  private async getStoredTickets(): Promise<SupportTicket[]> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'support_tickets' },
      });
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
    } catch {
      // ignore
    }
    return DEFAULT_TICKETS;
  }

  private async saveTickets(tickets: SupportTicket[]): Promise<void> {
    await prisma.systemSetting.upsert({
      where: { key: 'support_tickets' },
      update: { value: JSON.stringify(tickets) },
      create: {
        key: 'support_tickets',
        value: JSON.stringify(tickets),
        group: 'GENERAL',
      },
    });
  }

  async getTickets(userId?: string): Promise<SupportTicket[]> {
    const tickets = await this.getStoredTickets();
    // Return all tickets or user specific
    return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTicket(
    data: {
      title: string;
      category?: SupportTicket['category'];
      priority?: SupportTicket['priority'];
      module?: string;
      description: string;
    },
    userId?: string,
    userEmail?: string,
    userName?: string
  ): Promise<SupportTicket> {
    if (!data.title || !data.description) {
      throw new AppError('Vui lòng nhập đầy đủ tiêu đề và nội dung mô tả sự cố', 400, 'MISSING_FIELDS');
    }

    const current = await this.getStoredTickets();
    const codeNum = current.length + 84;
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: `TK-${dateStr}-${codeNum.toString().padStart(3, '0')}`,
      title: data.title.trim(),
      category: data.category || 'BUG',
      priority: data.priority || 'MEDIUM',
      module: data.module || 'Hệ thống chung',
      description: data.description.trim(),
      status: 'OPEN',
      userId,
      userName: userName || 'Người dùng TinyKPI',
      userEmail: userEmail || 'user@tinykpi.vn',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const updated = [newTicket, ...current];
    await this.saveTickets(updated);

    // Also log audit
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          userEmail,
          action: 'CREATE',
          entity: 'SupportTicket',
          entityId: newTicket.code,
          newValue: JSON.stringify({ title: newTicket.title, priority: newTicket.priority }),
        },
      });
    }

    return newTicket;
  }

  async updateTicketStatus(
    ticketId: string,
    data: { status?: SupportTicket['status']; response?: string },
    userId?: string,
    userEmail?: string
  ): Promise<SupportTicket> {
    const current = await this.getStoredTickets();
    const index = current.findIndex((t) => t.id === ticketId || t.code === ticketId);
    if (index === -1) {
      throw new AppError('Không tìm thấy Ticket hỗ trợ', 404, 'NOT_FOUND');
    }

    const target = current[index];
    const isResolved = data.status === 'RESOLVED' || data.status === 'CLOSED';

    const updatedTicket: SupportTicket = {
      ...target,
      status: data.status || target.status,
      response: data.response !== undefined ? data.response : target.response,
      updatedAt: new Date().toISOString(),
      resolvedAt: isResolved ? new Date().toISOString() : target.resolvedAt,
    };

    current[index] = updatedTicket;
    await this.saveTickets(current);

    return updatedTicket;
  }

  async deleteTicket(ticketId: string, userId?: string, userEmail?: string): Promise<void> {
    const current = await this.getStoredTickets();
    const filtered = current.filter((t) => t.id !== ticketId && t.code !== ticketId);
    await this.saveTickets(filtered);
  }
}

export const ticketService = new TicketService();
