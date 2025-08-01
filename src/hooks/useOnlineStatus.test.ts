/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOnlineStatus } from './useOnlineStatus';
import { useNetworkStore } from '@/stores/networkStore';

// Mock 外部依賴
vi.mock('@/stores/networkStore');
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock fetch API
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('useOnlineStatus', () => {
  const mockSetOnlineStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Mock useNetworkStore
    (useNetworkStore as any).mockReturnValue({
      isOnline: true,
      setOnlineStatus: mockSetOnlineStatus,
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Reset fetch mock
    mockFetch.mockResolvedValue(new Response());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    
    // 清理事件監聽器
    window.removeEventListener('online', vi.fn());
    window.removeEventListener('offline', vi.fn());
  });

  it('應該正確初始化並設置事件監聽器', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    renderHook(() => useOnlineStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('應該在初始化時檢查連線狀態', async () => {
    mockFetch.mockResolvedValue(new Response());
    
    renderHook(() => useOnlineStatus());

    // 等待初始檢查完成
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockFetch).toHaveBeenCalledWith('https://8.8.8.8/', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });
    expect(mockSetOnlineStatus).toHaveBeenCalledWith(true);
  });

  it('應該在 navigator.onLine 為 false 時設置離線狀態', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockSetOnlineStatus).toHaveBeenCalledWith(false);
    expect(result.current.connectionError).toBe('瀏覽器偵測為離線狀態');
  });

  it('應該處理網路連線檢查失敗', async () => {
    const mockError = new Error('Network error');
    mockFetch.mockRejectedValue(mockError);

    const { result } = renderHook(() => useOnlineStatus());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockSetOnlineStatus).toHaveBeenCalledWith(false);
    expect(result.current.connectionError).toBe('連線檢測發生錯誤: Network error');
  });

  it('應該提供手動重試連線的功能', async () => {
    mockFetch.mockResolvedValue(new Response());
    
    const { result } = renderHook(() => useOnlineStatus());

    const retryResult = await act(async () => {
      return await result.current.retryConnection();
    });

    expect(retryResult).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('https://8.8.8.8/', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });
    expect(mockSetOnlineStatus).toHaveBeenCalledWith(true);
  });

  it('應該回應 online 事件', () => {
    renderHook(() => useOnlineStatus());

    act(() => {
      const event = new Event('online');
      window.dispatchEvent(event);
    });

    expect(mockSetOnlineStatus).toHaveBeenCalledWith(true);
  });

  it('應該回應 offline 事件', () => {
    renderHook(() => useOnlineStatus());

    act(() => {
      const event = new Event('offline');
      window.dispatchEvent(event);
    });

    expect(mockSetOnlineStatus).toHaveBeenCalledWith(false);
  });

  it('應該設置定期檢查（每 2 分鐘）', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    
    renderHook(() => useOnlineStatus());

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 120000); // 2 分鐘
  });

  it('應該在 unmount 時清理事件監聽器和定時器', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('應該正確更新 lastChecked 時間', async () => {
    const { result } = renderHook(() => useOnlineStatus());

    const beforeTime = new Date();
    
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    const afterTime = new Date();

    expect(result.current.lastChecked).toBeDefined();
    expect(result.current.lastChecked).toBeInstanceOf(Date);
    expect(result.current.lastChecked!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.current.lastChecked!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it('應該返回正確的介面結構', () => {
    (useNetworkStore as any).mockReturnValue({
      isOnline: true,
      setOnlineStatus: mockSetOnlineStatus,
    });

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toHaveProperty('isOnline');
    expect(result.current).toHaveProperty('retryConnection');
    expect(result.current).toHaveProperty('lastChecked');
    expect(result.current).toHaveProperty('connectionError');
    expect(typeof result.current.retryConnection).toBe('function');
  });

  it('應該處理未知錯誤類型', async () => {
    const unknownError = 'String error';
    mockFetch.mockRejectedValue(unknownError);

    const { result } = renderHook(() => useOnlineStatus());

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.connectionError).toBe('連線檢測發生錯誤: 未知錯誤');
  });

  it('應該在手動重試失敗時返回 false', async () => {
    mockFetch.mockRejectedValue(new Error('Retry failed'));
    
    const { result } = renderHook(() => useOnlineStatus());

    const retryResult = await act(async () => {
      return await result.current.retryConnection();
    });

    expect(retryResult).toBe(false);
    expect(mockSetOnlineStatus).toHaveBeenCalledWith(false);
  });

  it('應該在定期檢查時呼叫連線檢查', async () => {
    renderHook(() => useOnlineStatus());

    // 清除初始檢查的調用
    mockFetch.mockClear();

    // 觸發定期檢查
    await act(async () => {
      vi.advanceTimersByTime(120000); // 2 分鐘後
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockFetch).toHaveBeenCalledWith('https://8.8.8.8/', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });
  });
}); 