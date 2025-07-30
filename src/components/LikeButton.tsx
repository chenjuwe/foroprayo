import React from 'react';
import { usePrayerLikes, useTogglePrayerLike } from '../hooks/useSocialFeatures';
import { log } from '@/lib/logger';
import { useLocation } from 'react-router-dom';

interface LikeButtonProps {
  prayerId: string;
  currentUserId: string | null;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ prayerId, currentUserId }) => {
  // 使用實際數據代替假資料
  const { data: likes = [] } = usePrayerLikes(prayerId);
  const toggleLikeMutation = useTogglePrayerLike();
  
  // 檢查當前用戶是否已經按過愛心
  const userLike = currentUserId 
    ? likes.find((like: any) => like.user_id === currentUserId)
    : null;
  
  const isLiked = !!userLike;
  const likeCount = likes.length;

  const handleLikeClick = () => {
    if (!currentUserId) {
      log.debug('用戶未登入，無法按愛心', {}, 'LikeButton');
      return;
    }
    
    if (toggleLikeMutation.isPending) {
      return; // 正在處理中，避免重複點擊
    }
    
    log.debug('點擊愛心按鈕', { prayerId, isLiked, likeId: userLike?.id }, 'LikeButton');
    
    // 切換愛心狀態
    toggleLikeMutation.mutate({
      prayerId,
      isLiked,
      ...(userLike?.id ? { likeId: userLike.id } : {})
    });
  };

  const location = useLocation();
  const isPrayersPage = location.pathname === '/prayers';
  const isLogPage = location.pathname === '/log';

  return (
    <button
      onClick={handleLikeClick}
      className="relative flex items-center gap-1 p-2 rounded-full cursor-pointer mr-4"
      aria-label={isLiked ? "取消愛心" : "給愛心"}
      disabled={!currentUserId || toggleLikeMutation.isPending}
      style={{ 
        transform: `translateX(${isPrayersPage ? '5px' : '-3px'})`,
        top: isPrayersPage ? '-6px' : isLogPage ? '0px' : '-8px'
      }}
    >
      {likeCount > 0 && (
        <span className="text-xs text-prayfor">{likeCount}</span>
      )}
      <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "#EA0000" : "#D0D0D0"} stroke={isLiked ? "#EA0000" : "#D0D0D0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
};
