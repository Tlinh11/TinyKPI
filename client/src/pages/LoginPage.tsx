import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { ToppionLogo } from '../components/common/ToppionLogo.js';
import { apiClient } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { User } from '../types/index.js';

interface LoginResponseData {
  token: string;
  user: User;
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('Thuankhanh.hust@gmail.com');
  const [password, setPassword] = useState('12345!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên truy cập hoặc email');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient<LoginResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      login(res.token, res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 md:p-6 bg-[#eef2f6]">
      {/* Centered Modal Card matching TopKPI screenshot */}
      <div className="w-full max-w-[860px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px] border border-slate-200/80">
        
        {/* Left Side: Dark Metallic Wave Panel (40% width) */}
        <div className="hidden md:flex md:w-[42%] relative overflow-hidden bg-gradient-to-b from-[#031329] via-[#06244d] to-[#04162e] p-8 flex-col justify-between select-none">
          {/* Subtle curved background overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-45">
            <svg viewBox="0 0 400 600" className="w-full h-full object-cover">
              <defs>
                <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e40af" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#082f49" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M-50,80 C150,180 80,380 320,320 C420,290 480,480 480,600 L-50,600 Z"
                fill="url(#wave1)"
              />
              <path
                d="M-80,260 C80,340 180,220 420,440 L-80,600 Z"
                fill="url(#wave2)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-200 text-[11px] font-semibold tracking-wide">
              <span>Nền tảng TinyKPI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="relative z-10 text-white space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Hệ thống Quản trị TinyKPI</h2>
            <p className="text-xs text-blue-200/80 leading-relaxed font-normal">
              Đo lường năng lực, tự động hóa quy trình nghiệp vụ và tối ưu hóa hiệu suất vận hành doanh nghiệp BSC & KPI.
            </p>
          </div>
        </div>

        {/* Right Side: Form (58% width) */}
        <div className="w-full md:w-[58%] p-8 md:p-12 flex flex-col justify-center bg-white">
          <ToppionLogo size="lg" layout="vertical" />

          <div className="mt-5 mb-2 text-left">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Đăng nhập hệ thống</h1>
            <p className="text-xs text-slate-500 mt-1">
              Bạn chưa có tài khoản?{' '}
              <a
                href="https://toppion.com.vn/"
                target="_blank"
                rel="noreferrer"
                className="text-[#1677ff] hover:underline font-medium"
              >
                Liên hệ đăng ký
              </a>
            </p>
          </div>

          {errorMessage && (
            <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Input 1: Tên truy cập with Floating Label Cutout */}
            <div className="relative mt-2">
              <label className="absolute -top-2 left-3 px-1.5 bg-white text-[11px] font-medium text-slate-500 z-10 select-none">
                <span className="text-red-500 mr-0.5">*</span> Tên truy cập
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên truy cập"
                required
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] placeholder:text-slate-400"
              />
            </div>

            {/* Input 2: Password with Quên mật khẩu & Floating Label */}
            <div>
              <div className="flex justify-end mb-1">
                <button
                  type="button"
                  onClick={() => alert('Vui lòng liên hệ Quản trị viên để đặt lại mật khẩu.')}
                  className="text-[11px] text-slate-500 hover:text-[#1677ff] transition"
                >
                  Quên mật khẩu
                </button>
              </div>

              <div className="relative">
                <label className="absolute -top-2 left-3 px-1.5 bg-white text-[11px] font-medium text-slate-500 z-10 select-none">
                  <span className="text-red-500 mr-0.5">*</span> Mật khẩu + OTP (nếu có)
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu + OTP (nếu có)"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg outline-none transition focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#1677ff] hover:bg-[#4096ff] text-white font-medium text-xs rounded-lg shadow-sm hover:shadow transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Phiên bản: 2026.09.8152-linux</span>
            <span>Tài khoản: Thuankhanh.hust@gmail.com</span>
          </div>
        </div>

      </div>
    </div>
  );
};
