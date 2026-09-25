import bcrypt from 'bcryptjs';
import { authRepository, AuthRepository } from './auth.repository.js';
import { LoginInput, ChangePasswordInput } from './auth.schema.js';
import { generateToken } from '../../utils/jwt.js';
import { AppError } from '../../utils/response.js';
import { LoginResponse, UserAuthDto } from './auth.types.js';
import { prisma } from '../../utils/prisma.js';

export class AuthService {
  constructor(private repo: AuthRepository = authRepository) {}

  async login(input: LoginInput, ipAddress?: string): Promise<LoginResponse> {
    const user = await this.repo.findByUsernameOrEmail(input.username.trim());

    if (!user) {
      throw new AppError('Tài khoản hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Tài khoản của bạn đã bị tạm khóa hoặc ngừng hoạt động', 403, 'ACCOUNT_LOCKED');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Tài khoản hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'LOGIN',
          entity: 'Auth',
          entityId: user.id,
          newValue: `Đăng nhập thành công từ ${input.username}`,
          ipAddress: ipAddress || null,
        },
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    const userDto: UserAuthDto = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role.name,
      avatar: user.avatar,
      departmentId: user.departmentId,
      positionId: user.positionId,
      departmentName: user.department?.name || null,
      positionName: user.position?.name || null,
    };

    return { token, user: userDto };
  }

  async getProfile(userId: string): Promise<UserAuthDto> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new AppError('Không tìm thấy thông tin tài khoản', 404, 'USER_NOT_FOUND');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role.name,
      avatar: user.avatar,
      departmentId: user.departmentId,
      positionId: user.positionId,
      departmentName: user.department?.name || null,
      positionName: user.position?.name || null,
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new AppError('Tài khoản không tồn tại', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(input.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Mật khẩu hiện tại không chính xác', 400, 'INVALID_OLD_PASSWORD');
    }

    const newHash = await bcrypt.hash(input.newPassword, 10);
    await this.repo.updatePassword(userId, newHash);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'UPDATE',
        entity: 'UserPassword',
        entityId: user.id,
        newValue: 'Đổi mật khẩu thành công',
      },
    });
  }
}

export const authService = new AuthService();
