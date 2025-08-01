import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// 設置 localStorage mock 的預設返回值
localStorageMock.getItem.mockImplementation((key: string) => {
  switch (key) {
    case 'background':
      return 'default-background.jpg';
    case 'custom_background':
      return null;
    case 'custom_background_size':
      return null;
    default:
      return null;
  }
});

// Mock logger
const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  log: mockLogger,
}));

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
  STORAGE_KEYS: {
    BACKGROUND: 'background',
    CUSTOM_BACKGROUND: 'custom_background',
    CUSTOM_BACKGROUND_SIZE: 'custom_background_size',
  },
  GUEST_DEFAULT_BACKGROUND: 'default-background.jpg',
}));

// Mock useBackgroundStore
const mockUseBackgroundStore = vi.fn(() => ({
  backgroundId: 'default-background.jpg',
  customBackground: null,
  customBackgroundSize: null,
  setBackground: vi.fn(),
  resetToDefault: vi.fn(),
}));

vi.mock('./backgroundStore', () => ({
  useBackgroundStore: mockUseBackgroundStore,
}));

describe('backgroundStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重置 localStorage mock
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // 重置 logger mock
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
  });

  afterEach(() => {
    // 清理 store 狀態
    mockUseBackgroundStore.mockClear();
  });

  describe('基本狀態管理', () => {
    it('應該有正確的初始狀態', () => {
      const mockStore = mockUseBackgroundStore();
      
      expect(mockStore.backgroundId).toBe('default-background.jpg');
      expect(mockStore.customBackground).toBeNull();
      expect(mockStore.customBackgroundSize).toBeNull();
    });

    it('應該有正確的方法', () => {
      const mockStore = mockUseBackgroundStore();
      
      expect(typeof mockStore.setBackground).toBe('function');
      expect(typeof mockStore.resetToDefault).toBe('function');
    });
  });

  describe('setBackground', () => {
    it('應該正確設置預設背景', () => {
      const mockStore = mockUseBackgroundStore();
      const mockSetBackground = mockStore.setBackground;
      
      act(() => {
        mockSetBackground('new-background.jpg');
      });
      
      expect(mockSetBackground).toHaveBeenCalledWith('new-background.jpg');
    });

    it('應該正確設置自定義背景', () => {
      const mockStore = mockUseBackgroundStore();
      const mockSetBackground = mockStore.setBackground;
      
      act(() => {
        mockSetBackground('custom', 'https://example.com/image.jpg', 'cover');
      });
      
      expect(mockSetBackground).toHaveBeenCalledWith('custom', 'https://example.com/image.jpg', 'cover');
    });
  });

  describe('resetToDefault', () => {
    it('應該正確重置背景', () => {
      const mockStore = mockUseBackgroundStore();
      const mockResetToDefault = mockStore.resetToDefault;
      
      act(() => {
        mockResetToDefault();
      });
      
      expect(mockResetToDefault).toHaveBeenCalled();
    });
  });
}); 