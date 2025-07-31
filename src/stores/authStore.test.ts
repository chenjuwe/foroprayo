import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFirebaseAuthStore } from './firebaseAuthStore';
import { mockUser } from '@/utils/test-utils';
import { act } from '@testing-library/react';
import { STORAGE_KEYS } from '@/constants';

// 使用 vi.hoisted 提升宣告
const hoistedMocks = vi.hoisted(() => {
  return {
    mockSignOut: vi.fn().mockResolvedValue(undefined),
    mockOnAuthStateChanged: vi.fn((_, callback) => {
      // 模擬觸發回調函數
      callback(null);
      // 返回取消訂閱函數
      return () => {};
    })
  };
});

// 模擬 Firebase auth
vi.mock('firebase/auth', () => {
  return {
    onAuthStateChanged: hoistedMocks.mockOnAuthStateChanged,
    signOut: vi.fn(() => Promise.resolve())
  };
});

// 模擬 firebase client
vi.mock('@/integrations/firebase/client', () => {
  return {
    auth: vi.fn(() => ({
      signOut: hoistedMocks.mockSignOut
    })),
    db: vi.fn()
  };
});

// 模擬 backgroundSyncService
vi.mock('@/services/sync/BackgroundSyncService', () => {
  return {
    backgroundSyncService: {
      syncUserBackground: vi.fn(),
    },
  };
});

// 模擬 queryClient
vi.mock('@/config/queryClient', () => {
  return {
    queryClient: {
      invalidateQueries: vi.fn(),
      clear: vi.fn(),
    },
  };
});

// 模擬全局 localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key]),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// 模擬 window.dispatchEvent
window.dispatchEvent = vi.fn();

// 模擬 window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '' },
});

describe('firebaseAuthStore', () => {
  // 在每個測試之前重置狀態
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    window.location.href = '';
    
    // 重置 store 狀態
    act(() => {
      useFirebaseAuthStore.setState({
        user: null,
        isAuthLoading: true,
        displayName: '',
      });
    });
  });
  
  it('應該有正確的初始狀態', () => {
    const store = useFirebaseAuthStore.getState();
    expect(store.user).toBeNull();
    expect(store.isAuthLoading).toBe(true);
    expect(store.displayName).toBe('');
  });
  
  it('setUser 應該正確更新用戶狀態', () => {
    const store = useFirebaseAuthStore.getState();
    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User'
    };
    
    act(() => {
      store.setUser(mockFirebaseUser as { uid: string; email: string; displayName: string });
    });
    
    expect(useFirebaseAuthStore.getState().user).toEqual(mockFirebaseUser);
    expect(useFirebaseAuthStore.getState().displayName).toBe('Test User');
  });
  
  it('setUser 應該在用戶沒有displayName時將displayName設為空字串', () => {
    const store = useFirebaseAuthStore.getState();
    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: null
    };
    
    act(() => {
      store.setUser(mockFirebaseUser as { uid: string; email: string; displayName: string | null });
    });
    
    expect(useFirebaseAuthStore.getState().user).toEqual(mockFirebaseUser);
    expect(useFirebaseAuthStore.getState().displayName).toBe('');
  });
  
  it('setAuthLoading 應該正確更新載入狀態', () => {
    const store = useFirebaseAuthStore.getState();
    
    act(() => {
      store.setAuthLoading(false);
    });
    
    expect(useFirebaseAuthStore.getState().isAuthLoading).toBe(false);
  });
  
  it('setDisplayName 應該正確更新顯示名稱', () => {
    const store = useFirebaseAuthStore.getState();
    
    act(() => {
      store.setDisplayName('New Name');
    });
    
    expect(useFirebaseAuthStore.getState().displayName).toBe('New Name');
  });
  
  it('initAuth 應該設置認證狀態監聽器', () => {
    const store = useFirebaseAuthStore.getState();
    
    act(() => {
      store.initAuth();
    });
    
    expect(hoistedMocks.mockOnAuthStateChanged).toHaveBeenCalled();
  });
  
  it('signOut 應該調用 auth().signOut', async () => {
    await useFirebaseAuthStore.getState().signOut();
    
    // 驗證 signOut 被調用了
    expect(hoistedMocks.mockSignOut).toHaveBeenCalledTimes(1);
    
    // 驗證 localStorage 的訪客背景設置
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.BACKGROUND, expect.any(String));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.CUSTOM_BACKGROUND, '');
  });
}); 