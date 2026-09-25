import { prisma } from '../../utils/prisma.js';

export class BscRepository {
  async getStrategyMap(organization = 'Công ty', stage = 'Giai đoạn 1') {
    return prisma.strategicObjective.findMany({
      where: { organization, stage },
      include: {
        kpiIndicators: {
          include: {
            department: { select: { id: true, name: true, code: true } },
            assignedTo: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { code: 'asc' },
        },
      },
      orderBy: [{ perspective: 'asc' }, { order: 'asc' }],
    });
  }

  async getObjectiveById(id: string) {
    return prisma.strategicObjective.findUnique({
      where: { id },
      include: { kpiIndicators: true },
    });
  }

  async createObjective(data: {
    organization?: string;
    stage?: string;
    perspective: string;
    code?: string;
    title: string;
    description?: string;
    order?: number;
  }) {
    return prisma.strategicObjective.create({
      data: {
        organization: data.organization || 'Công ty',
        stage: data.stage || 'Giai đoạn 1',
        perspective: data.perspective,
        code: data.code,
        title: data.title,
        description: data.description,
        order: data.order || 1,
      },
      include: { kpiIndicators: true },
    });
  }

  async updateObjective(id: string, data: any) {
    return prisma.strategicObjective.update({
      where: { id },
      data,
      include: { kpiIndicators: true },
    });
  }

  async deleteObjective(id: string) {
    return prisma.strategicObjective.delete({
      where: { id },
    });
  }

  async createKpi(data: any) {
    return prisma.kpiIndicator.create({
      data,
      include: {
        department: true,
        assignedTo: true,
        objective: true,
      },
    });
  }

  async updateKpi(id: string, data: any) {
    return prisma.kpiIndicator.update({
      where: { id },
      data,
      include: {
        department: true,
        assignedTo: true,
        objective: true,
      },
    });
  }

  async deleteKpi(id: string) {
    return prisma.kpiIndicator.delete({
      where: { id },
    });
  }

  async getKpiById(id: string) {
    return prisma.kpiIndicator.findUnique({
      where: { id },
      include: {
        department: true,
        assignedTo: true,
        objective: true,
      },
    });
  }

  async findKpiByCode(code: string) {
    return prisma.kpiIndicator.findUnique({
      where: { code },
    });
  }

  async getReports() {
    return prisma.bscReport.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReport(data: any) {
    return prisma.bscReport.create({
      data,
    });
  }

  async deleteReport(id: string) {
    return prisma.bscReport.delete({
      where: { id },
    });
  }

  // SWOT Analysis
  async getSwotItems(organization = 'Công ty', stage = 'Giai đoạn 1') {
    return prisma.swotItem.findMany({
      where: { organization, stage },
      orderBy: { order: 'asc' },
    });
  }

  async createSwotItem(data: { organization?: string; stage?: string; type: string; content: string; order?: number }) {
    return prisma.swotItem.create({
      data: {
        organization: data.organization || 'Công ty',
        stage: data.stage || 'Giai đoạn 1',
        type: data.type,
        content: data.content,
        order: data.order || 1,
      },
    });
  }

  async deleteSwotItem(id: string) {
    return prisma.swotItem.delete({
      where: { id },
    });
  }

  // Strategy Matrix (SO, WO, ST, WT)
  async getStrategyMatrix(organization = 'Công ty', stage = 'Giai đoạn 1') {
    return prisma.strategyMatrixItem.findMany({
      where: { organization, stage },
      orderBy: { order: 'asc' },
    });
  }

  async createStrategyMatrixItem(data: {
    organization?: string;
    stage?: string;
    type: string;
    title: string;
    description?: string;
    isSelected?: boolean;
    order?: number;
  }) {
    return prisma.strategyMatrixItem.create({
      data: {
        organization: data.organization || 'Công ty',
        stage: data.stage || 'Giai đoạn 1',
        type: data.type,
        title: data.title,
        description: data.description,
        isSelected: data.isSelected || false,
        order: data.order || 1,
      },
    });
  }

  async updateStrategyMatrixItem(id: string, data: any) {
    return prisma.strategyMatrixItem.update({
      where: { id },
      data,
    });
  }

  async deleteStrategyMatrixItem(id: string) {
    return prisma.strategyMatrixItem.delete({
      where: { id },
    });
  }
}

export const bscRepository = new BscRepository();

