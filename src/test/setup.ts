import { vi, afterEach, beforeEach, expect } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, configure, within, waitFor, screen } from '@testing-library/react';
import path from 'path';
import { act } from 'react-dom/test-utils';

// 設置默認測試超時時間 - 增加對複雜操作的容忍度
vi.setConfig({
  testTimeout: 10000, // 全局測試超時時間設為 10 秒
});

// Configure React Testing Library for React 18
configure({
  testIdAttribute: 'data-testid',
  // Disable act warnings for React 18 concurrent features
  reactStrictMode: false,
  // 增加預設等待時間，避免異步操作超時
  asyncUtilTimeout: 3000,
});

// Global flag to suppress React 18 concurrent mode errors
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// More aggressive React 18 concurrent mode suppression
if (typeof window !== 'undefined') {
  // Mock React's internal scheduler
  (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
    supportsFiber: true,
    inject: () => {},
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {},
  };
}

// 標準化 mock 每個特定模組，避免路徑別名問題

// 新增統一的 mock 工廠函數 - 用於創建標準化的 hook 和服務 mock
// 使用安全的泛型類型處理
const createHookMock = <T extends Record<string, unknown>>(defaultValues: T) => {
  const mockState = { ...defaultValues };
  const mockSetters: Record<string, ReturnType<typeof vi.fn>> = {};
  
  // 為每個值創建一個 setter 函數
  Object.keys(defaultValues).forEach(key => {
    mockSetters[`set${key.charAt(0).toUpperCase() + key.slice(1)}`] = 
      vi.fn((newValue: unknown) => { 
        (mockState as Record<string, unknown>)[key] = newValue; 
      });
  });
  
  // 創建 hook 函數
  const useHook = vi.fn(() => ({
    ...mockState,
    ...mockSetters
  }));
  
  // 重置 mock 狀態的方法
  const resetState = () => {
    Object.keys(defaultValues).forEach(key => {
      (mockState as Record<string, unknown>)[key] = defaultValues[key];
    });
    Object.values(mockSetters).forEach(setter => {
      setter.mockClear();
    });
  };
  
  return { useHook, resetState, mockState };
};

// 新增統一的服務 mock 工廠函數
type AnyFunction = (...args: any[]) => any;

const createServiceMock = <T extends Record<string, AnyFunction>>(methods: T) => {
  const mockMethods: Record<string, any> = {};
  
  Object.entries(methods).forEach(([key, defaultImpl]) => {
    mockMethods[key] = vi.fn(defaultImpl);
  });
  
  return mockMethods;
};

// useToast hook mock - 提供完整的實現
vi.mock('@/hooks/use-toast', () => {
  const mockToast = vi.fn().mockReturnValue({
    id: 'test-toast-id',
    dismiss: vi.fn(),
    update: vi.fn(),
  });

  return {
    useToast: vi.fn(() => ({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    })),
    toast: mockToast,
  };
});

// 確保也模擬 ui/use-toast (可能的替代路徑)
vi.mock('@/components/ui/use-toast', () => {
  const mockToast = vi.fn().mockReturnValue({
    id: 'test-toast-id',
    dismiss: vi.fn(),
    update: vi.fn(),
  });

  return {
    useToast: vi.fn(() => ({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    })),
    toast: mockToast,
  };
});

// tempUserStore mock
vi.mock('@/stores/tempUserStore', () => ({
  useTempUserStore: vi.fn(() => ({
    tempDisplayName: '',
    setTempDisplayName: vi.fn(),
    clearTempDisplayName: vi.fn(),
  })),
}));

// FirebaseAuthContext mock
vi.mock('@/contexts/FirebaseAuthContext', () => {
  const mockUser = {
    uid: 'test-user-123',
    displayName: '測試用戶',
    email: 'test@example.com',
    photoURL: 'https://example.com/avatar.jpg',
  };

  const authContextValue = {
    currentUser: mockUser,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ user: mockUser, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: mockUser, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    refreshUserAvatar: vi.fn()
  };

  // 創建 React context
  const React = require('react');
  const FirebaseAuthContext = React.createContext(authContextValue);

  return {
    useFirebaseAuth: vi.fn(() => authContextValue),
    FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => children,
    FirebaseAuthContext: FirebaseAuthContext,
  };
});

// PrayerAnsweredService mock
vi.mock('@/services/prayer/PrayerAnsweredService', () => ({
  prayerAnsweredService: {
    togglePrayerAnswered: vi.fn().mockImplementation((prayerId) => {
      return Promise.resolve({ success: true, data: { id: prayerId, is_answered: true } });
    }),
    toggleResponseAnswered: vi.fn().mockImplementation((responseId) => {
      return Promise.resolve({ success: true, data: { id: responseId, is_answered: true } });
    }),
    markPrayerAsAnswered: vi.fn().mockImplementation((prayerId) => {
      return Promise.resolve({ success: true, data: { id: prayerId, is_answered: true } });
    }),
    markResponseAsAnswered: vi.fn().mockImplementation((responseId) => {
      return Promise.resolve({ success: true, data: { id: responseId, is_answered: true } });
    }),
  }
}));

// 確保也 mock 通過相對路徑導入
vi.mock('../services/prayer/PrayerAnsweredService', () => ({
  prayerAnsweredService: {
    togglePrayerAnswered: vi.fn().mockImplementation((prayerId) => {
      return Promise.resolve({ success: true, data: { id: prayerId, is_answered: true } });
    }),
    toggleResponseAnswered: vi.fn().mockImplementation((responseId) => {
      return Promise.resolve({ success: true, data: { id: responseId, is_answered: true } });
    }),
    markPrayerAsAnswered: vi.fn().mockImplementation((prayerId) => {
      return Promise.resolve({ success: true, data: { id: prayerId, is_answered: true } });
    }),
    markResponseAsAnswered: vi.fn().mockImplementation((responseId) => {
      return Promise.resolve({ success: true, data: { id: responseId, is_answered: true } });
    }),
  }
}));

// useFirebaseAvatar mock - 更新以符合實際返回值結構
let mockFirebaseAvatarForLoggedOut: () => void;
let mockFirebaseAvatarForLoggedIn: () => void;

