import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AllTheProviders } from '@/utils/test-utils';

// Mock firebasePrayerService before importing the hook
vi.mock('@/services', () => ({
  firebasePrayerService: {
    getInstance: vi.fn(() => ({
      getAllPrayers: vi.fn()
    }))
  }
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock constants
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
  CACHE_CONFIG: {
    RESOURCES: {
      PRAYERS: {
        STALE_TIME: 2 * 60 * 1000,
        GC_TIME: 10 * 60 * 1000
      }
    }
  }
}));

// Now import the hook after mocks are set up
import { usePrayers } from './usePrayersOptimized';
import { firebasePrayerService } from '@/services';

describe('usePrayersOptimized', () => {
  let mockGetAllPrayers: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mock function reference
    mockGetAllPrayers = (firebasePrayerService.getInstance() as any).getAllPrayers;
  });

  it('應該成功獲取祈禱列表', async () => {
    const mockPrayers = [
      {
        id: '1',
        content: '測試祈禱 1',
        user_id: 'user-1',
        user_name: 'User 1',
        is_anonymous: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        image_url: null,
        is_answered: false,
        response_count: 0,
        prayer_type: 'prayer'
      },
      {
        id: '2',
        content: '測試祈禱 2',
        user_id: 'user-2',
        user_name: 'User 2',
        is_anonymous: false,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        image_url: null,
        is_answered: false,
        response_count: 5,
        prayer_type: 'prayer'
      }
    ];

    mockGetAllPrayers.mockResolvedValue(mockPrayers);

    const { result } = renderHook(() => usePrayers(), {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].id).toBe('1');
    expect(result.current.data?.[1].id).toBe('2');
    expect(result.current.error).toBeNull();
  });

  it('應該處理加載錯誤', async () => {
    const error = new Error('Firestore error');
    mockGetAllPrayers.mockRejectedValue(error);

    const { result } = renderHook(() => usePrayers(), {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });

  it('應該處理重新獲取資料', async () => {
    const mockPrayers = [
      {
        id: '1',
        content: '測試祈禱',
        user_id: 'user-1',
        user_name: 'User 1',
        is_anonymous: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        image_url: null,
        is_answered: false,
        response_count: 0,
        prayer_type: 'prayer'
      }
    ];

    mockGetAllPrayers.mockResolvedValue(mockPrayers);

    const { result } = renderHook(() => usePrayers(), {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 觸發重新獲取
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetAllPrayers).toHaveBeenCalledTimes(2);
  });

  it('應該處理空結果', async () => {
    mockGetAllPrayers.mockResolvedValue([]);

    const { result } = renderHook(() => usePrayers(), {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('應該處理網絡錯誤', async () => {
    const networkError = new Error('Network error');
    mockGetAllPrayers.mockRejectedValue(networkError);

    const { result } = renderHook(() => usePrayers(), {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });

  it('應該正確設置查詢選項', async () => {
    mockGetAllPrayers.mockResolvedValue([]);

    const { result } = renderHook(() => usePrayers(), {
      wrapper: AllTheProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 驗證查詢已被調用
    expect(mockGetAllPrayers).toHaveBeenCalled();
  });
}); 