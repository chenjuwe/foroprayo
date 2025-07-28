import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prayerAnsweredService } from '@/services/prayer/PrayerAnsweredService';
import { QUERY_KEYS } from '@/constants';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';

/**
 * 切換代禱「神已應允」狀態的 Hook
 */
export const useTogglePrayerAnswered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prayerId: string) => {
      log.debug('切換代禱「神已應允」狀態', { prayerId }, 'useTogglePrayerAnswered');
      return await prayerAnsweredService.togglePrayerAnswered(prayerId);
    },
    onSuccess: (isAnswered, prayerId) => {
      log.info('代禱「神已應允」狀態切換成功', { prayerId, isAnswered }, 'useTogglePrayerAnswered');
      
      // 使相關查詢失效，觸發重新獲取
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRAYERS
      });
    },
    onError: (error, prayerId) => {
      log.error('代禱「神已應允」狀態切換失敗', error, 'useTogglePrayerAnswered');
      notify.apiError(error, '切換「神已應允」狀態失敗');
    }
  });
};

/**
 * 切換回應「神已應允」狀態的 Hook
 */
export const useToggleResponseAnswered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ responseId, prayerId }: { responseId: string; prayerId: string }) => {
      log.debug('切換回應「神已應允」狀態', { responseId, prayerId }, 'useToggleResponseAnswered');
      return await prayerAnsweredService.toggleResponseAnswered(responseId);
    },
    onSuccess: (isAnswered, { prayerId }) => {
      log.info('回應「神已應允」狀態切換成功', { prayerId, isAnswered }, 'useToggleResponseAnswered');
      
      // 使相關查詢失效，觸發重新獲取
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRAYER_RESPONSES(prayerId)
      });
    },
    onError: (error, { responseId, prayerId }) => {
      log.error('回應「神已應允」狀態切換失敗', error, 'useToggleResponseAnswered');
      notify.apiError(error, '切換「神已應允」狀態失敗');
    }
  });
};

/**
 * 標記代禱為「神已應允」的 Hook
 */
export const useMarkPrayerAsAnswered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prayerId: string) => {
      log.debug('標記代禱為「神已應允」', { prayerId }, 'useMarkPrayerAsAnswered');
      return await prayerAnsweredService.markPrayerAsAnswered(prayerId);
    },
    onSuccess: (_, prayerId) => {
      log.info('代禱標記為「神已應允」成功', { prayerId }, 'useMarkPrayerAsAnswered');
      
      // 使相關查詢失效，觸發重新獲取
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRAYERS
      });
    },
    onError: (error, prayerId) => {
      log.error('代禱標記為「神已應允」失敗', error, 'useMarkPrayerAsAnswered');
      notify.apiError(error, '標記「神已應允」失敗');
    }
  });
};

/**
 * 標記回應為「神已應允」的 Hook
 */
export const useMarkResponseAsAnswered = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ responseId, prayerId }: { responseId: string; prayerId: string }) => {
      log.debug('標記回應為「神已應允」', { responseId, prayerId }, 'useMarkResponseAsAnswered');
      return await prayerAnsweredService.markResponseAsAnswered(responseId);
    },
    onSuccess: (_, { prayerId }) => {
      log.info('回應標記為「神已應允」成功', { prayerId }, 'useMarkResponseAsAnswered');
      
      // 使相關查詢失效，觸發重新獲取
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PRAYER_RESPONSES(prayerId)
      });
    },
    onError: (error, { responseId, prayerId }) => {
      log.error('回應標記為「神已應允」失敗', error, 'useMarkResponseAsAnswered');
      notify.apiError(error, '標記「神已應允」失敗');
    }
  });
}; 