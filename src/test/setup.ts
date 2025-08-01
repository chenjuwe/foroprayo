import { vi, afterEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// 確保每個測試後都清理 DOM
afterEach(() => {
  cleanup();
});

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    resetQueries: vi.fn(),
    refetchQueries: vi.fn(),
  })),
  QueryClientProvider: ({ children }: any) => children,
  MutationCache: vi.fn(() => ({
    onError: vi.fn(),
  })),
  useQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    isSuccess: false,
    isStale: false,
    status: 'idle',
    fetchStatus: 'idle',
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    isFetched: false,
    isFetchedAfterMount: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isInitialLoading: false,
    isRefetching: false,
    isPaused: false,
    isEnabled: true,
    promise: Promise.resolve(undefined),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    isIdle: true,
    status: 'idle',
    failureCount: 0,
    submittedAt: 0,
    variables: undefined,
    context: undefined,
    reset: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    resetQueries: vi.fn(),
    refetchQueries: vi.fn(),
  })),
}));

// Mock constants
vi.mock('@/constants', () => ({
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

// Mock Firebase client
vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  }))
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
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' })),
  useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
  Link: ({ children, ...props }: any) => React.createElement('a', props, children),
  BrowserRouter: ({ children }: any) => React.createElement('div', {}, children),
  Navigate: ({ to }: any) => React.createElement('div', { 'data-testid': 'navigate', 'data-to': to }),
}));

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
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}));

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

// Mock window properties
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

Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
  configurable: true,
});

// Mock Canvas API for heic2any
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