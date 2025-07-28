import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  // 可以自定義寬度和高度
  width?: string | number;
  height?: string | number;
  // 圓形模式（用於頭像）
  circle?: boolean;
  // 動畫類型
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  circle = false,
  animation = 'pulse',
  style,
  ...props
}) => {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-bounce',
    none: '',
  }[animation];

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        circle ? 'rounded-full' : 'rounded',
        animationClass,
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

// 專門用於代禱卡片的骨架屏
export const PrayerPostSkeleton: React.FC = () => {
  return (
    <div className="bg-white w-full p-4 md:p-6 shadow-sm rounded-none border-none">
      <div className="flex w-full justify-between gap-4">
        <div className="flex gap-3 md:gap-4 font-normal flex-1 min-w-0">
          {/* 頭像骨架 */}
          <Skeleton circle width="40px" height="40px" className="md:w-12 md:h-12 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-4">
              {/* 用戶名骨架 */}
              <Skeleton width="80px" height="20px" className="md:h-6" />
              {/* 按鈕骨架 */}
              <div className="flex items-center gap-2">
                <Skeleton width="60px" height="24px" className="rounded-full" />
                <Skeleton width="50px" height="24px" className="rounded-full" />
              </div>
            </div>
            {/* 時間骨架 */}
            <Skeleton width="120px" height="16px" className="mt-1" />
          </div>
        </div>
        {/* 操作按鈕骨架 */}
        <div className="flex items-start gap-3 md:gap-4 flex-shrink-0">
          <Skeleton circle width="20px" height="20px" />
          <Skeleton circle width="20px" height="20px" />
        </div>
      </div>
      
      {/* 內容骨架 */}
      <div className="mt-3 md:mt-4 space-y-2">
        <Skeleton width="100%" height="16px" />
        <Skeleton width="90%" height="16px" />
        <Skeleton width="75%" height="16px" />
      </div>
      
      {/* 回應列表標題骨架 */}
      <div className="mt-6">
        <Skeleton width="100px" height="12px" className="mb-4" />
      </div>

      {/* 回應表單骨架 */}
      <div className="w-full pt-4">
        <Skeleton width="100%" height="42px" />
        <div className="flex w-full justify-between items-start mt-3 md:mt-4 gap-4">
          <div className="flex items-start gap-2 md:gap-3 flex-1">
            <Skeleton width="15px" height="15px" />
            <Skeleton width="150px" height="32px" />
          </div>
          <Skeleton circle width="40px" height="40px" className="md:w-12 md:h-12" />
        </div>
      </div>
    </div>
  );
};

// 用於載入列表時的多個骨架屏
export const PrayerPostSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-1 md:space-y-1">
      {Array.from({ length: count }, (_, index) => (
        <PrayerPostSkeleton key={index} />
      ))}
    </div>
  );
};
