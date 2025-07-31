import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

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

// 簡化其他模組模擬
vi.mock('./hooks/usePerformanceMonitor', () => ({ usePerformanceMonitor: vi.fn() }));
vi.mock('./routes', () => ({ router: {} }));
vi.mock('./config/queryClient', () => ({ queryClient: {} }));

// 實際導入測試主體
import App from './App';

describe('App Component', () => {
  it('renders main structure and components', () => {
    render(<App />);

    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    expect(screen.getByTestId('firebase-auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('network-status')).toBeInTheDocument();
    expect(screen.getByTestId('router-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });
}); 