import { prisma } from '../../utils/prisma.js';

export class PositionRepository {
  async findMany() {
    return prisma.position.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.position.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });
  }

  async findByCode(code: string) {
    return prisma.position.findUnique({
      where: { code },
    });
  }

  async create(data: { name: string; code?: string; syncId?: string; description?: string; status?: string }) {
    return prisma.position.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return prisma.position.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.position.delete({
      where: { id },
    });
  }
}

export const positionRepository = new PositionRepository();
