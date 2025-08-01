import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, render } from '@testing-library/react';
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

// Mock the entire FirebaseAuthContext module
const mockContextValue: FirebaseAuthContextType = {
  currentUser: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  refreshUserAvatar: vi.fn(),
};

const FirebaseAuthContext = React.createContext<FirebaseAuthContextType | undefined>(mockContextValue);

// Mock the context module
vi.mock('@/contexts/FirebaseAuthContext', () => ({
  FirebaseAuthContext,
}));

// 移除有問題的 async mock

// Now import the hook we want to test
import { useFirebaseAuth } from './useFirebaseAuth';

describe('useFirebaseAuth', () => {
  const mockUser: User = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as any,
    providerData: [],
    refreshToken: 'refresh-token',
    tenantId: null,
    delete: vi.fn(),
    getIdToken: vi.fn(),
    getIdTokenResult: vi.fn(),
    reload: vi.fn(),
    toJSON: vi.fn(),
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock context value
    Object.assign(mockContextValue, {
      currentUser: null,
      loading: false,
      signIn: vi.fn().mockResolvedValue({ user: mockUser, error: null }),
      signUp: vi.fn().mockResolvedValue({ user: mockUser, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPassword: vi.fn().mockResolvedValue({ error: null }),
      refreshUserAvatar: vi.fn(),
    });
  });

  describe('基本功能', () => {
    it('應該正確初始化 hook', () => {
      const result = useFirebaseAuth();

      expect(result).toBeDefined();
      expect(result.currentUser).toBeNull();
      expect(result.loading).toBe(false);
    });

    it('應該正確返回用戶狀態', () => {
      mockContextValue.currentUser = mockUser;
      
      const result = useFirebaseAuth();

      expect(result.currentUser).toEqual(mockUser);
    });

    it('應該正確返回載入狀態', () => {
      mockContextValue.loading = true;
      
      const result = useFirebaseAuth();

      expect(result.loading).toBe(true);
    });

    it('應該包含所有認證方法', () => {
      const result = useFirebaseAuth();

      expect(typeof result.signIn).toBe('function');
      expect(typeof result.signUp).toBe('function');
      expect(typeof result.signOut).toBe('function');
      expect(typeof result.resetPassword).toBe('function');
      expect(typeof result.refreshUserAvatar).toBe('function');
    });
  });

  describe('功能測試', () => {
    it('應該正確調用登入功能', async () => {
      const mockSignIn = vi.fn().mockResolvedValue({ user: mockUser, error: null });
      mockContextValue.signIn = mockSignIn;
      
      const result = useFirebaseAuth();

      await result.signIn('test@example.com', 'password');
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('應該正確調用註冊功能', async () => {
      const mockSignUp = vi.fn().mockResolvedValue({ user: mockUser, error: null });
      mockContextValue.signUp = mockSignUp;
      
      const result = useFirebaseAuth();

      await result.signUp('test@example.com', 'password');
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('應該正確調用登出功能', async () => {
      const mockSignOut = vi.fn().mockResolvedValue({ error: null });
      mockContextValue.signOut = mockSignOut;
      
      const result = useFirebaseAuth();

      await result.signOut();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('應該正確調用重置密碼功能', async () => {
      const mockResetPassword = vi.fn().mockResolvedValue({ error: null });
      mockContextValue.resetPassword = mockResetPassword;
      
      const result = useFirebaseAuth();

      await result.resetPassword('test@example.com');
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('應該正確調用刷新頭像功能', () => {
      const mockRefreshUserAvatar = vi.fn();
      mockContextValue.refreshUserAvatar = mockRefreshUserAvatar;
      
      const result = useFirebaseAuth();

      result.refreshUserAvatar();
      expect(mockRefreshUserAvatar).toHaveBeenCalled();
    });
  });

  describe('邊界情況', () => {
    it('應該正確處理空用戶', () => {
      mockContextValue.currentUser = null;
      
      const result = useFirebaseAuth();

      expect(result.currentUser).toBeNull();
    });

    it('應該正確處理部分用戶資訊', () => {
      const partialUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: null,
      } as User;

      mockContextValue.currentUser = partialUser;
      
      const result = useFirebaseAuth();

      expect(result.currentUser).toEqual(partialUser);
    });
  });
}); 