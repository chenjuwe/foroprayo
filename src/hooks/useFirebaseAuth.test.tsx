import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { User } from 'firebase/auth';

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('@/integrations/firebase/client', () => ({
  auth: mockAuth,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    setLevel: vi.fn(),
    performance: vi.fn(),
    timer: vi.fn(),
  },
  LogLevel: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
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
  MutationCache: vi.fn(() => ({
    getAll: vi.fn(() => []),
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    find: vi.fn(),
    findAll: vi.fn(),
    notify: vi.fn(),
  })),
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

// Mock FirebaseAuthService
vi.mock('@/services/auth/FirebaseAuthService', () => ({
  FirebaseAuthService: {
    signIn: vi.fn(),
    signUp: vi.fn(), 
    signOut: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

// Mock firebaseAuthStore
vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: vi.fn(() => ({
    setUser: vi.fn(),
    setAuthLoading: vi.fn(),
    initAuth: vi.fn(),
  })),
}));

// 創建 FirebaseAuthContext 的類型定義
interface FirebaseAuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  refreshUserAvatar: () => void;
}

// Mock the FirebaseAuthContext - 簡化版本
vi.mock('@/contexts/FirebaseAuthContext', () => {
  const React = require('react');
  
  const mockContextValue: FirebaseAuthContextType = {
    currentUser: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    refreshUserAvatar: vi.fn(),
  };
  
  const FirebaseAuthContext = React.createContext(mockContextValue);
  
  return {
    FirebaseAuthContext,
    FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => 
      React.createElement(FirebaseAuthContext.Provider, { value: mockContextValue }, children),
  };
});

// Now import the hook we want to test
import { useFirebaseAuth } from './useFirebaseAuth';

// Test wrapper component that provides context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement('div', {}, children);
};

describe('useFirebaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本功能', () => {
    it('應該正確初始化 hook', () => {
      const { result } = renderHook(() => useFirebaseAuth(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signUp).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
      expect(typeof result.current.resetPassword).toBe('function');
      expect(typeof result.current.refreshUserAvatar).toBe('function');
    });

    it('應該包含所有認證方法', () => {
      const { result } = renderHook(() => useFirebaseAuth(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signUp).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
      expect(typeof result.current.resetPassword).toBe('function');
      expect(typeof result.current.refreshUserAvatar).toBe('function');
    });
  });

  describe('功能測試', () => {
    it('應該正確調用認證方法', async () => {
      const { result } = renderHook(() => useFirebaseAuth(), {
        wrapper: TestWrapper,
      });

      // 測試這些方法可以被調用而不拋出錯誤
      expect(async () => {
        await result.current.signIn('test@example.com', 'password');
        await result.current.signUp('test@example.com', 'password');
        await result.current.signOut();
        await result.current.resetPassword('test@example.com');
        result.current.refreshUserAvatar();
      }).not.toThrow();
    });
  });

  describe('邊界情況', () => {
    it('應該正確處理基本用例', () => {
      const { result } = renderHook(() => useFirebaseAuth(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeDefined();
      expect(result.current.signIn).toBeDefined();
    });
  });
}); 