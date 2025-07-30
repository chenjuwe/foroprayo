import React, { useEffect, useState } from 'react';
import UserInfo from './UserInfo';
import { PostActionButtons } from './PostActionButtons';
import { LikeButton } from './LikeButton';
import type { Prayer } from '@/services/prayerService';
import { useTempUserStore } from '@/stores/tempUserStore';

interface PrayerHeaderProps {
  prayer: Prayer;
  currentUserId: string | null;
  isOwner: boolean;
  onShare?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}

export const PrayerHeader: React.FC<PrayerHeaderProps> = ({
  prayer,
  currentUserId,
  isOwner,
  onShare,
  onEdit,
  onDelete,
}) => {
  // 使用 state 保存當前的訪客模式狀態
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  // 在組件加載時檢查訪客模式
  useEffect(() => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    setIsGuestMode(guestMode);
    
    // 監聽存儲變更
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'guestMode') {
        setIsGuestMode(e.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // 如果是用戶自己的貼文，使用臨時名稱
  const { tempDisplayName } = useTempUserStore();
  
  // 檢查是否應顯示為匿名用戶
  const shouldShowAnonymous = prayer.is_anonymous || false;
  
  // 獲取正確的顯示名稱 - 直接使用邏輯而不依賴 getUnifiedUserName
  const displayName = shouldShowAnonymous 
    ? '訪客' // 匿名貼文顯示為訪客
    : isOwner && currentUserId === prayer.user_id && tempDisplayName
      ? tempDisplayName // 用戶自己的貼文且有臨時名稱時使用臨時名稱
      : prayer.user_name || '用戶';

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex-shrink-0 min-w-fit">
        <UserInfo
          isAnonymous={shouldShowAnonymous}
          userName={displayName}
          userAvatarUrl={prayer.user_avatar_48 || prayer.user_avatar || ''}
          userId={prayer.user_id || ''}
          createdAt={prayer.created_at}
        />
      </div>
      <div className="flex items-center ml-auto flex-shrink-0">
        <div style={{ transform: 'translateY(-2px)' }}>
          <LikeButton prayerId={prayer.id} currentUserId={currentUserId} />
        </div>
        <div className="relative right-[4px]">
          <PostActionButtons
            postId={prayer.id}
            prayerUserId={prayer.user_id || ''}
            prayerContent={prayer.content || ''}
            prayerUserName={displayName}
            prayerUserAvatar={prayer.user_avatar || ''}
            isOwner={isOwner}
            onShare={onShare}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
}; 