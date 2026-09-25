import { prisma } from '../../utils/prisma.js';

export class DepartmentRepository {
  async findMany() {
    return prisma.department.findMany({
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true, children: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        users: {
          select: { id: true, fullName: true, email: true, status: true },
        },
      },
    });
  }

  async findByCode(code: string) {
    return prisma.department.findUnique({
      where: { code },
    });
  }

  async create(data: {
    name: string;
    code?: string;
    syncId?: string;
    abbreviation?: string;
    parentId?: string;
    type?: string;
    order?: number;
    description?: string;
  }) {
    return prisma.department.create({
      data,
      include: {
        parent: true,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.department.update({
      where: { id },
      data,
      include: {
        parent: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.department.delete({
      where: { id },
    });
  }
}

export const departmentRepository = new DepartmentRepository();
