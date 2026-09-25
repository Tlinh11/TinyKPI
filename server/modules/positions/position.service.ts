import { positionRepository, PositionRepository } from './position.repository.js';
import { AppError } from '../../utils/response.js';
import { prisma } from '../../utils/prisma.js';

export class PositionService {
  constructor(private repo: PositionRepository = positionRepository) {}

  async getAllPositions() {
    return this.repo.findMany();
  }

  async getPositionById(id: string) {
    const pos = await this.repo.findById(id);
    if (!pos) {
      throw new AppError('Không tìm thấy chức vụ', 404, 'POSITION_NOT_FOUND');
    }
    return pos;
  }

  async createPosition(data: any, userId?: string, userEmail?: string) {
    if (data.code) {
      const existing = await this.repo.findByCode(data.code);
      if (existing) {
        throw new AppError(`Mã chức vụ ${data.code} đã tồn tại`, 400, 'DUPLICATE_POSITION_CODE');
      }
    }

    const created = await this.repo.create(data);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'CREATE',
        entity: 'Position',
        entityId: created.id,
        newValue: JSON.stringify({ name: created.name, code: created.code }),
      },
    });

    return created;
  }

  async updatePosition(id: string, data: any, userId?: string, userEmail?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError('Chức vụ không tồn tại', 404, 'POSITION_NOT_FOUND');
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await this.repo.findByCode(data.code);
      if (duplicate) {
        throw new AppError(`Mã chức vụ ${data.code} đã tồn tại`, 400, 'DUPLICATE_POSITION_CODE');
      }
    }

    const updated = await this.repo.update(id, data);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'UPDATE',
        entity: 'Position',
        entityId: id,
        oldValue: JSON.stringify({ name: existing.name }),
        newValue: JSON.stringify({ name: updated.name }),
      },
    });

    return updated;
  }

  async deletePosition(id: string, userId?: string, userEmail?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError('Chức vụ không tồn tại', 404, 'POSITION_NOT_FOUND');
    }

    if (existing.users && existing.users.length > 0) {
      throw new AppError('Không thể xóa chức vụ đang được gắn cho nhân sự', 400, 'HAS_ASSIGNED_USERS');
    }

    const deleted = await this.repo.delete(id);

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'DELETE',
        entity: 'Position',
        entityId: id,
        oldValue: JSON.stringify({ name: existing.name }),
      },
    });

    return deleted;
  }
}

export const positionService = new PositionService();
