import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFirebaseAuth } from './useFirebaseAuth';
import React from 'react';

// 定義 User 型別
type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
};

// Mock FirebaseAuthContext
const mockAuthContext = {
  currentUser: null as User | null,
  loading: false,
  signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
  signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  resetPassword: vi.fn().mockResolvedValue({ error: null }),
  refreshUserAvatar: vi.fn(),
};

// Create the actual React context for testing
const FirebaseAuthContext = React.createContext(mockAuthContext);

// Override the module mock
vi.mock('@/contexts/FirebaseAuthContext', () => {
  const context = React.createContext({
    currentUser: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
    signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    refreshUserAvatar: vi.fn(),
  });

  return {
    FirebaseAuthContext: context,
    useFirebaseAuth: () => React.useContext(context),
  };
});

describe('useFirebaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Create a wrapper that provides the context
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(
      FirebaseAuthContext.Provider, 
      { value: mockAuthContext },
      children
    )
  );

  it('應該正確返回 context 值', () => {
    const { result } = renderHook(() => useFirebaseAuth(), { wrapper });
    
    expect(result.current.currentUser).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.resetPassword).toBe('function');
    expect(typeof result.current.refreshUserAvatar).toBe('function');
  });

  it('應該正確調用 signIn 方法', async () => {
    const { result } = renderHook(() => useFirebaseAuth(), { wrapper });
    
    await result.current.signIn('test@example.com', 'password123');
    
    expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('應該正確調用 signUp 方法', async () => {
    const { result } = renderHook(() => useFirebaseAuth(), { wrapper });
    
    await result.current.signUp('test@example.com', 'password123');
    
    expect(mockAuthContext.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('應該正確調用 signOut 方法', async () => {
    const { result } = renderHook(() => useFirebaseAuth(), { wrapper });
    
    await result.current.signOut();
    
    expect(mockAuthContext.signOut).toHaveBeenCalled();
  });

  it('應該正確調用 resetPassword 方法', async () => {
    const { result } = renderHook(() => useFirebaseAuth(), { wrapper });
    
    await result.current.resetPassword('test@example.com');
    
    expect(mockAuthContext.resetPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('應該正確調用 refreshUserAvatar 方法', () => {
    const { result } = renderHook(() => useFirebaseAuth(), { wrapper });
    
    result.current.refreshUserAvatar();
    
    expect(mockAuthContext.refreshUserAvatar).toHaveBeenCalled();
  });

  it('應該正確處理已登入用戶狀態', () => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    // 創建一個有登入用戶的 context wrapper
    const loggedInWrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(
        FirebaseAuthContext.Provider, 
        { 
          value: {
            ...mockAuthContext,
            currentUser: mockUser,
          }
        },
        children
      )
    );

    const { result } = renderHook(() => useFirebaseAuth(), { wrapper: loggedInWrapper });
    
    expect(result.current.currentUser).toEqual(mockUser);
  });

  it('應該正確處理載入狀態', () => {
    // 創建一個正在載入的 context wrapper
    const loadingWrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(
        FirebaseAuthContext.Provider, 
        { 
          value: {
            ...mockAuthContext,
            loading: true,
          }
        },
        children
      )
    );

    const { result } = renderHook(() => useFirebaseAuth(), { wrapper: loadingWrapper });
    
    expect(result.current.loading).toBe(true);
  });
}); 