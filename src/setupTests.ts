import { expect, afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

// 擴展 Vitest 的匹配器
expect.extend(matchers);

// 每個測試後清理
afterEach(() => {
  cleanup();
});

// 模擬 ResizeObserver
class ResizeObserverMock {
  observe() { /* do nothing */ }
  unobserve() { /* do nothing */ }
  disconnect() { /* do nothing */ }
}

window.ResizeObserver = ResizeObserverMock;

// 模擬 matchMedia
window.matchMedia = window.matchMedia || ((query) => ({
    matches: false,
    media: query,
    onchange: null,
  addListener: vi.fn(), // 兼容舊版 API
  removeListener: vi.fn(), // 兼容舊版 API
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

// 模擬 URL.createObjectURL 和 URL.revokeObjectURL
URL.createObjectURL = vi.fn().mockImplementation((object) => {
  return `mock-url-${Math.random().toString(36).substr(2, 9)}`;
});
URL.revokeObjectURL = vi.fn();

// 模擬 Intersection Observer
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(callback: IntersectionObserverCallback) {
    setTimeout(() => {
      callback([{
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        isIntersecting: true,
        rootBounds: null,
        target: {} as Element,
        time: Date.now()
      }], this as IntersectionObserver);
    }, 50);
  }
  
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
  takeRecords() { return []; }
}

window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// 模擬 window.scrollTo
window.scrollTo = vi.fn();

// 模擬 heic2any
vi.mock('heic2any', () => ({
  default: vi.fn().mockResolvedValue([new Blob(['fake-image-data'], { type: 'image/jpeg' })])
}));

// 模擬 Firebase
vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
  })),
  storage: vi.fn(() => ({
    ref: vi.fn(() => ({
      put: vi.fn(() => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('mock-url') } })),
      getDownloadURL: vi.fn(() => Promise.resolve('mock-url')),
    })),
  })),
  db: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ data: () => ({}) })),
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
        delete: vi.fn(() => Promise.resolve()),
        onSnapshot: vi.fn(() => vi.fn()),
      })),
      add: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve({ docs: [] })),
            onSnapshot: vi.fn(() => vi.fn()),
          })),
        })),
      })),
    })),
  })),
}));

// 模擬 useFirebaseAuthStore - 使用動態狀態管理
let mockFirebaseAuthState: any = {
  user: null,
  isAuthLoading: true, // 修正初始狀態
  displayName: '',
  setUser: vi.fn((user) => {
    mockFirebaseAuthState.user = user;
    if (user && user.displayName) {
      mockFirebaseAuthState.displayName = user.displayName;
    } else {
      mockFirebaseAuthState.displayName = '';
    }
  }),
  setAuthLoading: vi.fn((loading) => {
    mockFirebaseAuthState.isAuthLoading = loading;
  }),
  setDisplayName: vi.fn((name) => {
    mockFirebaseAuthState.displayName = name;
  }),
  initAuth: vi.fn(() => {
    // 模擬實際的 initAuth 行為
    mockFirebaseAuthState.isAuthLoading = false;
  }),
  signOut: vi.fn(async () => {
    // 模擬實際的 signOut 行為
    mockFirebaseAuthState.user = null;
    mockFirebaseAuthState.displayName = '';
  }),
};

const mockUseFirebaseAuthStore = vi.fn((selector) => {
  if (typeof selector === 'function') {
    return selector(mockFirebaseAuthState);
  }
  return mockFirebaseAuthState;
});

// 為 mockUseFirebaseAuthStore 添加 getState 方法
Object.defineProperty(mockUseFirebaseAuthStore, 'getState', {
  value: vi.fn(() => mockFirebaseAuthState),
  writable: true,
});

// 添加重置函數
const resetFirebaseAuthStore = () => {
  mockFirebaseAuthState = {
    user: null,
    isAuthLoading: true, // 修正初始狀態
    displayName: '',
    setUser: vi.fn((user) => {
      mockFirebaseAuthState.user = user;
      if (user && user.displayName) {
        mockFirebaseAuthState.displayName = user.displayName;
      } else {
        mockFirebaseAuthState.displayName = '';
      }
    }),
    setAuthLoading: vi.fn((loading) => {
      mockFirebaseAuthState.isAuthLoading = loading;
    }),
    setDisplayName: vi.fn((name) => {
      mockFirebaseAuthState.displayName = name;
    }),
    initAuth: vi.fn(() => {
      // 模擬實際的 initAuth 行為
      mockFirebaseAuthState.isAuthLoading = false;
    }),
    signOut: vi.fn(async () => {
      // 模擬實際的 signOut 行為
      mockFirebaseAuthState.user = null;
      mockFirebaseAuthState.displayName = '';
    }),
  };
};

vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: mockUseFirebaseAuthStore,
}));

// 模擬 backgroundStore - 使用動態狀態管理
let mockBackgroundState: any = {
  backgroundId: 'default-background.jpg',
  customBackground: null,
  customBackgroundSize: null,
  setBackground: vi.fn((backgroundId, customUrl, size) => {
    mockBackgroundState.backgroundId = backgroundId;
    mockBackgroundState.customBackground = customUrl || null;
    mockBackgroundState.customBackgroundSize = size || null;
  }),
  resetToDefault: vi.fn(() => {
    mockBackgroundState.backgroundId = 'default-background.jpg';
    mockBackgroundState.customBackground = null;
    mockBackgroundState.customBackgroundSize = null;
  }),
};

const mockUseBackgroundStore = vi.fn((selector) => {
  if (typeof selector === 'function') {
    return selector(mockBackgroundState);
  }
  return mockBackgroundState;
});

Object.defineProperty(mockUseBackgroundStore, 'getState', {
  value: vi.fn(() => mockBackgroundState),
  writable: true,
});

const resetBackgroundStore = () => {
  mockBackgroundState = {
    backgroundId: 'default-background.jpg',
    customBackground: null,
    customBackgroundSize: null,
    setBackground: vi.fn((backgroundId, customUrl, size) => {
      mockBackgroundState.backgroundId = backgroundId;
      mockBackgroundState.customBackground = customUrl || null;
      mockBackgroundState.customBackgroundSize = size || null;
    }),
    resetToDefault: vi.fn(() => {
      mockBackgroundState.backgroundId = 'default-background.jpg';
      mockBackgroundState.customBackground = null;
      mockBackgroundState.customBackgroundSize = null;
    }),
  };
};

vi.mock('@/stores/backgroundStore', () => ({
  useBackgroundStore: mockUseBackgroundStore,
}));

// 模擬 tempUserStore - 使用動態狀態管理
let mockTempUserState: any = {
  tempDisplayNames: {},
  recentUsers: [],
  setTempDisplayName: vi.fn((userId, displayName) => {
    mockTempUserState.tempDisplayNames[userId] = displayName;
  }),
  getTempDisplayName: vi.fn((userId) => {
    return mockTempUserState.tempDisplayNames[userId] || '';
  }),
  clearTempDisplayName: vi.fn((userId) => {
    delete mockTempUserState.tempDisplayNames[userId];
  }),
  clearAllTempDisplayNames: vi.fn(() => {
    mockTempUserState.tempDisplayNames = {};
  }),
  addRecentUser: vi.fn((userId) => {
    if (!mockTempUserState.recentUsers.includes(userId)) {
      mockTempUserState.recentUsers.unshift(userId);
      // 限制為 20 個
      if (mockTempUserState.recentUsers.length > 20) {
        mockTempUserState.recentUsers = mockTempUserState.recentUsers.slice(0, 20);
      }
    } else {
      // 如果已存在，移到開頭
      const index = mockTempUserState.recentUsers.indexOf(userId);
      mockTempUserState.recentUsers.splice(index, 1);
      mockTempUserState.recentUsers.unshift(userId);
    }
  }),
  getRecentUsers: vi.fn(() => mockTempUserState.recentUsers),
  clearRecentUsers: vi.fn(() => {
    mockTempUserState.recentUsers = [];
  }),
  // 向後兼容的屬性和方法
  tempDisplayName: '',
  setTempDisplayName_legacy: vi.fn((name) => {
    mockTempUserState.tempDisplayName = name;
  }),
  clearTempDisplayName_legacy: vi.fn(() => {
    mockTempUserState.tempDisplayName = '';
  }),
};

const mockUseTempUserStore = vi.fn((selector) => {
  if (typeof selector === 'function') {
    return selector(mockTempUserState);
  }
  return mockTempUserState;
});

Object.defineProperty(mockUseTempUserStore, 'getState', {
  value: vi.fn(() => mockTempUserState),
  writable: true,
});

