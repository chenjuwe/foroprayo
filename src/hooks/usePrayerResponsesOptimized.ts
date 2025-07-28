import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firebasePrayerResponseService } from '@/services';
import type { PrayerResponse, CreateResponseRequest } from '@/types/prayer';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';
import { isAuthError } from '@/types/common';
import { 
  QUERY_KEYS, 
  QUERY_CONFIG, 
  CACHE_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} from '@/constants';

// 獲取代禱回應的 Hook
export const usePrayerResponses = (prayerId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.PRAYER_RESPONSES(prayerId),
    queryFn: async () => {
      try {
        if (!prayerId) return [];
        
        // 只使用 Firebase 服務
        return await firebasePrayerResponseService.getInstance().getPrayerResponses(prayerId);
      } catch (error) {
        log.error('Failed to fetch prayer responses', error, 'usePrayerResponses');
        throw error;
      }
    },
    enabled: !!prayerId,
    staleTime: CACHE_CONFIG.RESOURCES.PRAYER_RESPONSES.STALE_TIME,
    gcTime: CACHE_CONFIG.RESOURCES.PRAYER_RESPONSES.GC_TIME,
    retry: (failureCount, error: unknown) => {
      // 認證錯誤不重試
      if (isAuthError(error)) {
        return false;
      }
      return failureCount < QUERY_CONFIG.RETRY_COUNT;
    },
    retryDelay: QUERY_CONFIG.RETRY_DELAY,
  });
};

// 創建代禱回應的 Hook
export const useCreatePrayerResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (response: CreateResponseRequest) => {
      try {
        log.debug('Creating prayer response', { 
          prayerId: response.prayer_id, 
          isAnonymous: response.is_anonymous,
          hasImage: !!response.image_url // 記錄是否包含圖片
        }, 'useCreatePrayerResponse');
        
        // 只使用 Firebase 服務
        return await firebasePrayerResponseService.getInstance().createResponse(response);
      } catch (error) {
        log.error('Failed to create prayer response', error, 'useCreatePrayerResponse');
        throw error;
      }
    },
    onSuccess: (newResponse: PrayerResponse) => {
      // 立即更新對應代禱的回應緩存
      queryClient.setQueryData<PrayerResponse[]>(
        QUERY_KEYS.PRAYER_RESPONSES(newResponse.prayer_id), 
        (oldData) => {
          if (!oldData) return [newResponse];
          return [...oldData, newResponse];
        }
      );
      
      // 廢棄相關查詢，以觸發數據重新獲取
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRAYERS });
      
      // 不顯示成功通知
      log.info('Prayer response created successfully', { id: newResponse.id, prayerId: newResponse.prayer_id }, 'useCreatePrayerResponse');
    },
    onError: (error: unknown) => {
      let errorMessage = '';
      
      if (error instanceof Error) {
        // 檢查並提供更友好的錯誤消息
        if (error.message.includes('Missing or insufficient permissions')) {
          errorMessage = '權限不足，請確認您已登入並有權限發布回應';
        } else if (error.message.includes('image_url')) {
          errorMessage = '圖片上傳失敗，請稍後再試';
        } else {
          // 其他錯誤
          errorMessage = error.message || ERROR_MESSAGES.RESPONSE_CREATE_ERROR;
        }
      } else {
        errorMessage = ERROR_MESSAGES.RESPONSE_CREATE_ERROR;
      }
      
      notify.error('回應發布失敗：' + errorMessage, error);
      log.error('Failed to create prayer response', error, 'useCreatePrayerResponse');
    },
  });
};

// 更新代禱回應的 Hook
export const useUpdatePrayerResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      try {
        log.debug('Updating prayer response', { 
          id, 
          contentLength: content.length 
        }, 'useUpdatePrayerResponse');
        
        // 目前 Firebase 版本沒有實現更新功能，可以擴展
        throw new Error('Firebase 版本暫不支持更新回應');
      } catch (error) {
        log.error('Failed to update prayer response', error, 'useUpdatePrayerResponse');
        throw error;
      }
    },
    onSuccess: (updatedResponse: PrayerResponse) => {
      // 更新對應代禱的回應緩存
      queryClient.setQueryData<PrayerResponse[]>(
        QUERY_KEYS.PRAYER_RESPONSES(updatedResponse.prayer_id),
        (oldData) => {
          if (!oldData) return [updatedResponse];
          return oldData.map(response => 
            response.id === updatedResponse.id ? updatedResponse : response
          );
        }
      );

      notify.success(SUCCESS_MESSAGES.RESPONSE_UPDATED);
      log.info('Prayer response updated successfully', { 
        id: updatedResponse.id 
      }, 'useUpdatePrayerResponse');
    },
    onError: (error: unknown) => {
      const errorMessage = (error instanceof Error ? error.message : null) || ERROR_MESSAGES.RESPONSE_UPDATE_ERROR;
      notify.error(errorMessage, error);
      log.error('Failed to update prayer response', error, 'useUpdatePrayerResponse');
    },
  });
};

// 刪除代禱回應的 Hook
export const useDeletePrayerResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, prayerId }: { id: string; prayerId: string }) => {
      try {
        log.debug('Deleting prayer response', { id, prayerId }, 'useDeletePrayerResponse');
        
        // 只使用 Firebase 服務
        await firebasePrayerResponseService.getInstance().deleteResponse(id);
        return { id, prayerId };
      } catch (error) {
        log.error('Failed to delete prayer response', error, 'useDeletePrayerResponse');
        throw error;
      }
    },
    onSuccess: ({ id, prayerId }) => {
      // 從對應代禱的回應緩存中移除
      queryClient.setQueryData<PrayerResponse[]>(
        QUERY_KEYS.PRAYER_RESPONSES(prayerId),
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter(response => response.id !== id);
        }
      );

      notify.success(SUCCESS_MESSAGES.RESPONSE_DELETED);
      log.info('Prayer response deleted successfully', { id, prayerId }, 'useDeletePrayerResponse');
    },
    onError: (error: unknown) => {
      const errorMessage = (error instanceof Error ? error.message : null) || ERROR_MESSAGES.RESPONSE_DELETE_ERROR;
      notify.error(errorMessage, error);
      log.error('Failed to delete prayer response', error, 'useDeletePrayerResponse');
    },
  });
};

// 組合 Hook：提供完整的代禱回應管理功能
export const usePrayerResponseManagement = (prayerId: string) => {
  const responses = usePrayerResponses(prayerId);
  const createResponse = useCreatePrayerResponse();
  const updateResponse = useUpdatePrayerResponse();
  const deleteResponse = useDeletePrayerResponse();

  return {
    // 查詢
    responses: responses.data || [],
    isLoading: responses.isLoading,
    isError: responses.isError,
    error: responses.error,
    refetch: responses.refetch,
    
    // 操作
    createResponse: createResponse.mutate,
    updateResponse: updateResponse.mutate,
    deleteResponse: deleteResponse.mutate,
    
    // 操作狀態
    isCreating: createResponse.isPending,
    isUpdating: updateResponse.isPending,
    isDeleting: deleteResponse.isPending,
    
    // 任何操作是否正在進行
    isMutating: createResponse.isPending || updateResponse.isPending || deleteResponse.isPending,
  };
}; 