import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  layout?: 'horizontal' | 'vertical';
  showSubtitle?: boolean;
}

export const TinyKpiLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  layout = 'vertical',
  showSubtitle = true,
}) => {
  const [imgError, setImgError] = useState(false);

  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const subtitleSizes = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-xs',
  };

  const isHorizontal = layout === 'horizontal';

  return (
    <div
      className={`inline-flex ${
        isHorizontal ? 'flex-row items-center gap-2.5' : 'flex-col items-center justify-center'
      } select-none ${className}`}
    >
      {/* Logo Mark: Cropped high-res authentic icon with SVG vector fallback */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center shrink-0`}>
        {!imgError ? (
          <img
            src="/tinykpi-icon.png"
            alt="TinyKPI Logo"
            className="w-full h-full object-contain drop-shadow-sm transition-transform hover:scale-105 duration-200"
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          /* SVG Vector matching the warm orange roof + star + smile */
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="tinyKpiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="50%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FB923C" />
              </linearGradient>
            </defs>
            {/* Top Roof Chevron */}
            <path
              d="M 50 15 L 18 42 C 14 45 16 52 22 52 L 28 52 C 32 52 36 49 39 46 L 50 37 L 61 46 C 64 49 68 52 72 52 L 78 52 C 84 52 86 45 82 42 Z"
              fill="url(#tinyKpiGrad)"
            />
            {/* Center 4-pointed Star */}
            <path
              d="M 50 42 Q 50 51 59 51 Q 50 51 50 60 Q 50 51 41 51 Q 50 51 50 42 Z"
              fill="url(#tinyKpiGrad)"
            />
            {/* Bottom Smile Arc */}
            <path
              d="M 22 59 C 22 78 35 91 50 91 C 65 91 78 78 78 59 C 78 55 73 55 70 58 C 65 72 54 81 50 81 C 46 81 35 72 30 58 C 27 55 22 55 22 59 Z"
              fill="url(#tinyKpiGrad)"
            />
          </svg>
        )}
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className={`flex flex-col ${isHorizontal ? 'text-left' : 'text-center mt-1.5'}`}>
          <div className={`${textSizes[size]} font-extrabold tracking-tight leading-none flex items-center`}>
            <span className="text-[#EA580C]">Tiny</span>
            <span className="text-[#0F172A] ml-0.5">KPI</span>
          </div>
          {showSubtitle && (size === 'md' || size === 'lg' || size === 'xl') && (
            <div
              className={`${subtitleSizes[size]} font-bold tracking-[0.16em] text-slate-500 uppercase mt-1 leading-none`}
            >
              HỆ THỐNG BSC & KPI
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Export backward compatible alias so existing imports work seamlessly
export const ToppionLogo = TinyKpiLogo;
