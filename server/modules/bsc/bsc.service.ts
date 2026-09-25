import { bscRepository, BscRepository } from './bsc.repository.js';
import { AppError } from '../../utils/response.js';
import { prisma } from '../../utils/prisma.js';

export class BscService {
  constructor(private repo: BscRepository = bscRepository) {}

  async getStrategyMap(organization = 'Công ty', stage = 'Giai đoạn 1') {
    const objectives = await this.repo.getStrategyMap(organization, stage);

    // Group by Perspective
    const perspectives = [
      { key: 'FINANCIAL', title: 'TÀI CHÍNH', description: 'Gia tăng giá trị cổ đông và phát triển bền vững' },
      { key: 'CUSTOMER', title: 'KHÁCH HÀNG', description: 'Định vị giá trị, sự hài lòng và giữ chân khách hàng' },
      { key: 'INTERNAL_PROCESS', title: 'QUY TRÌNH NỘI BỘ', description: 'Tối ưu hóa năng suất vận hành và chuyển đổi số' },
      { key: 'LEARNING_GROWTH', title: 'HỌC HỎI & PHÁT TRIỂN', description: 'Đào tạo năng lực nhân sự và văn hóa hiệu suất' },
    ];

    const map = perspectives.map((p) => {
      const pObjectives = objectives.filter((o) => o.perspective === p.key);
      const allKpis = pObjectives.flatMap((o) => o.kpiIndicators);
      const avgRate = allKpis.length > 0
        ? Number((allKpis.reduce((acc, k) => acc + (k.achievementRate || 0), 0) / allKpis.length).toFixed(1))
        : 0;

      return {
        ...p,
        objectives: pObjectives,
        kpiCount: allKpis.length,
        averageAchievement: avgRate,
      };
    });

    // Compute Overall Score
    const allIndicators = objectives.flatMap((o) => o.kpiIndicators);
    const overallScore = allIndicators.length > 0
      ? Number((allIndicators.reduce((acc, k) => acc + (k.achievementRate || 0), 0) / allIndicators.length).toFixed(1))
      : 0;

    const links = await this.getStrategyLinks();

    return {
      organization,
      stage,
      overallScore,
      totalObjectives: objectives.length,
      totalKpis: allIndicators.length,
      perspectives: map,
      links,
    };
  }

