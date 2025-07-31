import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { FirebaseAuthContext } from '@/contexts/FirebaseAuthContext';

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => mockAuth),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useFirebaseAuth', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: false,
    isAnonymous: false,
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
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

  const mockContextValue = {
    user: null,
    isAuthLoading: false,
    displayName: '',
    setUser: vi.fn(),
    setAuthLoading: vi.fn(),
    setDisplayName: vi.fn(),
    initAuth: vi.fn(),
    signOut: vi.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <FirebaseAuthContext.Provider value={mockContextValue}>
      {children}
    </FirebaseAuthContext.Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本功能', () => {
    it('應該正確返回 Firebase 認證上下文', () => {
      const { result } = renderHook(() => useFirebaseAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthLoading).toBe(false);
      expect(result.current.displayName).toBe('');
    });

    it('應該在 Provider 外使用時拋出錯誤', () => {
      expect(() => {
        renderHook(() => useFirebaseAuth());
      }).toThrow('useFirebaseAuth must be used within a FirebaseAuthProvider');
    });

    it('應該正確處理用戶狀態', () => {
      const contextWithUser = {
        ...mockContextValue,
        user: mockUser,
      };

      const wrapperWithUser = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={contextWithUser}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      const { result } = renderHook(() => useFirebaseAuth(), { wrapper: wrapperWithUser });

      expect(result.current.user).toEqual(mockUser);
    });

    it('應該正確處理載入狀態', () => {
      const contextWithLoading = {
        ...mockContextValue,
        isAuthLoading: true,
      };

      const wrapperWithLoading = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={contextWithLoading}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      const { result } = renderHook(() => useFirebaseAuth(), { wrapper: wrapperWithLoading });

      expect(result.current.isAuthLoading).toBe(true);
    });

    it('應該正確處理認證方法', () => {
      const { result } = renderHook(() => useFirebaseAuth(), { wrapper });

      expect(result.current.setUser).toBeDefined();
      expect(result.current.setAuthLoading).toBeDefined();
      expect(result.current.setDisplayName).toBeDefined();
      expect(result.current.initAuth).toBeDefined();
      expect(result.current.signOut).toBeDefined();
    });

    it('應該正確處理未定義的上下文', () => {
      const undefinedWrapper = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={undefined as any}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      expect(() => {
        renderHook(() => useFirebaseAuth(), { wrapper: undefinedWrapper });
      }).toThrow('useFirebaseAuth must be used within a FirebaseAuthProvider');
    });
  });

  describe('用戶資訊處理', () => {
    it('應該正確處理有 displayName 的用戶', () => {
      const contextWithDisplayName = {
        ...mockContextValue,
        user: mockUser,
        displayName: 'Test User',
      };

      const wrapperWithDisplayName = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={contextWithDisplayName}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      const { result } = renderHook(() => useFirebaseAuth(), { wrapper: wrapperWithDisplayName });

      expect(result.current.displayName).toBe('Test User');
    });

    it('應該正確處理沒有 displayName 的用戶', () => {
      const contextWithoutDisplayName = {
        ...mockContextValue,
        user: mockUser,
        displayName: '',
      };

      const wrapperWithoutDisplayName = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={contextWithoutDisplayName}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      const { result } = renderHook(() => useFirebaseAuth(), { wrapper: wrapperWithoutDisplayName });

      expect(result.current.displayName).toBe('');
    });
  });

  describe('認證初始化', () => {
    it('應該正確調用初始化認證', () => {
      const mockInitAuth = vi.fn();
      const contextWithInitAuth = {
        ...mockContextValue,
        initAuth: mockInitAuth,
      };

      const wrapperWithInitAuth = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={contextWithInitAuth}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      const { result } = renderHook(() => useFirebaseAuth(), { wrapper: wrapperWithInitAuth });

      act(() => {
        result.current.initAuth();
      });

      expect(mockInitAuth).toHaveBeenCalled();
    });

    it('應該正確調用登出', async () => {
      const mockSignOut = vi.fn(() => Promise.resolve());
      const contextWithSignOut = {
        ...mockContextValue,
        signOut: mockSignOut,
      };

      const wrapperWithSignOut = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={contextWithSignOut}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      const { result } = renderHook(() => useFirebaseAuth(), { wrapper: wrapperWithSignOut });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('邊界情況', () => {
    it('應該正確處理空用戶對象', () => {
      const contextWithEmptyUser = {
        ...mockContextValue,
        user: null,
        displayName: '',
      };

      const wrapperWithEmptyUser = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={contextWithEmptyUser}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      const { result } = renderHook(() => useFirebaseAuth(), { wrapper: wrapperWithEmptyUser });

      expect(result.current.user).toBeNull();
      expect(result.current.displayName).toBe('');
    });

    it('應該正確處理部分用戶資訊', () => {
      const partialUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: null,
        emailVerified: false,
        isAnonymous: false,
        metadata: {} as any,
        providerData: [],
        refreshToken: '',
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

      const contextWithPartialUser = {
        ...mockContextValue,
        user: partialUser,
        displayName: '',
      };

      const wrapperWithPartialUser = ({ children }: { children: React.ReactNode }) => (
        <FirebaseAuthContext.Provider value={contextWithPartialUser}>
          {children}
        </FirebaseAuthContext.Provider>
      );

      const { result } = renderHook(() => useFirebaseAuth(), { wrapper: wrapperWithPartialUser });

      expect(result.current.user).toEqual(partialUser);
      expect(result.current.displayName).toBe('');
    });
  });
}); 