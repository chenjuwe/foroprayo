import { vi, expect } from 'vitest';
import { render, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { TestDataFactory } from '@/test/fixtures/test-data-factory';

/**
 * 測試輔助工具 - 專門處理複雜組件測試的常見問題
 */
export class TestHelpers {
  /**
   * 創建帶有 QueryClient 的渲染函數
   */
  static createQueryClientRenderer(customQueryClient?: QueryClient) {
    const queryClient = customQueryClient || TestDataFactory.createTestQueryClient();
    
    return {
      queryClient,
      renderWithQueryClient: (ui: React.ReactElement): RenderResult => {
        return render(
          React.createElement(QueryClientProvider, { client: queryClient }, ui)
        );
      },
    };
  }

  /**
   * 等待 React 狀態更新完成
   */
  static async waitForReactUpdates() {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * 創建統一的 mock 重置函數
   */
  static createMockReset(...mockServices: any[]) {
    return () => {
      vi.clearAllMocks();
      mockServices.forEach(service => {
        if (service && typeof service === 'object') {
          Object.values(service).forEach(fn => {
            if (vi.isMockFunction(fn)) {
              fn.mockClear();
            }
          });
        }
      });
    };
  }

  /**
   * 創建 Firebase 服務的統一 mock
   */
  static createUnifiedFirebaseMock(serviceName: string, customMethods?: Record<string, any>) {
    const defaultMethods = {
      getUserStats: vi.fn(),
      getAllPrayers: vi.fn(),
      createPrayer: vi.fn(),
      updatePrayer: vi.fn(),
      deletePrayer: vi.fn(),
      getPrayersByUserId: vi.fn(),
      getPrayerById: vi.fn(),
      createResponse: vi.fn(),
      updateResponse: vi.fn(),
      deleteResponse: vi.fn(),
      toggleLike: vi.fn(),
      updatePrayerAnsweredStatus: vi.fn(),
    };

    const mockMethods = { ...defaultMethods, ...customMethods };
    
    vi.mock(`@/services/${serviceName}`, () => ({
      [serviceName]: vi.fn().mockImplementation(() => mockMethods),
    }));

    return mockMethods;
  }

  /**
   * 模擬邊界條件測試數據
   */
  static createBoundaryTestData() {
    return {
      empty: {
        prayerCount: 0,
        responseCount: 0,
        receivedLikesCount: 0,
      },
      maximum: {
        prayerCount: Number.MAX_SAFE_INTEGER,
        responseCount: Number.MAX_SAFE_INTEGER,
        receivedLikesCount: Number.MAX_SAFE_INTEGER,
      },
      negative: {
        prayerCount: -1,
        responseCount: -1,
        receivedLikesCount: -1,
      },
      float: {
        prayerCount: 10.5,
        responseCount: 25.7,
        receivedLikesCount: 5.3,
      },
    };
  }

  /**
   * 創建錯誤場景的測試數據
   */
  static createErrorScenarios() {
    return {
      networkError: new Error('Network connection failed'),
      authenticationError: new Error('Authentication failed'),
      permissionError: new Error('Permission denied'),
      validationError: new Error('Validation failed'),
      serverError: new Error('Internal server error'),
      timeoutError: new Error('Request timeout'),
    };
  }

  /**
   * 創建性能測試工具
   */
  static createPerformanceTestUtils() {
    return {
      measureRenderTime: async (renderFn: () => Promise<void> | void) => {
        const startTime = performance.now();
        await renderFn();
        const endTime = performance.now();
        return endTime - startTime;
      },
      
      measureComponentMount: (Component: React.ComponentType<any>, props: any = {}) => {
        const startTime = performance.now();
        const result = render(React.createElement(Component, props));
        const endTime = performance.now();
        return {
          renderTime: endTime - startTime,
          result,
        };
      },
    };
  }

  /**
   * 驗證 mock 調用的輔助函數
   */
  static verifyMockCalls(mockFn: any, expectedCalls: any[]) {
    expect(mockFn).toHaveBeenCalledTimes(expectedCalls.length);
    expectedCalls.forEach((expectedCall, index) => {
      expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedCall);
    });
  }

  /**
   * 創建異步數據加載的測試輔助
   */
  static createAsyncDataHelper() {
    return {
      // 創建立即解析的 Promise
      createResolvedPromise: <T>(data: T) => Promise.resolve(data),
      
      // 創建延遲解析的 Promise
      createDelayedPromise: <T>(data: T, delay: number = 100) => 
        new Promise<T>(resolve => setTimeout(() => resolve(data), delay)),
      
      // 創建拒絕的 Promise
      createRejectedPromise: (error: Error) => Promise.reject(error),
      
      // 創建永遠 pending 的 Promise
      createPendingPromise: <T>() => new Promise<T>(() => {}),
    };
  }

  /**
   * 測試清理工具
   */
  static cleanup() {
    // 清理所有 mock
    vi.clearAllMocks();
    
    // 清理 DOM
    document.body.innerHTML = '';
    
    // 重置定時器
    vi.clearAllTimers();
  }
}

/**
 * 組件測試的預設配置
 */
export const ComponentTestConfig = {
  // React Query 預設配置
  defaultQueryClientOptions: {
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
  },

  // 常用的 mock 配置
  commonMocks: {
    successfulUserStats: {
      prayerCount: 10,
      responseCount: 25,
      receivedLikesCount: 5,
    },
    emptyUserStats: {
      prayerCount: 0,
      responseCount: 0,
      receivedLikesCount: 0,
    },
  },

  // 邊界條件測試配置
  boundaryConditions: {
    maxSafeInteger: Number.MAX_SAFE_INTEGER,
    minSafeInteger: Number.MIN_SAFE_INTEGER,
    largeString: 'a'.repeat(10000),
    emptyString: '',
    specialCharacters: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
  },
}; 