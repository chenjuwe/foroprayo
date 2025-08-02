import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FirebaseAuthProvider } from '@/contexts/FirebaseAuthContext';
import { vi } from 'vitest';

// 創建測試用查詢客戶端
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false,
    }
  }
});

// 全局測試用戶數據
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: '測試用戶',
  photoURL: 'https://example.com/avatar.jpg',
  emailVerified: true,
};

// 已登入狀態的身分驗證上下文
export const mockAuthContextLoggedIn = {
  currentUser: mockUser,
  loading: false,
  isLoggedIn: true,
  signIn: vi.fn().mockResolvedValue({ user: mockUser, error: null }),
  signUp: vi.fn().mockResolvedValue({ user: mockUser, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  resetPassword: vi.fn().mockResolvedValue({ error: null }),
  refreshUserAvatar: vi.fn().mockResolvedValue(true),
};

// 未登入狀態的身分驗證上下文
export const mockAuthContextLoggedOut = {
  currentUser: null,
  loading: false,
  isLoggedIn: false,
  signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
  signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  resetPassword: vi.fn().mockResolvedValue({ error: null }),
  refreshUserAvatar: vi.fn().mockResolvedValue(true),
};

// 完整的測試渲染函數，包含所有必要的提供者
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    isAuthenticated = false,
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <QueryClientProvider client={queryClient}>
          <FirebaseAuthProvider>
            {children}
          </FirebaseAuthProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }
  
  // 根據認證狀態設置 mock
  if (isAuthenticated) {
    vi.mock('@/contexts/FirebaseAuthContext', () => ({
      useFirebaseAuth: () => mockAuthContextLoggedIn,
      FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
  } else {
    vi.mock('@/contexts/FirebaseAuthContext', () => ({
      useFirebaseAuth: () => mockAuthContextLoggedOut,
      FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// 模擬響應式設計斷點
export const mockResponsiveDesign = (isMobile = false) => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: isMobile ? 375 : 1024,
    });
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: isMobile ? query.includes('max-width: 768px') : query.includes('min-width: 769px'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    // 觸發窗口大小變化事件
    window.dispatchEvent(new Event('resize'));
  }
};

// 等待組件重新渲染
export const waitForRender = async (delay = 0) => {
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  await Promise.resolve();
}; 