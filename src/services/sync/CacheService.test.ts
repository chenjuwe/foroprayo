import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheService } from './CacheService';
import { log } from '@/lib/logger';

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({
    getQueryData: vi.fn(),
    getQueryState: vi.fn(),
    prefetchQuery: vi.fn(),
    invalidateQueries: vi.fn(),
    clear: vi.fn(),
  })),
}));

// Mock @tanstack/react-query-persist-client
vi.mock('@tanstack/react-query-persist-client', () => ({
  PersistQueryClientProvider: vi.fn(),
}));

// Mock @tanstack/query-sync-storage-persister
vi.mock('@tanstack/query-sync-storage-persister', () => ({
  createSyncStoragePersister: vi.fn(() => ({
    restoreClient: vi.fn(),
    persistClient: vi.fn(),
  })),
}));

// Mock services
vi.mock('@/services', () => ({
  firebasePrayerService: {
    getInstance: vi.fn(() => ({
      getAllPrayers: vi.fn().mockResolvedValue([]),
      getPrayersByUserId: vi.fn().mockResolvedValue([]),
    })),
  },
  firebasePrayerResponseService: {
    getInstance: vi.fn(() => ({
      getResponsesByPrayerId: vi.fn().mockResolvedValue([]),
      getPrayerResponses: vi.fn().mockResolvedValue([]),
    })),
  },
}));

// Mock constants
vi.mock('@/constants', () => ({
  CACHE_CONFIG: {
    MEMORY_TTL: 300000,
    MEMORY_STALE_TTL: 600000,
    INDEXED_DB_TTL: 86400000,
  },
  QUERY_KEYS: {
    PRAYERS: ['prayers'],
    PRAYER_RESPONSES: (prayerId: string) => ['prayer-responses', prayerId],
    USER_PROFILE: (userId: string) => ['user-profile', userId],
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 cacheService 狀態
    (cacheService as any).queryClient = null;
    (cacheService as any).persister = null;
    (cacheService as any).isInitialized = false;
  });

  describe('initialize', () => {
    it('應該成功初始化緩存服務', () => {
      const mockQueryClient = {
        getQueryData: vi.fn(),
        getQueryState: vi.fn(),
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      expect(cacheService).toBeDefined();
    });

    it('應該在初始化後設置 isInitialized 標誌', () => {
      const mockQueryClient = {
        getQueryData: vi.fn(),
        getQueryState: vi.fn(),
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      // 檢查是否調用了 logger
      expect(log.info).toHaveBeenCalledWith('緩存服務已初始化', null, 'CacheService');
    });
  });

  describe('getPersistQueryClientProviderProps', () => {
    it('應該在未初始化時拋出錯誤', () => {
      expect(() => {
        cacheService.getPersistQueryClientProviderProps();
      }).toThrow('緩存服務未初始化');
    });

    it('應該在初始化後返回正確的 props', () => {
      const mockQueryClient = {
        getQueryData: vi.fn(),
        getQueryState: vi.fn(),
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      const props = cacheService.getPersistQueryClientProviderProps();

      expect(props).toHaveProperty('client');
      expect(props).toHaveProperty('persistOptions');
      expect(props.persistOptions).toHaveProperty('persister');
      expect(props.persistOptions).toHaveProperty('maxAge');
      expect(props.persistOptions).toHaveProperty('dehydrateOptions');
    });
  });

  describe('prefetchPrayers', () => {
    it('應該在未初始化時拋出錯誤', async () => {
      await expect(cacheService.prefetchPrayers()).rejects.toThrow('緩存服務未初始化');
    });

    it('應該成功預取代禱數據', async () => {
      const mockQueryClient = {
        getQueryData: vi.fn(() => null),
        getQueryState: vi.fn(() => ({ dataUpdatedAt: Date.now() - 10 * 60 * 1000 })),
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      await cacheService.prefetchPrayers();

      expect(mockQueryClient.prefetchQuery).toHaveBeenCalled();
    });

    it('應該在緩存仍然新鮮時跳過預取', async () => {
      const mockQueryClient = {
        getQueryData: vi.fn(() => ({ some: 'data' })),
        getQueryState: vi.fn(() => ({ dataUpdatedAt: Date.now() - 2 * 60 * 1000 })), // 2分鐘前
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      await cacheService.prefetchPrayers();

      expect(mockQueryClient.prefetchQuery).not.toHaveBeenCalled();
    });
  });

  describe('prefetchUserPrayers', () => {
    it('應該在未初始化時不執行任何操作', async () => {
      await cacheService.prefetchUserPrayers('test-user-id');
      // 不應該拋出錯誤，只是不執行任何操作
    });

    it('應該在用戶ID為空時不執行任何操作', async () => {
      const mockQueryClient = {
        getQueryData: vi.fn(),
        getQueryState: vi.fn(),
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      await cacheService.prefetchUserPrayers('');

      expect(mockQueryClient.prefetchQuery).not.toHaveBeenCalled();
    });

    it('應該成功預取用戶代禱數據', async () => {
      const mockQueryClient = {
        getQueryData: vi.fn(() => null),
        getQueryState: vi.fn(() => ({ dataUpdatedAt: Date.now() - 10 * 60 * 1000 })),
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      await cacheService.prefetchUserPrayers('test-user-id');

      expect(mockQueryClient.prefetchQuery).toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    it('應該在未初始化時拋出錯誤', () => {
      expect(() => {
        cacheService.invalidateCache(['prayers']);
      }).toThrow('緩存服務未初始化');
    });

    it('應該成功使緩存失效', () => {
      const mockQueryClient = {
        getQueryData: vi.fn(),
        getQueryState: vi.fn(),
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      cacheService.invalidateCache(['prayers']);

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['prayers'] });
    });
  });

  describe('clearAllCache', () => {
    it('應該在未初始化時拋出錯誤', () => {
      expect(() => {
        cacheService.clearAllCache();
      }).toThrow('緩存服務未初始化');
    });

    it('應該成功清除所有緩存', () => {
      const mockQueryClient = {
        getQueryData: vi.fn(),
        getQueryState: vi.fn(),
        prefetchQuery: vi.fn(),
        invalidateQueries: vi.fn(),
        clear: vi.fn(),
      };

      cacheService.initialize(mockQueryClient as any);

      cacheService.clearAllCache();

      expect(mockQueryClient.clear).toHaveBeenCalled();
    });
  });
}); 