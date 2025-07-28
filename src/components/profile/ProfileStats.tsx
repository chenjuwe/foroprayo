import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FirebasePrayerService } from '@/services/prayer/FirebasePrayerService';
import { cn } from '@/lib/utils';

// 導入圖標，使用正確的vite-plugin-svgr語法
import MessageIcon from '@/assets/icons/MessageIcon.svg?react';
import ReplyIcon from '@/assets/icons/Reply.svg?react';
import LikeIcon from '@/assets/icons/LikeIcon.svg?react';

interface ProfileStatsProps {
  userId: string;
  className?: string;
}

export function ProfileStats({ userId, className }: ProfileStatsProps) {
  const prayerService = new FirebasePrayerService();

  // 獲取用戶統計信息
  const { data: stats, isLoading } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => await prayerService.getUserStats(userId),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className={cn("w-full mt-4 p-4 flex justify-center", className)}>
        <div>載入中...</div>
      </div>
    );
  }

  return (
    <div className={cn("w-full mt-8 flex justify-center", className)} style={{ marginTop: '108px' }}>
      <div className="grid grid-cols-3 gap-6 w-full max-w-md">
        {/* 代禱次數統計 */}
        <div className="flex flex-col items-center">
          <MessageIcon className="w-5 h-5 text-black mb-2" />
          <span className="text-xl font-bold" style={{ fontSize: '14px' }}>{stats?.prayerCount || 0}</span>
          <span className="text-sm text-gray-600" style={{ fontSize: '12px' }}>代禱次數</span>
        </div>
        
        {/* 回應次數統計 */}
        <div className="flex flex-col items-center">
          <ReplyIcon className="w-5 h-5 text-gray-500 mb-2" />
          <span className="text-xl font-bold" style={{ fontSize: '14px' }}>{stats?.responseCount || 0}</span>
          <span className="text-sm text-gray-600" style={{ fontSize: '12px' }}>回應次數</span>
        </div>
        
        {/* 獲得愛心數統計 */}
        <div className="flex flex-col items-center">
          <LikeIcon className="w-5 h-5 text-red-700 mb-2" />
          <span className="text-xl font-bold" style={{ fontSize: '14px' }}>{stats?.receivedLikesCount || 0}</span>
          <span className="text-sm text-gray-600" style={{ fontSize: '12px' }}>獲得愛心</span>
        </div>
      </div>
    </div>
  );
} 