  async getStrategyLinks() {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'bsc_strategy_map_links' }
    });
    if (setting && setting.value) {
      try {
        return JSON.parse(setting.value);
      } catch {
        return [];
      }
    }

    // Default seeded links between objectives across 4 BSC layers
    return [
      {
        id: 'link-pt-qt',
        sourceId: 'obj-learn-01',
        targetId: 'obj-proc-01',
        label: 'Thúc đẩy số hóa & SLA',
        type: 'ENABLES'
      },
      {
        id: 'link-qt-kh',
        sourceId: 'obj-proc-01',
        targetId: 'obj-cust-01',
        label: 'Nâng cao trải nghiệm KH',
        type: 'DRIVES'
      },
      {
        id: 'link-kh-tc',
        sourceId: 'obj-cust-01',
        targetId: 'obj-fin-01',
        label: 'Gia tăng doanh thu & lợi nhuận',
        type: 'DRIVES'
      }
    ];
  }

  async saveStrategyLinks(links: any[], userId?: string, userEmail?: string) {
    await prisma.systemSetting.upsert({
      where: { key: 'bsc_strategy_map_links' },
      update: { value: JSON.stringify(links) },
      create: {
        key: 'bsc_strategy_map_links',
        value: JSON.stringify(links),
        group: 'GENERAL'
      }
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          userEmail,
          action: 'UPDATE',
          entity: 'StrategyMapLinks',
          entityId: 'bsc_strategy_map_links',
          newValue: JSON.stringify({ count: links.length })
        }
      });
    }

    return links;
  }

  async addStrategyLink(data: { sourceId: string; targetId: string; label?: string; type?: string }, userId?: string, userEmail?: string) {
    if (!data.sourceId || !data.targetId) {
      throw new AppError('Cần chọn mục tiêu nguồn và mục tiêu đích', 400, 'INVALID_LINK');
    }
    if (data.sourceId === data.targetId) {
      throw new AppError('Mục tiêu nguồn và đích không thể trùng nhau', 400, 'SELF_LINK');
    }

    const current = await this.getStrategyLinks();
    const existing = current.find((l: any) => l.sourceId === data.sourceId && l.targetId === data.targetId);
    if (existing) {
      throw new AppError('Liên kết nhân - quả giữa hai mục tiêu này đã tồn tại', 400, 'DUPLICATE_LINK');
    }

    const newLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sourceId: data.sourceId,
      targetId: data.targetId,
      label: data.label || 'Thúc đẩy',
      type: data.type || 'DRIVES',
      createdAt: new Date().toISOString()
    };

    const updated = [...current, newLink];
    await this.saveStrategyLinks(updated, userId, userEmail);
    return newLink;
  }

  async deleteStrategyLink(linkId: string, userId?: string, userEmail?: string) {
    const current = await this.getStrategyLinks();
    const filtered = current.filter((l: any) => l.id !== linkId);
    await this.saveStrategyLinks(filtered, userId, userEmail);
    return filtered;
  }

  async createObjective(data: any, userId?: string, userEmail?: string) {
    if (!data.title) {
      throw new AppError('Vui lòng nhập tên mục tiêu chiến lược', 400, 'MISSING_TITLE');
    }
    const created = await this.repo.createObjective(data);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'CREATE',
        entity: 'StrategicObjective',
        entityId: created.id,
        newValue: JSON.stringify({ title: created.title, perspective: created.perspective }),
      },
    });

    return created;
  }

  async updateObjective(id: string, data: any, userId?: string, userEmail?: string) {
    const existing = await this.repo.getObjectiveById(id);
    if (!existing) {
      throw new AppError('Mục tiêu chiến lược không tồn tại', 404, 'NOT_FOUND');
    }

    const updated = await this.repo.updateObjective(id, data);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'UPDATE',
        entity: 'StrategicObjective',
        entityId: id,
        oldValue: JSON.stringify({ title: existing.title }),
        newValue: JSON.stringify({ title: updated.title }),
      },
    });

    return updated;
  }

  async deleteObjective(id: string, userId?: string, userEmail?: string) {
    const existing = await this.repo.getObjectiveById(id);
    if (!existing) {
      throw new AppError('Mục tiêu chiến lược không tồn tại', 404, 'NOT_FOUND');
    }

    if (existing.kpiIndicators && existing.kpiIndicators.length > 0) {
      throw new AppError('Không thể xóa mục tiêu chiến lược đang có chỉ số KPI', 400, 'HAS_KPIS');
    }

    const deleted = await this.repo.deleteObjective(id);

    try {
      const currentLinks = await this.getStrategyLinks();
      const filteredLinks = currentLinks.filter((l: any) => l.sourceId !== id && l.targetId !== id);
      if (filteredLinks.length !== currentLinks.length) {
        await this.saveStrategyLinks(filteredLinks, userId, userEmail);
      }
    } catch (e) {
      console.warn('Could not clean up links for deleted objective:', e);
    }

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'DELETE',
        entity: 'StrategicObjective',
        entityId: id,
        oldValue: JSON.stringify({ title: existing.title }),
      },
    });

    return deleted;
  }

  async createKpi(data: any, userId?: string, userEmail?: string) {
    if (!data.code || !data.name || !data.objectiveId) {
      throw new AppError('Thiếu thông tin bắt buộc của chỉ số KPI', 400, 'MISSING_FIELDS');
    }

    const duplicate = await this.repo.findKpiByCode(data.code.trim());
    if (duplicate) {
      throw new AppError(`Mã KPI ${data.code} đã tồn tại`, 400, 'DUPLICATE_KPI_CODE');
    }

    const targetValue = parseFloat(data.targetValue) || 1;
    const actualValue = parseFloat(data.actualValue) || 0;
    const achievementRate = targetValue > 0
      ? Number(((actualValue / targetValue) * 100).toFixed(1))
      : 0;

    let status = 'IN_PROGRESS';
    if (achievementRate >= 100) status = 'EXCEEDED';
    else if (achievementRate >= 90) status = 'ACHIEVED';
    else if (achievementRate >= 75) status = 'WARNING';
    else if (actualValue > 0) status = 'FAILED';

    const payload = {
      ...data,
      code: data.code.trim(),
      targetValue,
      actualValue,
      weight: parseFloat(data.weight) || 20,
      thresholdValue: data.thresholdValue ? parseFloat(data.thresholdValue) : null,
      stretchValue: data.stretchValue ? parseFloat(data.stretchValue) : null,
      achievementRate,
      status,
    };

    const created = await this.repo.createKpi(payload);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'CREATE',
        entity: 'KpiIndicator',
        entityId: created.id,
        newValue: JSON.stringify({ code: created.code, name: created.name, target: created.targetValue }),
      },
    });

    return created;
  }

  async updateKpi(id: string, data: any, userId?: string, userEmail?: string) {
    const existing = await this.repo.getKpiById(id);
    if (!existing) {
      throw new AppError('Chỉ số KPI không tồn tại', 404, 'KPI_NOT_FOUND');
    }

    const targetValue = data.targetValue !== undefined ? parseFloat(data.targetValue) : existing.targetValue;
    const actualValue = data.actualValue !== undefined ? parseFloat(data.actualValue) : existing.actualValue || 0;
    const achievementRate = targetValue > 0
      ? Number(((actualValue / targetValue) * 100).toFixed(1))
      : 0;

    let status = existing.status;
    if (achievementRate >= 100) status = 'EXCEEDED';
    else if (achievementRate >= 90) status = 'ACHIEVED';
    else if (achievementRate >= 75) status = 'WARNING';
    else if (actualValue > 0) status = 'FAILED';

    const payload: any = {
      ...data,
      targetValue,
      actualValue,
      achievementRate,
      status,
    };
    if (data.weight !== undefined) payload.weight = parseFloat(data.weight);
    if (data.thresholdValue !== undefined) payload.thresholdValue = data.thresholdValue ? parseFloat(data.thresholdValue) : null;
    if (data.stretchValue !== undefined) payload.stretchValue = data.stretchValue ? parseFloat(data.stretchValue) : null;

    const updated = await this.repo.updateKpi(id, payload);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'UPDATE',
        entity: 'KpiIndicator',
        entityId: id,
        oldValue: JSON.stringify({ actual: existing.actualValue, rate: existing.achievementRate }),
        newValue: JSON.stringify({ actual: updated.actualValue, rate: updated.achievementRate }),
      },
    });

    return updated;
  }

  async deleteKpi(id: string, userId?: string, userEmail?: string) {
    const existing = await this.repo.getKpiById(id);
    if (!existing) {
      throw new AppError('Chỉ số KPI không tồn tại', 404, 'KPI_NOT_FOUND');
    }

    const deleted = await this.repo.deleteKpi(id);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'DELETE',
        entity: 'KpiIndicator',
        entityId: id,
        oldValue: JSON.stringify({ code: existing.code, name: existing.name }),
      },
    });

    return deleted;
  }

  async getReports() {
    return this.repo.getReports();
  }

  async createReport(data: any, userId?: string, userEmail?: string) {
    if (!data.name || !data.period) {
      throw new AppError('Vui lòng nhập tên báo cáo và kỳ đánh giá', 400, 'MISSING_FIELDS');
    }
    const created = await this.repo.createReport({
      ...data,
      authorId: userId || null,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'CREATE',
        entity: 'BscReport',
        entityId: created.id,
        newValue: JSON.stringify({ name: created.name, period: created.period }),
      },
    });

    return created;
  }

  async deleteReport(id: string, userId?: string, userEmail?: string) {
    const deleted = await this.repo.deleteReport(id);
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'DELETE',
        entity: 'BscReport',
        entityId: id,
      },
    });
    return deleted;
  }

  // SWOT Analysis Service
  async getSwot(organization = 'Công ty', stage = 'Giai đoạn 1') {
    const items = await this.repo.getSwotItems(organization, stage);
    return {
      organization,
      stage,
      strengths: items.filter((i) => i.type === 'STRENGTH'),
      weaknesses: items.filter((i) => i.type === 'WEAKNESS'),
      opportunities: items.filter((i) => i.type === 'OPPORTUNITY'),
      threats: items.filter((i) => i.type === 'THREAT'),
    };
  }

  async createSwotItem(data: any, userId?: string, userEmail?: string) {
    if (!data.content || !data.type) {
      throw new AppError('Thiếu nội dung hoặc phân loại SWOT', 400, 'MISSING_FIELDS');
    }
    const created = await this.repo.createSwotItem(data);
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'CREATE',
        entity: 'SwotItem',
        entityId: created.id,
        newValue: JSON.stringify({ type: created.type, content: created.content }),
      },
    });
    return created;
  }

  async deleteSwotItem(id: string, userId?: string, userEmail?: string) {
    const deleted = await this.repo.deleteSwotItem(id);
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'DELETE',
        entity: 'SwotItem',
        entityId: id,
      },
    });
    return deleted;
  }

  // Strategy Matrix (SO, WO, ST, WT) Service
  async getStrategyMatrix(organization = 'Công ty', stage = 'Giai đoạn 1') {
    const items = await this.repo.getStrategyMatrix(organization, stage);
    return {
      organization,
      stage,
      so: items.filter((i) => i.type === 'SO'),
      wo: items.filter((i) => i.type === 'WO'),
      st: items.filter((i) => i.type === 'ST'),
      wt: items.filter((i) => i.type === 'WT'),
      totalStrategies: items.length,
      selectedStrategies: items.filter((i) => i.isSelected).length,
    };
  }

  async createStrategyMatrixItem(data: any, userId?: string, userEmail?: string) {
    if (!data.title || !data.type) {
      throw new AppError('Vui lòng nhập tên chiến lược và nhóm phân loại', 400, 'MISSING_FIELDS');
    }
    const created = await this.repo.createStrategyMatrixItem(data);
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'CREATE',
        entity: 'StrategyMatrixItem',
        entityId: created.id,
        newValue: JSON.stringify({ type: created.type, title: created.title }),
      },
    });
    return created;
  }

  async updateStrategyMatrixItem(id: string, data: any, userId?: string, userEmail?: string) {
    const updated = await this.repo.updateStrategyMatrixItem(id, data);
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'UPDATE',
        entity: 'StrategyMatrixItem',
        entityId: id,
        newValue: JSON.stringify({ isSelected: updated.isSelected, title: updated.title }),
      },
    });
    return updated;
  }

  async deleteStrategyMatrixItem(id: string, userId?: string, userEmail?: string) {
    const deleted = await this.repo.deleteStrategyMatrixItem(id);
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'DELETE',
        entity: 'StrategyMatrixItem',
        entityId: id,
      },
    });
    return deleted;
  }
}

export const bscService = new BscService();

