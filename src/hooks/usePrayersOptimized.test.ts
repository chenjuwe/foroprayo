import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePrayers } from './usePrayersOptimized';

// Mock 祈禱數據
const mockPrayers = [
  {
    id: '1',
    content: '為家人健康祈禱',
    userId: 'user1',
    userName: '測試用戶1',
    avatar_url: 'https://example.com/avatar1.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isAnswered: false,
    likeCount: 5,
    responseCount: 3,
    isAnonymous: false,
  },
  {
    id: '2',
    content: '為工作順利祈禱',
    userId: 'user2',
    userName: '測試用戶2',
    avatar_url: 'https://example.com/avatar2.jpg',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    isAnswered: true,
    likeCount: 8,
    responseCount: 6,
    isAnonymous: false,
  },
];

// Mock Firebase Prayer Service
const mockGetAllPrayers = vi.fn().mockResolvedValue(mockPrayers);

vi.mock('@/services', () => ({
  firebasePrayerService: {
    getInstance: vi.fn(() => ({
      getAllPrayers: mockGetAllPrayers,
    })),
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

describe('usePrayers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  it('應該正確初始化', () => {
    const { result } = renderHook(() => usePrayers(), { wrapper });
    
    expect(result.current.data).toEqual(undefined);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.refetch).toBe('function');
  });

  it('應該成功獲取祈禱列表', async () => {
    const { result } = renderHook(() => usePrayers(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockPrayers);
    expect(result.current.isError).toBe(false);
    expect(mockGetAllPrayers).toHaveBeenCalled();
  });

  it('應該正確處理獲取錯誤', async () => {
    const errorMessage = '獲取祈禱失敗';
    // 使用 mockRejectedValue 而不是 mockRejectedValueOnce，確保重試時也會失敗
    mockGetAllPrayers.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => usePrayers(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 }); // 增加超時時間以允許重試完成

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toEqual(undefined);
    
    // 重置 mock 為預設行為，避免影響後續測試
    mockGetAllPrayers.mockResolvedValue(mockPrayers);
  });

  it('應該支援手動重新獲取數據', async () => {
    const { result } = renderHook(() => usePrayers(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 清除調用記錄
    mockGetAllPrayers.mockClear();

    await waitFor(async () => {
      await result.current.refetch();
    });

    expect(mockGetAllPrayers).toHaveBeenCalled();
  });

  it('應該正確處理空結果', async () => {
    mockGetAllPrayers.mockResolvedValueOnce([]);
    
    const { result } = renderHook(() => usePrayers(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('應該正確記錄日誌', async () => {
    const { log } = await import('@/lib/logger');
    
    const { result } = renderHook(() => usePrayers(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(log.debug).toHaveBeenCalledWith(
      '開始獲取代禱列表 (Firebase)',
      {},
      'usePrayers'
    );
    expect(log.info).toHaveBeenCalledWith(
      '成功載入代禱列表 (Firebase)',
      { count: mockPrayers.length },
      'usePrayers'
    );
  });

  it('應該正確處理網絡錯誤並記錄', async () => {
    const { log } = await import('@/lib/logger');
    const networkError = new Error('Network error');
    // 使用 mockRejectedValue 而不是 mockRejectedValueOnce，確保重試時也會失敗
    mockGetAllPrayers.mockRejectedValue(networkError);
    
    const { result } = renderHook(() => usePrayers(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 }); // 增加超時時間以允許重試完成

    expect(result.current.isError).toBe(true);
    expect(log.error).toHaveBeenCalledWith(
      'Firebase 查詢代禱列表失敗',
      networkError,
      'usePrayers'
    );
    
    // 重置 mock 為預設行為，避免影響後續測試
    mockGetAllPrayers.mockResolvedValue(mockPrayers);
  });

  it('應該正確設置查詢選項', () => {
    const { result } = renderHook(() => usePrayers(), { wrapper });
    
    // 檢查查詢是否已初始化
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });
}); 