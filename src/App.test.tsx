import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

// 使用 vi.hoisted 來解決變數提升問題
const hoisted = vi.hoisted(() => ({
  mockInitAuth: vi.fn(),
  mockInitNetworkListeners: vi.fn(),
  mockCacheInitialize: vi.fn()
}));

// 定義通用的 Props 類型
interface ChildrenProps {
  children: ReactNode;
}

// 基本元件模擬
vi.mock('react-router-dom', () => ({
  RouterProvider: () => <div data-testid="router-provider">Router Content</div>
}));

// 模擬 QueryClient 及相關組件
vi.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: ChildrenProps) => <div data-testid="query-provider">{children}</div>
}));

vi.mock('@tanstack/react-query-persist-client', () => ({
  PersistQueryClientProvider: ({ children }: ChildrenProps) => <div data-testid="persist-provider">{children}</div>
}));

// 簡單模擬其他組件
vi.mock('./components/NetworkStatusAlert', () => ({
  NetworkStatusAlert: () => <div data-testid="network-status">Network Status Alert</div>
}));

vi.mock('./components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}));

vi.mock('./contexts/FirebaseAuthContext', () => ({
  FirebaseAuthProvider: ({ children }: ChildrenProps) => <div data-testid="firebase-auth-provider">{children}</div>,
  useFirebaseAuth: () => ({
    currentUser: null,
    isLoading: false
  })
}));

// 模擬關鍵函數
type AuthStore = {
  user: null;
  isAuthLoading: boolean;
  initAuth: () => void;
};

vi.mock('./stores/authStore', () => ({
  useAuthStore: (selector: ((state: AuthStore) => unknown) | undefined) => {
    if (selector) {
      return selector({ 
        user: null, 
        isAuthLoading: false,
        initAuth: hoisted.mockInitAuth 
      });
    }
    return null;
  }
}));

vi.mock('./stores/networkStore', () => ({
  initNetworkListeners: hoisted.mockInitNetworkListeners
}));

vi.mock('./services/sync/CacheService', () => ({
  cacheService: {
    initialize: hoisted.mockCacheInitialize,
    getPersistQueryClientProviderProps: () => ({})
  }
}));

// 簡化其他模組模擬
vi.mock('./hooks/usePerformanceMonitor', () => ({ usePerformanceMonitor: vi.fn() }));
vi.mock('./hooks/useIdlePrefetch', () => ({ useIdlePrefetch: vi.fn() }));
vi.mock('./hooks/useFirebaseAvatar', () => ({ useFirebaseAvatar: () => ({ refreshAvatar: vi.fn() }) }));
vi.mock('./routes', () => ({ router: {} }));
vi.mock('./config/queryClient', () => ({ queryClient: {} }));
vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => ({
    currentUser: null
  })),
  db: vi.fn(() => ({}))
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('@/services/auth/FirebaseUserService', () => ({
  FirebaseUserService: {
    syncUserDataFromAuth: vi.fn().mockResolvedValue({}),
    ensureUserDisplayName: vi.fn().mockResolvedValue('Test User'),
  }
}));

vi.mock('./stores/tempUserStore', () => ({
  useTempUserStore: {
    getState: vi.fn().mockReturnValue({
      setTempDisplayName: vi.fn()
    })
  }
}));

// 實際導入測試主體
import App from './App';

describe('App Component', () => {
  it('renders main structure and components', () => {
    render(<App />);

    expect(screen.getByTestId('firebase-auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('persist-provider')).toBeInTheDocument();
    
    // 驗證函數調用
    expect(hoisted.mockInitAuth).not.toHaveBeenCalled(); // FirebaseAuthProvider 現在代替了 AuthStore
    expect(hoisted.mockInitNetworkListeners).toHaveBeenCalled();
    expect(hoisted.mockCacheInitialize).toHaveBeenCalled();
  });
}); 