const resetTempUserStore = () => {
  mockTempUserState = {
    tempDisplayNames: {},
    recentUsers: [],
    setTempDisplayName: vi.fn((userId, displayName) => {
      mockTempUserState.tempDisplayNames[userId] = displayName;
    }),
    getTempDisplayName: vi.fn((userId) => {
      return mockTempUserState.tempDisplayNames[userId] || '';
    }),
    clearTempDisplayName: vi.fn((userId) => {
      delete mockTempUserState.tempDisplayNames[userId];
    }),
    clearAllTempDisplayNames: vi.fn(() => {
      mockTempUserState.tempDisplayNames = {};
    }),
    addRecentUser: vi.fn((userId) => {
      if (!mockTempUserState.recentUsers.includes(userId)) {
        mockTempUserState.recentUsers.unshift(userId);
        // 限制為 20 個
        if (mockTempUserState.recentUsers.length > 20) {
          mockTempUserState.recentUsers = mockTempUserState.recentUsers.slice(0, 20);
        }
      } else {
        // 如果已存在，移到開頭
        const index = mockTempUserState.recentUsers.indexOf(userId);
        mockTempUserState.recentUsers.splice(index, 1);
        mockTempUserState.recentUsers.unshift(userId);
      }
    }),
    getRecentUsers: vi.fn(() => mockTempUserState.recentUsers),
    clearRecentUsers: vi.fn(() => {
      mockTempUserState.recentUsers = [];
    }),
  };
};

vi.mock('@/stores/tempUserStore', () => ({
  useTempUserStore: mockUseTempUserStore,
}));

// 模擬 useFirebaseAvatar hook
vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: vi.fn(() => ({
    user: null,
    isLoggedIn: false,
    isAuthLoading: false,
    avatarUrl: 'https://example.com/avatar.jpg',
    avatarUrl30: 'https://example.com/avatar-30.jpg',
    avatarUrl48: 'https://example.com/avatar-48.jpg',
    avatarUrl96: 'https://example.com/avatar-96.jpg',
    avatarError: false,
    isLoading: false,
    error: null,
    refreshAvatar: vi.fn().mockResolvedValue(true),
    uploadAvatar: vi.fn(() => Promise.resolve('https://example.com/new-avatar.jpg')),
    deleteAvatar: vi.fn(() => Promise.resolve()),
    data: {
      avatar_url: 'https://example.com/avatar.jpg',
      user_name: 'Test User'
    }
  })),
}));

// 模擬 useFirebaseUserData hook
vi.mock('@/hooks/useFirebaseUserData', () => ({
  useFirebaseUserData: vi.fn(() => ({
    userData: {
      displayName: 'Test User',
      scripture: 'John 3:16',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    isLoading: false,
    isError: false,
    error: null,
    updateUserData: vi.fn(() => Promise.resolve()),
  })),
}));

// 模擬 useFirebaseAuth hook
vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(() => ({
    currentUser: null,
    isLoading: false,
    isError: false,
    error: null,
    signIn: vi.fn(() => Promise.resolve()),
    signUp: vi.fn(() => Promise.resolve()),
    signOut: vi.fn(() => Promise.resolve()),
    resetPassword: vi.fn(() => Promise.resolve()),
  })),
}));

// 模擬 usePrayersOptimized hook
vi.mock('@/hooks/usePrayersOptimized', () => ({
  usePrayers: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    dataUpdatedAt: Date.now(),
    isFetching: false,
  })),
  usePrayersByUserId: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    dataUpdatedAt: Date.now(),
    isFetching: false,
  })),
  useCreatePrayer: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
  })),
  useUpdatePrayer: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
  })),
  useDeletePrayer: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
  })),
}));

