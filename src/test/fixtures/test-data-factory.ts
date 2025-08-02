import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createMockUserStats, mockUserStats, mockUsers } from './mock-data';

/**
 * 測試數據工廠 - 用於統一管理複雜組件的 mock 配置
 */
export class TestDataFactory {
  /**
   * 創建標準化的 QueryClient 用於測試
   */
  static createTestQueryClient(): QueryClient {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
  }

  /**
   * 創建 Firebase 服務的完整 mock
   */
  static createFirebaseServiceMock(options?: {
    userStatsScenario?: keyof typeof mockUserStats;
    shouldError?: boolean;
    errorMessage?: string;
  }) {
    const {
      userStatsScenario = 'default',
      shouldError = false,
      errorMessage = 'Service error'
    } = options || {};

    const stats = createMockUserStats(userStatsScenario);
    
    const mockService = {
      getUserStats: vi.fn(),
      getAllPrayers: vi.fn().mockResolvedValue([]),
      createPrayer: vi.fn().mockResolvedValue({ id: 'new-prayer-id' }),
      updatePrayer: vi.fn().mockResolvedValue({ id: 'updated-prayer-id' }),
      deletePrayer: vi.fn().mockResolvedValue(true),
      getPrayersByUserId: vi.fn().mockResolvedValue([]),
      getPrayerById: vi.fn().mockResolvedValue(null),
      createResponse: vi.fn().mockResolvedValue({ id: 'new-response-id' }),
      updateResponse: vi.fn().mockResolvedValue({ id: 'updated-response-id' }),
      deleteResponse: vi.fn().mockResolvedValue(true),
      toggleLike: vi.fn().mockResolvedValue(true),
      updatePrayerAnsweredStatus: vi.fn().mockResolvedValue({ id: 'prayer-id', isAnswered: true }),
    };

    if (shouldError) {
      // 如果需要模擬錯誤，設置所有方法拋出錯誤
      Object.keys(mockService).forEach(key => {
        (mockService as any)[key] = vi.fn().mockRejectedValue(new Error(errorMessage));
      });
    } else {
      // 正常情況下設置 getUserStats 返回指定數據
      mockService.getUserStats.mockResolvedValue(stats);
    }

    return mockService;
  }

  /**
   * 創建用戶認證的 mock
   */
  static createAuthMock(options?: {
    isAuthenticated?: boolean;
    userId?: string;
    displayName?: string;
    isGuest?: boolean;
  }) {
    const {
      isAuthenticated = true,
      userId = 'test-user-id',
      displayName = '測試用戶',
      isGuest = false
    } = options || {};

    return {
      currentUser: isAuthenticated ? {
        uid: userId,
        displayName,
        email: isGuest ? null : 'test@example.com',
        photoURL: null,
        isGuest,
      } : null,
      loading: false,
      signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
      signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPassword: vi.fn().mockResolvedValue({ error: null }),
      refreshUserAvatar: vi.fn(),
    };
  }

  /**
   * 創建 React Query Hook 的 mock
   */
  static createQueryHookMock<T>(data: T, options?: {
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
  }) {
    const {
      isLoading = false,
      isError = false,
      error = null
    } = options || {};

    return {
      data: isError ? undefined : data,
      isLoading,
      isError,
      error,
      refetch: vi.fn(),
      isFetching: false,
      isSuccess: !isError && !isLoading,
      isStale: false,
      status: isLoading ? 'loading' : isError ? 'error' : 'success',
      fetchStatus: 'idle',
      isPending: isLoading,
      isLoadingError: false,
      isRefetchError: false,
      isPlaceholderData: false,
      isFetched: !isLoading,
      isFetchedAfterMount: !isLoading,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: isError ? Date.now() : 0,
      failureCount: isError ? 1 : 0,
      failureReason: error,
      errorUpdateCount: isError ? 1 : 0,
      isInitialLoading: isLoading,
      isRefetching: false,
      isPaused: false,
      isEnabled: true,
      promise: Promise.resolve(data),
    };
  }

  /**
   * 創建載入狀態的 mock
   */
  static createLoadingMock() {
    return this.createQueryHookMock(undefined, { isLoading: true });
  }

  /**
   * 創建錯誤狀態的 mock
   */
  static createErrorMock(errorMessage = 'Test error') {
    return this.createQueryHookMock(undefined, { 
      isError: true, 
      error: new Error(errorMessage) 
    });
  }

  /**
   * 創建永遠 pending 的 Promise（用於測試載入狀態）
   */
  static createPendingPromise<T>(): Promise<T> {
    return new Promise(() => {}); // 永遠不 resolve
  }

  /**
   * 重置所有 mock 狀態
   */
  static resetAllMocks() {
    vi.clearAllMocks();
  }

  /**
   * 等待異步操作完成的工具函數
   */
  static async waitForAsyncUpdates() {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * 測試場景預設配置
 */
export const TestScenarios = {
  // 正常用戶統計數據
  normalUserStats: () => TestDataFactory.createFirebaseServiceMock({
    userStatsScenario: 'default'
  }),
  
  // 零統計數據
  zeroUserStats: () => TestDataFactory.createFirebaseServiceMock({
    userStatsScenario: 'zero'
  }),
  
  // 大數值統計數據
  largeUserStats: () => TestDataFactory.createFirebaseServiceMock({
    userStatsScenario: 'large'
  }),
  
  // 服務錯誤
  serviceError: () => TestDataFactory.createFirebaseServiceMock({
    shouldError: true,
    errorMessage: 'Firebase service error'
  }),
  
  // 載入狀態
  loadingState: () => {
    const mockService = TestDataFactory.createFirebaseServiceMock();
    mockService.getUserStats.mockImplementation(() => TestDataFactory.createPendingPromise());
    return mockService;
  },
  
  // 認證用戶
  authenticatedUser: () => TestDataFactory.createAuthMock({
    isAuthenticated: true,
    userId: 'authenticated-user',
    displayName: '認證用戶'
  }),
  
  // 訪客用戶
  guestUser: () => TestDataFactory.createAuthMock({
    isAuthenticated: true,
    userId: 'guest-user',
    displayName: '訪客用戶',
    isGuest: true
  }),
  
  // 未認證用戶
  unauthenticatedUser: () => TestDataFactory.createAuthMock({
    isAuthenticated: false
  }),
}; 