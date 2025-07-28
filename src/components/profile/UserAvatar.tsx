import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarService } from '@/services/background/AvatarService';
// import { supabase } from '@/integrations/supabase/client';

// const avatarService = new AvatarService(supabase);

// 根據 userId 獲取頭像 URL - 暫時停用
const fetchAvatarUrl = async (userId: string | null) => {
  if (!userId) return null;
  // 暫時停用 Supabase 頭像功能
  return null;
};

interface UserAvatarProps {
  userId: string | null;
  username?: string | null;
  className?: string;
}

export function UserAvatar({ userId, username, className }: UserAvatarProps) {
  const { data: avatarUrl, isLoading } = useQuery({
    queryKey: ['avatarUrl', userId],
    queryFn: () => fetchAvatarUrl(userId),
    enabled: !!userId,
  });

  return (
    <Avatar className={`h-[30px] w-[30px] ${className}`}>
      {!isLoading && avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={username || 'User Avatar'} />
      ) : null}
      <AvatarFallback 
        style={{ 
          backgroundColor: '#95d2f4', 
          color: '#000000',
          fontSize: '12px'
        }}
      >
        {isLoading ? '...' : 'G'}
      </AvatarFallback>
    </Avatar>
  );
} 