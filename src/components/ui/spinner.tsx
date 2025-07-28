import React from 'react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'small' | 'medium' | 'large';
type SpinnerVariant = 'default' | 'primary' | 'secondary';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string | undefined;
  fullscreen?: boolean;
}

// 定義尺寸映射
const sizeMap = {
  small: 'h-4 w-4 border-2',
  medium: 'h-6 w-6 border-2',
  large: 'h-8 w-8 border-[3px]',
};

// 定義顏色映射
const variantMap = {
  default: 'border-gray-400 border-t-transparent',
  primary: 'border-blue-500 border-t-transparent',
  secondary: 'border-current border-t-transparent',
};

// 統一的載入動畫元件
export function Spinner({ 
  size = 'medium', 
  variant = 'primary', 
  className,
  fullscreen = false
}: SpinnerProps) {
  const spinnerClasses = cn(
    'animate-spin rounded-full', 
    sizeMap[size], 
    variantMap[variant], 
    className
  );
  
  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        <div className={spinnerClasses}></div>
      </div>
    );
  }
  
  return <div className={spinnerClasses}></div>;
}

// 導出獨立的全螢幕載入
export function FullscreenSpinner() {
  return <Spinner size="large" fullscreen />;
}

// 小尺寸內聯載入
export function InlineSpinner({ className }: { className?: string | undefined }) {
  return <Spinner size="small" className={className} />;
} 