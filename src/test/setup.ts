import { vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';

// Configure React Testing Library for React 18
configure({
  testIdAttribute: 'data-testid',
  // Disable act warnings for React 18 concurrent features
  reactStrictMode: false,
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

// Fix React 18 concurrent mode issues
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
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
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock Storage API
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

// Mock SVG imports
vi.mock('@/assets/icons/MessageIcon.svg?react', () => {
  return {
    default: ({ className, ...props }: any) => 
      React.createElement('svg', { 
        'data-testid': 'message-icon',
        className,
        ...props 
      })
  };
});

vi.mock('@/assets/icons/Reply.svg?react', () => {
  return {
    default: ({ className, ...props }: any) => 
      React.createElement('svg', { 
        'data-testid': 'reply-icon',
        className,
        ...props 
      })
  };
});

vi.mock('@/assets/icons/LikeIcon.svg?react', () => {
  return {
    default: ({ className, ...props }: any) => 
      React.createElement('svg', { 
        'data-testid': 'like-icon',
        className,
        ...props 
      })
  };
});

vi.mock('@/assets/icons/PrayforLogo.svg?react', () => {
  return {
    default: ({ className, ...props }: any) => 
      React.createElement('svg', { 
        'data-testid': 'prayfor-logo',
        className,
        ...props 
      })
  };
});

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

// Mock requestIdleCallback
if (typeof window !== 'undefined') {
  if (!window.requestIdleCallback) {
    Object.defineProperty(window, 'requestIdleCallback', {
      value: vi.fn((callback: Function) => {
        return setTimeout(() => callback({ timeRemaining: () => 50 }), 1);
      }),
      writable: true,
      configurable: true,
    });
  }

  if (!window.cancelIdleCallback) {
    Object.defineProperty(window, 'cancelIdleCallback', {
      value: vi.fn((id: number) => clearTimeout(id)),
      writable: true,
      configurable: true,
    });
  }
}

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

// Mock React Query - 簡化版本，不干擾測試
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query') as any;
  return {
    ...actual,
    // 保留實際的 React Query 功能，只 mock 必要的部分
    QueryClient: actual.QueryClient,
    QueryClientProvider: actual.QueryClientProvider,
    useQuery: actual.useQuery,
    useMutation: actual.useMutation,
    useQueryClient: actual.useQueryClient,
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

// Mock use-toast
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

// Mock FirebaseAuthContext
vi.mock('@/contexts/FirebaseAuthContext', () => {
  const MockFirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => children;
  const mockUseFirebaseAuth = vi.fn(() => ({
    currentUser: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    refreshUserAvatar: vi.fn()
  }));
  
  return {
    useFirebaseAuth: mockUseFirebaseAuth,
    FirebaseAuthProvider: MockFirebaseAuthProvider,
    FirebaseAuthContext: {
      Provider: MockFirebaseAuthProvider
    }
  };
});

// Mock tempUserStore
vi.mock('@/stores/tempUserStore', () => ({
  useTempUserStore: vi.fn(() => ({
    tempDisplayName: '',
    setTempDisplayName: vi.fn(),
    clearTempDisplayName: vi.fn(),
  })),
}));

// Mock useFirebaseAuth hook
vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(() => ({
    currentUser: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    refreshUserAvatar: vi.fn()
  })),
}));

// Mock Firebase client
vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  })),
  db: vi.fn(() => ({})),
  storage: vi.fn(() => ({}))
}));

// Mock superAdminService
vi.mock('@/services/admin/SuperAdminService', () => ({
  superAdminService: {
    getInstance: vi.fn(() => ({
      isSuperAdmin: vi.fn().mockResolvedValue(false),
      deletePrayer: vi.fn().mockResolvedValue(true),
    })),
  },
}));

// Mock usePrayerAnswered hook
vi.mock('@/hooks/usePrayerAnswered', () => ({
  useToggleResponseAnswered: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: null
  })),
  useTogglePrayerAnswered: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: null
  }))
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Firebase services
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

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    apiError: vi.fn(),
    confirm: vi.fn(),
  },
  notifications: {
    handleValidationError: vi.fn(),
    loading: vi.fn(),
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

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
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

vi.mock('firebase/firestore', () => ({
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
}));

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
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