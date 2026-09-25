import { prisma } from '../../utils/prisma.js';

export class TaskRepository {
  async findMany(filters?: {
    status?: string;
    priority?: string;
    departmentId?: string;
    assigneeId?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.priority && filters.priority !== 'ALL') {
      where.priority = filters.priority;
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      where.departmentId = filters.departmentId;
    }
    if (filters?.assigneeId && filters.assigneeId !== 'ALL') {
      where.assigneeId = filters.assigneeId;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        slaItem: {
          select: { id: true, taskType: true, durationHours: true },
        },
        objective: {
          select: { id: true, title: true, perspective: true },
        },
        checklists: {
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        creator: true,
        department: true,
        slaItem: true,
        objective: true,
        checklists: {
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: any) {
    return prisma.task.create({
      data,
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        checklists: true,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        checklists: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.task.delete({
      where: { id },
    });
  }

  async addChecklist(taskId: string, title: string) {
    return prisma.taskChecklist.create({
      data: { taskId, title },
    });
  }

  async updateChecklist(checklistId: string, isDone: boolean) {
    return prisma.taskChecklist.update({
      where: { id: checklistId },
      data: { isDone },
    });
  }

  async addComment(taskId: string, userId: string, content: string) {
    return prisma.taskComment.create({
      data: { taskId, userId, content },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
      },
    });
  }
}

export const taskRepository = new TaskRepository();
