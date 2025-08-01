import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useTogglePrayerAnswered, 
  useToggleResponseAnswered,
  useMarkPrayerAsAnswered,
  useMarkResponseAsAnswered
} from './usePrayerAnswered';
import React from 'react';

// Mock dependencies
vi.mock('@/services/prayer/PrayerAnsweredService', () => ({
  prayerAnsweredService: {
    togglePrayerAnswered: vi.fn(),
    toggleResponseAnswered: vi.fn(),
    markPrayerAsAnswered: vi.fn(),
    markResponseAsAnswered: vi.fn()
  }
}));

vi.mock('@/constants', () => ({
  QUERY_KEYS: {
    PRAYERS: ['prayers'],
    PRAYER_RESPONSES: (prayerId: string) => ['prayer-responses', prayerId]
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/lib/notifications', () => ({
  notify: {
    apiError: vi.fn()
  }
}));

// Helper to create test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  // Spy on queryClient methods
  vi.spyOn(queryClient, 'invalidateQueries');

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  return { Wrapper, queryClient };
};

describe('usePrayerAnswered hooks', () => {
  let mockPrayerAnsweredService: any;
  let mockLogger: any;
  let mockNotify: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked services
    const prayerModule = vi.mocked(require('@/services/prayer/PrayerAnsweredService'));
    mockPrayerAnsweredService = prayerModule.prayerAnsweredService;
    mockLogger = vi.mocked(require('@/lib/logger').log);
    mockNotify = vi.mocked(require('@/lib/notifications').notify);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('useTogglePrayerAnswered', () => {
    it('應該成功切換禱告已應允狀態', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const mockResult = { isAnswered: true };
      mockPrayerAnsweredService.togglePrayerAnswered.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync('prayer-1');
      });

      expect(mockPrayerAnsweredService.togglePrayerAnswered).toHaveBeenCalledWith('prayer-1');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '切換代禱「神已應允」狀態',
        { prayerId: 'prayer-1' },
        'useTogglePrayerAnswered'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '代禱「神已應允」狀態切換成功',
        { prayerId: 'prayer-1', isAnswered: mockResult },
        'useTogglePrayerAnswered'
      );
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['prayers']
      });
    });

    it('應該處理切換禱告已應允狀態的錯誤', async () => {
      const { Wrapper } = createWrapper();
      const mockError = new Error('切換失敗');
      mockPrayerAnsweredService.togglePrayerAnswered.mockRejectedValue(mockError);

      const { result } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('prayer-1');
        } catch (error) {
          // 預期的錯誤
        }
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        '代禱「神已應允」狀態切換失敗',
        mockError,
        'useTogglePrayerAnswered'
      );
      expect(mockNotify.apiError).toHaveBeenCalledWith(
        mockError,
        '切換「神已應允」狀態失敗'
      );
    });

    it('應該設置正確的載入狀態', () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe('useToggleResponseAnswered', () => {
    it('應該成功切換回應已應允狀態', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const mockResult = { isAnswered: true };
      mockPrayerAnsweredService.toggleResponseAnswered.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useToggleResponseAnswered(), { wrapper: Wrapper });

      const params = { responseId: 'response-1', prayerId: 'prayer-1' };

      await act(async () => {
        await result.current.mutateAsync(params);
      });

      expect(mockPrayerAnsweredService.toggleResponseAnswered).toHaveBeenCalledWith('response-1');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '切換回應「神已應允」狀態',
        params,
        'useToggleResponseAnswered'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '回應「神已應允」狀態切換成功',
        { prayerId: 'prayer-1', isAnswered: mockResult },
        'useToggleResponseAnswered'
      );
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['prayer-responses', 'prayer-1']
      });
    });

    it('應該處理切換回應已應允狀態的錯誤', async () => {
      const { Wrapper } = createWrapper();
      const mockError = new Error('切換失敗');
      mockPrayerAnsweredService.toggleResponseAnswered.mockRejectedValue(mockError);

      const { result } = renderHook(() => useToggleResponseAnswered(), { wrapper: Wrapper });

      const params = { responseId: 'response-1', prayerId: 'prayer-1' };

      await act(async () => {
        try {
          await result.current.mutateAsync(params);
        } catch (error) {
          // 預期的錯誤
        }
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        '回應「神已應允」狀態切換失敗',
        mockError,
        'useToggleResponseAnswered'
      );
      expect(mockNotify.apiError).toHaveBeenCalledWith(
        mockError,
        '切換「神已應允」狀態失敗'
      );
    });
  });

  describe('useMarkPrayerAsAnswered', () => {
    it('應該成功標記禱告為已應允', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const mockResult = { success: true };
      mockPrayerAnsweredService.markPrayerAsAnswered.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useMarkPrayerAsAnswered(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync('prayer-1');
      });

      expect(mockPrayerAnsweredService.markPrayerAsAnswered).toHaveBeenCalledWith('prayer-1');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '標記代禱為「神已應允」',
        { prayerId: 'prayer-1' },
        'useMarkPrayerAsAnswered'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '代禱標記為「神已應允」成功',
        { prayerId: 'prayer-1' },
        'useMarkPrayerAsAnswered'
      );
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['prayers']
      });
    });

    it('應該處理標記禱告為已應允的錯誤', async () => {
      const { Wrapper } = createWrapper();
      const mockError = new Error('標記失敗');
      mockPrayerAnsweredService.markPrayerAsAnswered.mockRejectedValue(mockError);

      const { result } = renderHook(() => useMarkPrayerAsAnswered(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('prayer-1');
        } catch (error) {
          // 預期的錯誤
        }
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        '代禱標記為「神已應允」失敗',
        mockError,
        'useMarkPrayerAsAnswered'
      );
      expect(mockNotify.apiError).toHaveBeenCalledWith(
        mockError,
        '標記「神已應允」失敗'
      );
    });
  });

  describe('useMarkResponseAsAnswered', () => {
    it('應該成功標記回應為已應允', async () => {
      const { Wrapper, queryClient } = createWrapper();
      const mockResult = { success: true };
      mockPrayerAnsweredService.markResponseAsAnswered.mockResolvedValue(mockResult);

      const { result } = renderHook(() => useMarkResponseAsAnswered(), { wrapper: Wrapper });

      const params = { responseId: 'response-1', prayerId: 'prayer-1' };

      await act(async () => {
        await result.current.mutateAsync(params);
      });

      expect(mockPrayerAnsweredService.markResponseAsAnswered).toHaveBeenCalledWith('response-1');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '標記回應為「神已應允」',
        params,
        'useMarkResponseAsAnswered'
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '回應標記為「神已應允」成功',
        { prayerId: 'prayer-1' },
        'useMarkResponseAsAnswered'
      );
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['prayer-responses', 'prayer-1']
      });
    });

    it('應該處理標記回應為已應允的錯誤', async () => {
      const { Wrapper } = createWrapper();
      const mockError = new Error('標記失敗');
      mockPrayerAnsweredService.markResponseAsAnswered.mockRejectedValue(mockError);

      const { result } = renderHook(() => useMarkResponseAsAnswered(), { wrapper: Wrapper });

      const params = { responseId: 'response-1', prayerId: 'prayer-1' };

      await act(async () => {
        try {
          await result.current.mutateAsync(params);
        } catch (error) {
          // 預期的錯誤
        }
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        '回應標記為「神已應允」失敗',
        mockError,
        'useMarkResponseAsAnswered'
      );
      expect(mockNotify.apiError).toHaveBeenCalledWith(
        mockError,
        '標記「神已應允」失敗'
      );
    });
  });

  describe('Integration tests', () => {
    it('應該正確處理連續的操作', async () => {
      const { Wrapper, queryClient } = createWrapper();
      mockPrayerAnsweredService.togglePrayerAnswered.mockResolvedValue({ isAnswered: true });
      mockPrayerAnsweredService.markPrayerAsAnswered.mockResolvedValue({ success: true });

      const { result: toggleResult } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });
      const { result: markResult } = renderHook(() => useMarkPrayerAsAnswered(), { wrapper: Wrapper });

      // 執行連續操作
      await act(async () => {
        await toggleResult.current.mutateAsync('prayer-1');
        await markResult.current.mutateAsync('prayer-1');
      });

      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['prayers']
      });
    });

    it('應該正確處理並行操作', async () => {
      const { Wrapper } = createWrapper();
      mockPrayerAnsweredService.togglePrayerAnswered.mockResolvedValue({ isAnswered: true });
      mockPrayerAnsweredService.toggleResponseAnswered.mockResolvedValue({ isAnswered: true });

      const { result: prayerResult } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });
      const { result: responseResult } = renderHook(() => useToggleResponseAnswered(), { wrapper: Wrapper });

      // 執行並行操作
      await act(async () => {
        await Promise.all([
          prayerResult.current.mutateAsync('prayer-1'),
          responseResult.current.mutateAsync({ responseId: 'response-1', prayerId: 'prayer-1' })
        ]);
      });

      expect(mockPrayerAnsweredService.togglePrayerAnswered).toHaveBeenCalledWith('prayer-1');
      expect(mockPrayerAnsweredService.toggleResponseAnswered).toHaveBeenCalledWith('response-1');
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理空的禱告 ID', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.mutateAsync('');
      });

      expect(mockPrayerAnsweredService.togglePrayerAnswered).toHaveBeenCalledWith('');
    });

    it('應該處理無效的參數', async () => {
      const { Wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleResponseAnswered(), { wrapper: Wrapper });

      const invalidParams = { responseId: '', prayerId: '' };

      await act(async () => {
        await result.current.mutateAsync(invalidParams);
      });

      expect(mockPrayerAnsweredService.toggleResponseAnswered).toHaveBeenCalledWith('');
    });

    it('應該處理網路錯誤', async () => {
      const { Wrapper } = createWrapper();
      const networkError = new Error('Network error');
      mockPrayerAnsweredService.togglePrayerAnswered.mockRejectedValue(networkError);

      const { result } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('prayer-1');
        } catch (error) {
          expect(error).toBe(networkError);
        }
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(networkError);
    });
  });

  describe('狀態管理測試', () => {
    it('應該正確追蹤 mutation 狀態', async () => {
      const { Wrapper } = createWrapper();
      mockPrayerAnsweredService.togglePrayerAnswered.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ isAnswered: true }), 100))
      );

      const { result } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });

      // 初始狀態
      expect(result.current.isPending).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);

      // 開始 mutation
      act(() => {
        result.current.mutate('prayer-1');
      });

      expect(result.current.isPending).toBe(true);

      // 等待完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    it('應該正確重置狀態', async () => {
      const { Wrapper } = createWrapper();
      mockPrayerAnsweredService.togglePrayerAnswered.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useTogglePrayerAnswered(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('prayer-1');
        } catch (error) {
          // 預期的錯誤
        }
      });

      expect(result.current.isError).toBe(true);

      // 重置狀態
      act(() => {
        result.current.reset();
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });
}); 