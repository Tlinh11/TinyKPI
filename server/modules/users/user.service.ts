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

  async bulkCreateUsers(rows: any[], authorId?: string, authorEmail?: string) {
    const departments = await prisma.department.findMany({ select: { id: true, name: true, code: true } });
    const positions = await prisma.position.findMany({ select: { id: true, name: true, code: true } });
    const roles = await prisma.role.findMany({ select: { id: true, name: true } });
    const defaultRole = roles.find((r) => r.name === 'Staff') || roles[0];

    const defaultPasswordHash = await bcrypt.hash('12345!', 10);

    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const fullName = String(row.fullName || row.name || '').trim();
        if (!fullName) {
          errors.push(`Dòng ${i + 1}: Thiếu Họ và tên.`);
          continue;
        }

        const employeeCode = String(row.employeeCode || row.code || `NV-${Math.floor(1000 + Math.random() * 9000)}`).trim();
        let email = String(row.email || '').trim().toLowerCase();
        let username = String(row.username || '').trim().toLowerCase();

        if (!email) {
          const cleanName = fullName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
          email = `${cleanName}.${employeeCode.toLowerCase()}@tinykpi.com`;
        }
        if (!username) {
          username = email.split('@')[0];
        }

        const existing = await prisma.user.findFirst({
          where: { OR: [{ email }, { username }] },
        });

        // Find department
        let departmentId: string | null = null;
        if (row.departmentId) {
          departmentId = row.departmentId;
        } else if (row.department || row.departmentName) {
          const deptQuery = String(row.department || row.departmentName).trim().toLowerCase();
          const foundDept = departments.find(
            (d) => d.name.toLowerCase() === deptQuery || (d.code && d.code.toLowerCase() === deptQuery)
          );
          if (foundDept) departmentId = foundDept.id;
        }

        // Find position
        let positionId: string | null = null;
        if (row.positionId) {
          positionId = row.positionId;
        } else if (row.position || row.positionName) {
          const posQuery = String(row.position || row.positionName).trim().toLowerCase();
          const foundPos = positions.find(
            (p) => p.name.toLowerCase() === posQuery || (p.code && p.code.toLowerCase() === posQuery)
          );
          if (foundPos) positionId = foundPos.id;
        }

        // Find role
        let roleId = defaultRole ? defaultRole.id : undefined;
        if (row.roleId) {
          roleId = row.roleId;
        } else if (row.role || row.roleName) {
          const roleQuery = String(row.role || row.roleName).trim().toLowerCase();
          const foundRole = roles.find((r) => r.name.toLowerCase() === roleQuery);
          if (foundRole) roleId = foundRole.id;
        }

        const data: any = {
          fullName,
          employeeCode,
          email,
          username,
          phone: row.phone ? String(row.phone).trim() : null,
          gender: row.gender ? String(row.gender).trim() : 'Nam',
          status: row.status === 'Đã nghỉ việc' || row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
          departmentId,
          positionId,
          roleId: roleId!,
          passwordHash: defaultPasswordHash,
          startDate: row.startDate ? new Date(row.startDate) : new Date(),
          kpiStartDate: row.kpiStartDate ? new Date(row.kpiStartDate) : new Date(),
        };

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              fullName: data.fullName,
              phone: data.phone,
              gender: data.gender,
              status: data.status,
              departmentId: data.departmentId || existing.departmentId,
              positionId: data.positionId || existing.positionId,
            },
          });
        } else {
          await prisma.user.create({ data });
        }
        importedCount++;
      } catch (err: any) {
        errors.push(`Dòng ${i + 1}: ${err.message || 'Lỗi không xác định'}`);
      }
    }

    if (authorId) {
      await prisma.auditLog.create({
        data: {
          userId: authorId,
          userEmail: authorEmail,
          action: 'BULK_IMPORT',
          entity: 'User',
          entityId: 'BULK',
          newValue: JSON.stringify({ importedCount, total: rows.length }),
        },
      });
    }

    return { importedCount, total: rows.length, errors };
  }
}

export const userService = new UserService();

