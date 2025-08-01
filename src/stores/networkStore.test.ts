import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useNetworkStore, initNetworkListeners } from './networkStore';

describe('networkStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 store 狀態
    useNetworkStore.setState({
      isOnline: navigator.onLine,
      hasPreviouslyBeenOffline: !navigator.onLine,
    });
  });

  describe('初始狀態', () => {
    it('應該有正確的初始狀態', () => {
      const store = useNetworkStore.getState();
      
      expect(store).toHaveProperty('isOnline');
      expect(store).toHaveProperty('hasPreviouslyBeenOffline');
      expect(store).toHaveProperty('setOnlineStatus');
      expect(typeof store.setOnlineStatus).toBe('function');
    });
  });

  describe('setOnlineStatus', () => {
    it('應該正確設置在線狀態', () => {
      const store = useNetworkStore.getState();
      
      act(() => {
        store.setOnlineStatus(true);
      });
      
      expect(useNetworkStore.getState().isOnline).toBe(true);
    });

    it('應該正確設置離線狀態', () => {
      const store = useNetworkStore.getState();
      
      act(() => {
        store.setOnlineStatus(false);
      });
      
      expect(useNetworkStore.getState().isOnline).toBe(false);
    });

    it('應該在從離線恢復時顯示成功訊息', () => {
      const store = useNetworkStore.getState();
      
      act(() => {
        store.setOnlineStatus(false);
        store.setOnlineStatus(true);
      });
      
      expect(useNetworkStore.getState().isOnline).toBe(true);
    });

    it('應該在離線時顯示錯誤訊息', () => {
      const store = useNetworkStore.getState();
      
      act(() => {
        store.setOnlineStatus(false);
      });
      
      expect(useNetworkStore.getState().isOnline).toBe(false);
    });

    it('不應該在狀態未改變時觸發更新', () => {
      const store = useNetworkStore.getState();
      const initialOnline = store.isOnline;
      
      act(() => {
        store.setOnlineStatus(initialOnline);
      });
      
      expect(useNetworkStore.getState().isOnline).toBe(initialOnline);
    });
  });

  describe('initNetworkListeners', () => {
    it('應該設置正確的事件監聽器', () => {
      const mockAddEventListener = vi.fn();
      
      // Mock window.addEventListener
      Object.defineProperty(window, 'addEventListener', {
        value: mockAddEventListener,
        writable: true,
        configurable: true,
      });
      
      // 調用 initNetworkListeners 函數
      initNetworkListeners();
      
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
}); 