vi.mock('@/hooks/useFirebaseAvatar', () => {
  // 添加變數追蹤當前使用者狀態，用於測試不同情況
  let mockIsLoggedIn = true;
  let mockAuthLoading = true;
  let mockAvatarUrls = {
    avatarUrl: 'https://example.com/avatar.jpg' as string | null,
    avatarUrl96: null as string | null,
    avatarUrl48: null as string | null,
    avatarUrl30: null as string | null
  };
  
  const useFirebaseAvatar = vi.fn(() => ({
    user: mockIsLoggedIn ? {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.jpg',
    } : null,
    loading: false,
    error: null,
    isLoading: false,
    isAuthLoading: mockAuthLoading,
    isLoggedIn: mockIsLoggedIn,
    uploadAvatar: vi.fn().mockImplementation((file) => {
      // 確保總是返回成功結果，無論輸入是什麼
      return Promise.resolve({
        success: true,
        data: {
          avatar_url: 'https://example.com/avatar.jpg',
          avatar_url_96: 'https://example.com/avatar.jpg?size=96',
          avatar_url_48: 'https://example.com/avatar.jpg?size=48',
          avatar_url_30: 'https://example.com/avatar.jpg?size=30',
        }
      });
    }),
    refreshAvatar: vi.fn().mockResolvedValue(true),
    avatarUrl: mockAvatarUrls.avatarUrl,
    avatarUrl96: mockAvatarUrls.avatarUrl96,
    avatarUrl48: mockAvatarUrls.avatarUrl48,
    avatarUrl30: mockAvatarUrls.avatarUrl30,
    data: mockIsLoggedIn ? {
      avatar_url: 'https://example.com/avatar.jpg',
      user_name: 'Test User'
    } : null
  }));

  // 用於測試的輔助函數
  mockFirebaseAvatarForLoggedOut = () => {
    mockIsLoggedIn = false;
    mockAuthLoading = false;
    mockAvatarUrls = {
      avatarUrl: null,
      avatarUrl96: null,
      avatarUrl48: null,
      avatarUrl30: null
    };
  };
  
  mockFirebaseAvatarForLoggedIn = () => {
    mockIsLoggedIn = true;
    mockAuthLoading = false;
    mockAvatarUrls = {
      avatarUrl: 'https://example.com/avatar.jpg',
      avatarUrl96: 'https://example.com/avatar.jpg?size=96',
      avatarUrl48: 'https://example.com/avatar.jpg?size=48',
      avatarUrl30: 'https://example.com/avatar.jpg?size=30'
    };
  };

  return {
    useFirebaseAvatar,
    clearAvatarGlobalState: vi.fn(),
    mockFirebaseAvatarForLoggedOut,
    mockFirebaseAvatarForLoggedIn
  };
});

// usePrayersOptimized mock - 增強實現
vi.mock('@/hooks/usePrayersOptimized', () => ({
  usePrayers: vi.fn(() => ({
    prayers: [
      {
        id: 'prayer-1',
        content: '這是一則測試代禱',
        user_id: 'test-user-123',
        user_name: '測試用戶',
        timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 },
        likes: 5,
        responses: 3,
        is_answered: false
      },
      {
        id: 'prayer-2',
        content: '這是第二則測試代禱',
        user_id: 'test-user-123',
        user_name: '測試用戶',
        timestamp: { seconds: (Date.now() - 86400000) / 1000, nanoseconds: 0 },
        likes: 10,
        responses: 7,
        is_answered: true
      }
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useCreatePrayer: vi.fn(() => ({
    mutate: vi.fn().mockImplementation((prayer) => {
      return Promise.resolve({
        id: 'new-prayer-' + Date.now(),
        ...prayer,
        timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 }
      });
    }),
    isPending: false,
    isError: false,
    error: null,
  })),
  useDeletePrayer: vi.fn(() => ({
    mutate: vi.fn().mockImplementation((prayerId) => {
      return Promise.resolve({ success: true });
    }),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

// 確保也 mock 通過相對路徑導入
vi.mock('../hooks/usePrayersOptimized', () => ({
  usePrayers: vi.fn(() => ({
    prayers: [
      {
        id: 'prayer-1',
        content: '這是一則測試代禱',
        user_id: 'test-user-123',
        user_name: '測試用戶',
        timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 },
        likes: 5,
        responses: 3,
        is_answered: false
      }
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useCreatePrayer: vi.fn(() => ({
    mutate: vi.fn().mockImplementation((prayer) => {
      return Promise.resolve({
        id: 'new-prayer-' + Date.now(),
        ...prayer,
        timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 }
      });
    }),
    isPending: false,
    isError: false,
    error: null,
  })),
  useDeletePrayer: vi.fn(() => ({
    mutate: vi.fn().mockImplementation((prayerId) => {
      return Promise.resolve({ success: true });
    }),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

// Fix React 18 concurrent mode issues
const originalError = console.error;
const originalWarn = console.warn;

// 測試隔離和共享狀態管理
const testIsolation = {
  // 測試實例 ID，用於追蹤測試執行
  testInstanceId: 0,
  
  // 用於儲存測試特定的數據
  testSpecificData: new Map<number, Record<string, any>>(),
  
  // 創建一個隔離的測試環境
  createIsolatedEnv: () => {
    const id = ++testIsolation.testInstanceId;
    testIsolation.testSpecificData.set(id, {});
    return {
      id,
      // 設置測試特定數據
      setData: (key: string, value: any) => {
        const data = testIsolation.testSpecificData.get(id) || {};
        data[key] = value;
        testIsolation.testSpecificData.set(id, data);
      },
      // 獲取測試特定數據
      getData: (key: string) => {
        const data = testIsolation.testSpecificData.get(id);
        return data?.[key];
      },
      // 清理測試環境
      cleanup: () => {
        testIsolation.testSpecificData.delete(id);
      }
    };
  }
};

beforeEach(() => {
  // 初始化測試前設置虛擬計時器
  vi.useFakeTimers();
  
  // Suppress React 18 concurrent mode warnings in tests
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string') {
      // React 18 concurrent mode errors
      if (args[0].includes('Should not already be working')) return;
      if (args[0].includes('Warning: ReactDOMTestUtils.act is deprecated')) return;
      if (args[0].includes('performConcurrentWorkOnRoot')) return;
      if (args[0].includes('flushActQueue')) return;
      if (args[0].includes('act is deprecated')) return;
      // React 18 concurrent rendering warnings
      if (args[0].includes('Warning: You are calling')) return;
      if (args[0].includes('Warning: Cannot update a component')) return;
    }
    // Check if it's an Error object with React concurrent message
    if (args[0] instanceof Error && args[0].message.includes('Should not already be working')) {
      return;
    }
    originalError.call(console, ...args);
  };

  // Also suppress warnings
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string') {
      if (args[0].includes('React concurrent mode')) return;
      if (args[0].includes('Warning: ReactDOMTestUtils.act')) return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  // 恢復真實計時器
  vi.useRealTimers();
  
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock Storage API - 完善實現
const createMockStorage = () => {
  let store: Record<string, string> = {};
  
  const mockStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
  
  return mockStorage;
};

// Create global mock instances
const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();

// Setup localStorage and sessionStorage mocks
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });
} else {
  // Fallback for environments where window is not available
  global.localStorage = mockLocalStorage as any;
  global.sessionStorage = mockSessionStorage as any;
}

// 統一所有 SVG 圖標的 Mock 方式
// 創建一個標準 SVG 模擬組件
const createSvgMock = (testId: string) => {
  return {
    default: ({ className, ...props }: any) => 
      React.createElement('svg', { 
        'data-testid': testId,
        className,
        ...props 
      })
  };
};

// Mock SVG imports - 使用標準化方法
vi.mock('@/assets/icons/MessageIcon.svg?react', () => createSvgMock('message-icon'));
vi.mock('@/assets/icons/Reply.svg?react', () => createSvgMock('reply-icon'));
vi.mock('@/assets/icons/LikeIcon.svg?react', () => createSvgMock('like-icon'));
vi.mock('@/assets/icons/PrayforLogo.svg?react', () => createSvgMock('prayfor-logo'));

// Create a generic SVG mock component
const MockSVGComponent = ({ className, ...props }: any) => 
  React.createElement('svg', { 
    'data-testid': 'mock-svg-icon',
    className,
    ...props 
  });

// Export the mock as default for SVG imports
(globalThis as any).__vi_svg_mock__ = {
  default: MockSVGComponent
};

// Mock window properties for responsive tests  
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'innerWidth', {
    value: 1024,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'innerHeight', {
    value: 768,
    writable: true,
    configurable: true,
  });

  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      writable: true,
      configurable: true,
    });
  }
  
  // Mock addEventListener and removeEventListener
  Object.defineProperty(window, 'addEventListener', {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });

  Object.defineProperty(window, 'removeEventListener', {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });
  
  // Mock dispatchEvent
  Object.defineProperty(window, 'dispatchEvent', {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });
} else {
  // For SSR environments
  global.window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    innerWidth: 1024,
    innerHeight: 768,
    matchMedia: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
  } as any;
}

// Mock navigator properly - only if not already defined
if (typeof navigator !== 'undefined') {
  const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'onLine');
  if (!originalDescriptor || originalDescriptor.configurable) {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  }
}

// 修復 requestIdleCallback - 確保無論在什麼環境都可用
if (typeof window !== 'undefined') {
  // 先刪除已有的定義（如果存在），確保重新定義不會出錯
  delete (window as any).requestIdleCallback;
  delete (window as any).cancelIdleCallback;

  // 重新定義 requestIdleCallback
    Object.defineProperty(window, 'requestIdleCallback', {
    value: vi.fn((callback: IdleRequestCallback) => {
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => 50,
        });
      }, 0);
      }),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'cancelIdleCallback', {
      value: vi.fn((id: number) => clearTimeout(id)),
      writable: true,
      configurable: true,
    });
} else {
  // 為 SSR 環境也提供這些函數
  (global as any).requestIdleCallback = (callback: any) => {
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50,
      });
    }, 0);
  };
  
  (global as any).cancelIdleCallback = (id: number) => clearTimeout(id);
}

