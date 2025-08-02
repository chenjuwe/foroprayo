import React, { useState } from 'react';
import { PrayerResponse } from './PrayerResponse';
import type { PrayerResponse as PrayerResponseType } from '@/services/prayerService';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';

interface PrayerResponseListProps {
  responses: PrayerResponseType[];
  currentUserId?: string | null;
  isSuperAdmin?: boolean;
  onShare?: () => void;
  onEditResponse?: (responseId: string) => void;
  onDeleteResponse?: (responseId: string) => void;
  prayerId?: string;
}

export const PrayerResponseList: React.FC<PrayerResponseListProps> = ({
  responses: initialResponses,
  currentUserId = null, // Default to null to match PrayerResponse's expected type
  isSuperAdmin = false,
  onShare,
  onEditResponse,
  onDeleteResponse,
  prayerId
}) => {
  // 使用本地狀態來追蹤回應，以便在刪除時立即更新 UI
  const [responses, setResponses] = useState<PrayerResponseType[]>(initialResponses);
  
  // 安全地獲取 queryClient
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    // 在測試環境中可能無法訪問 QueryClientProvider
    queryClient = null;
  }
  
  // 處理刪除回應
  const handleDeleteResponse = (responseId: string) => {
    // 更新本地狀態，移除被刪除的回應
    setResponses(prevResponses => prevResponses.filter(response => response.id !== responseId));
    
    // 如果提供了刪除回調，則調用它
    if (onDeleteResponse) {
      onDeleteResponse(responseId);
    }
    
    // 如果 queryClient 和 prayerId 存在，則使其失效
    if (queryClient && prayerId) {
      try {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.PRAYER_RESPONSES, prayerId]
        });
      } catch (error) {
        console.error('Failed to invalidate queries:', error);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4 my-4">
      {responses.map((response, index) => (
        <PrayerResponse 
          key={response.id} 
          response={response}
          currentUserId={currentUserId}
          isSuperAdmin={isSuperAdmin}
          onShare={onShare}
          onEdit={onEditResponse}
          onDelete={handleDeleteResponse}
          isFirst={index === 0}
        />
      ))}
      {responses.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          目前還沒有回應。添加第一個回應吧！
        </div>
      )}
    </div>
  );
};
