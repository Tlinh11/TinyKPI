import { departmentRepository, DepartmentRepository } from './department.repository.js';
import { AppError } from '../../utils/response.js';
import { prisma } from '../../utils/prisma.js';

export class DepartmentService {
  constructor(private repo: DepartmentRepository = departmentRepository) {}

  async getAllDepartments() {
    return this.repo.findMany();
  }

  async getDepartmentById(id: string) {
    const dept = await this.repo.findById(id);
    if (!dept) {
      throw new AppError('Không tìm thấy phòng ban', 404, 'DEPARTMENT_NOT_FOUND');
    }
    return dept;
  }

  async createDepartment(data: any, userId?: string, userEmail?: string) {
    if (data.code) {
      const existing = await this.repo.findByCode(data.code);
      if (existing) {
        throw new AppError(`Mã phòng ban ${data.code} đã tồn tại`, 400, 'DUPLICATE_DEPARTMENT_CODE');
      }
    }

    const created = await this.repo.create(data);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'CREATE',
        entity: 'Department',
        entityId: created.id,
        newValue: JSON.stringify({ name: created.name, code: created.code }),
      },
    });

    return created;
  }

  async updateDepartment(id: string, data: any, userId?: string, userEmail?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError('Phòng ban không tồn tại', 404, 'DEPARTMENT_NOT_FOUND');
    }

    if (data.parentId && data.parentId === id) {
      throw new AppError('Phòng ban cha không thể là chính nó', 400, 'INVALID_PARENT_DEPARTMENT');
    }

    if (data.code && data.code !== existing.code) {
      const duplicate = await this.repo.findByCode(data.code);
      if (duplicate) {
        throw new AppError(`Mã phòng ban ${data.code} đã tồn tại`, 400, 'DUPLICATE_DEPARTMENT_CODE');
      }
    }

    const updated = await this.repo.update(id, data);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'UPDATE',
        entity: 'Department',
        entityId: id,
        oldValue: JSON.stringify({ name: existing.name, code: existing.code }),
        newValue: JSON.stringify({ name: updated.name, code: updated.code }),
      },
    });

    return updated;
  }

  async deleteDepartment(id: string, userId?: string, userEmail?: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError('Phòng ban không tồn tại', 404, 'DEPARTMENT_NOT_FOUND');
    }

    if (existing.children && existing.children.length > 0) {
      throw new AppError('Không thể xóa phòng ban có phòng ban trực thuộc', 400, 'HAS_CHILD_DEPARTMENTS');
    }

    if (existing.users && existing.users.length > 0) {
      throw new AppError('Không thể xóa phòng ban đang có nhân sự', 400, 'HAS_ASSIGNED_USERS');
    }

    const deleted = await this.repo.delete(id);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action: 'DELETE',
        entity: 'Department',
        entityId: id,
        oldValue: JSON.stringify({ name: existing.name }),
      },
    });

    return deleted;
  }

  async bulkCreateDepartments(rows: any[], userId?: string, userEmail?: string) {
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const name = String(row.name || row.departmentName || '').trim();
        if (!name) {
          errors.push(`Dòng ${i + 1}: Thiếu tên phòng ban`);
          continue;
        }

        const code = row.code ? String(row.code).trim() : `PB-${Math.floor(100 + Math.random() * 900)}`;

        const existing = await prisma.department.findFirst({
          where: { OR: [{ name }, { code }] },
        });

        if (existing) {
          await prisma.department.update({
            where: { id: existing.id },
            data: {
              name,
              abbreviation: row.abbreviation ? String(row.abbreviation).trim() : existing.abbreviation,
              type: row.type || existing.type,
              description: row.description || existing.description,
            },
          });
        } else {
          await prisma.department.create({
            data: {
              name,
              code,
              abbreviation: row.abbreviation ? String(row.abbreviation).trim() : null,
              type: row.type || 'DEPARTMENT',
              order: row.order ? Number(row.order) : 1,
              description: row.description ? String(row.description).trim() : null,
            },
          });
        }
        importedCount++;
      } catch (err: any) {
        errors.push(`Dòng ${i + 1}: ${err.message || 'Lỗi không xác định'}`);
      }
    }

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          userEmail,
          action: 'BULK_IMPORT',
          entity: 'Department',
          entityId: 'BULK',
          newValue: JSON.stringify({ importedCount, total: rows.length }),
        },
      });
    }

    return { importedCount, total: rows.length, errors };
  }
}

export const departmentService = new DepartmentService();

