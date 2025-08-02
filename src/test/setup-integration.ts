import { vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';

// 從標準測試設置導入共用模擬
import { mockLocalStorage, mockSessionStorage, mockLogger, MockTimestamp } from './setup';

// 為整合測試創建專用的 Query Client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      // 使用 v5 版本的 Query Client 參數
      gcTime: 0,
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// 創建整合測試全局 Provider
export function TestIntegrationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  
  // 使用 React.createElement 來避免 JSX 解析問題
  return React.createElement(
    BrowserRouter,
    null,
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        FirebaseAuthProvider,
        null,
        children
      )
    )
  );
}

// 自定義渲染函數，用於整合測試
export function renderWithProviders(ui: React.ReactElement) {
  return {
    ...render(ui, { wrapper: TestIntegrationProvider }),
  };
}

// 模擬Firebase Auth的用戶狀態
export const mockAuthState = {
  user: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
  },
  authenticated: true,
  setAuthenticated: vi.fn(),
  setUser: vi.fn(),
};

// 模擬Firebase處於已登入狀態
export function mockAuthenticatedState() {
  vi.mock('@/contexts/FirebaseAuthContext', () => ({
    useFirebaseAuth: vi.fn(() => ({
      currentUser: mockAuthState.user,
      loading: false,
      isAuthenticated: true,
      signIn: vi.fn().mockResolvedValue({ user: mockAuthState.user, error: null }),
      signUp: vi.fn().mockResolvedValue({ user: mockAuthState.user, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPassword: vi.fn().mockResolvedValue({ error: null }),
      refreshUserAvatar: vi.fn()
    })),
    FirebaseAuthProvider: ({ children }: any) => children,
  }));
}

// 模擬Firebase處於未登入狀態
export function mockUnauthenticatedState() {
  vi.mock('@/contexts/FirebaseAuthContext', () => ({
    useFirebaseAuth: vi.fn(() => ({
      currentUser: null,
      loading: false,
      isAuthenticated: false,
      signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
      signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPassword: vi.fn().mockResolvedValue({ error: null }),
      refreshUserAvatar: vi.fn()
    })),
    FirebaseAuthProvider: ({ children }: any) => children,
  }));
}

// 模擬成功的網絡請求響應
export function mockSuccessResponse(data: any) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  });
}

// 模擬失敗的網絡請求響應
export function mockErrorResponse(status = 400, message = 'Bad Request') {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.resolve({ error: message })
  });
}

// 模擬網絡錯誤
export function mockNetworkError() {
  return Promise.reject(new Error('Network Error'));
}

// 配置每個測試的設置和清理
beforeEach(() => {
  // 為整合測試設置計時器
  vi.useFakeTimers();
  
  // 初始化本地存儲
  mockLocalStorage.clear();
  mockSessionStorage.clear();
  
  // 默認為已登入狀態
  mockAuthenticatedState();
});

afterEach(() => {
  // 清理 DOM
  cleanup();
  
  // 重置模擬函數
  vi.clearAllMocks();
  
  // 恢復真實計時器
  vi.useRealTimers();
});

// 匯出所有測試輔助函數和模擬對象
export {
  mockLocalStorage,
  mockSessionStorage,
  mockLogger,
  MockTimestamp,
  toast
}; 