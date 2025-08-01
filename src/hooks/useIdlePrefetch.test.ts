import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIdlePrefetch } from './useIdlePrefetch';
import { queryClient } from '@/config/queryClient';
import { log } from '@/lib/logger';

// Mock dependencies
vi.mock('@/config/queryClient', () => ({
  queryClient: {
    prefetchQuery: vi.fn()
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn()
  }
}));

// Mock setTimeout and clearTimeout
vi.useFakeTimers();

describe('useIdlePrefetch', () => {
  const mockRequestIdleCallback = vi.fn();
  const mockCancelIdleCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.requestIdleCallback
    Object.defineProperty(window, 'requestIdleCallback', {
      writable: true,
      value: mockRequestIdleCallback
    });
    
    Object.defineProperty(window, 'cancelIdleCallback', {
      writable: true,
      value: mockCancelIdleCallback
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('應該在有 userId 時設置空閒回調', () => {
    const userId = 'test-user-id';

    renderHook(() => useIdlePrefetch(userId));

    expect(mockRequestIdleCallback).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 10000 }
    );
  });

  it('應該在沒有 userId 時不設置空閒回調', () => {
    renderHook(() => useIdlePrefetch());

    expect(mockRequestIdleCallback).not.toHaveBeenCalled();
  });

  it('應該在空閒回調觸發時預取數據', () => {
    const userId = 'test-user-id';
    let idleCallback: (() => void) | null = null;

    mockRequestIdleCallback.mockImplementation((callback) => {
      idleCallback = callback;
      return 1;
    });

    renderHook(() => useIdlePrefetch(userId));

    expect(idleCallback).not.toBeNull();

    // 觸發空閒回調
    if (idleCallback) {
      idleCallback();
    }

    // 快進時間以觸發預取
    vi.advanceTimersByTime(5000);

    expect(queryClient.prefetchQuery).toHaveBeenCalledWith({
      queryKey: ['prayers', { page: 0, limit: 10 }],
      staleTime: 5 * 60 * 1000,
    });
  });

  it('應該在 requestIdleCallback 不存在時使用 setTimeout', () => {
    const userId = 'test-user-id';

    // 移除 requestIdleCallback
    Object.defineProperty(window, 'requestIdleCallback', {
      writable: true,
      value: undefined
    });

    renderHook(() => useIdlePrefetch(userId));

    expect(mockRequestIdleCallback).not.toHaveBeenCalled();

    // 快進時間以觸發備用方案
    vi.advanceTimersByTime(15000);

    // 應該進入處理函數
    expect(log.debug).toHaveBeenCalledWith(
      '用戶閒置，開始預取數據',
      null,
      'useIdlePrefetch'
    );
  });

  it('應該在組件卸載時清理回調和計時器', () => {
    const userId = 'test-user-id';
    const idleCallbackId = 123;

    mockRequestIdleCallback.mockReturnValue(idleCallbackId);

    const { unmount } = renderHook(() => useIdlePrefetch(userId));

    unmount();

    expect(mockCancelIdleCallback).toHaveBeenCalledWith(idleCallbackId);
  });

  it('應該在預取成功時記錄日誌', () => {
    const userId = 'test-user-id';
    let idleCallback: (() => void) | null = null;

    mockRequestIdleCallback.mockImplementation((callback) => {
      idleCallback = callback;
      return 1;
    });

    renderHook(() => useIdlePrefetch(userId));

    // 觸發空閒回調
    if (idleCallback) {
      idleCallback();
    }

    // 快進時間
    vi.advanceTimersByTime(5000);

    expect(log.debug).toHaveBeenCalledWith(
      '用戶閒置，開始預取數據',
      null,
      'useIdlePrefetch'
    );
    expect(log.debug).toHaveBeenCalledWith(
      '閒置預取成功',
      null,
      'useIdlePrefetch'
    );
  });

  it('應該在預取失敗時記錄錯誤', () => {
    const userId = 'test-user-id';
    const error = new Error('Prefetch failed');
    let idleCallback: (() => void) | null = null;

    mockRequestIdleCallback.mockImplementation((callback) => {
      idleCallback = callback;
      return 1;
    });

    (queryClient.prefetchQuery as any).mockRejectedValue(error);

    renderHook(() => useIdlePrefetch(userId));

    // 觸發空閒回調
    if (idleCallback) {
      idleCallback();
    }

    // 快進時間
    vi.advanceTimersByTime(5000);

    expect(log.error).toHaveBeenCalledWith(
      '閒置預取失敗',
      error,
      'useIdlePrefetch'
    );
  });

  it('應該在 userId 變化時重新設置預取', () => {
    let userId = 'user-1';

    const { rerender } = renderHook(() => useIdlePrefetch(userId));

    expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);

    // 更新 userId
    userId = 'user-2';
    rerender();

    expect(mockRequestIdleCallback).toHaveBeenCalledTimes(2);
  });

  it('應該在 userId 從有效值變為 undefined 時清理回調', () => {
    let userId: string | undefined = 'test-user-id';
    const idleCallbackId = 123;

    mockRequestIdleCallback.mockReturnValue(idleCallbackId);

    const { rerender } = renderHook(() => useIdlePrefetch(userId));

    expect(mockRequestIdleCallback).toHaveBeenCalledTimes(1);

    // 將 userId 設為 undefined
    userId = undefined;
    rerender();

    // 應該會清理之前的回調
    expect(mockCancelIdleCallback).toHaveBeenCalledWith(idleCallbackId);
  });
}); 