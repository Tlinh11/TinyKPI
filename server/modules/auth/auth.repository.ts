import { prisma } from '../../utils/prisma.js';

export class AuthRepository {
  async findByUsernameOrEmail(identifier: string) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
      include: {
        role: true,
        department: true,
        position: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        department: true,
        position: true,
      },
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

export const authRepository = new AuthRepository();
