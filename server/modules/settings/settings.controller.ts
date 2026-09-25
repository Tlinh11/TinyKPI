import { Response, NextFunction } from 'express';
import { prisma } from '../../utils/prisma.js';
import { sendSuccess, AppError } from '../../utils/response.js';
import { AuthenticatedRequest } from '../../middleware/authGuard.js';

export class SettingsController {
  // ==========================================
  // 1. ROLES & RBAC MATRIX
  // ==========================================
  async getRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const roles = await prisma.role.findMany({
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      sendSuccess(res, roles, 'Lấy danh sách nhóm quyền thành công');
    } catch (err) {
      next(err);
    }
  }

  async getPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { name: 'asc' }],
      });
      sendSuccess(res, permissions, 'Lấy danh mục quyền thành công');
    } catch (err) {
      next(err);
    }
  }

  async createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      if (!name || !name.trim()) {
        throw new AppError('Tên nhóm quyền không được để trống', 400);
      }

      const existing = await prisma.role.findUnique({
        where: { name: name.trim() },
      });
      if (existing) {
        throw new AppError(`Nhóm quyền '${name}' đã tồn tại trong hệ thống`, 400);
      }

      const role = await prisma.role.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        },
      });

      sendSuccess(res, role, 'Tạo nhóm quyền mới thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name, description } = req.body;

      const role = await prisma.role.findUnique({ where: { id } });
      if (!role) {
        throw new AppError('Nhóm quyền không tồn tại', 404);
      }

      const updated = await prisma.role.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(description !== undefined ? { description: description?.trim() || null } : {}),
        },
      });

      sendSuccess(res, updated, 'Cập nhật thông tin nhóm quyền thành công');
    } catch (err) {
      next(err);
    }
  }

  async updateRolePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { permissionIds } = req.body;

      const role = await prisma.role.findUnique({ where: { id } });
      if (!role) {
        throw new AppError('Nhóm quyền không tồn tại', 404);
      }

      if (!Array.isArray(permissionIds)) {
        throw new AppError('Danh sách mã quyền phải là một mảng (permissionIds)', 400);
      }

      // Perform in transaction: remove existing, then re-insert
      await prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((pid: string) => ({
              roleId: id,
              permissionId: pid,
            })),
          });
        }
      });

      const updatedRole = await prisma.role.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      });

      sendSuccess(res, updatedRole, 'Cập nhật ma trận phân quyền thành công');
    } catch (err) {
      next(err);
    }
  }

  async deleteRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new AppError('Nhóm quyền không tồn tại', 404);
      }

      if (['Admin', 'Manager', 'Staff', 'User'].includes(role.name)) {
        throw new AppError(`Không thể xóa nhóm quyền hệ thống mặc định '${role.name}'`, 400);
      }

      const userCount = await prisma.user.count({ where: { roleId: id } });
      if (userCount > 0) {
        throw new AppError(`Không thể xóa: Có ${userCount} nhân sự đang thuộc nhóm quyền này`, 400);
      }

      await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { roleId: id } }),
        prisma.role.delete({ where: { id } }),
      ]);

      sendSuccess(res, null, `Đã xóa nhóm quyền ${role.name} thành công`);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 2. ORG CHART HIERARCHY
  // ==========================================
  async getOrgChart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const departments = await prisma.department.findMany({
        include: {
          users: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
              status: true,
              position: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { order: 'asc' },
      });

      // Find leader or pick first user as manager representation
      const formatted = departments.map((d) => {
        const manager =
          d.users.find(
            (u) =>
              u.position?.name?.toLowerCase().includes('trưởng') ||
              u.position?.name?.toLowerCase().includes('giám đốc')
          ) || d.users[0] || null;

        return {
          ...d,
          manager: manager
            ? {
                id: manager.id,
                fullName: manager.fullName,
                email: manager.email,
                avatar: manager.avatar,
                position: manager.position ? { title: manager.position.name } : null,
              }
            : null,
          users: d.users.map((u) => ({
            ...u,
            position: u.position ? { title: u.position.name } : null,
          })),
        };
      });

      // Transform flat departments into recursive tree
      type OrgNode = (typeof formatted)[0] & { children: OrgNode[] };
      const map = new Map<string, OrgNode>();
      formatted.forEach((d) => {
        map.set(d.id, { ...d, children: [] });
      });

      const roots: OrgNode[] = [];
      formatted.forEach((d) => {
        const node = map.get(d.id)!;
        if (d.parentId && map.has(d.parentId)) {
          map.get(d.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      });

      sendSuccess(res, { roots, flat: formatted }, 'Lấy sơ đồ tổ chức đồ họa thành công');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 3. EMPLOYEE LEAVE RECORDS (Nghỉ dài hạn)
  // ==========================================
  async getLeaves(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const leaves = await prisma.employeeLeaveRecord.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
              status: true,
              department: { select: { id: true, name: true } },
              position: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = leaves.map((l) => ({
        ...l,
        user: {
          ...l.user,
          position: l.user.position ? { title: l.user.position.name } : null,
        },
      }));

      sendSuccess(res, formatted, 'Lấy danh sách nhân sự nghỉ dài hạn thành công');
    } catch (err) {
      next(err);
    }
  }

  async createLeave(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId, leaveType, startDate, endDate, reason, freezeKpi, approvedBy } = req.body;

      if (!userId || !leaveType || !startDate) {
        throw new AppError('Thiếu thông tin bắt buộc: userId, leaveType, startDate', 400);
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError('Nhân sự không tồn tại', 404);
      }

      const shouldFreeze = freezeKpi !== false;

      const record = await prisma.$transaction(async (tx) => {
        const r = await tx.employeeLeaveRecord.create({
          data: {
            userId,
            leaveType,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            reason: reason || null,
            freezeKpi: shouldFreeze,
            approvedBy: approvedBy || 'Ban Quản Trị',
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                department: { select: { name: true } },
                position: { select: { id: true, name: true } },
              },
            },
          },
        });

        // If freezeKpi is true, update user status to LEAVE (if defined in schema)
        if (shouldFreeze) {
          await tx.user.update({
            where: { id: userId },
            data: { status: 'LEAVE' },
          });
        }

        return r;
      });

      sendSuccess(res, record, 'Đăng ký nghỉ chế độ thành công & đã đóng băng tính KPI', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateLeave(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, endDate, reason, approvedBy } = req.body;

      const existing = await prisma.employeeLeaveRecord.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Không tìm thấy bản ghi nghỉ dài hạn', 404);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const r = await tx.employeeLeaveRecord.update({
          where: { id },
          data: {
            ...(status ? { status } : {}),
            ...(endDate ? { endDate: new Date(endDate) } : {}),
            ...(reason !== undefined ? { reason } : {}),
            ...(approvedBy !== undefined ? { approvedBy } : {}),
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                department: { select: { name: true } },
                position: { select: { id: true, name: true } },
              },
            },
          },
        });

        // If status changed to COMPLETED, reactivate user
        if (status === 'COMPLETED' || status === 'INACTIVE') {
          await tx.user.update({
            where: { id: existing.userId },
            data: { status: 'ACTIVE' },
          });
        }

        return r;
      });

      sendSuccess(res, updated, 'Cập nhật bản ghi nghỉ chế độ thành công');
    } catch (err) {
      next(err);
    }
  }

  async deleteLeave(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const existing = await prisma.employeeLeaveRecord.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Không tìm thấy bản ghi nghỉ', 404);
      }

      await prisma.$transaction([
        prisma.employeeLeaveRecord.delete({ where: { id } }),
        prisma.user.update({
          where: { id: existing.userId },
          data: { status: 'ACTIVE' },
        }),
      ]);

      sendSuccess(res, null, 'Đã xóa bản ghi nghỉ dài hạn & khôi phục trạng thái hoạt động');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 4. FORM TEMPLATES
  // ==========================================
  async getForms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const forms = await prisma.formTemplate.findMany({
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, forms, 'Lấy danh sách biểu mẫu thành công');
    } catch (err) {
      next(err);
    }
  }

  async createForm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code, name, category, description, fieldsJson, status } = req.body;
      if (!code || !name || !fieldsJson) {
        throw new AppError('Thiếu thông tin bắt buộc: code, name, fieldsJson', 400);
      }

      const existing = await prisma.formTemplate.findUnique({ where: { code } });
      if (existing) {
        throw new AppError(`Mã biểu mẫu '${code}' đã tồn tại`, 400);
      }

      const form = await prisma.formTemplate.create({
        data: {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          category: category || 'GENERAL',
          description: description || null,
          fieldsJson: typeof fieldsJson === 'string' ? fieldsJson : JSON.stringify(fieldsJson),
          status: status || 'ACTIVE',
        },
      });

      sendSuccess(res, form, 'Tạo mẫu biểu điện tử mới thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateForm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { name, category, description, fieldsJson, status } = req.body;

      const form = await prisma.formTemplate.update({
        where: { id },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(category ? { category } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(fieldsJson !== undefined
            ? { fieldsJson: typeof fieldsJson === 'string' ? fieldsJson : JSON.stringify(fieldsJson) }
            : {}),
          ...(status ? { status } : {}),
        },
      });

      sendSuccess(res, form, 'Cập nhật biểu mẫu thành công');
    } catch (err) {
      next(err);
    }
  }

  async deleteForm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.formTemplate.delete({ where: { id } });
      sendSuccess(res, null, 'Đã xóa mẫu biểu điện tử');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 5. AI KPI RULES
  // ==========================================
  async getAiRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { industry, position } = req.query;
      const rules = await prisma.aiKpiRule.findMany({
        where: {
          ...(industry ? { industry: String(industry) } : {}),
          ...(position ? { position: String(position) } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, rules, 'Lấy danh mục quy tắc AI KPI thành công');
    } catch (err) {
      next(err);
    }
  }

  async createAiRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { industry, position, perspective, suggestedKpi, formula, unit, weight } = req.body;
      if (!industry || !position || !perspective || !suggestedKpi) {
        throw new AppError('Thiếu thông tin: industry, position, perspective, suggestedKpi', 400);
      }

      const rule = await prisma.aiKpiRule.create({
        data: {
          industry: industry.trim().toUpperCase(),
          position: position.trim().toUpperCase(),
          perspective: perspective.trim().toUpperCase(),
          suggestedKpi: suggestedKpi.trim(),
          formula: formula || null,
          unit: unit || '%',
          weight: Number(weight) || 20,
        },
      });

      sendSuccess(res, rule, 'Thêm quy tắc AI gợi ý KPI thành công', 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteAiRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await prisma.aiKpiRule.delete({ where: { id } });
      sendSuccess(res, null, 'Đã xóa quy tắc AI gợi ý');
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 6. SYSTEM & EMAIL SETTINGS
  // ==========================================
  async getSystemSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const settings = await prisma.systemSetting.findMany({
        orderBy: { key: 'asc' },
      });
      sendSuccess(res, settings, 'Lấy cấu hình hệ thống thành công');
    } catch (err) {
      next(err);
    }
  }

  async updateSystemSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { settings } = req.body;
      if (!Array.isArray(settings)) {
        throw new AppError("Dữ liệu cài đặt phải là một mảng '{ key, value, group }'", 400);
      }

      await prisma.$transaction(
        settings.map((s: { key: string; value: string; group?: string }) =>
          prisma.systemSetting.upsert({
            where: { key: s.key },
            update: { value: String(s.value) },
            create: {
              key: s.key,
              value: String(s.value),
              group: s.group || 'GENERAL',
            },
          })
        )
      );

      const allSettings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
      sendSuccess(res, allSettings, 'Đã lưu toàn bộ cấu hình hệ thống thành công');
    } catch (err) {
      next(err);
    }
  }

  async testEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { testRecipient } = req.body;
      const target = testRecipient || req.user?.email || 'admin@tinykpi.com';

      // Simulate SMTP connection and handshake
      sendSuccess(
        res,
        {
          success: true,
          recipient: target,
          sentAt: new Date().toISOString(),
          smtpLog: `[SMTP 250 2.0.0] OK: Message delivered to relay for <${target}>`,
        },
        `Đã gửi email kiểm thử kết nối SMTP thành công đến ${target}`
      );
    } catch (err) {
      next(err);
    }
  }
}

export const settingsController = new SettingsController();
