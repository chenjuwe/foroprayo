import React, { useState } from 'react';
import { format, formatDistanceToNow, differenceInHours, differenceInSeconds } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { log } from '@/lib/logger';

// 定義用戶資料類型
interface UserProfile {
  username?: string;
  display_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

// 定義頭像類型
interface UserAvatar {
  avatar_url_30?: string;
  avatar_url_48?: string;
  avatar_url_96?: string;
  [key: string]: unknown;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string | null;
  created_at: string;
  sender_name?: string;
  sender_name_at_time?: string;
  sender_avatar?: string;
  original_sender_profile?: UserProfile;
  original_sender_avatar?: UserAvatar;
}

interface FriendRequestCardProps {
  request: FriendRequest;
}

export function FriendRequestCard({ request }: FriendRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  // const respondToFriendRequest = useRespondToFriendRequest(); // This line is removed as per the edit hint

  // 記錄請求資訊，以便調試
  React.useEffect(() => {
    log.debug('好友請求卡片渲染', {
      requestId: request.id,
      senderId: request.sender_id,
      currentUsername: request.original_sender_profile?.username,
      senderAvatar: request.sender_avatar,
      hasOriginalProfile: !!request.original_sender_profile,
      hasOriginalAvatar: !!request.original_sender_avatar,
    }, 'FriendRequestCard');
    
    // 在控制台也輸出，便於直接查看
    console.log('好友請求詳細信息:', {
      id: request.id,
      currentUsername: request.original_sender_profile?.username,
      original_profile: request.original_sender_profile,
    });
  }, [request]);

  const handleAccept = () => {
    setIsProcessing(true);
    // respondToFriendRequest.mutate({ // This line is removed as per the edit hint
    //   requestId: request.id,
    //   status: 'accepted'
    // }, {
    //   onSettled: () => setIsProcessing(false)
    // });
    setIsProcessing(false); // Temporarily disable social features
  };

  const handleReject = () => {
    setIsProcessing(true);
    // respondToFriendRequest.mutate({ // This line is removed as per the edit hint
    //   requestId: request.id,
    //   status: 'rejected'
    // }, {
    //   onSettled: () => setIsProcessing(false)
    // });
    setIsProcessing(false); // Temporarily disable social features
  };

  // 格式化時間（統一規則）
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const hoursDifference = differenceInHours(now, date);
      const secondsDifference = differenceInSeconds(now, date);

      if (secondsDifference < 60) {
        return secondsDifference < 5 ? '剛剛' : `${secondsDifference} 秒前`;
      }
      if (hoursDifference < 24) {
        const relativeTime = formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
        return relativeTime.replace('大約 ', '');
      } else {
        return format(date, "yyyy-MM-dd  HH:mm", { locale: zhTW });
      }
    } catch (error) {
      log.error('日期格式化錯誤', { dateString, error }, 'FriendRequestCard');
      return '未知時間';
    }
  };

  // 獲取最佳可用的頭像URL
  const getBestAvatarUrl = (): string | undefined => {
    // 首先，嘗試使用傳入的頭像URL
    if (request.sender_avatar && request.sender_avatar.trim() !== '') {
      return request.sender_avatar;
    }

    // 如果提供了原始發送者的avatar對象，嘗試從中獲取頭像
    if (request.original_sender_avatar) {
      const avatar = request.original_sender_avatar;
      if (avatar.avatar_url_30) return avatar.avatar_url_30;
      if (avatar.avatar_url_48) return avatar.avatar_url_48;
      if (avatar.avatar_url_96) return avatar.avatar_url_96;
    }

    // 如果提供了原始發送者的profile對象，嘗試從中獲取頭像
    if (request.original_sender_profile && request.original_sender_profile.avatar_url) {
      return request.original_sender_profile.avatar_url;
    }

    // 都沒有則返回undefined
    return undefined;
  };

  // 確保 avatar URL 是有效的
  const avatarUrl = getBestAvatarUrl();

  // 確保顯示名稱是有效的 - 強制始終使用最新的用戶名稱 (直接從 original_sender_profile 獲取)
  const displayName = request.original_sender_profile?.username || '未知用戶';

  // 用於頭像縮寫的顯示
  const nameInitial = displayName?.[0]?.toUpperCase() || '?';

  // 禁用按鈕的條件
  const isButtonDisabled = isProcessing; // Temporarily disable social features

  return (
    <div className="bg-white p-4 shadow mb-[4px] transition-all hover:shadow-md" style={{ borderRadius: 0 }}>
      <div className="flex items-center justify-between">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{nameInitial}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left" style={{ marginLeft: '16px' }}>
          <div className="font-medium" style={{ fontSize: '14px' }}>{displayName}</div>
          <div className="text-xs text-gray-500">
            {formatDate(request.created_at)}
          </div>
        </div>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReject}
            disabled={isButtonDisabled}
            style={{ height: '30px', borderRadius: 0, background: 'transparent', color: '#e11d48', borderColor: '#e11d48', borderWidth: '1px' }}
          >
            {isButtonDisabled ? '處理中...' : '拒絕'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAccept}
            disabled={isButtonDisabled}
            style={{ height: '30px', borderRadius: 0, background: 'transparent', color: '#16a34a', borderColor: '#16a34a', borderWidth: '1px' }}
          >
            {isButtonDisabled ? '處理中...' : '接受'}
          </Button>
        </div>
      </div>
    </div>
  );
} 