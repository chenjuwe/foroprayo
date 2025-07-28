import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prayerService, Prayer, CreatePrayerRequest } from '@/services/prayerService';
import { firebasePrayerService } from '@/services';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';
import {
  QUERY_KEYS,
  QUERY_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CACHE_CONFIG
} from '@/constants';

// 獲取所有代禱的 Hook (Firebase 版本)
export const usePrayers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.PRAYERS,
    queryFn: async () => {
      log.debug('開始獲取代禱列表 (Firebase)', null, 'usePrayers');

      try {
        // 使用 Firebase 服務獲取代禱列表
        const prayers = await firebasePrayerService.getInstance().getAllPrayers();
        log.info('成功載入代禱列表 (Firebase)', { count: prayers.length }, 'usePrayers');
        return prayers;
      } catch (error) {
        log.error('Firebase 查詢代禱列表失敗', error, 'usePrayers');
        throw error;
      }
    },
    staleTime: CACHE_CONFIG.RESOURCES.PRAYERS.STALE_TIME,
    gcTime: CACHE_CONFIG.RESOURCES.PRAYERS.GC_TIME,
    retry: 2,
    retryDelay: 1000,
  });
};

// 根據用戶ID獲取代禱的 Hook (Firebase 版本)
export const usePrayersByUserId = (userId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER_PROFILE(userId),
    queryFn: async () => {
      try {
        // 使用 Firebase 服務獲取用戶代禱
        return await firebasePrayerService.getInstance().getPrayersByUserId(userId);
      } catch (error) {
        log.error('Failed to fetch prayers by user ID (Firebase)', error, 'usePrayersByUserId');
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: CACHE_CONFIG.RESOURCES.USER_PROFILE.STALE_TIME,
    gcTime: CACHE_CONFIG.RESOURCES.USER_PROFILE.GC_TIME,
  });
};

// 創建代禱的 Hook (Firebase 版本)
export const useCreatePrayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prayer: CreatePrayerRequest) => {
      try {
        log.debug('Creating prayer (Firebase)', { isAnonymous: prayer.is_anonymous }, 'useCreatePrayer');
        // 使用 Firebase 服務創建代禱
        const result = await firebasePrayerService.getInstance().createPrayer(prayer);
        if (!result) throw new Error('建立代禱失敗');
        return result;
      } catch (error) {
        log.error('Failed to create prayer (Firebase)', error, 'useCreatePrayer');
        throw error;
      }
    },
    onSuccess: (newPrayer: Prayer) => {
      // 立即更新緩存
      queryClient.setQueryData<Prayer[]>(QUERY_KEYS.PRAYERS, (oldData) => {
        if (!oldData) return [newPrayer];
        return [newPrayer, ...oldData];
      });

      // 如果是用戶的代禱，也更新用戶代禱緩存
      if (newPrayer.user_id) {
        queryClient.setQueryData<Prayer[]>(
          QUERY_KEYS.USER_PROFILE(newPrayer.user_id),
          (oldData) => {
            if (!oldData) return [newPrayer];
            return [newPrayer, ...oldData];
          }
        );
      }
      // 不顯示成功通知
      log.info('Prayer created successfully (Firebase)', { id: newPrayer.id }, 'useCreatePrayer');
    },
    onError: (error: unknown) => {
      const errorMessage = (error instanceof Error ? error.message : null) || ERROR_MESSAGES.PRAYER_CREATE_ERROR;
      notify.error('代禱發布失敗：' + errorMessage, error);
      log.error('Failed to create prayer (Firebase)', error, 'useCreatePrayer');
    },
  });
};

