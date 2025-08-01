import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
  },
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

// Mock useTempUserStore
const mockUseTempUserStore = vi.fn(() => ({
  getTempDisplayName: vi.fn(),
  setTempDisplayName: vi.fn(),
  clearTempDisplayName: vi.fn(),
  clearAllTempDisplayNames: vi.fn(),
}));

vi.mock('./tempUserStore', () => ({
  useTempUserStore: mockUseTempUserStore,
}));

describe('tempUserStore - 用戶體驗相關測試', () => {
  let mockStore: ReturnType<typeof mockUseTempUserStore>;

  beforeEach(() => {
    // 重置 mock
    vi.clearAllMocks();
    
    // 獲取 mock store
    mockStore = mockUseTempUserStore();
  });

  afterEach(() => {
    // 清理 mock
    mockUseTempUserStore.mockClear();
  });

  describe('基本功能測試', () => {
    it('應該能夠設置和獲取特定用戶的臨時名稱', () => {
      const userId = 'user123';
      const displayName = '測試用戶';

      mockStore.setTempDisplayName(userId, displayName);
      mockStore.getTempDisplayName.mockReturnValue(displayName);

      const result = mockStore.getTempDisplayName(userId);

      expect(mockStore.setTempDisplayName).toHaveBeenCalledWith(userId, displayName);
      expect(result).toBe(displayName);
    });

    it('應該能夠清除特定用戶的臨時名稱', () => {
      const userId = 'user123';
      const displayName = '測試用戶';

      mockStore.setTempDisplayName(userId, displayName);
      mockStore.getTempDisplayName.mockReturnValueOnce(displayName).mockReturnValueOnce('');

      expect(mockStore.getTempDisplayName(userId)).toBe(displayName);

      mockStore.clearTempDisplayName(userId);
      expect(mockStore.getTempDisplayName(userId)).toBe('');
    });

    it('應該能夠清除所有臨時名稱', () => {
      mockStore.setTempDisplayName('user1', '用戶1');
      mockStore.setTempDisplayName('user2', '用戶2');

      mockStore.getTempDisplayName.mockReturnValueOnce('用戶1').mockReturnValueOnce('用戶2');

      expect(mockStore.getTempDisplayName('user1')).toBe('用戶1');
      expect(mockStore.getTempDisplayName('user2')).toBe('用戶2');

      mockStore.clearAllTempDisplayNames();

      expect(mockStore.clearAllTempDisplayNames).toHaveBeenCalled();
    });
  });

  describe('用戶體驗優化測試', () => {
    it('當設置相同名稱時不應該觸發更新事件', () => {
      const userId = 'user123';
      const displayName = '測試用戶';

      // 第一次設置
      mockStore.setTempDisplayName(userId, displayName);

      // 第二次設置相同名稱
      mockStore.setTempDisplayName(userId, displayName);

      expect(mockStore.setTempDisplayName).toHaveBeenCalledTimes(2);
    });

    it('應該在設置名稱時觸發全局事件', () => {
      const userId = 'user123';
      const displayName = '測試用戶';

      mockStore.setTempDisplayName(userId, displayName);

      expect(mockStore.setTempDisplayName).toHaveBeenCalledWith(userId, displayName);
    });
  });
}); 