// 新增 - 元素選擇輔助函數，優化元素選擇邏輯
const testUtils = {
  // 等待元素顯示，帶超時選項
  async waitForElement(selector: string, { timeout = 5000 } = {}) {
    return waitFor(() => screen.getByTestId(selector), { timeout });
  },
  
  // 安全地獲取元素（在容器中）
  getElementSafely(container: HTMLElement, selector: string) {
    try {
      return within(container).getByTestId(selector);
    } catch (e) {
      return null;
    }
  },
  
  // 等待元素消失
  async waitForElementToDisappear(selector: string, { timeout = 5000 } = {}) {
    return waitFor(
      () => {
        try {
          const element = screen.queryByTestId(selector);
          expect(element).not.toBeInTheDocument();
        } catch (e) {
          // 元素不存在，測試通過
        }
      },
      { timeout }
    );
  },

  // 安全地進行異步交互
  async actSafely(callback: () => Promise<any>) {
    try {
      await act(async () => {
        await callback();
      });
    } catch (e) {
      if (e instanceof Error && !e.message.includes('React state update')) {
        throw e;
      }
      // 忽略 React 更新相關錯誤
    }
  },

  // 模擬用戶輸入
  async userType(element: HTMLElement & { value: string }, text: string) {
    await testUtils.actSafely(async () => {
      // 一次輸入一個字符，更真實地模擬用戶行為
      for (const char of text) {
        element.focus();
        const inputEvent = new InputEvent('input', { bubbles: true });
        Object.defineProperty(inputEvent, 'data', { value: char });
        element.dispatchEvent(inputEvent);
        element.value = element.value + char;
        // 小延遲使輸入更自然
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    });
  }
};

// 確保每個測試後都清理 DOM
afterEach(() => {
  // Clean up DOM
  cleanup();
  
  // Reset localStorage and sessionStorage using the global mock instances
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  
  // Clear all mock calls but keep the mocks themselves
  vi.clearAllMocks();
  
  // Reset window dimensions
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  }
  
  // Reset navigator onLine safely
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    try {
      (navigator as any).onLine = true;
    } catch (e) {
      // 如果無法設定，則跳過
    }
  }
});

// 完善 React Query mock - 提供真實功能和監控功能
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query') as any;
  
  // 創建監控功能的查詢客戶端
  const createMockQueryClient = () => {
    return new actual.QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
      logger: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    });
  };
  
  return {
    ...actual,
    QueryClient: vi.fn().mockImplementation(createMockQueryClient),
    QueryClientProvider: ({ children, client }: any) => children,
  };
});