// 模擬 usePrayerResponsesOptimized hook
vi.mock('@/hooks/usePrayerResponsesOptimized', () => ({
  usePrayerResponses: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
  useCreatePrayerResponse: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

// 模擬 useBaptismPosts hook
vi.mock('@/hooks/useBaptismPosts', () => ({
  useBaptismPosts: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// 模擬 useJourneyPosts hook
vi.mock('@/hooks/useJourneyPosts', () => ({
  useJourneyPosts: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// 模擬 useMiraclePosts hook
vi.mock('@/hooks/useMiraclePosts', () => ({
  useMiraclePosts: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// 模擬 usePrayerAnswered hook
vi.mock('@/hooks/usePrayerAnswered', () => ({
  useTogglePrayerAnswered: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

// 模擬 useSocialFeatures hook
vi.mock('@/hooks/useSocialFeatures', () => ({
  usePrayerLikes: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
  useTogglePrayerLike: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

// 模擬 useOnlineStatus hook
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
  })),
}));

// 模擬 usePerformanceMonitor hook
vi.mock('@/hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: vi.fn(() => ({
    measureTime: vi.fn(),
    measureMemory: vi.fn(),
  })),
}));

// 模擬 useIdlePrefetch hook
vi.mock('@/hooks/useIdlePrefetch', () => ({
  useIdlePrefetch: vi.fn(() => ({
    prefetch: vi.fn(),
    isPrefetching: false,
  })),
}));

// 模擬 useUserDisplayName hook
vi.mock('@/hooks/useUserDisplayName', () => ({
  useUserDisplayName: vi.fn(() => ({
    displayName: 'Test User',
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// 模擬 use-mobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useMobile: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  })),
}));

// 模擬 Firebase 服務
vi.mock('@/services/prayer/FirebasePrayerService', () => ({
  FirebasePrayerService: vi.fn(() => ({
    getPrayers: vi.fn(() => Promise.resolve([])),
    getPrayersByUserId: vi.fn(() => Promise.resolve([])),
    createPrayer: vi.fn(() => Promise.resolve({ id: 'test-id' })),
    updatePrayer: vi.fn(() => Promise.resolve()),
    deletePrayer: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock('@/services/prayer/FirebasePrayerResponseService', () => ({
  FirebasePrayerResponseService: vi.fn(() => ({
    getPrayerResponses: vi.fn(() => Promise.resolve([])),
    createPrayerResponse: vi.fn(() => Promise.resolve({ id: 'test-id' })),
  })),
}));

vi.mock('@/services/auth/FirebaseAuthService', () => ({
  FirebaseAuthService: vi.fn(() => ({
    signIn: vi.fn(() => Promise.resolve()),
    signUp: vi.fn(() => Promise.resolve()),
    signOut: vi.fn(() => Promise.resolve()),
    resetPassword: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock('@/services/sync/BackgroundSyncService', () => ({
  BackgroundSyncService: vi.fn(() => ({
    syncUserBackground: vi.fn(() => Promise.resolve()),
    syncPrayers: vi.fn(() => Promise.resolve()),
  })),
}));

// 模擬 networkStore - 使用動態狀態管理
let mockNetworkState: any = {
  isOnline: true,
  hasPreviouslyBeenOffline: false,
  setOnlineStatus: vi.fn((status) => {
    mockNetworkState.isOnline = status;
    mockNetworkState.hasPreviouslyBeenOffline = !status;
  }),
};

const mockUseNetworkStore = vi.fn((selector) => {
  if (typeof selector === 'function') {
    return selector(mockNetworkState);
  }
  return mockNetworkState;
});

Object.defineProperty(mockUseNetworkStore, 'getState', {
  value: vi.fn(() => mockNetworkState),
  writable: true,
});

const mockInitNetworkListeners = vi.fn(() => {
  // 模擬初始化網路監聽器
});

const resetNetworkStore = () => {
  mockNetworkState = {
    isOnline: true,
    hasPreviouslyBeenOffline: false,
    setOnlineStatus: vi.fn((status) => {
      mockNetworkState.isOnline = status;
      mockNetworkState.hasPreviouslyBeenOffline = !status;
    }),
  };
};

vi.mock('@/stores/networkStore', () => ({
  useNetworkStore: mockUseNetworkStore,
  initNetworkListeners: mockInitNetworkListeners,
}));

// 模擬 React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
    isError: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  })),
  QueryClient: vi.fn().mockImplementation(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    setQueriesData: vi.fn(),
    getQueriesData: vi.fn(),
    removeQueries: vi.fn(),
    resetQueries: vi.fn(),
    refetchQueries: vi.fn(),
    cancelQueries: vi.fn(),
    isFetching: vi.fn(),
    isMutating: vi.fn(),
    getDefaultOptions: vi.fn(),
    setDefaultOptions: vi.fn(),
    mount: vi.fn(),
    unmount: vi.fn(),
    getQueryCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
      find: vi.fn(),
      findAll: vi.fn(() => []),
      remove: vi.fn(),
      clear: vi.fn(),
    })),
    getMutationCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
      find: vi.fn(),
      findAll: vi.fn(() => []),
      remove: vi.fn(),
      clear: vi.fn(),
    })),
  })),
  QueryClientProvider: vi.fn().mockImplementation(({ children }) => children),
}));

// 模擬 React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname: '/prayers' })),
    useParams: vi.fn(() => ({})),
  };
});

// 模擬 logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// 模擬 Notifications
const mockToast = vi.fn();
vi.mock('@/lib/notifications', () => {
  const mockNotificationService = {
    success: vi.fn((message, options = {}) => {
      mockToast({
        title: options.title || '成功',
        description: message,
        duration: options.duration || 3000,
      });
    }),
    error: vi.fn((message, error) => {
      let description = message;
      if (error instanceof Error) {
        description = `${message}: ${error.message}`;
      } else if (typeof error === 'string') {
        description = `${message}: ${error}`;
      }
      mockToast({
        variant: 'destructive',
        title: '錯誤',
        description,
        duration: 5000,
      });
    }),
    info: vi.fn((message, options = {}) => {
      mockToast({
        title: options.title || '提示',
        description: message,
        duration: options.duration || 3000,
      });
    }),
    warning: vi.fn((message, options = {}) => {
      mockToast({
        title: options.title || '警告',
        description: message,
        duration: options.duration || 4000,
      });
    }),
    apiError: vi.fn((error, fallbackMessage = '發生未知錯誤') => {
      let description = fallbackMessage;
      if (error instanceof Error) {
        description = error.message;
      } else if (typeof error === 'string') {
        description = error;
      }
      mockToast({
        variant: 'destructive',
        title: '錯誤',
        description,
        duration: 5000,
      });
    }),
    handleApiError: vi.fn((error, fallbackMessage = '發生未知錯誤') => {
      let description = fallbackMessage;
      if (error instanceof Error) {
        description = error.message;
      } else if (typeof error === 'string') {
        description = error;
      }
      mockToast({
        variant: 'destructive',
        title: '錯誤',
        description,
        duration: 5000,
      });
    }),
    confirm: vi.fn((message, onConfirm, onCancel, options = {}) => {
      mockToast({
        title: options.title || '確認',
        description: message,
        action: {
          label: options.confirmText || '確認',
          onClick: onConfirm,
        },
        cancel: {
          label: options.cancelText || '取消',
          onClick: onCancel,
        },
      });
    }),
    handleValidationError: vi.fn((errors) => {
      const errorMessages = Object.values(errors).join(', ');
      mockToast({
        variant: 'destructive',
        title: '表單驗證失敗',
        description: errorMessages,
        duration: 5000,
      });
    }),
    loading: vi.fn((message) => {
      mockToast({
        title: '載入中...',
        description: message,
        duration: Infinity,
      });
      return () => {
        // 模擬關閉 toast
        mockToast.mockClear();
      };
    }),
  };

  return {
    notify: mockNotificationService,
    notifyError: vi.fn((message, error) => {
      mockToast({
        variant: 'destructive',
        title: '錯誤',
        description: error instanceof Error ? `${message}: ${error.message}` : message,
        duration: 5000,
      });
    }),
    notifySuccess: vi.fn((message) => {
      mockToast({
        title: '成功',
        description: message,
        duration: 3000,
      });
    }),
    notifications: mockNotificationService,
  };
});

// 模擬 use-toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast,
  })),
  toast: mockToast,
}));

