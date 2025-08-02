// 固定版測試設置檔案 - 解決 Timestamp 相關問題和模組路徑解析問題
import { vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';
import path from 'path';

// 正確的 Timestamp 實現
class MockTimestamp {
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

  // 提供 instanceof 檢查功能
  static [Symbol.hasInstance](instance: any) {
    return instance && 
      typeof instance === 'object' && 
      'seconds' in instance && 
      'nanoseconds' in instance &&
      typeof instance.toDate === 'function';
  }
}

// 配置測試環境
configure({
  testIdAttribute: 'data-testid',
  reactStrictMode: false,
});

// 全局設置
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// 虛擬計時器和控制台訊息處理
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // 啟用虛擬計時器
  vi.useFakeTimers();
  
  // 壓制 React 並發模式警告
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && 
       (args[0].includes('Should not already be working') || 
        args[0].includes('Warning: ReactDOM') ||
        args[0].includes('performConcurrentWorkOnRoot') ||
        args[0].includes('flushActQueue'))) {
      return;
    }
    if (args[0] instanceof Error && 
       (args[0].message.includes('Should not already be working') ||
        args[0].message.includes('Maximum update depth exceeded'))) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && 
       (args[0].includes('React concurrent mode') ||
        args[0].includes('Warning: ReactDOMTestUtils'))) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  // 清理和恢復環境
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  console.error = originalError;
  console.warn = originalWarn;
});

// 創建 Mock Storage
const createMockStorage = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
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
};

// 創建全局 mock 實例
const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();

// 設置瀏覽器環境
  if (typeof window !== 'undefined') {
  // Storage API
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
  
  // requestIdleCallback
  delete (window as any).requestIdleCallback;
  delete (window as any).cancelIdleCallback;
  
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
  
  // 響應式尺寸
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
      
  // matchMedia
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
  }
  
// Mock navigator.onLine
if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
}

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

// 模擬各個模組
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(() => ({
    id: 'test-id',
    dismiss: vi.fn(),
    update: vi.fn(),
  })),
  useToast: vi.fn(() => ({
    toast: vi.fn(() => ({
      id: 'test-id',
      dismiss: vi.fn(),
      update: vi.fn(),
    })),
    dismiss: vi.fn(),
    toasts: [],
  })),
}));

vi.mock('@/stores/tempUserStore', () => ({
  useTempUserStore: vi.fn(() => ({
    tempDisplayName: '',
    setTempDisplayName: vi.fn(),
    clearTempDisplayName: vi.fn(),
  })),
}));

vi.mock('@/contexts/FirebaseAuthContext', () => ({
  useFirebaseAuth: vi.fn(() => ({
    currentUser: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    refreshUserAvatar: vi.fn()
  })),
  FirebaseAuthProvider: ({ children }: any) => children,
}));

vi.mock('@/services/prayer/PrayerAnsweredService', () => ({
  prayerAnsweredService: {
    togglePrayerAnswered: vi.fn().mockResolvedValue(true),
    toggleResponseAnswered: vi.fn().mockResolvedValue(true),
    markPrayerAsAnswered: vi.fn().mockResolvedValue(true),
    markResponseAsAnswered: vi.fn().mockResolvedValue(true),
  }
}));

// useFirebaseAvatar mock
const globalAvatarState: Record<string, any> = {};

vi.mock('@/hooks/useFirebaseAvatar', () => {
  const clearAvatarGlobalState = () => {
    Object.keys(globalAvatarState).forEach(key => {
      delete globalAvatarState[key];
    });
  };

  const useFirebaseAvatar = vi.fn(() => ({
    user: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.jpg',
    },
    isLoggedIn: true,
    isAuthLoading: false,
    avatarUrl: 'https://example.com/avatar.jpg',
    avatarUrl30: 'https://example.com/avatar-30.jpg',
    avatarUrl48: 'https://example.com/avatar-48.jpg',
    avatarUrl96: 'https://example.com/avatar-96.jpg',
    refreshAvatar: vi.fn().mockResolvedValue(true),
    isLoading: false,
    error: null,
    data: {
      avatar_url: 'https://example.com/avatar.jpg',
      user_name: 'Test User'
    }
  }));

  return {
    useFirebaseAvatar,
    clearAvatarGlobalState,
  };
});

vi.mock('@/hooks/usePrayersOptimized', () => ({
  usePrayers: vi.fn(() => ({
    prayers: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useCreatePrayer: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
}));

vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.jpg',
    }
  })),
  db: vi.fn(() => ({})),
  storage: vi.fn(() => ({})),
}));

vi.mock('@/services/admin/SuperAdminService', () => ({
  superAdminService: {
    getInstance: vi.fn(() => ({
      isSuperAdmin: vi.fn().mockResolvedValue(false),
      deletePrayer: vi.fn().mockResolvedValue(true),
    })),
  },
}));

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

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/services', () => ({
  firebasePrayerService: {
    getInstance: vi.fn(() => ({
      getAllPrayers: vi.fn(),
      createPrayer: vi.fn(),
      updatePrayer: vi.fn(),
      deletePrayer: vi.fn(),
      getPrayersByUserId: vi.fn(),
    })),
  },
  FirebaseUserService: {
    getUserData: vi.fn(),
    setUserData: vi.fn(),
    updateScripture: vi.fn(),
  },
}));

// Avatar Service mock
vi.mock('@/services/background/AvatarService', () => {
  class MockAvatarService {
    getUserSerialNumber(userId: string) { 
      return Promise.resolve(12345);
    }
    
    getFallbackSerialNumber() {
      return 99999;
    }
    
    uploadAndRegisterAvatars(userId: string, blobs: { l: Blob; m: Blob; s: Blob }) {
      return Promise.resolve({
        avatar_url_96: 'https://example.com/avatar-96.jpg',
        avatar_url_48: 'https://example.com/avatar-48.jpg',
        avatar_url_30: 'https://example.com/avatar-30.jpg',
      });
    }
    
    getUserAvatar(userId: string | undefined) {
      if (!userId) return Promise.resolve(null);
      
      return Promise.resolve({
        user_id: userId,
        avatar_url_96: 'https://example.com/avatar-96.jpg',
        avatar_url_48: 'https://example.com/avatar-48.jpg',
        avatar_url_30: 'https://example.com/avatar-30.jpg',
        updated_at: '2023-01-01T00:00:00Z'
      });
    }
  }
  
  return {
    AvatarService: MockAvatarService,
    getUserAvatarUrlFromFirebase: vi.fn().mockResolvedValue({
      large: 'https://example.com/avatar-96.jpg',
      medium: 'https://example.com/avatar-48.jpg',
      small: 'https://example.com/avatar-30.jpg',
    }),
    uploadAvatarToFirebase: vi.fn().mockResolvedValue({
      success: true,
      data: {
        avatar_url_96: 'https://example.com/avatar-96.jpg',
        avatar_url_48: 'https://example.com/avatar-48.jpg',
        avatar_url_30: 'https://example.com/avatar-30.jpg',
      }
    })
  };
});

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

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  User: vi.fn(),
}));

// Mock Firebase Firestore - 修復 Timestamp 問題
vi.mock('firebase/firestore', () => {
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
  };
});

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn().mockImplementation(() => Promise.resolve('https://example.com/avatar-30.webp')),
  deleteObject: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    refetchQueries: vi.fn(),
  })),
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    refetchQueries: vi.fn(),
  })),
  QueryClientProvider: ({ children }: any) => children,
}));

// 提供全局 Export 讓測試可以存取 mock 實例
export { mockLocalStorage, mockSessionStorage, mockLogger, MockTimestamp }; 