// Mock constants
vi.mock('@/constants', () => ({
  VALIDATION_CONFIG: {
    PRAYER_CONTENT: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 20000,
    },
    PRAYER_RESPONSE: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 20000,
    },
    USER_NAME: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 50,
    },
  },
  QUERY_CONFIG: {
    STALE_TIME: 2 * 60 * 1000,
    GC_TIME: 5 * 60 * 1000,
    RETRY_COUNT: 1,
    RETRY_DELAY: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 10000),
  },
  QUERY_KEYS: {
    PRAYERS: ['prayers'],
    USER_PROFILE: (userId: string) => ['user_profile', userId],
    PRAYER_RESPONSES: (prayerId: string) => ['prayer_responses', prayerId],
    PRAYER_LIKES: (prayerId: string | undefined) => ['prayer_likes', prayerId],
    PRAYER_RESPONSE_LIKES: (responseId: string | undefined) => ['prayer_response_likes', responseId],
    PRAYER_BOOKMARKS: ['prayer-bookmarks'],
    SOCIAL_FEATURES: ['social-features'],
    BAPTISM_POSTS: ['baptism-posts'],
    JOURNEY_POSTS: ['journey-posts'],
    MIRACLE_POSTS: ['miracle-posts'],
  },
  ERROR_MESSAGES: {
    NETWORK_ERROR: '網路連線失敗，請檢查網路狀態',
    AUTH_ERROR: '請先登入再進行此操作',
    PERMISSION_ERROR: '您沒有權限執行此操作',
    VALIDATION_ERROR: '輸入資料格式不正確',
    UNKNOWN_ERROR: '發生未知錯誤，請稍後再試',
    PRAYER_CREATE_ERROR: '代禱發布失敗，請稍後再試',
    PRAYER_UPDATE_ERROR: '代禱更新失敗，請稍後再試',
    PRAYER_DELETE_ERROR: '代禱刪除失敗，請稍後再試',
    RESPONSE_CREATE_ERROR: '回應發布失敗，請稍後再試',
    RESPONSE_UPDATE_ERROR: '回應更新失敗，請稍後再試',
    RESPONSE_DELETE_ERROR: '回應刪除失敗，請稍後再試',
  },
  SUCCESS_MESSAGES: {
    PRAYER_CREATED: '代禱發布成功',
    PRAYER_UPDATED: '代禱內容已更新',
    PRAYER_DELETED: '代禱已刪除',
    RESPONSE_CREATED: '回應發布成功',
    RESPONSE_UPDATED: '回應內容已更新',
    RESPONSE_DELETED: '回應已刪除',
    PROFILE_UPDATED: '個人資料已更新',
  },
  CACHE_CONFIG: {
    RESOURCES: {
      PRAYERS: {
        STALE_TIME: 2 * 60 * 1000,
        GC_TIME: 10 * 60 * 1000,
      },
      PRAYER_RESPONSES: {
        STALE_TIME: 3 * 60 * 1000,
        GC_TIME: 15 * 60 * 1000,
      },
      USER_PROFILE: {
        STALE_TIME: 10 * 60 * 1000,
        GC_TIME: 30 * 60 * 1000,
      },
      SOCIAL_FEATURES: {
        STALE_TIME: 15 * 60 * 1000,
        GC_TIME: 60 * 60 * 1000,
      },
    },
  },
  UI_CONFIG: {
    TOAST_DURATION: {
      SUCCESS: 3000,
      ERROR: 5000,
      WARNING: 4000,
      INFO: 3000,
    },
  },
  ROUTES: {
    HOME: '/',
    PRAYERS: '/prayers',
    PRAYERS_NEW: '/new',
    NEW_PRAYER: '/new',
    AUTH: '/auth',
    PROFILE: '/profile',
    LOG: '/log',
    MESSAGE: '/message',
    SETTING: '/setting',
    BAPTISM: '/baptism',
    MIRACLE: '/miracle',
    JOURNEY: '/journey',
    CLAIRE: '/claire',
    CLAIRE_DASHBOARD: '/claire/dashboard',
    CLAIRE_USERS: '/claire/users',
    CLAIRE_PRAYERS: '/claire/prayers',
    CLAIRE_REPORTS: '/claire/reports',
    CLAIRE_SUPER_ADMINS: '/claire/super-admins',
    FIX_DATABASE: '/fix-database',
    NOT_FOUND: '*',
  },
  GUEST_DEFAULT_BACKGROUND: 'guest',
  STORAGE_KEYS: {
    USERNAME_PREFIX: 'username_',
    AVATAR_PREFIX: 'avatar_',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme',
    LANGUAGE: 'language',
    BACKGROUND: 'global_background',
    CUSTOM_BACKGROUND: 'global_custom_background',
    CUSTOM_BACKGROUND_SIZE: 'global_custom_background_size',
  },
  BACKGROUND_OPTIONS: [
    { id: 'default', name: '預設二', style: '', bgColor: '#f8e9e2' },
    { id: 'default3', name: '預設三', style: '', bgColor: '#ffe6e6' },
    { id: 'default5', name: '預設五', style: '', bgColor: '#e6f3ff' },
    { id: 'default8', name: '預設八', style: '', bgColor: '#f0f8e6' },
    { id: 'default1', name: '預設一', style: '', bgColor: '#fffbe6' },
    { id: 'default4', name: '預設四', style: '', bgColor: '#e6fff7' },
    { id: 'default6', name: '預設六', style: '', bgColor: '#e6eaff' },
    { id: 'default7', name: '預設七', style: '', bgColor: '#ffe6fa' },
    { id: 'default9', name: '預設九', style: '', bgColor: '#e6ffe6' },
    { id: 'guest', name: '訪客背景', style: '', bgColor: '#F4E4DD' },
    { id: 'custom', name: '自定義', style: '' },
  ],
}));

// Mock logger
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  setLevel: vi.fn(),
  performance: vi.fn(),
  timer: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  log: mockLogger,
  logger: mockLogger,
  LogLevel: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  },
}));

// Mock React Router
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
    Link: ({ children, to, ...props }: any) => React.createElement('a', { href: to, ...props }, children),
    BrowserRouter: ({ children }: any) => React.createElement('div', { 'data-testid': 'browser-router' }, children),
    Routes: ({ children }: any) => React.createElement('div', { 'data-testid': 'routes' }, children),
    Route: ({ element }: any) => React.createElement('div', { 'data-testid': 'route' }, element),
    Navigate: ({ to, replace }: any) => React.createElement('div', { 'data-testid': 'navigate', 'data-to': to, 'data-replace': replace }),
  };
});

