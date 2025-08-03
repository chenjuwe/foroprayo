import { QueryClient } from "@tanstack/react-query";
// import { createClient } from '@supabase/supabase-js';
import { CACHE_CONFIG, QUERY_KEYS } from "@/constants";
import { log } from "@/lib/logger";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { Prayer } from "@/services/prayerService";
import { firebasePrayerService, firebasePrayerResponseService } from '@/services';

class CacheService {
  private queryClient: QueryClient | null = null;
  private persister: ReturnType<typeof createSyncStoragePersister> | null = null;
  private isInitialized = false;

  initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;

    // 創建持久化存儲器
    this.persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: 'foroprayo-cache',
      throttleTime: 1000, // 限流，避免過多寫操作
      serialize: (data: unknown) => JSON.stringify(data),
      deserialize: (data: string) => JSON.parse(data),
    });

    this.isInitialized = true;
    log.info('緩存服務已初始化', null, 'CacheService');
  }

  // 獲取持久化提供者包裝器
  getPersistQueryClientProviderProps() {
    if (!this.isInitialized || !this.persister) {
      throw new Error('緩存服務未初始化');
    }

    return {
      client: this.queryClient!,
      persistOptions: {
        persister: this.persister,
        maxAge: CACHE_CONFIG.INDEXED_DB_TTL, // 持久化緩存最大壽命
        dehydrateOptions: {
          shouldDehydrateQuery: (query: { queryKey: unknown[] }) => {
            // 只持久化特定的查詢，避免存儲敏感或不需要持久化的數據
            const queryKey = query.queryKey[0];
            const persistableKeys = ['prayers', 'prayer-responses', 'user-profile'];
            return persistableKeys.includes(queryKey as string);
          },
        },
      },
    };
  }

  // 預取代禱數據，可在應用空閒時或特定時間調用 (Firebase 版本)
  async prefetchPrayers() {
    if (!this.queryClient) {
      throw new Error('緩存服務未初始化');
    }

    log.info('開始預取代禱數據 (Firebase)', null, 'CacheService');
    try {
      // 檢查當前緩存時間
      const cachedData = this.queryClient.getQueryData(QUERY_KEYS.PRAYERS);
      if (cachedData) {
        const cacheTime = this.queryClient.getQueryState(QUERY_KEYS.PRAYERS)?.dataUpdatedAt;
        // 如果緩存時間少於 5 分鐘，則跳過預取
        if (cacheTime && (Date.now() - cacheTime < 5 * 60 * 1000)) {
          log.info('代禱數據緩存仍然新鮮，跳過預取', null, 'CacheService');
          return;
        }
      }

      // 預取數據
      await this.queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.PRAYERS,
        queryFn: async () => {
          log.debug('預取代禱數據中 (Firebase)', null, 'CacheService');
          
          // 使用 Firebase 服務
          const prayers = await firebasePrayerService.getInstance().getAllPrayers();
          
          log.info('預取代禱數據成功 (Firebase)', { count: prayers.length }, 'CacheService');
          return prayers;
        },
        staleTime: CACHE_CONFIG.MEMORY_TTL,
        gcTime: CACHE_CONFIG.MEMORY_STALE_TTL,
      });
    } catch (error) {
      log.error('預取代禱數據時發生錯誤', error, 'CacheService');
    }
  }

  // 預取特定用戶的代禱數據 (Firebase 版本)
  async prefetchUserPrayers(userId: string) {
    if (!this.queryClient || !userId) {
      return;
    }

    log.info('開始預取用戶代禱數據 (Firebase)', { userId }, 'CacheService');
    
    try {
      await this.queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.USER_PROFILE(userId),
        queryFn: async () => {
          // 使用 Firebase 服務
          const prayers = await firebasePrayerService.getInstance().getPrayersByUserId(userId);
          return prayers;
        },
        staleTime: CACHE_CONFIG.MEMORY_TTL,
        gcTime: CACHE_CONFIG.MEMORY_STALE_TTL,
      });
      
      log.info('預取用戶代禱數據成功 (Firebase)', { userId }, 'CacheService');
    } catch (error) {
      log.error('預取用戶代禱數據失敗', error, 'CacheService');
    }
  }

  // 預取特定代禱的回應數據 (Firebase 版本)
  async prefetchPrayerResponses(prayerId: string) {
    if (!this.queryClient || !prayerId) {
      return;
    }

    log.info('開始預取代禱回應數據 (Firebase)', { prayerId }, 'CacheService');
    
    try {
      await this.queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.PRAYER_RESPONSES(prayerId),
        queryFn: async () => {
          // 使用 Firebase 服務
          const responses = await firebasePrayerResponseService.getInstance().getPrayerResponses(prayerId);
          return responses;
        },
        staleTime: CACHE_CONFIG.MEMORY_TTL,
        gcTime: CACHE_CONFIG.MEMORY_STALE_TTL,
      });
      
      log.info('預取代禱回應數據成功 (Firebase)', { prayerId }, 'CacheService');
    } catch (error) {
      log.error('預取代禱回應數據失敗', error, 'CacheService');
    }
  }

  // 批次預取頂部代禱的回應
  async prefetchTopPrayerResponses() {
    if (!this.queryClient) {
      return;
    }

    // 獲取當前緩存的代禱列表
    const prayers = this.queryClient.getQueryData<Prayer[]>(QUERY_KEYS.PRAYERS);
    if (!prayers || prayers.length === 0) {
      return;
    }

    // 只預取前 5 個代禱的回應
    const topPrayers = prayers.slice(0, 5);
    for (const prayer of topPrayers) {
      await this.prefetchPrayerResponses(prayer.id);
    }
  }

  // 清除特定查詢的緩存
  invalidateCache(queryKey: string[]) {
    if (!this.queryClient) {
      throw new Error('緩存服務未初始化');
    }
    
    this.queryClient.invalidateQueries({ queryKey });
  }

  // 清除所有緩存
  clearAllCache() {
    if (!this.queryClient) {
      throw new Error('緩存服務未初始化');
    }
    
    this.queryClient.clear();
    log.info('所有緩存已清除', null, 'CacheService');
  }
}

// 導出單例實例
export const cacheService = new CacheService(); 