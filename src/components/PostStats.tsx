import React, { useState, useEffect } from 'react';
import ReplyIcon from '../assets/icons/Reply.svg?react';
import { useLocation } from 'react-router-dom';
import { log } from '@/lib/logger';

interface PostStatsProps {
  prayerId: string;
  currentUserId: string | null;
  responseCount: number;
  onResponseClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  heartIconSize?: number; // 愛心圖標大小
  replyIconSize?: number; // 回應圖標大小
  gap?: number;         // 元素之間的間距
}

// 定義點讚數據的接口
interface PrayerLike {
  id: string;
  user_id: string;
  prayer_id: string;
  created_at?: string;
}

export const PostStats: React.FC<PostStatsProps> = ({ 
  prayerId, 
  currentUserId, 
  responseCount,
  onResponseClick,
  className = "",
  style,
  heartIconSize = 14,
  replyIconSize = 14,
  gap = 4
}) => {
  const location = useLocation();
  const isPrayersPage = location.pathname === '/prayers';
  const isLogPage = location.pathname === '/log';
  
  // 暫時禁用社交功能
  const likes = [];
  const isLoading = false;
  const error = null;
  const isLikedByCurrentUser = false;
  const optimisticLiked = false;
  const optimisticLikeCount = 0;
  
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 暫時禁用點讚功能
    log.debug('點讚功能暫時不可用', null, 'PostStats');
  };

  const handleResponseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onResponseClick) {
      onResponseClick();
    }
  };

  return (
    <div 
      className={`flex items-center w-full justify-end ${className}`} 
      style={{
        ...style,
        gap: `${gap}px`,
        overflow: 'visible',
        position: 'relative' as const,
        minWidth: '150px',
        paddingRight: '20px',
        marginRight: '-2px',  // 從10px減少12px，變成-2px，實現向右移動12px
        marginLeft: '12px'    // 增加左邊距12px也有助於右移效果
      }}
    >
      {/* 回應數字和圖標 - 移到左側 */}
      <div 
        className="flex items-center gap-1 cursor-pointer"
        onClick={handleResponseClick}
        style={{ 
          paddingRight: '12px',
          overflow: 'visible'
        }}
      >
        {responseCount > 0 && (
          <span className="text-xs text-prayfor" style={{ minWidth: '24px', display: 'inline-block', textAlign: 'right' }}>
            {responseCount}
          </span>
        )}
        <ReplyIcon 
          style={{ 
            color: responseCount > 0 ? '#16a34a' : '#D0D0D0',
            width: `${replyIconSize}px`,
            height: `${replyIconSize}px`
          }}
        />
      </div>
      
      {/* 愛心數字和圖標 - 移到右側 */}
      <div 
        onClick={handleLikeClick}
        className="flex items-center gap-1 cursor-pointer"
      >
        {optimisticLikeCount > 0 && (
          <span className="text-xs text-prayfor" style={{ minWidth: '24px', display: 'inline-block', textAlign: 'right' }}>
            {optimisticLikeCount}
          </span>
        )}
        <svg 
          width={heartIconSize} 
          height={heartIconSize} 
          viewBox="0 0 24 24" 
          fill={optimisticLiked ? "#EA0000" : "#D0D0D0"} 
          stroke={optimisticLiked ? "#EA0000" : "#D0D0D0"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </div>
    </div>
  );
}; 