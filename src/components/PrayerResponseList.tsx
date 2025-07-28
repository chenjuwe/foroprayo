import React, { useState, useCallback } from 'react';
import { PrayerResponse } from './PrayerResponse';
import type { PrayerResponse as PrayerResponseType } from '@/services/prayerService';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';

interface PrayerResponseListProps {
  responses: PrayerResponseType[];
  currentUserId: string | null;
  isSuperAdmin?: boolean;
  onShare?: () => void;
  onEditResponse?: (responseId: string) => void;
  onDeleteResponse?: (responseId: string) => void;
  prayerId?: string; // 添加 prayerId 參數
}

export const PrayerResponseList: React.FC<PrayerResponseListProps> = ({
  responses: initialResponses,
  currentUserId,
  isSuperAdmin = false,
  onShare,
  onEditResponse,
  onDeleteResponse,
  prayerId
}) => {
  // 使用本地狀態來追蹤回應，以便在刪除時立即更新 UI
  const [responses, setResponses] = useState<PrayerResponseType[]>(initialResponses);
  const queryClient = useQueryClient();

  // 當 initialResponses 改變時更新本地狀態
  React.useEffect(() => {
    setResponses(initialResponses);
  }, [initialResponses]);

  // 處理刪除回應
  const handleDeleteResponse = useCallback((responseId: string) => {
    // 從本地狀態中移除回應（樂觀更新）
    setResponses(prev => prev.filter(response => response.id !== responseId));
    
    // 如果有 prayerId，使相關查詢失效
    if (prayerId) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRAYER_RESPONSES(prayerId)
      });
    }
    
    // 調用原始的 onDeleteResponse 函數（如果有的話）
    if (onDeleteResponse) {
      onDeleteResponse(responseId);
    }
  }, [onDeleteResponse, prayerId, queryClient]);

  // 處理編輯回應
  const handleEditResponse = useCallback((responseId: string) => {
    if (onEditResponse) {
      onEditResponse(responseId);
    }
  }, [onEditResponse]);

  // 處理分享
  const handleShare = useCallback(() => {
    if (onShare) {
      onShare();
    }
  }, [onShare]);

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="m-0 p-0">
      {responses.map((response, index) => (
        <PrayerResponse
          key={response.id}
          response={response}
          currentUserId={currentUserId}
          isSuperAdmin={isSuperAdmin}
          onShare={handleShare}
          onEdit={handleEditResponse}
          onDelete={handleDeleteResponse}
          isFirst={index === 0}
        />
      ))}
    </div>
  );
};
