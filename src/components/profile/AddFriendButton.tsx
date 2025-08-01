import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import FriendIcon from '@/assets/icons/FriendIcon.svg?react';
import { cn } from '@/lib/utils';
import { MessageDialog } from './MessageDialog';
import { log } from '@/lib/logger';

interface AddFriendButtonProps {
  userId: string;
  className?: string;
  disabled?: boolean;
}

export function AddFriendButton({ userId, className, disabled }: AddFriendButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFriend = () => {
    // 暫時禁用社交功能
    log.info('社交功能暫時不可用', {}, 'AddFriendButton');
  };

  return (
    <Button
      onClick={handleAddFriend}
      className={cn(
        `flex items-center gap-2 border-black border bg-transparent rounded-full`,
        className
      )}
      style={{ height: '30px', fontSize: '14px' }}
      disabled={disabled || isLoading}
      variant="outline"
    >
      <span className="text-xl font-bold" style={{ fontSize: '14px', width: '14px', height: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>＋</span>
      <span>{isLoading ? '處理中...' : '加好友'}</span>
    </Button>
  );
} 

// 新增：加好友或傳送訊息按鈕
export function AddFriendButtonWithMessage({ userId, className, disabled }: AddFriendButtonProps) {
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [targetUserName, setTargetUserName] = useState('');

  // 獲取目標用戶名稱
  React.useEffect(() => {
    const fetchTargetUserName = async () => {
      try {
        // 暫時使用默認名稱
        setTargetUserName('用戶');
      } catch (error) {
        console.error('獲取用戶名稱失敗:', error);
        setTargetUserName('用戶');
      }
    };

    if (userId) {
      fetchTargetUserName();
    }
  }, [userId]);

  const handleSendMessage = () => {
    setIsMessageDialogOpen(true);
  };

  // 暫時只顯示加好友按鈕
  return <AddFriendButton userId={userId} className={className ?? ''} disabled={!!disabled} />;
} 