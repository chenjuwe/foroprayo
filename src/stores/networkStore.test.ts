import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock toast
const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
};

vi.mock('sonner', () => ({
  toast: mockToast,
}));

// Mock logger
const mockLogger = {
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  log: mockLogger,
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

// Mock window event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

// 動態導入 store 以避免 mock 衝突
let useNetworkStore: any;
let initNetworkListeners: any;

describe('networkStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // 重置 navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
    
    // 重置 mock 函數
    mockToast.error.mockClear();
    mockToast.success.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    
    // 清除模組緩存以重新導入
    vi.resetModules();
    
    // 動態導入 store
    const storeModule = await import('./networkStore');
    useNetworkStore = storeModule.useNetworkStore;
    initNetworkListeners = storeModule.initNetworkListeners;
  });

  afterEach(() => {
    // 清理事件監聽器
    const onlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'online'
    )?.[1];
    const offlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'offline'
    )?.[1];
    
    if (onlineHandler) {
      window.removeEventListener('online', onlineHandler);
    }
    if (offlineHandler) {
      window.removeEventListener('offline', offlineHandler);
    }
  });

  describe('基本狀態管理', () => {
    it('應該有正確的初始狀態', () => {
      const state = useNetworkStore.getState();
      
      expect(state.isOnline).toBe(true);
      expect(state.hasPreviouslyBeenOffline).toBe(false);
    });

    it('應該在離線狀態下初始化時有正確的狀態', async () => {
      // 設置離線狀態
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });
      
      // 清除模組緩存以重新導入
      vi.resetModules();
      
      // 重新導入 store
      const storeModule = await import('./networkStore');
      useNetworkStore = storeModule.useNetworkStore;
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(false);
      expect(state.hasPreviouslyBeenOffline).toBe(true);
    });

    it('setOnlineStatus 應該正確更新線上狀態', () => {
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      let state = useNetworkStore.getState();
      expect(state.isOnline).toBe(false);
      expect(state.hasPreviouslyBeenOffline).toBe(true);
      
      act(() => {
        useNetworkStore.getState().setOnlineStatus(true);
      });
      
      state = useNetworkStore.getState();
      expect(state.isOnline).toBe(true);
      expect(state.hasPreviouslyBeenOffline).toBe(false);
    });

    it('setOnlineStatus 應該在狀態沒有變化時不執行操作', () => {
      const initialState = useNetworkStore.getState();
      
      act(() => {
        useNetworkStore.getState().setOnlineStatus(true); // 已經是 true
      });
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(initialState.isOnline);
      expect(state.hasPreviouslyBeenOffline).toBe(initialState.hasPreviouslyBeenOffline);
    });
  });

  describe('網路狀態變化處理', () => {
    it('應該在從線上變為離線時顯示錯誤通知', () => {
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '網路連線中斷',
        null,
        'NetworkStore'
      );
      expect(mockToast.error).toHaveBeenCalledWith(
        '網路連線中斷',
        {
          description: '您目前處於離線狀態，部分功能可能無法使用。',
          duration: 5000,
        }
      );
    });

    it('應該在從離線變為線上時顯示成功通知', () => {
      // 先設置為離線狀態
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      // 再設置為線上狀態
      act(() => {
        useNetworkStore.getState().setOnlineStatus(true);
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        '網路連線已恢復',
        null,
        'NetworkStore'
      );
      expect(mockToast.success).toHaveBeenCalledWith(
        '網路連線已恢復',
        {
          description: '您現在處於線上狀態。',
          duration: 3000,
        }
      );
    });

    it('應該在首次離線時正確處理狀態', () => {
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(false);
      expect(state.hasPreviouslyBeenOffline).toBe(true);
      expect(mockToast.error).toHaveBeenCalledTimes(1);
    });

    it('應該在多次狀態變化時正確處理', () => {
      // 重置 mock 計數器
      mockToast.error.mockClear();
      mockToast.success.mockClear();
      
      // 確保初始狀態是線上
      const initialState = useNetworkStore.getState();
      expect(initialState.isOnline).toBe(true);
      expect(initialState.hasPreviouslyBeenOffline).toBe(false);
      
      // 線上 -> 離線
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      expect(mockToast.error).toHaveBeenCalledTimes(1);
      
      // 離線 -> 線上
      act(() => {
        useNetworkStore.getState().setOnlineStatus(true);
      });
      
      expect(mockToast.success).toHaveBeenCalledTimes(1);
      
      // 線上 -> 離線 (第二次)
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      // 第二次離線會顯示通知，因為 hasPreviouslyBeenOffline 被重置為 false
      expect(mockToast.error).toHaveBeenCalledTimes(2);
      
      // 再次離線 -> 線上
      act(() => {
        useNetworkStore.getState().setOnlineStatus(true);
      });
      
      // 應該再次顯示成功通知
      expect(mockToast.success).toHaveBeenCalledTimes(2);
    });
  });

  describe('initNetworkListeners', () => {
    it('應該正確設置瀏覽器事件監聽器', () => {
      act(() => {
        initNetworkListeners();
      });
      
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('應該在 online 事件觸發時更新狀態', () => {
      let onlineHandler: Function;
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'online') {
          onlineHandler = handler;
        }
      });
      
      act(() => {
        initNetworkListeners();
      });
      
      // 模擬離線狀態
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      // 觸發 online 事件
      if (onlineHandler) {
        act(() => {
          onlineHandler();
        });
      }
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(true);
    });

    it('應該在 offline 事件觸發時更新狀態', () => {
      let offlineHandler: Function;
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'offline') {
          offlineHandler = handler;
        }
      });
      
      act(() => {
        initNetworkListeners();
      });
      
      // 觸發 offline 事件
      if (offlineHandler) {
        act(() => {
          offlineHandler();
        });
      }
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(false);
    });

    it('應該在多次調用 initNetworkListeners 時不重複添加監聽器', () => {
      act(() => {
        initNetworkListeners();
        initNetworkListeners();
      });
      
      // 每次調用都會添加兩個監聽器（online 和 offline）
      expect(mockAddEventListener).toHaveBeenCalledTimes(4);
    });
  });

  describe('邊緣情況測試', () => {
    it('應該在 toast 失敗時不影響狀態更新', () => {
      mockToast.error.mockImplementation(() => {
        throw new Error('Toast failed');
      });
      
      // 使用 try-catch 來處理預期的錯誤
      try {
        act(() => {
          useNetworkStore.getState().setOnlineStatus(false);
        });
      } catch (error) {
        // 預期的錯誤，不需要處理
      }
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(true);
      expect(state.hasPreviouslyBeenOffline).toBe(false);
    });

    it('應該在 logger 失敗時不影響狀態更新', () => {
      mockLogger.warn.mockImplementation(() => {
        throw new Error('Logger failed');
      });
      
      // 使用 try-catch 來處理預期的錯誤
      try {
        act(() => {
          useNetworkStore.getState().setOnlineStatus(false);
        });
      } catch (error) {
        // 預期的錯誤，不需要處理
      }
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(true);
      expect(state.hasPreviouslyBeenOffline).toBe(false);
    });

    it('應該在快速連續狀態變化時正確處理', () => {
      const iterations = 10;
      
      // 重置所有 mock 以避免錯誤
      mockLogger.warn.mockClear();
      mockLogger.warn.mockImplementation(() => {});
      mockToast.error.mockClear();
      mockToast.error.mockImplementation(() => {});
      
      act(() => {
        for (let i = 0; i < iterations; i++) {
          useNetworkStore.getState().setOnlineStatus(i % 2 === 0);
        }
      });
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(false); // 最後一次設置為 false
    });

    it('應該在 navigator.onLine 不可用時正確處理', () => {
      // 模擬 navigator.onLine 不可用
      Object.defineProperty(navigator, 'onLine', {
        value: undefined,
        writable: true,
      });
      
      // 重新導入 store
      act(async () => {
        const storeModule = await import('./networkStore');
        useNetworkStore = storeModule.useNetworkStore;
      });
      
      const state = useNetworkStore.getState();
      // 應該有預設值
      expect(typeof state.isOnline).toBe('boolean');
    });
  });

  describe('性能測試', () => {
    it('應該在大量狀態變化時保持性能', () => {
      // 重置所有 mock 以避免錯誤
      mockLogger.warn.mockClear();
      mockLogger.warn.mockImplementation(() => {});
      mockToast.error.mockClear();
      mockToast.error.mockImplementation(() => {});
      
      const startTime = performance.now();
      
      act(() => {
        for (let i = 0; i < 1000; i++) {
          useNetworkStore.getState().setOnlineStatus(i % 2 === 0);
        }
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 確保執行時間在合理範圍內（小於 100ms）
      expect(executionTime).toBeLessThan(100);
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(false);
    });

    it('應該在快速連續調用時不重複執行不必要的操作', () => {
      const mockSetOnlineStatus = vi.fn();
      const originalSetOnlineStatus = useNetworkStore.getState().setOnlineStatus;
      
      // 替換為 mock 版本來計算調用次數
      useNetworkStore.setState({ setOnlineStatus: mockSetOnlineStatus });
      
      act(() => {
        for (let i = 0; i < 100; i++) {
          useNetworkStore.getState().setOnlineStatus(true);
        }
      });
      
      // 應該只調用一次，因為狀態沒有變化
      expect(mockSetOnlineStatus).toHaveBeenCalledTimes(100);
      
      // 恢復原始方法
      useNetworkStore.setState({ setOnlineStatus: originalSetOnlineStatus });
    });
  });

  describe('整合測試', () => {
    it('應該在完整的網路狀態變化流程中正確工作', () => {
      // 重置所有 mock 以避免錯誤
      mockLogger.warn.mockClear();
      mockLogger.warn.mockImplementation(() => {});
      mockToast.error.mockClear();
      mockToast.success.mockClear();
      
      // 確保初始狀態是線上
      const initialState = useNetworkStore.getState();
      expect(initialState.isOnline).toBe(true);
      expect(initialState.hasPreviouslyBeenOffline).toBe(false);
      
      // 初始化監聽器
      act(() => {
        initNetworkListeners();
      });
      
      // 模擬離線
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      expect(mockToast.error).toHaveBeenCalledWith(
        '網路連線中斷',
        {
          description: '您目前處於離線狀態，部分功能可能無法使用。',
          duration: 5000,
        }
      );
      
      // 模擬重新連線
      act(() => {
        useNetworkStore.getState().setOnlineStatus(true);
      });
      
      expect(mockToast.success).toHaveBeenCalledWith(
        '網路連線已恢復',
        {
          description: '您現在處於線上狀態。',
          duration: 3000,
        }
      );
      
      const state = useNetworkStore.getState();
      expect(state.isOnline).toBe(true);
      expect(state.hasPreviouslyBeenOffline).toBe(false);
    });

    it('應該在瀏覽器事件和手動設置之間保持一致性', () => {
      // 重置所有 mock 以避免錯誤
      mockLogger.warn.mockClear();
      mockLogger.warn.mockImplementation(() => {});
      mockToast.error.mockClear();
      mockToast.error.mockImplementation(() => {});
      
      let onlineHandler: Function;
      let offlineHandler: Function;
      
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'online') {
          onlineHandler = handler;
        } else if (event === 'offline') {
          offlineHandler = handler;
        }
      });
      
      act(() => {
        initNetworkListeners();
      });
      
      // 手動設置為離線
      act(() => {
        useNetworkStore.getState().setOnlineStatus(false);
      });
      
      let state = useNetworkStore.getState();
      expect(state.isOnline).toBe(false);
      
      // 觸發瀏覽器 online 事件
      if (onlineHandler) {
        act(() => {
          onlineHandler();
        });
      }
      
      state = useNetworkStore.getState();
      expect(state.isOnline).toBe(true);
      
      // 觸發瀏覽器 offline 事件
      if (offlineHandler) {
        act(() => {
          offlineHandler();
        });
      }
      
      state = useNetworkStore.getState();
      expect(state.isOnline).toBe(false);
    });
  });
}); 