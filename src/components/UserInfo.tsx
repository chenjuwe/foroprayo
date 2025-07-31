import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { log } from '@/lib/logger';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { GuestAvatar } from './ui/guest-avatar'; // 修正 GuestAvatar 的導入路徑
import { formatDistanceToNow, format, differenceInHours, differenceInSeconds } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface UserInfoProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  isAnonymous?: boolean;
  createdAt?: string;
  onAvatarClick?: (user: { userId: string; displayName: string }) => void;
  onNameClick?: (user: { userId: string; displayName: string }) => void;
}

function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = differenceInSeconds(now, date);
    const diffHours = differenceInHours(now, date);

    if (diffSeconds < 60) return `${diffSeconds} 秒前`;
    if (diffHours < 24) return formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
    return format(date, 'yyyy-MM-dd HH:mm', { locale: zhTW });
  } catch (e) {
    return dateString;
  }
}

const UserInfo: React.FC<UserInfoProps> = ({ 
  userId, 
  userName, 
  userEmail, 
  userAvatarUrl, 
  isAnonymous, 
  createdAt, 
  onAvatarClick, 
  onNameClick 
}) => {
  const navigate = useNavigate();
  
  // 不再使用 useUserDisplayName hook
  // const displayName = useUserDisplayName({ name: userName }, isAnonymous, userId);
  
  // 直接使用傳入的用戶名
  const displayName = isAnonymous ? '訪客' : userName || '用戶';
  
  // 使用 useFirebaseAvatar hook 獲取頭像
  const { avatarUrl } = useFirebaseAvatar(userId);

  const [finalAvatarUrl, setFinalAvatarUrl] = useState(avatarUrl || userAvatarUrl);
  
  // 當 useFirebaseAvatar 的 avatarUrl 更新時，同步到 finalAvatarUrl
  useEffect(() => {
    if (avatarUrl) {
      setFinalAvatarUrl(avatarUrl);
    }
  }, [avatarUrl]);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAvatarClick && userId) {
      onAvatarClick({ userId, displayName });
    } else if (userId) {
      navigate(`/profile/${userId}`);
    }
  };
  
  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNameClick && userId) {
      onNameClick({ userId, displayName });
    } else if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const getAvatarSize = (): "sm" | "md" | "lg" => {
    return 'md';
  };

  const handleAvatarError = () => {
    // 可以在這裡處理頭像加載失敗的邏輯，例如顯示備用頭像
  };

  return (
    <div data-testid="user-info" className="flex items-center gap-3" data-user-id={userId || ''}>
      <div className="flex-shrink-0">
        {isAnonymous ? (
          <GuestAvatar size={getAvatarSize()} />
        ) : (
          <Avatar 
            data-testid="user-avatar"
            className={`${getAvatarSize()} cursor-pointer transition-transform hover:scale-105`}
            onClick={handleAvatarClick}
          >
            <AvatarImage
              src={finalAvatarUrl}
              alt={displayName || '用戶頭像'}
              onError={handleAvatarError}
              className="object-cover"
            />
            <AvatarFallback>{displayName ? displayName.charAt(0) : 'U'}</AvatarFallback>
          </Avatar>
        )}
      </div>
      
      <div className="flex flex-col items-start">
        <span 
          data-testid="user-name"
          className="font-semibold text-sm cursor-pointer hover:underline"
          onClick={handleNameClick}
        >
          {displayName || '用戶'}
        </span>
        <span className="text-xs text-gray-500">{formatTimeAgo(createdAt)}</span>
      </div>
    </div>
  );
};

export default UserInfo; 