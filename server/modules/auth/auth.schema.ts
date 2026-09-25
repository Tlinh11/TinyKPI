import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên truy cập hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
