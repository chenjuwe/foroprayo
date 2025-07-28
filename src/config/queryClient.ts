import { QueryClient, MutationCache } from "@tanstack/react-query";
import { QUERY_CONFIG, CACHE_CONFIG } from "@/constants";
import { isAuthError } from "@/types/common";
import { log } from "@/lib/logger";
import { toast } from "sonner";

// 建立針對特定資源類型的查詢配置
const getResourceStaleTime = (queryKey: readonly unknown[]): number => {
  if (!queryKey?.length) return QUERY_CONFIG.STALE_TIME;

  const key = queryKey[0];
  
  // 根據資源類型選擇適當的緩存時間
  if (key === 'prayers') {
    return CACHE_CONFIG.RESOURCES.PRAYERS.STALE_TIME;
  }
  
  if (key === 'prayer-responses') {
    return CACHE_CONFIG.RESOURCES.PRAYER_RESPONSES.STALE_TIME;
  }
  
  if (key === 'user-profile') {
    return CACHE_CONFIG.RESOURCES.USER_PROFILE.STALE_TIME;
  }
  
  if (key === 'social-features') {
    return CACHE_CONFIG.RESOURCES.SOCIAL_FEATURES.STALE_TIME;
  }
  
  // 默認緩存時間
  return QUERY_CONFIG.STALE_TIME;
};

// 建立針對特定資源類型的垃圾回收配置
const getResourceGCTime = (queryKey: readonly unknown[]): number => {
  if (!queryKey?.length) return QUERY_CONFIG.GC_TIME;

  const key = queryKey[0];
  
  // 根據資源類型選擇適當的垃圾回收時間
  if (key === 'prayers') {
    return CACHE_CONFIG.RESOURCES.PRAYERS.GC_TIME;
  }
  
  if (key === 'prayer-responses') {
    return CACHE_CONFIG.RESOURCES.PRAYER_RESPONSES.GC_TIME;
  }
  
  if (key === 'user-profile') {
    return CACHE_CONFIG.RESOURCES.USER_PROFILE.GC_TIME;
  }
  
  if (key === 'social-features') {
    return CACHE_CONFIG.RESOURCES.SOCIAL_FEATURES.GC_TIME;
  }
  
  // 默認垃圾回收時間
  return QUERY_CONFIG.GC_TIME;
};

export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_CONFIG.STALE_TIME,
      gcTime: QUERY_CONFIG.GC_TIME,
      retry: (failureCount, error: unknown) => {
        // 認證錯誤不重試
        if (isAuthError(error)) {
          return false;
        }
        return failureCount < QUERY_CONFIG.RETRY_COUNT;
      },
      retryDelay: QUERY_CONFIG.RETRY_DELAY,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        // 認證錯誤不重試
        if (isAuthError(error)) {
          return false;
        }
        return failureCount < 1; // 變異操作只重試一次
      },
    },
  },
  // 添加全局錯誤處理
  mutationCache: new MutationCache({
    onError: (error: unknown, _variables, _context, mutation) => {
      // 只處理頭像相關的錯誤
      if (mutation.options.mutationKey?.[0] === 'avatar') {
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        log.error('頭像操作失敗', error, 'AvatarMutation');
        toast.error('頭像操作失敗', {
          description: errorMessage || '請稍後再試',
          duration: 3000,
        });
      }
    }
  }),
});

export const queryClient = createQueryClient(); 