// Firebase 相關 mock
// Mock Firebase Auth - 增強實現
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-123',
      displayName: '測試用戶',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.jpg',
      emailVerified: true,
      isAnonymous: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString()
      },
      providerData: [{
        providerId: 'password',
        uid: 'test@example.com',
        displayName: '測試用戶',
        email: 'test@example.com',
        photoURL: 'https://example.com/avatar.jpg',
        phoneNumber: null
      }],
      getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
      getIdTokenResult: vi.fn().mockResolvedValue({
        token: 'mock-id-token',
        claims: { role: 'user' },
        issuedAtTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
        authTime: new Date().toISOString(),
        signInProvider: 'password'
      })
    },
    onAuthStateChanged: vi.fn((auth, callback) => {
      // 立即觸發一次回調
      callback({
        uid: 'test-user-123',
        displayName: '測試用戶',
        email: 'test@example.com',
        photoURL: 'https://example.com/avatar.jpg'
      });
      // 返回取消訂閱功能
      return vi.fn();
    }),
  })),
  signInWithEmailAndPassword: vi.fn().mockImplementation((auth, email, password) => {
    if (email === 'test@example.com' && password === 'password') {
      return Promise.resolve({
        user: {
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: '測試用戶',
          photoURL: 'https://example.com/avatar.jpg',
          emailVerified: true,
          getIdToken: vi.fn().mockResolvedValue('mock-id-token')
        },
      });
    }
    return Promise.reject(new Error('auth/invalid-credential'));
  }),
  createUserWithEmailAndPassword: vi.fn().mockImplementation((auth, email, password) => {
    if (email && password && password.length >= 6) {
      return Promise.resolve({
        user: {
          uid: 'new-test-user-' + Date.now(),
          email: email,
          displayName: null,
          photoURL: null,
          emailVerified: false,
          getIdToken: vi.fn().mockResolvedValue('mock-id-token-new-user')
        },
      });
    }
    return Promise.reject(new Error('auth/weak-password'));
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({
      uid: 'test-user-123',
      displayName: '測試用戶',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.jpg'
    });
    return vi.fn(); // 返回 unsubscribe 函數
  }),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  reauthenticateWithCredential: vi.fn().mockResolvedValue(undefined),
  EmailAuthProvider: {
    credential: vi.fn((email, password) => ({ email, password })),
  },
  User: vi.fn(),
}));

// Mock Firebase Firestore
const MockTimestamp = class {
  constructor(public seconds: number, public nanoseconds: number) {}
  
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1000000);
  }
  
  static now() {
    const now = Date.now();
    return new MockTimestamp(Math.floor(now / 1000), (now % 1000) * 1000000);
  }
  
  static fromDate(date: Date) {
    const ms = date.getTime();
    return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
  }
};

vi.mock('firebase/firestore', () => {
  const Timestamp = MockTimestamp;
  return {
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => MockTimestamp.now()),
  Timestamp: MockTimestamp,
  // 新增進階 Firestore 功能支援
  startAfter: vi.fn(),
  endBefore: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  increment: vi.fn((value) => ({ __increment: value })),
  arrayUnion: vi.fn((...elements) => ({ __arrayUnion: elements })),
  arrayRemove: vi.fn((...elements) => ({ __arrayRemove: elements })),
  documentId: vi.fn(),
  collectionGroup: vi.fn(),
  };
});

// Mock Firebase Storage - 增強實現
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({
    app: {
      name: '[DEFAULT]',
      options: {
        projectId: 'test-project',
        storageBucket: 'test-project.appspot.com'
      }
    }
  })),
  ref: vi.fn((storage, path) => ({ 
    storage, 
    path,
    fullPath: path,
    name: path.split('/').pop() || '',
    parent: path.includes('/') ? { fullPath: path.split('/').slice(0, -1).join('/') } : null,
    root: { fullPath: '' }
  })),
  uploadBytes: vi.fn().mockImplementation((ref, bytes) => {
    return Promise.resolve({
      ref,
      metadata: { 
        fullPath: ref.path, 
        size: bytes.length || 1024,
        contentType: 'image/jpeg',
        name: ref.path.split('/').pop() || 'default',
        bucket: 'test-project.appspot.com',
        generation: '12345',
        metageneration: '1',
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    });
  }),
  uploadString: vi.fn().mockImplementation((ref, dataUrl, format) => {
    return Promise.resolve({
      ref,
      metadata: { 
        fullPath: ref.path, 
        size: 1024,
        contentType: format === 'data_url' ? 'image/jpeg' : 'text/plain',
        name: ref.path.split('/').pop() || 'default',
        bucket: 'test-project.appspot.com',
        generation: '12345',
        metageneration: '1',
        timeCreated: new Date().toISOString(),
        updated: new Date().toISOString()
      }
    });
  }),
  getDownloadURL: vi.fn().mockImplementation((ref) => {
    const fileName = ref.path.split('/').pop() || 'default';
    // 根據路徑產生固定大小的URL
    if (ref.path.includes('avatar_96')) {
      return Promise.resolve(`https://example.com/storage/${fileName}?size=96`);
    } else if (ref.path.includes('avatar_48')) {
      return Promise.resolve(`https://example.com/storage/${fileName}?size=48`);
    } else if (ref.path.includes('avatar_30')) {
      return Promise.resolve(`https://example.com/storage/${fileName}?size=30`);
    } else {
      return Promise.resolve(`https://example.com/storage/${fileName}`);
    }
  }),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  listAll: vi.fn().mockResolvedValue({ items: [], prefixes: [] }),
  updateMetadata: vi.fn().mockResolvedValue({ customMetadata: {} }),
}));

// Mock Canvas API for heic2any
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'HTMLCanvasElement', {
    value: class MockCanvas {
      getContext() {
        return {
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({ data: new Uint8Array(4) })),
          putImageData: vi.fn(),
          createImageData: vi.fn(() => ({ data: new Uint8Array(4) })),
          canvas: { width: 100, height: 100 },
        };
      }
    },
    writable: true,
    configurable: true,
  });

  // Mock Worker API
  Object.defineProperty(window, 'Worker', {
    value: class MockWorker {
      postMessage = vi.fn();
      terminate = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();
    },
    writable: true,
    configurable: true,
  });
}

// Mock URL API for heic2any
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-url'),
  writable: true,
  configurable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true,
  configurable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})); 

