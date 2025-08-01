import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

// Mock React Query - 先定義 mock
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  MutationCache: vi.fn(() => ({
    onError: vi.fn(),
  })),
}));

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
  QUERY_CONFIG: {
    STALE_TIME: 2 * 60 * 1000,
    GC_TIME: 5 * 60 * 1000,
    RETRY_COUNT: 1,
    RETRY_DELAY: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 10000),
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

// 在 mock 之後導入並獲取 mock 函數
import { usePrayers, useCreatePrayer, useUpdatePrayer, useDeletePrayer, usePrayersByUserId } from './usePrayersOptimized';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const mockUseQuery = useQuery as any;
const mockUseMutation = useMutation as any;
const mockUseQueryClient = useQueryClient as any;

describe('usePrayersOptimized', () => {
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    wrapper = ({ children }) => children;

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
          user_name: 'Test User',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_anonymous: false,
          user_avatar: 'avatar-url-1',
          image_url: null,
          audioUrl: null,
        }
      ];

      mockUseQuery.mockReturnValue({
        data: mockPrayers,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        isError: false,
        status: 'success',
        fetchStatus: 'idle',
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        isPlaceholderData: false,
        isStale: false,
        isFetched: true,
        isFetchedAfterMount: true,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isInitialLoading: false,
        isPreviousData: false,
        isRefetching: false,
        remove: vi.fn(),
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockPrayers);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('應該處理獲取代禱列表時的錯誤', async () => {
      const mockError = new Error('Network error');

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: false,
        isError: true,
        status: 'error',
        fetchStatus: 'idle',
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(mockError);
      });
    });
  });

  describe('usePrayersByUserId', () => {
    it('應該成功獲取用戶的代禱', async () => {
      const mockUserPrayers = [
        {
          id: 'prayer-1',
          content: '用戶代禱 1',
          user_name: 'Test User',
          user_id: 'test-user-id',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          is_anonymous: false,
          user_avatar: 'avatar-url-1',
          image_url: null,
          audioUrl: null,
        }
      ];

      mockUseQuery.mockReturnValue({
        data: mockUserPrayers,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        isError: false,
        status: 'success',
        fetchStatus: 'idle',
      });

      const { result } = renderHook(() => usePrayersByUserId('test-user-id'), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockUserPrayers);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('useCreatePrayer', () => {
    it('應該成功創建代禱', async () => {
      const mockMutate = vi.fn();
      const mockMutateAsync = vi.fn();

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
        isSuccess: false,
        isIdle: true,
        status: 'idle',
        failureCount: 0,
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useCreatePrayer(), { wrapper });

      expect(result.current.mutate).toBe(mockMutate);
      expect(result.current.mutateAsync).toBe(mockMutateAsync);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useUpdatePrayer', () => {
    it('應該成功更新代禱', async () => {
      const mockMutate = vi.fn();
      const mockMutateAsync = vi.fn();

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
        isSuccess: false,
        isIdle: true,
        status: 'idle',
        failureCount: 0,
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useUpdatePrayer(), { wrapper });

      expect(result.current.mutate).toBe(mockMutate);
      expect(result.current.mutateAsync).toBe(mockMutateAsync);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useDeletePrayer', () => {
    it('應該成功刪除代禱', async () => {
      const mockMutate = vi.fn();
      const mockMutateAsync = vi.fn();

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: null,
        isSuccess: false,
        isIdle: true,
        status: 'idle',
        failureCount: 0,
        submittedAt: 0,
        variables: undefined,
        context: undefined,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useDeletePrayer(), { wrapper });

      expect(result.current.mutate).toBe(mockMutate);
      expect(result.current.mutateAsync).toBe(mockMutateAsync);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('應該處理刪除代禱時的錯誤', async () => {
      const mockMutate = vi.fn();
      const mockMutateAsync = vi.fn();
      const mockError = new Error('Delete failed');

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: mockError,
        isSuccess: false,
        isIdle: false,
        status: 'error',
        failureCount: 1,
        submittedAt: Date.now(),
        variables: undefined,
        context: undefined,
        reset: vi.fn(),
      });

      const { result } = renderHook(() => useDeletePrayer(), { wrapper });

      expect(result.current.mutate).toBe(mockMutate);
      expect(result.current.mutateAsync).toBe(mockMutateAsync);
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBe(mockError);
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理網路錯誤', async () => {
      const mockError = new Error('Network error');

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: false,
        isError: true,
        status: 'error',
        fetchStatus: 'idle',
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe(mockError);
      });
    });
  });

  describe('性能優化', () => {
    it('應該正確處理服務實例錯誤', async () => {
      const mockError = new Error('Service instance error');

      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: false,
        isError: true,
        status: 'error',
        fetchStatus: 'idle',
      });

      const { result } = renderHook(() => usePrayers(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe(mockError);
      });
    });
  });
}); 