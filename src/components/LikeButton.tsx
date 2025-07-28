import React, { useState } from 'react';
// import { usePrayerLikes, useTogglePrayerLike } from '../hooks/useSocialFeatures';
import { log } from '@/lib/logger';
import { useLocation } from 'react-router-dom';

interface LikeButtonProps {
  prayerId: string;
  currentUserId: string | null;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ prayerId, currentUserId }) => {
  // 假資料
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(0);

  const handleLikeClick = () => {
    // 暫時停用愛心功能
  };

  const location = useLocation();
  const isPrayersPage = location.pathname === '/prayers';
  const isLogPage = location.pathname === '/log';

  return (
    <button
      onClick={handleLikeClick}
      className="relative flex items-center gap-1 p-2 rounded-full cursor-pointer mr-4"
      aria-label={optimisticLiked ? "取消愛心" : "給愛心"}
      disabled={true}
      style={{ 
        transform: 'translateX(-3px)',
        top: isPrayersPage ? '-8px' : isLogPage ? '0px' : '-8px'
      }}
    >
      {optimisticLikeCount > 0 && (
        <span className="text-xs text-prayfor">{optimisticLikeCount}</span>
      )}
      <svg width="14" height="14" viewBox="0 0 24 24" fill={optimisticLiked ? "#EA0000" : "#D0D0D0"} stroke={optimisticLiked ? "#EA0000" : "#D0D0D0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
};
