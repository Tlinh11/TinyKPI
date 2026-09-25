import bcrypt from 'bcryptjs';
import { userRepository, UserRepository, UserFilterOptions } from './user.repository.js';
import { AppError } from '../../utils/response.js';
import { prisma } from '../../utils/prisma.js';

export class UserService {
  constructor(private repo: UserRepository = userRepository) {}

  async getUsers(options: UserFilterOptions) {
    return this.repo.findMany(options);
  }

  async getUserById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new AppError('Không tìm thấy nhân sự', 404, 'USER_NOT_FOUND');
    }
    return user;
  }

  async createUser(data: any, authorId?: string, authorEmail?: string) {
    // Check duplicate email or username
    if (data.email) {
      const existingEmail = await this.repo.findByEmailOrUsername(data.email.trim());
      if (existingEmail) {
        throw new AppError(`Email ${data.email} đã được sử dụng`, 400, 'DUPLICATE_EMAIL');
      }
    }

    if (data.username) {
      const existingUsername = await this.repo.findByEmailOrUsername(data.username.trim());
      if (existingUsername) {
        throw new AppError(`Tên truy cập ${data.username} đã tồn tại`, 400, 'DUPLICATE_USERNAME');
      }
    }

    // Hash password
    const rawPassword = data.password || '12345!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // If roleId not supplied, default to Staff
    let roleId = data.roleId;
    if (!roleId) {
      const defaultRole = await prisma.role.findFirst({ where: { name: 'Staff' } });
      roleId = defaultRole ? defaultRole.id : undefined;
    }

    const payload = {
      ...data,
      passwordHash,
      roleId,
      kpiStartDate: data.kpiStartDate ? new Date(data.kpiStartDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
    };
    delete payload.password;

    const created = await this.repo.create(payload);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authorId,
        userEmail: authorEmail,
        action: 'CREATE',
        entity: 'User',
        entityId: created.id,
        newValue: JSON.stringify({ fullName: created.fullName, email: created.email }),
      },
    });

    return created;
  }

  async updateUser(id: string, data: any, authorId?: string, authorEmail?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError('Nhân sự không tồn tại', 404, 'USER_NOT_FOUND');
    }

    if (data.email && data.email !== existing.email) {
      const duplicate = await this.repo.findByEmailOrUsername(data.email.trim());
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Email ${data.email} đã được sử dụng`, 400, 'DUPLICATE_EMAIL');
      }
    }

    const payload: any = { ...data };
    if (data.password) {
      payload.passwordHash = await bcrypt.hash(data.password, 10);
      delete payload.password;
    }
    if (data.kpiStartDate) {
      payload.kpiStartDate = new Date(data.kpiStartDate);
    }
    if (data.startDate) {
      payload.startDate = new Date(data.startDate);
    }

    const updated = await this.repo.update(id, payload);

    await prisma.auditLog.create({
      data: {
        userId: authorId,
        userEmail: authorEmail,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        oldValue: JSON.stringify({ fullName: existing.fullName, status: existing.status }),
        newValue: JSON.stringify({ fullName: updated.fullName, status: updated.status }),
      },
    });

    return updated;
  }

  async deleteUser(id: string, authorId?: string, authorEmail?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError('Nhân sự không tồn tại', 404, 'USER_NOT_FOUND');
    }

    if (authorId === id) {
      throw new AppError('Bạn không thể tự xóa tài khoản của chính mình', 400, 'CANNOT_DELETE_SELF');
    }

    const deleted = await this.repo.delete(id);

    await prisma.auditLog.create({
      data: {
        userId: authorId,
        userEmail: authorEmail,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        oldValue: JSON.stringify({ fullName: existing.fullName, email: existing.email }),
      },
    });

    return deleted;
  }
}

export const userService = new UserService();
