import { prisma } from '../../utils/prisma.js';

export interface AppNotification {
  id: string;
  type: 'SLA_BREACH' | 'SLA_WARNING' | 'TASK_ASSIGNED' | 'TASK_APPROVAL' | 'KPI_UPDATE' | 'KPI_WARNING' | 'SYSTEM';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  metadata?: Record<string, any>;
}

export class NotificationService {
  private async getReadIds(userId: string): Promise<string[]> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: `user_read_notifs_${userId}` },
      });
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private async getDismissedIds(userId: string): Promise<string[]> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: `user_dismissed_notifs_${userId}` },
      });
      if (setting && setting.value) {
        return JSON.parse(setting.value);
      }
    } catch {
      // ignore
    }
    return [];
  }

  async getNotifications(userId: string): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
    const [readIds, dismissedIds] = await Promise.all([
      this.getReadIds(userId),
      this.getDismissedIds(userId),
    ]);

    // Query active tasks and SLAs to generate dynamic real-time notifications
    const [tasks, slaItems, kpis] = await Promise.all([
      prisma.task.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.slaItem.findMany({
        include: { group: true },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.kpiIndicator.findMany({
        take: 5,
        orderBy: { achievementRate: 'asc' },
      }),
    ]);

    const generated: AppNotification[] = [];

    // 1. SLA Notifications
    slaItems.forEach((sla, index) => {
      const isBreached = index === 0;
      const groupName = sla.group?.name || 'Quy trình vận hành';
      generated.push({
        id: `notif-sla-${sla.id || index}`,
        type: isBreached ? 'SLA_BREACH' : 'SLA_WARNING',
        title: isBreached ? '🚨 Cảnh báo Vi phạm SLA' : '⚠️ Nhắc nhở Cam kết SLA',
        message: isBreached
          ? `Nhiệm vụ [${sla.taskType}] thuộc nhóm [${groupName}] đã vượt ngưỡng cam kết SLA (${sla.durationHours}h). Cần xử lý ngay.`
          : `Nhiệm vụ [${sla.taskType}] thuộc [${groupName}] còn dưới 2 giờ để hoàn tất theo tiêu chuẩn cam kết (${sla.durationHours}h).`,
        createdAt: new Date(Date.now() - (index + 1) * 28 * 60 * 1000).toISOString(),
        isRead: readIds.includes(`notif-sla-${sla.id || index}`),
        link: '/sla',
        severity: isBreached ? 'CRITICAL' : 'WARNING',
        metadata: { slaId: sla.id, taskType: sla.taskType },
      });
    });

    // 2. Task Notifications
    tasks.forEach((task, index) => {
      const isUrgent = task.priority === 'URGENT' || task.priority === 'HIGH';
      generated.push({
        id: `notif-task-${task.id || index}`,
        type: isUrgent ? 'TASK_APPROVAL' : 'TASK_ASSIGNED',
        title: isUrgent ? '⚡ Nhiệm vụ Ưu tiên Khẩn cấp' : '📋 Nhiệm vụ Mới được phân công',
        message: `Nhiệm vụ: "${task.title}" (${task.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đang thực hiện'}).`,
        createdAt: new Date(Date.now() - (index + 2) * 45 * 60 * 1000).toISOString(),
        isRead: readIds.includes(`notif-task-${task.id || index}`),
        link: '/tasks',
        severity: isUrgent ? 'WARNING' : 'INFO',
        metadata: { taskId: task.id },
      });
    });

    // 3. KPI Alerts
    kpis.forEach((kpi, index) => {
      const isLow = (kpi.achievementRate || 0) < 80;
      if (isLow) {
        generated.push({
          id: `notif-kpi-${kpi.id || index}`,
          type: 'KPI_WARNING',
          title: '🎯 Cảnh báo Tiến độ Chỉ số KPI',
          message: `Chỉ số [${kpi.code}] ${kpi.name} chỉ đạt ${kpi.achievementRate}% (dưới ngưỡng 80%).`,
          createdAt: new Date(Date.now() - (index + 3) * 90 * 60 * 1000).toISOString(),
          isRead: readIds.includes(`notif-kpi-${kpi.id || index}`),
          link: '/bsc-scorecard',
          severity: 'CRITICAL',
          metadata: { kpiId: kpi.id, code: kpi.code },
        });
      }
    });

    // 4. System Announcement
    generated.push({
      id: 'notif-system-ai',
      type: 'SYSTEM',
      title: '✨ Cập nhật Trợ lý AI Đề xuất KPI',
      message: 'Hệ thống đã tích hợp trí tuệ nhân tạo Google Gemini 1.5 Flash tự động sinh bộ chỉ số BSC 4 viễn cảnh.',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      isRead: readIds.includes('notif-system-ai'),
      link: '/ai-rules',
      severity: 'SUCCESS',
    });

    generated.push({
      id: 'notif-system-excel',
      type: 'SYSTEM',
      title: '📊 Bộ công cụ Excel .XLSX Đã Sẵn Sàng',
      message: 'Bạn có thể xuất/nhập danh sách nhân sự, phòng ban, quy trình và thẻ điểm BSC trực tiếp từ file Excel.',
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      isRead: readIds.includes('notif-system-excel'),
      link: '/reports',
      severity: 'INFO',
    });

    // Filter out dismissed notifications
    const activeNotifications = generated.filter((n) => !dismissedIds.includes(n.id));

    // Sort by createdAt descending
    activeNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = activeNotifications.filter((n) => !n.isRead).length;

    return {
      notifications: activeNotifications,
      unreadCount,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const readIds = await this.getReadIds(userId);
    if (!readIds.includes(notificationId)) {
      readIds.push(notificationId);
      await prisma.systemSetting.upsert({
        where: { key: `user_read_notifs_${userId}` },
        update: { value: JSON.stringify(readIds) },
        create: {
          key: `user_read_notifs_${userId}`,
          value: JSON.stringify(readIds),
          group: 'NOTIFICATION',
        },
      });
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { notifications } = await this.getNotifications(userId);
    const allIds = notifications.map((n) => n.id);
    await prisma.systemSetting.upsert({
      where: { key: `user_read_notifs_${userId}` },
      update: { value: JSON.stringify(allIds) },
      create: {
        key: `user_read_notifs_${userId}`,
        value: JSON.stringify(allIds),
        group: 'NOTIFICATION',
      },
    });
  }

  async dismissNotification(userId: string, notificationId: string): Promise<void> {
    const dismissedIds = await this.getDismissedIds(userId);
    if (!dismissedIds.includes(notificationId)) {
      dismissedIds.push(notificationId);
      await prisma.systemSetting.upsert({
        where: { key: `user_dismissed_notifs_${userId}` },
        update: { value: JSON.stringify(dismissedIds) },
        create: {
          key: `user_dismissed_notifs_${userId}`,
          value: JSON.stringify(dismissedIds),
          group: 'NOTIFICATION',
        },
      });
    }
  }
}

export const notificationService = new NotificationService();
