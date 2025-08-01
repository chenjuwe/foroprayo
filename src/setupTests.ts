import { expect, afterEach, vi, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

// 擴展 Vitest 的匹配器
expect.extend(matchers);

// 每個測試後清理 - 修復 React 並發渲染問題
afterEach(() => {
  cleanup();
  // 清理所有計時器
  vi.clearAllTimers();
  // 清理所有模擬
  vi.clearAllMocks();
  // 重置模組緩存
  vi.resetModules();
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

// 模擬 Firebase 基本客戶端
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

// 模擬 NetworkStatusAlert 相關的 hooks
vi.mock('@/stores/networkStore', () => ({
  useNetworkStore: vi.fn(() => ({
    isOnline: true,
    hasPreviouslyBeenOffline: false,
    setOnlineStatus: vi.fn(),
  })),
  initNetworkListeners: vi.fn(),
}));

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => ({
    retryConnection: vi.fn().mockResolvedValue(true),
    connectionError: null,
  })),
}));

// 模擬 React Router 基本功能
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
vi.mock('@/lib/logger', () => {
  const mockLog = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
  
  return {
    log: mockLog,
    logger: mockLog,
    LogLevel: {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
    },
    default: mockLog,
  };
});

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

// 模擬 React Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    resetQueries: vi.fn(),
    refetchQueries: vi.fn(),
    getQueryCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
      get: vi.fn(),
      remove: vi.fn(),
    })),
    getMutationCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
      get: vi.fn(),
      remove: vi.fn(),
    })),
  })),
  QueryClientProvider: ({ children }: any) => children,
  useQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    isSuccess: false,
    isStale: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    isFetched: false,
    isFetchedAfterMount: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetching: false,
    status: 'idle',
    fetchStatus: 'idle',
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    isIdle: true,
    isPaused: false,
    status: 'idle',
    failureCount: 0,
    failureReason: null,
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
    getQueryCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
      get: vi.fn(),
      remove: vi.fn(),
    })),
    getMutationCache: vi.fn(() => ({
      getAll: vi.fn(() => []),
      get: vi.fn(),
      remove: vi.fn(),
    })),
  })),
  MutationCache: vi.fn(() => ({
    onError: vi.fn(),
    onSuccess: vi.fn(),
    onMutate: vi.fn(),
    onSettled: vi.fn(),
  })),
  QueryCache: vi.fn(() => ({
    onError: vi.fn(),
    onSuccess: vi.fn(),
    onSettled: vi.fn(),
  })),
  useInfiniteQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetching: false,
    isSuccess: false,
    isStale: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    isFetched: false,
    isFetchedAfterMount: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetching: false,
    status: 'idle',
    fetchStatus: 'idle',
  })),
  useSuspenseQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    isSuccess: false,
    isStale: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    isFetched: false,
    isFetchedAfterMount: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetching: false,
    status: 'idle',
    fetchStatus: 'idle',
  })),
  useSuspenseInfiniteQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetching: false,
    isSuccess: false,
    isStale: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    isFetched: false,
    isFetchedAfterMount: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetching: false,
    status: 'idle',
    fetchStatus: 'idle',
  })),
}));

// 模擬 use-toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toasts: [],
    toast: vi.fn(),
    dismiss: vi.fn(),
  })),
  toast: vi.fn(),
}));

// 模擬 sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  },
  Toaster: vi.fn(() => null),
})); 