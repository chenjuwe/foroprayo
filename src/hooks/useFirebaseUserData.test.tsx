import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFirebaseUserData } from './useFirebaseUserData';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react-dom/test-utils';
import { FirebaseUserService } from '@/services/auth/FirebaseUserService';

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
};

vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => mockAuth),
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock FirebaseUserService
vi.mock('@/services/auth/FirebaseUserService', () => ({
  FirebaseUserService: {
    getUserData: vi.fn(),
    setUserData: vi.fn(),
    updateScripture: vi.fn(),
  },
}));

// Mock firebaseAuthStore
vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: (selector: any) => {
    const state = {
      user: {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      } as any,
      isAuthLoading: false,
    };
    return selector ? selector(state) : state;
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

describe('useFirebaseUserData', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = mockUser as any;
  });

  describe('基本功能', () => {
    it('應該正確初始化 hook', () => {
      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.userData).toBe('object');
      expect(typeof result.current.updateUserData).toBe('function');
      expect(typeof result.current.updateScripture).toBe('function');
    });

    it('應該在沒有用戶時返回 null', () => {
      mockAuth.currentUser = null;
      
      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      expect(result.current.userData).toBeNull();
    });
  });

  describe('用戶資料獲取', () => {
    it('應該成功獲取用戶資料', async () => {
      const mockUserData = {
        userId: 'test-user-id',
        displayName: 'Test User',
        email: 'test@example.com',
        scripture: '測試經文',
        updatedAt: 1753978302003,
      };

      const { useQuery } = await import('@tanstack/react-query');
      vi.mocked(useQuery).mockReturnValue({
        data: mockUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        isError: false,
        status: 'success',
        fetchStatus: 'idle',
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        isPlaceholderData: false,
        isStale: false,
        isFetched: true,
        isFetchedAfterMount: true,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isInitialLoading: false,
        isRefetching: false,
        isPaused: false,
        isEnabled: true,
        promise: Promise.resolve(mockUserData),
      } as any);

      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      await waitFor(() => {
        expect(result.current.userData).toEqual(mockUserData);
      }, { timeout: 15000 });
    }, 15000);

    it('應該處理獲取用戶資料時的錯誤', async () => {
      vi.mocked(FirebaseUserService.getUserData).mockRejectedValue(new Error('Database error'));

      const { useQuery } = await import('@tanstack/react-query');
      vi.mocked(useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Database error'),
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: false,
        isStale: false,
        status: 'error',
        fetchStatus: 'idle',
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        isPlaceholderData: false,
        isFetched: false,
        isFetchedAfterMount: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 1,
        failureReason: new Error('Database error'),
        errorUpdateCount: 1,
        isInitialLoading: false,
        isRefetching: false,
        isPaused: false,
        isEnabled: true,
        promise: Promise.resolve(undefined), // 改為 resolve 避免未處理的 reject
      } as any);

      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      }, { timeout: 15000 });
    }, 15000);
  });

  describe('用戶資料更新', () => {
    it('應該成功更新用戶資料', async () => {
      const mockUpdateData = {
        displayName: 'Updated User',
        scripture: '更新的經文',
      };

      vi.mocked(FirebaseUserService.setUserData).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      await act(async () => {
        await result.current.updateUserData(mockUpdateData);
      });

      expect(FirebaseUserService.setUserData).toHaveBeenCalledWith('test-user-id', mockUpdateData);
    });

    it('應該處理更新用戶資料時的錯誤', async () => {
      const mockUpdateData = {
        displayName: 'Updated User',
      };

      vi.mocked(FirebaseUserService.setUserData).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      await act(async () => {
        await result.current.updateUserData(mockUpdateData);
      });

      // 應該顯示錯誤 toast
      const { toast } = await import('sonner');
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('經文更新', () => {
    it('應該成功更新經文', async () => {
      vi.mocked(FirebaseUserService.updateScripture).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      await act(async () => {
        await result.current.updateScripture('新經文');
      });

      expect(FirebaseUserService.updateScripture).toHaveBeenCalledWith('test-user-id', '新經文');
    });

    it('應該處理更新經文時的錯誤', async () => {
      vi.mocked(FirebaseUserService.updateScripture).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      await act(async () => {
        await expect(result.current.updateScripture('新經文')).rejects.toThrow('Update failed');
      });

      // 應該顯示錯誤 toast
      const { toast } = await import('sonner');
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('本地狀態管理', () => {
    it('應該正確管理本地經文狀態', async () => {
      const mockUserData = {
        userId: 'test-user-id',
        displayName: 'Test User',
        email: 'test@example.com',
        scripture: '測試經文',
        updatedAt: 1753978302003,
      };

      const { useQuery } = await import('@tanstack/react-query');
      vi.mocked(useQuery).mockReturnValue({
        data: mockUserData,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isFetching: false,
        isSuccess: true,
        isError: false,
        status: 'success',
        fetchStatus: 'idle',
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        isPlaceholderData: false,
        isStale: false,
        isFetched: true,
        isFetchedAfterMount: true,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isInitialLoading: false,
        isRefetching: false,
        isPaused: false,
        isEnabled: true,
        promise: Promise.resolve(mockUserData),
      } as any);

      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      await waitFor(() => {
        expect(result.current.scripture).toBe('測試經文');
      }, { timeout: 15000 });
    }, 15000);

    it('應該在更新經文時更新本地狀態', async () => {
      vi.mocked(FirebaseUserService.updateScripture).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFirebaseUserData(), { 
        wrapper: createWrapper() 
      });

      await act(async () => {
        await result.current.updateScripture('新經文');
      });

      expect(result.current.scripture).toBe('新經文');
    });
  });
}); 