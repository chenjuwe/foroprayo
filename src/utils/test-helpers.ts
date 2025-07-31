import { QueryClient } from '@tanstack/react-query';
import { FirebaseUser } from 'firebase/auth';
import { vi } from 'vitest';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { mockUser } from './test-constants';

// 創建一個模擬的 QueryClient
export const createTestQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
    },
  });

// 模擬 Zustand Firebase 認證存儲
export const mockFirebaseAuthStore = () => {
  const originalUseFirebaseAuthStore = useFirebaseAuthStore;
  
  // 模擬登入狀態
  const mockLoggedInState = {
    user: mockUser,
    isAuthLoading: false,
    displayName: '測試用戶',
    setUser: vi.fn(),
    setAuthLoading: vi.fn(),
    setDisplayName: vi.fn(),
    initAuth: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
  
  // 模擬未登入狀態
  const mockLoggedOutState = {
    user: null,
    isAuthLoading: false,
    displayName: '',
    setUser: vi.fn(),
    setAuthLoading: vi.fn(),
    setDisplayName: vi.fn(),
    initAuth: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
  
  // 創建模擬函數
  const mockStore = (isLoggedIn = true) => {
    vi.spyOn(useFirebaseAuthStore, 'getState').mockReturnValue(
      isLoggedIn ? mockLoggedInState : mockLoggedOutState
    );
    
    return vi.fn().mockImplementation((selector) => {
      const state = isLoggedIn ? mockLoggedInState : mockLoggedOutState;
      return selector(state);
    });
  };
  
  return { originalUseFirebaseAuthStore, mockStore };
}; 