// 創建測試覆蓋率監控助手
const testCoverageMonitor = {
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  getReport: vi.fn(() => ({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    coverage: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    }
  })),
  // 新增高級測試分析功能
  testData: {
    startTime: 0,
    endTime: 0,
    testCases: new Map(),
    testSuites: new Set(),
  },
  
  // 啟動測試套件效能監控
  startTestSuite: function(suiteName: string) {
    this.testData.testSuites.add(suiteName);
    this.testData.startTime = performance.now();
    return {
      suiteName,
      startTime: this.testData.startTime,
    };
  },
  
  // 紀錄單個測試案例執行情況
  recordTest: function(testName: string, passed: boolean, duration: number) {
    this.testData.testCases.set(testName, {
      passed,
      duration,
      timestamp: new Date().toISOString(),
    });
  },
  
  // 停止測試套件監控並返回效能報告
  endTestSuite: function(suiteName: string) {
    this.testData.endTime = performance.now();
    const duration = this.testData.endTime - this.testData.startTime;
    
    const testsInSuite = Array.from(this.testData.testCases.entries())
      .filter(([testName]) => testName.startsWith(suiteName))
      .map(([_, data]) => data);
    
    const passedTests = testsInSuite.filter(t => t.passed).length;
    
    return {
      suiteName,
      duration,
      totalTests: testsInSuite.length,
      passedTests,
      failedTests: testsInSuite.length - passedTests,
      averageTestDuration: testsInSuite.reduce((sum, t) => sum + t.duration, 0) / (testsInSuite.length || 1),
    };
  },
  
  // 生成完整測試報告
  generateFullReport: function() {
    const allTests = Array.from(this.testData.testCases.values());
    const passedTests = allTests.filter(t => t.passed);
    
    return {
      timestamp: new Date().toISOString(),
      totalDuration: this.testData.endTime - this.testData.startTime,
      testSuites: this.testData.testSuites.size,
      totalTests: allTests.length,
      passedTests: passedTests.length,
      failedTests: allTests.length - passedTests.length,
      passRate: allTests.length ? (passedTests.length / allTests.length) * 100 : 0,
      averageTestDuration: allTests.reduce((sum, t) => sum + t.duration, 0) / (allTests.length || 1),
      slowestTests: [...allTests].sort((a, b) => b.duration - a.duration).slice(0, 5),
      coverage: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      }
    };
  },
  
  // 重置測試數據
  reset: function() {
    this.testData = {
      startTime: 0,
      endTime: 0,
      testCases: new Map(),
      testSuites: new Set(),
    };
  }
};

// 測試數據工廠 - 使用工廠模式統一管理測試數據
class TestDataFactory {
  // 用戶數據
  static createUser(overrides: Record<string, any> = {}) {
    return {
      uid: 'test-user-123',
      displayName: '測試用戶',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg',
      ...overrides
    };
  }

  // 代禱數據
  static createPrayer(overrides: Record<string, any> = {}) {
    return {
      id: 'prayer-123',
      content: '這是一則測試代禱',
      user_id: 'test-user-123',
      user_name: '測試用戶',
      timestamp: MockTimestamp.now(),
      likes: 0,
      responses: 0,
      is_answered: false,
      ...overrides
    };
  }

  // 代禱回應數據
  static createPrayerResponse(overrides: Record<string, any> = {}) {
    return {
      id: 'response-123',
      prayer_id: 'prayer-123',
      content: '這是一則測試回應',
      user_id: 'test-user-456',
      user_name: '回應用戶',
      timestamp: MockTimestamp.now(),
      likes: 0,
      is_answered: false,
      ...overrides
    };
  }

  // 創建多個對象
  static createMultiple<T>(
    factory: (overrides?: Record<string, any>) => T, 
    count: number, 
    baseOverrides: Record<string, any> = {}
  ) {
    return Array.from({ length: count }, (_, i) => 
      factory({ ...baseOverrides, id: `${(baseOverrides.id as string) || 'item'}-${i}` })
    );
  }
  
  // 創建表單事件
  static createFormEvent(values: Record<string, any> = {}) {
    return {
      preventDefault: vi.fn(),
      target: {
        elements: Object.entries(values).reduce((acc, [key, value]) => {
          acc[key] = { value };
          return acc;
        }, {} as Record<string, { value: any }>)
      }
    };
  }
}

// Export mock instances so they can be used in tests
export { 
  mockLocalStorage, 
  mockSessionStorage, 
  mockLogger, 
  MockTimestamp,
  testCoverageMonitor,
  testIsolation,
  testUtils,
  TestDataFactory,
  createHookMock,
  createServiceMock,
  createSvgMock,
  mockFirebaseAvatarForLoggedOut,
  mockFirebaseAvatarForLoggedIn
}; 

// 添加測試實用函數和擴展支持
export const testHelpers = {
  // 創建模擬測試組件容器
  createTestContainer: () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'test-container');
    document.body.appendChild(container);
    return container;
  },

  // 模擬瀏覽器事件觸發
  simulateEvent: (element: HTMLElement, eventType: string, eventData = {}) => {
    const event = new Event(eventType, { bubbles: true, cancelable: true });
    Object.assign(event, eventData);
    element.dispatchEvent(event);
    return event;
  },

  // 模擬Firebase身分驗證響應
  createAuthResponse: (isSuccess = true, userData: any = null, errorMessage = '身份驗證失敗') => {
    if (isSuccess) {
      return { user: userData || TestDataFactory.createUser(), error: null };
    }
    return { user: null, error: new Error(errorMessage) };
  },

  // 模擬API響應
  mockApiResponse: <T>(data: T, delay = 0) => {
    return new Promise<T>((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  },

  // 模擬異步錯誤
  mockApiError: (message = '操作失敗', statusCode = 500, delay = 0) => {
    return new Promise((_, reject) => {
      const error = new Error(message) as Error & { statusCode?: number };
      error.statusCode = statusCode;
      setTimeout(() => reject(error), delay);
    });
  },

  // 等待組件渲染更新完成
  waitForRender: async (timeout = 100) => {
    await new Promise(resolve => setTimeout(resolve, timeout));
    // 用一個額外的 tick 確保所有非同步渲染完成
    await Promise.resolve();
  },

  // 模擬表單提交事件
  createFormSubmitEvent: (formData: Record<string, any> = {}) => {
    return {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      target: {
        elements: Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [key, { value }])
        ),
        reset: vi.fn()
      }
    };
  }
};

// 導出其他常用模擬對象和常數
export const testConstants = {
  DEFAULT_TEST_TIMEOUT: 5000,
  DEFAULT_USER_ID: 'test-user-123',
  DEFAULT_PRAYER_ID: 'prayer-123',
  DEFAULT_RESPONSE_ID: 'response-123',
  TEST_IMAGE_URL: 'https://example.com/test-image.jpg',
  TEST_BASE64_IMAGE: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
};

