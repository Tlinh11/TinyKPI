import { prisma } from '../../utils/prisma.js';

export interface UserFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  positionId?: string;
  roleId?: string;
  status?: string;
}

export class UserRepository {
  async findMany(options: UserFilterOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.search) {
      const q = options.search.trim();
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { username: { contains: q } },
        { phone: { contains: q } },
        { employeeCode: { contains: q } },
      ];
    }

    if (options.departmentId) {
      where.departmentId = options.departmentId;
    }

    if (options.positionId) {
      where.positionId = options.positionId;
    }

    if (options.roleId) {
      where.roleId = options.roleId;
    }

    if (options.status) {
      where.status = options.status;
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: { select: { id: true, name: true } },
          department: { select: { id: true, name: true, code: true } },
          position: { select: { id: true, name: true, code: true } },
          employeeAssignments: {
            include: {
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
        position: true,
        employeeAssignments: {
          include: { department: true },
        },
      },
    });
  }

  async findByEmailOrUsername(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  async create(data: any) {
    const { assignments, ...userData } = data;
    return prisma.user.create({
      data: {
        ...userData,
        employeeAssignments: assignments && assignments.length > 0 ? {
          create: assignments.map((a: any) => ({
            departmentId: a.departmentId,
            roleName: a.roleName,
            kpiStartDate: a.kpiStartDate ? new Date(a.kpiStartDate) : null,
            endDate: a.endDate ? new Date(a.endDate) : null,
          })),
        } : undefined,
      },
      include: {
        role: true,
        department: true,
        position: true,
        employeeAssignments: true,
      },
    });
  }

  async update(id: string, data: any) {
    const { assignments, password, ...userData } = data;
    return prisma.user.update({
      where: { id },
      data: userData,
      include: {
        role: true,
        department: true,
        position: true,
        employeeAssignments: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
