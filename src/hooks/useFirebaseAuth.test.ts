import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFirebaseAuth } from './useFirebaseAuth';
import React from 'react';

// Mock FirebaseAuthContext
const mockAuthContext = {
  currentUser: null,
  loading: false,
  signIn: vi.fn().mockResolvedValue({ user: null, error: null }),
  signUp: vi.fn().mockResolvedValue({ user: null, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  resetPassword: vi.fn().mockResolvedValue({ error: null }),
  refreshUserAvatar: vi.fn(),
};

vi.mock('@/contexts/FirebaseAuthContext', () => ({
  FirebaseAuthContext: {
    Provider: ({ children }: any) => children,
  },
  useFirebaseAuth: vi.fn(() => mockAuthContext),
}));

// Mock the actual context behavior
const MockFirebaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(
    'div',
    { 'data-testid': 'mock-firebase-auth-provider' },
    children
  );
};

describe('useFirebaseAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(MockFirebaseAuthProvider, { children })
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

  it('應該拋出錯誤當在 Provider 外使用時', () => {
    // Override the mock to return undefined
    vi.mocked(require('@/contexts/FirebaseAuthContext').useFirebaseAuth)
      .mockImplementationOnce(() => {
        throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
      });

    expect(() => {
      renderHook(() => useFirebaseAuth());
    }).toThrow('useFirebaseAuth must be used within a FirebaseAuthProvider');
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

    // Override mock for this test
    vi.mocked(require('@/contexts/FirebaseAuthContext').useFirebaseAuth)
      .mockReturnValueOnce({
        ...mockAuthContext,
        currentUser: mockUser,
        loading: false,
      });

    const { result } = renderHook(() => useFirebaseAuth(), { wrapper });
    
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('應該正確處理載入狀態', () => {
    // Override mock for this test
    vi.mocked(require('@/contexts/FirebaseAuthContext').useFirebaseAuth)
      .mockReturnValueOnce({
        ...mockAuthContext,
        currentUser: null,
        loading: true,
      });

    const { result } = renderHook(() => useFirebaseAuth(), { wrapper });
    
    expect(result.current.currentUser).toBe(null);
    expect(result.current.loading).toBe(true);
  });
}); 