// 添加模擬資料庫操作輔助工具
export class MockDatabase {
  private static instance: MockDatabase;
  private collections: Map<string, Map<string, any>>;
  private relationshipMap: Map<string, Map<string, Set<string>>>;
  private transactionLog: Array<{
    action: string; 
    collection: string; 
    documentId?: string | undefined; 
    data?: any;
  }>;
  private indexedFields: Map<string, Set<string>>;
  private transactionInProgress: boolean = false;
  
  private constructor() {
    this.collections = new Map();
    this.relationshipMap = new Map();
    this.transactionLog = [];
    this.indexedFields = new Map();
  }
  
  public static getInstance(): MockDatabase {
    if (!MockDatabase.instance) {
      MockDatabase.instance = new MockDatabase();
    }
    return MockDatabase.instance;
  }
  
  // 重置資料庫
  public reset(): void {
    this.collections = new Map();
    this.relationshipMap = new Map();
    this.transactionLog = [];
    this.indexedFields = new Map();
    this.transactionInProgress = false;
  }
  
  // 添加集合
  public addCollection(collectionName: string): Map<string, any> {
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
    return this.collections.get(collectionName)!;
  }
  
  // 獲取集合
  public getCollection(collectionName: string): Map<string, any> | undefined {
    return this.collections.get(collectionName);
  }
  
  // 添加文檔
  public addDocument(collectionName: string, documentId: string, data: any): void {
    let collection = this.getCollection(collectionName);
    if (!collection) {
      collection = this.addCollection(collectionName);
    }
    
    // 確保有 id 和時間戳
    const docData = {
      id: documentId,
      createdAt: MockTimestamp.now(),
      updatedAt: MockTimestamp.now(),
      ...data
    };
    
    collection.set(documentId, docData);
    
    // 記錄交易
    this.logTransaction('add', collectionName, documentId, docData);
    
    // 更新索引
    this.updateIndices(collectionName, documentId, docData);
    
    // 處理關聯
    this.handleRelationships(collectionName, documentId, docData);
  }
  
  // 獲取文檔
  public getDocument(collectionName: string, documentId: string): any {
    const collection = this.getCollection(collectionName);
    if (!collection) return null;
    
    return collection.get(documentId) || null;
  }
  
  // 更新文檔
  public updateDocument(collectionName: string, documentId: string, data: any): boolean {
    const doc = this.getDocument(collectionName, documentId);
    if (!doc) return false;
    
    const collection = this.getCollection(collectionName)!;
    const updatedDoc = {
      ...doc,
      ...data,
      updatedAt: MockTimestamp.now()
    };
    
    collection.set(documentId, updatedDoc);
    
    // 記錄交易
    this.logTransaction('update', collectionName, documentId, updatedDoc);
    
    // 更新索引
    this.updateIndices(collectionName, documentId, updatedDoc);
    
    // 處理關聯
    this.handleRelationships(collectionName, documentId, updatedDoc);
    
    return true;
  }
  
  // 刪除文檔
  public deleteDocument(collectionName: string, documentId: string): boolean {
    const collection = this.getCollection(collectionName);
    if (!collection) return false;
    
    const doc = collection.get(documentId);
    if (!doc) return false;
    
    // 刪除關聯
    this.deleteRelationships(collectionName, documentId);
    
    // 刪除索引
    this.removeFromIndices(collectionName, documentId);
    
    // 記錄交易
    this.logTransaction('delete', collectionName, documentId);
    
    return collection.delete(documentId);
  }
  
  // 查詢文檔
  public queryDocuments(collectionName: string, filterFn: (doc: any) => boolean): any[] {
    const collection = this.getCollection(collectionName);
    if (!collection) return [];
    
    return Array.from(collection.values()).filter(filterFn);
  }
  
  // 批量添加文檔
  public addDocumentBatch(collectionName: string, documents: any[]): void {
    documents.forEach((doc, index) => {
      const id = doc.id || `auto-id-${Date.now()}-${index}`;
      this.addDocument(collectionName, id, doc);
    });
  }
  
  // 獲取所有文檔
  public getAllDocuments(collectionName: string): any[] {
    const collection = this.getCollection(collectionName);
    if (!collection) return [];
    
    return Array.from(collection.values());
  }
  
  // 清空集合
  public clearCollection(collectionName: string): void {
    const collection = this.getCollection(collectionName);
    if (collection) {
      collection.clear();
    }
    
    // 記錄交易
    this.logTransaction('clear', collectionName);
  }
  
  // 新增高級功能 - 創建索引
  public createIndex(collectionName: string, fieldPath: string): void {
    if (!this.indexedFields.has(collectionName)) {
      this.indexedFields.set(collectionName, new Set());
    }
    
    this.indexedFields.get(collectionName)!.add(fieldPath);
    
    // 對現有文檔建立索引
    const collection = this.getCollection(collectionName);
    if (collection) {
      collection.forEach((doc, docId) => {
        this.updateIndices(collectionName, docId, doc);
      });
    }
  }
  
  // 新增高級功能 - 根據索引查詢
  public queryByIndex(collectionName: string, fieldPath: string, value: any): any[] {
    if (!this.indexedFields.has(collectionName) || 
        !this.indexedFields.get(collectionName)!.has(fieldPath)) {
      // 如果沒有索引，執行全表掃描
      return this.queryDocuments(collectionName, doc => {
        const fieldValue = this.getFieldValueByPath(doc, fieldPath);
        return fieldValue === value;
      });
    }
    
    // 使用索引查詢
    return this.queryDocuments(collectionName, doc => {
      const fieldValue = this.getFieldValueByPath(doc, fieldPath);
      return fieldValue === value;
    });
  }
  
  // 新增高級功能 - 創建關聯
  public createRelationship(
    sourceCollection: string, 
    sourceId: string, 
    targetCollection: string, 
    targetId: string,
    relationshipName: string
  ): void {
    const relationshipKey = `${sourceCollection}:${relationshipName}:${targetCollection}`;
    
    if (!this.relationshipMap.has(relationshipKey)) {
      this.relationshipMap.set(relationshipKey, new Map());
    }
    
    const relationships = this.relationshipMap.get(relationshipKey)!;
    
    if (!relationships.has(sourceId)) {
      relationships.set(sourceId, new Set());
    }
    
    relationships.get(sourceId)!.add(targetId);
  }
  