// 更新代禱的 Hook (Firebase 版本)
export const useUpdatePrayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      try {
        log.debug('Updating prayer (Firebase)', { id, contentLength: content.length }, 'useUpdatePrayer');
        // 使用 Firebase 服務更新代禱
        const result = await firebasePrayerService.getInstance().updatePrayer(id, content);
        if (!result) throw new Error('更新代禱失敗');
        return result;
      } catch (error) {
        log.error('Failed to update prayer (Firebase)', error, 'useUpdatePrayer');
        throw error;
      }
    },
    onSuccess: (updatedPrayer: Prayer) => {
      // 更新所有相關緩存
      queryClient.setQueryData<Prayer[]>(QUERY_KEYS.PRAYERS, (oldData) => {
        if (!oldData) return [updatedPrayer];
        return oldData.map(prayer =>
          prayer.id === updatedPrayer.id ? updatedPrayer : prayer
        );
      });

      if (updatedPrayer.user_id) {
        queryClient.setQueryData<Prayer[]>(
          QUERY_KEYS.USER_PROFILE(updatedPrayer.user_id),
          (oldData) => {
            if (!oldData) return [updatedPrayer];
            return oldData.map(prayer =>
              prayer.id === updatedPrayer.id ? updatedPrayer : prayer
            );
          }
        );
      }

      notify.success(SUCCESS_MESSAGES.PRAYER_UPDATED);
      log.info('Prayer updated successfully (Firebase)', { id: updatedPrayer.id }, 'useUpdatePrayer');
    },
    onError: (error: unknown) => {
      const errorMessage = (error instanceof Error ? error.message : null) || ERROR_MESSAGES.PRAYER_UPDATE_ERROR;
      notify.error(errorMessage, error);
      log.error('Failed to update prayer (Firebase)', error, 'useUpdatePrayer');
    },
  });
};

// 刪除代禱的 Hook (Firebase 版本)
export const useDeletePrayer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        log.debug('Deleting prayer (Firebase)', { id }, 'useDeletePrayer');
        // 使用 Firebase 服務刪除代禱
        await firebasePrayerService.getInstance().deletePrayer(id);
        return id;
      } catch (error) {
        log.error('Failed to delete prayer (Firebase)', error, 'useDeletePrayer');
        throw error;
      }
    },
    onSuccess: (deletedId: string) => {
      // 從所有相關緩存中移除
      queryClient.setQueryData<Prayer[]>(QUERY_KEYS.PRAYERS, (oldData) => {
        if (!oldData) return [];
        return oldData.filter(prayer => prayer.id !== deletedId);
      });

      // 同時從所有用戶緩存中移除
      queryClient.invalidateQueries({
        queryKey: ['user-profile'],
        type: 'all'
      });

      notify.success(SUCCESS_MESSAGES.PRAYER_DELETED);
      log.info('Prayer deleted successfully (Firebase)', { id: deletedId }, 'useDeletePrayer');
    },
    onError: (error: unknown) => {
      const errorMessage = (error instanceof Error ? error.message : null) || ERROR_MESSAGES.PRAYER_DELETE_ERROR;
      notify.error(errorMessage, error);
      log.error('Failed to delete prayer (Firebase)', error, 'useDeletePrayer');
    },
  });
};

// 組合 Hook：提供完整的代禱管理功能 (Firebase 版本)
export const usePrayerManagement = () => {
  const prayers = usePrayers();
  const createPrayer = useCreatePrayer();
  const updatePrayer = useUpdatePrayer();
  const deletePrayer = useDeletePrayer();

  return {
    // 查詢
    prayers: prayers.data || [],
    isLoading: prayers.isLoading,
    isError: prayers.isError,
    error: prayers.error,
    refetch: prayers.refetch,

    // 操作
    createPrayer: createPrayer.mutate,
    updatePrayer: updatePrayer.mutate,
    deletePrayer: deletePrayer.mutate,

    // 操作狀態
    isCreating: createPrayer.isPending,
    isUpdating: updatePrayer.isPending,
    isDeleting: deletePrayer.isPending,

    // 任何操作是否正在進行
    isMutating: createPrayer.isPending || updatePrayer.isPending || deletePrayer.isPending,
  };
};