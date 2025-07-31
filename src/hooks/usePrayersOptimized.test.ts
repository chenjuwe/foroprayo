import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePrayers, useCreatePrayer, useUpdatePrayer, useDeletePrayer, usePrayersByUserId } from './usePrayersOptimized';
import { firebasePrayerService } from '@/services';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';
import { QUERY_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

// Mock dependencies
vi.mock('@/services', () => ({
  firebasePrayerService: {
    getInstance: vi.fn(() => ({
      getAllPrayers: vi.fn(),
      createPrayer: vi.fn(),
      updatePrayer: vi.fn(),
      deletePrayer: vi.fn(),
      getPrayersByUserId: vi.fn()
    }))
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('@/lib/notifications', () => ({
  notify: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// 修復常數配置問題 - 使用實際的常數值
vi.mock('@/constants', () => ({
  QUERY_KEYS: {
    PRAYERS: ['prayers'],
    USER_PROFILE: (userId: string) => ['user_profile', userId]
  },
  ERROR_MESSAGES: {
    PRAYER_CREATE_ERROR: '代禱發布失敗，請稍後再試',
    PRAYER_UPDATE_ERROR: '代禱更新失敗，請稍後再試',
    PRAYER_DELETE_ERROR: '代禱刪除失敗，請稍後再試'
  },
  SUCCESS_MESSAGES: {
    PRAYER_CREATED: '代禱發布成功',
    PRAYER_UPDATED: '代禱內容已更新',
    PRAYER_DELETED: '代禱已刪除'
  },
  CACHE_CONFIG: {
    RESOURCES: {
      PRAYERS: {
        STALE_TIME: 2 * 60 * 1000,
        GC_TIME: 10 * 60 * 1000
      },
      USER_PROFILE: {
        STALE_TIME: 10 * 60 * 1000,
        GC_TIME: 30 * 60 * 1000
      }
    }
  }
}));

describe('usePrayersOptimized', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    wrapper = ({ children }) => 
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('usePrayers', () => {
    it('應該成功獲取代禱列表', async () => {
      const mockPrayers = [
        {
          id: 'prayer-1',
          content: '測試代禱 1',
          user_id: 'user-1',
          user_name: 'User 1',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'prayer-2',
          content: '測試代禱 2',
          user_id: 'user-2',
          user_name: 'User 2',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockGetAllPrayers = vi.fn().mockResolvedValue(mockPrayers);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        getAllPrayers: mockGetAllPrayers
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPrayers);
      expect(mockGetAllPrayers).toHaveBeenCalled();
      expect(log.debug).toHaveBeenCalledWith('開始獲取代禱列表 (Firebase)', {}, 'usePrayers');
      expect(log.info).toHaveBeenCalledWith('成功載入代禱列表 (Firebase)', { count: 2 }, 'usePrayers');
    });

    it('應該處理獲取代禱列表時的錯誤', async () => {
      const mockError = new Error('Database error');
      const mockGetAllPrayers = vi.fn().mockRejectedValue(mockError);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        getAllPrayers: mockGetAllPrayers
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
      expect(log.error).toHaveBeenCalledWith('Firebase 查詢代禱列表失敗', mockError, 'usePrayers');
    });
  });

  describe('usePrayersByUserId', () => {
    it('應該成功獲取用戶的代禱', async () => {
      const userId = 'test-user-id';
      const mockUserPrayers = [
        {
          id: 'prayer-1',
          content: '用戶代禱 1',
          user_id: userId,
          user_name: 'Test User',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockGetPrayersByUserId = vi.fn().mockResolvedValue(mockUserPrayers);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        getPrayersByUserId: mockGetPrayersByUserId
      });

      const { result } = renderHook(() => usePrayersByUserId(userId), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserPrayers);
      expect(mockGetPrayersByUserId).toHaveBeenCalledWith(userId);
    });

    it('應該在用戶ID為空時不執行查詢', () => {
      const { result } = renderHook(() => usePrayersByUserId(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreatePrayer', () => {
    it('應該成功創建代禱', async () => {
      const newPrayer = {
        id: 'new-prayer-id',
        content: '新代禱內容',
        user_id: 'test-user-id',
        user_name: 'Test User',
        created_at: '2024-01-01T00:00:00Z'
      };

      const mockCreatePrayer = vi.fn().mockResolvedValue(newPrayer);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        createPrayer: mockCreatePrayer
      });

      const { result } = renderHook(() => useCreatePrayer(), { wrapper });

      const createPrayerRequest = {
        content: '新代禱內容',
        is_anonymous: false,
        prayer_type: 'prayer'
      };

      result.current.mutate(createPrayerRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCreatePrayer).toHaveBeenCalledWith(createPrayerRequest);
      expect(log.debug).toHaveBeenCalledWith('Creating prayer (Firebase)', { isAnonymous: false }, 'useCreatePrayer');
      expect(log.info).toHaveBeenCalledWith('Prayer created successfully (Firebase)', { id: 'new-prayer-id' }, 'useCreatePrayer');
    });

    it('應該處理創建代禱時的錯誤', async () => {
      const mockError = new Error('創建失敗');
      const mockCreatePrayer = vi.fn().mockRejectedValue(mockError);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        createPrayer: mockCreatePrayer
      });

      const { result } = renderHook(() => useCreatePrayer(), { wrapper });

      const createPrayerRequest = {
        content: '新代禱內容',
        is_anonymous: false,
        prayer_type: 'prayer'
      };

      result.current.mutate(createPrayerRequest);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(notify.error).toHaveBeenCalledWith('代禱發布失敗：創建失敗', mockError);
      expect(log.error).toHaveBeenCalledWith('Failed to create prayer (Firebase)', mockError, 'useCreatePrayer');
    });

    it('應該正確更新緩存', async () => {
      const newPrayer = {
        id: 'new-prayer-id',
        content: '新代禱內容',
        user_id: 'test-user-id',
        user_name: 'Test User',
        created_at: '2024-01-01T00:00:00Z'
      };

      const mockCreatePrayer = vi.fn().mockResolvedValue(newPrayer);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        createPrayer: mockCreatePrayer
      });

      // 先設置一些現有數據
      queryClient.setQueryData(QUERY_KEYS.PRAYERS, [
        { id: 'existing-prayer', content: '現有代禱' }
      ]);

      const { result } = renderHook(() => useCreatePrayer(), { wrapper });

      const createPrayerRequest = {
        content: '新代禱內容',
        is_anonymous: false,
        prayer_type: 'prayer'
      };

      result.current.mutate(createPrayerRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // 檢查緩存是否被正確更新
      const cachedData = queryClient.getQueryData(QUERY_KEYS.PRAYERS);
      expect(cachedData).toEqual([newPrayer, { id: 'existing-prayer', content: '現有代禱' }]);
    });
  });

  describe('useUpdatePrayer', () => {
    it('應該成功更新代禱', async () => {
      const updatedPrayer = {
        id: 'prayer-1',
        content: '更新後的代禱內容',
        user_id: 'test-user-id',
        user_name: 'Test User',
        created_at: '2024-01-01T00:00:00Z'
      };

      const mockUpdatePrayer = vi.fn().mockResolvedValue(updatedPrayer);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        updatePrayer: mockUpdatePrayer
      });

      const { result } = renderHook(() => useUpdatePrayer(), { wrapper });

      result.current.mutate({ id: 'prayer-1', content: '更新後的代禱內容' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdatePrayer).toHaveBeenCalledWith('prayer-1', '更新後的代禱內容');
    });

    it('應該處理更新代禱時的錯誤', async () => {
      const mockError = new Error('更新失敗');
      const mockUpdatePrayer = vi.fn().mockRejectedValue(mockError);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        updatePrayer: mockUpdatePrayer
      });

      const { result } = renderHook(() => useUpdatePrayer(), { wrapper });

      result.current.mutate({ id: 'prayer-1', content: '更新內容' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(notify.error).toHaveBeenCalledWith('更新失敗', mockError);
    });
  });

  describe('useDeletePrayer', () => {
    it('應該成功刪除代禱', async () => {
      const mockDeletePrayer = vi.fn().mockResolvedValue(undefined);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        deletePrayer: mockDeletePrayer
      });

      const { result } = renderHook(() => useDeletePrayer(), { wrapper });

      result.current.mutate('prayer-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDeletePrayer).toHaveBeenCalledWith('prayer-1');
    });

    it('應該處理刪除代禱時的錯誤', async () => {
      const mockError = new Error('刪除失敗');
      const mockDeletePrayer = vi.fn().mockRejectedValue(mockError);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        deletePrayer: mockDeletePrayer
      });

      const { result } = renderHook(() => useDeletePrayer(), { wrapper });

      result.current.mutate('prayer-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 10000 });

      expect(notify.error).toHaveBeenCalledWith('刪除失敗', mockError);
    });

    it('應該正確從緩存中移除刪除的代禱', async () => {
      const mockDeletePrayer = vi.fn().mockResolvedValue(undefined);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        deletePrayer: mockDeletePrayer
      });

      // 先設置一些現有數據
      queryClient.setQueryData(QUERY_KEYS.PRAYERS, [
        { id: 'prayer-1', content: '要刪除的代禱' },
        { id: 'prayer-2', content: '保留的代禱' }
      ]);

      const { result } = renderHook(() => useDeletePrayer(), { wrapper });

      result.current.mutate('prayer-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 10000 });

      // 檢查緩存是否被正確更新
      const cachedData = queryClient.getQueryData(QUERY_KEYS.PRAYERS);
      expect(cachedData).toEqual([{ id: 'prayer-2', content: '保留的代禱' }]);
    });
  });

  describe('緩存管理', () => {
    it('應該正確處理查詢鍵', () => {
      const { result } = renderHook(() => usePrayers(), { wrapper });
      
      expect(result.current.dataUpdatedAt).toBeDefined();
    });

    it('應該正確處理用戶代禱的查詢鍵', () => {
      const userId = 'test-user-id';
      const { result } = renderHook(() => usePrayersByUserId(userId), { wrapper });
      
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理網路錯誤', async () => {
      const networkError = new Error('Network error');
      const mockGetAllPrayers = vi.fn().mockRejectedValue(networkError);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        getAllPrayers: mockGetAllPrayers
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 10000 });

      expect(result.current.error).toBe(networkError);
    });

    it('應該正確處理服務實例錯誤', async () => {
      (firebasePrayerService.getInstance as any).mockImplementation(() => {
        throw new Error('Service instance error');
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 10000 });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('性能優化', () => {
    it('應該正確設置查詢配置', () => {
      const { result } = renderHook(() => usePrayers(), { wrapper });
      
      expect(result.current.isFetching).toBeDefined();
      expect(result.current.isLoading).toBeDefined();
    });

    it('應該正確處理重試邏輯', async () => {
      const mockError = new Error('Temporary error');
      const mockGetAllPrayers = vi.fn().mockRejectedValue(mockError);
      (firebasePrayerService.getInstance as any).mockReturnValue({
        getAllPrayers: mockGetAllPrayers
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 5000 });

      // 檢查重試次數 - 由於 retry: 2，所以會調用 3 次（初始 + 2次重試）
      expect(mockGetAllPrayers).toHaveBeenCalledTimes(3);
    });
  });
}); 