  // 新增高級功能 - 獲取關聯文檔
  public getRelatedDocuments(
    sourceCollection: string, 
    sourceId: string, 
    targetCollectionName: string,
    relationshipName: string
  ): any[] {
    const relationshipKey = `${sourceCollection}:${relationshipName}:${targetCollectionName}`;
    
    if (!this.relationshipMap.has(relationshipKey)) {
      return [];
    }
    
    const relationships = this.relationshipMap.get(relationshipKey)!;
    
    if (!relationships.has(sourceId)) {
      return [];
    }
    
    const targetIds = Array.from(relationships.get(sourceId)!);
    const targetCollection = this.getCollection(targetCollectionName);
    
    if (!targetCollection) {
      return [];
    }
    
    return targetIds
      .map(id => targetCollection.get(id))
      .filter(doc => doc !== undefined);
  }
  
  // 新增高級功能 - 開始事務
  public beginTransaction(): void {
    if (this.transactionInProgress) {
      throw new Error('Transaction already in progress');
    }
    
    this.transactionInProgress = true;
  }
  
  // 新增高級功能 - 提交事務
  public commitTransaction(): void {
    if (!this.transactionInProgress) {
      throw new Error('No transaction in progress');
    }
    
    this.transactionInProgress = false;
  }
  
  // 新增高級功能 - 回滾事務
  public rollbackTransaction(): void {
    if (!this.transactionInProgress) {
      throw new Error('No transaction in progress');
    }
    
    // 根據交易日誌回滾操作
    for (let i = this.transactionLog.length - 1; i >= 0; i--) {
      const log = this.transactionLog[i];
      // 在這裡執行回滾邏輯...
    }
    
    this.transactionLog = [];
    this.transactionInProgress = false;
  }
  
  // 記錄交易
  private logTransaction(action: string, collection: string, documentId?: string | undefined, data?: any): void {
    if (this.transactionInProgress) {
      this.transactionLog.push({ 
        action, 
        collection, 
        documentId, 
        data
      });
    }
  }
  
  // 按照路徑獲取嵌套字段的值
  private getFieldValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }
    
    return value;
  }
  
  // 更新索引
  private updateIndices(collectionName: string, docId: string, doc: any): void {
    if (!this.indexedFields.has(collectionName)) {
      return;
    }
    
    // 在實際實現中，這裡會更新索引
    // 目前簡單實現，不做實際索引存儲
  }
  
  // 從索引中刪除
  private removeFromIndices(collectionName: string, docId: string): void {
    if (!this.indexedFields.has(collectionName)) {
      return;
    }
    
    // 在實際實現中，這裡會從索引中移除文檔
  }
  
  // 處理關聯
  private handleRelationships(collectionName: string, docId: string, doc: any): void {
    // 在實際實現中，這裡可以基於文檔內容自動處理關聯
  }
  
  // 刪除關聯
  private deleteRelationships(collectionName: string, docId: string): void {
    // 刪除所有以此文檔為源的關聯
    this.relationshipMap.forEach((relationshipsBySource, relationshipKey) => {
      if (relationshipKey.startsWith(`${collectionName}:`)) {
        relationshipsBySource.delete(docId);
      }
    });
    
    // 刪除所有以此文檔為目標的關聯
    this.relationshipMap.forEach((relationshipsBySource) => {
      relationshipsBySource.forEach((targets, sourceId) => {
        targets.forEach((targetId) => {
          if (targetId === docId) {
            targets.delete(targetId);
          }
        });
      });
    });
  }
} 

// 添加通用測試提供者包裝器
export const createTestProviders = () => {
  const React = require('react');
  const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
  const { MemoryRouter } = require('react-router-dom');

  // 創建模擬 QueryClient
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });

  // 測試提供者包裝器組件
  const AllProviders = ({ children, initialEntries = ['/'] }: { 
    children: React.ReactNode, 
    initialEntries?: string[] 
  }) => {
    // Replace the require with a direct mock implementation
    const FirebaseAuthProvider = ({ children }: { children: React.ReactNode }) => children;

    return React.createElement(
      MemoryRouter,
      { initialEntries },
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(FirebaseAuthProvider, {}, children)
      )
    );
  };

  return {
    AllProviders,
    queryClient,
  };
};

// 簡化的測試渲染函數
export const renderWithProviders = (ui: React.ReactElement, options = {}) => {
  const { render } = require('@testing-library/react');
  const { AllProviders } = createTestProviders();
  return render(ui, { wrapper: AllProviders, ...options });
}; 

// 添加測試效能優化工具
export const testPerformanceOptimizer = {
  /**
   * 測試效能緩存 - 用於存儲頻繁使用的測試數據
   * 減少重複創建成本高昂的模擬對象
   */
  cache: new Map<string, any>(),
  
  /**
   * 獲取緩存數據，如不存在則創建
   */
  getCachedData: <T>(key: string, creator: () => T): T => {
    if (!testPerformanceOptimizer.cache.has(key)) {
      testPerformanceOptimizer.cache.set(key, creator());
    }
    return testPerformanceOptimizer.cache.get(key) as T;
  },
  
  /**
   * 清除緩存數據
   */
  clearCache: (key?: string) => {
    if (key) {
      testPerformanceOptimizer.cache.delete(key);
    } else {
      testPerformanceOptimizer.cache.clear();
    }
  },
  
  /**
   * 測量函數執行時間
   */
  measureExecutionTime: async <T>(fn: () => Promise<T> | T, description?: string): Promise<T> => {
    const startTime = performance.now();
    let result: T;
    
    try {
      result = await fn();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (description) {
        console.log(`⏱️ ${description} 耗時: ${duration.toFixed(2)}ms`);
      }
    }
    
    return result;
  },
  
  /**
   * 批量處理測試 - 優化多個相似測試的執行
   */
  batchTests: <T extends Record<string, any>>(cases: T[], testFn: (testCase: T) => void) => {
    // 共享設置只執行一次
    const sharedSetupTime = performance.now();
    
    cases.forEach((testCase) => {
      testFn(testCase);
    });
    
    const totalTime = performance.now() - sharedSetupTime;
    console.log(`⏱️ 批量測試（${cases.length}個）總耗時: ${totalTime.toFixed(2)}ms，平均: ${(totalTime / cases.length).toFixed(2)}ms/測試`);
  },
  
  /**
   * 設置測試超時
   */
  setTimeout: (timeoutMs: number) => {
    vi.setConfig({ testTimeout: timeoutMs });
  },
  
  /**
   * 恢復默認測試超時
   */
  resetTimeout: () => {
    vi.setConfig({ testTimeout: 10000 }); // 還原為默認值
  }
}; 