// 為測試提供 toast 函數
Object.defineProperty(global, 'toast', {
  value: mockToast,
  writable: true,
});

// 模擬 date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 小時前'),
  format: vi.fn(() => '2024-01-01'),
  parseISO: vi.fn(() => new Date()),
}));

// 模擬 localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// 模擬 sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// 在每個測試前重置 localStorage 模擬
beforeEach(() => {
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // 重置所有 store 狀態
  resetFirebaseAuthStore();
  resetBackgroundStore();
  resetTempUserStore();
  resetNetworkStore();
});

// 儲存原始控制台方法
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// 抑制不必要的警告
console.warn = function(message, ...args) {
  // 過濾掉某些特定的警告訊息
  if (
    typeof message === 'string' && 
    (message.includes('act(...)') || 
     message.includes('Warning:') || 
     message.includes('React state updates'))
  ) {
    return;
}
  // 保留真正需要注意的警告
  originalConsoleWarn.call(console, message, ...args);
};

console.error = function(message, ...args) {
  // 過濾不必要的錯誤
  if (
    typeof message === 'string' && 
    (message.includes('act(...)') || 
     message.includes('Warning:') || 
     message.includes('React state updates'))
  ) {
    return;
  }
  originalConsoleError.call(console, message, ...args);
}; 