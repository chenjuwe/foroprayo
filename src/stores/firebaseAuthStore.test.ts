import { vi, beforeEach, describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';

// Mock Firebase auth
const mockOnAuthStateChanged = vi.fn();
const mockSignOut = vi.fn();

const mockAuth = vi.fn(() => ({
  currentUser: null,
  onAuthStateChanged: mockOnAuthStateChanged,
  signOut: mockSignOut,
}));

vi.mock('@/integrations/firebase/client', () => ({
  auth: mockAuth,
}));

// Mock logger
const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  log: mockLogger,
}));

// Mock query client
const mockQueryClient = {
  clear: vi.fn(),
  invalidateQueries: vi.fn(),
};

vi.mock('@/config/queryClient', () => ({
  queryClient: mockQueryClient,
}));

// Mock background sync service
const mockBackgroundSyncService = {
  syncUserBackground: vi.fn(),
  setGuestBackground: vi.fn(),
};

vi.mock('@/services/sync/BackgroundSyncService', () => ({
  backgroundSyncService: mockBackgroundSyncService,
}));

// Mock constants
vi.mock('@/constants', () => ({
  STORAGE_KEYS: {
    BACKGROUND: 'background',
    CUSTOM_BACKGROUND: 'custom_background',
    CUSTOM_BACKGROUND_SIZE: 'custom_background_size',
  },
  GUEST_DEFAULT_BACKGROUND: 'default-background.jpg',
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

// Mock window.dispatchEvent
Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn(),
  writable: true,
});

// 動態導入 store 以避免 mock 衝突
let useFirebaseAuthStore: any;

describe('firebaseAuthStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // 重置 mock 函數
    mockAuth.mockReturnValue({
      currentUser: null,
      onAuthStateChanged: mockOnAuthStateChanged,
      signOut: mockSignOut,
    });
    
    // 重置 localStorage mock
    localStorageMock.setItem.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    
    // 重置 queryClient mock
    mockQueryClient.clear.mockClear();
    mockQueryClient.invalidateQueries.mockClear();
    
    // 重置 logger mock
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    
    // 重置 backgroundSyncService mock
    mockBackgroundSyncService.syncUserBackground.mockClear();
    mockBackgroundSyncService.setGuestBackground.mockClear();
    
    // 重置 window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
      },
      writable: true,
    });
    
    // 重置 window.dispatchEvent
    Object.defineProperty(window, 'dispatchEvent', {
      value: vi.fn(),
      writable: true,
    });
    
    // 動態導入 store
    const storeModule = await import('./firebaseAuthStore');
    useFirebaseAuthStore = storeModule.useFirebaseAuthStore;
  });

  describe('基本狀態管理', () => {
    it('應該有正確的初始狀態', () => {
      const state = useFirebaseAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.isAuthLoading).toBe(true);
      expect(state.displayName).toBe('');
    });

    it('setUser 應該正確更新用戶狀態', () => {
      const mockUser = {
        uid: 'test-uid',
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
      
      act(() => {
        useFirebaseAuthStore.getState().setUser(mockUser);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('Test User');
    });

    it('setUser 應該在用戶為 null 時重置 displayName', () => {
      act(() => {
        useFirebaseAuthStore.getState().setUser(null);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.displayName).toBe('');
    });

    it('setUser 應該在用戶沒有 displayName 時重置 displayName', () => {
      const mockUser = {
        uid: 'test-uid',
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
      
      act(() => {
        useFirebaseAuthStore.getState().setUser(mockUser);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('');
    });

    it('setUser 應該在用戶 displayName 為空字串時重置 displayName', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: '',
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
      
      act(() => {
        useFirebaseAuthStore.getState().setUser(mockUser);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('');
    });

    it('setAuthLoading 應該正確更新載入狀態', () => {
      act(() => {
        useFirebaseAuthStore.getState().setAuthLoading(true);
      });
      
      let state = useFirebaseAuthStore.getState();
      expect(state.isAuthLoading).toBe(true);
      
      act(() => {
        useFirebaseAuthStore.getState().setAuthLoading(false);
      });
      
      state = useFirebaseAuthStore.getState();
      expect(state.isAuthLoading).toBe(false);
    });

    it('setDisplayName 應該正確更新顯示名稱', () => {
      act(() => {
        useFirebaseAuthStore.getState().setDisplayName('New Display Name');
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe('New Display Name');
    });

    it('setDisplayName 應該能處理空字串', () => {
      act(() => {
        useFirebaseAuthStore.getState().setDisplayName('');
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe('');
    });

    it('setDisplayName 應該能處理特殊字符', () => {
      const specialName = '測試用戶 🎉 @#$%^&*()';
      act(() => {
        useFirebaseAuthStore.getState().setDisplayName(specialName);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe(specialName);
    });
  });

  describe('initAuth', () => {
    it('應該正確初始化認證狀態', () => {
      const mockOnAuthStateChanged = vi.fn();
      mockAuth().onAuthStateChanged = mockOnAuthStateChanged;
      
      act(() => {
        useFirebaseAuthStore.getState().initAuth();
      });
      
      expect(mockOnAuthStateChanged).toHaveBeenCalled();
    });

    it('應該在用戶登入時正確處理狀態', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      let authStateCallback: any;
      mockAuth().onAuthStateChanged = vi.fn((callback) => {
        authStateCallback = callback;
        return vi.fn(); // unsubscribe function
      });
      
      act(() => {
        useFirebaseAuthStore.getState().initAuth();
      });
      
      // 模擬用戶登入
      if (authStateCallback) {
        act(() => {
          authStateCallback(mockUser);
        });
      }
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthLoading).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Firebase 用戶登入',
        { userId: 'test-uid', email: 'test@example.com', displayName: 'Test User' },
        'FirebaseAuthStore'
      );
      expect(mockBackgroundSyncService.syncUserBackground).toHaveBeenCalledWith('test-uid');
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['avatar', 'test-uid'] });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['prayers'] });
    });

    it('應該在用戶登入但沒有 uid 時正確處理', () => {
      const mockUser = {
        uid: '',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      let authStateCallback: any;
      mockAuth().onAuthStateChanged = vi.fn((callback) => {
        authStateCallback = callback;
        return vi.fn();
      });
      
      act(() => {
        useFirebaseAuthStore.getState().initAuth();
      });
      
      if (authStateCallback) {
        act(() => {
          authStateCallback(mockUser);
        });
      }
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthLoading).toBe(false);
      expect(mockBackgroundSyncService.syncUserBackground).not.toHaveBeenCalled();
    });

    it('應該在用戶登入但沒有 email 時正確處理', () => {
      const mockUser = {
        uid: 'test-uid',
        email: null,
        displayName: 'Test User',
      };
      
      let authStateCallback: any;
      mockAuth().onAuthStateChanged = vi.fn((callback) => {
        authStateCallback = callback;
        return vi.fn();
      });
      
      act(() => {
        useFirebaseAuthStore.getState().initAuth();
      });
      
      if (authStateCallback) {
        act(() => {
          authStateCallback(mockUser);
        });
      }
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthLoading).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Firebase 用戶登入',
        { userId: 'test-uid', email: null, displayName: 'Test User' },
        'FirebaseAuthStore'
      );
    });

    it('應該在用戶登出時正確處理狀態', () => {
      let authStateCallback: any;
      mockAuth().onAuthStateChanged = vi.fn((callback) => {
        authStateCallback = callback;
        return vi.fn(); // unsubscribe function
      });
      
      act(() => {
        useFirebaseAuthStore.getState().initAuth();
      });
      
      // 模擬用戶登出
      if (authStateCallback) {
        act(() => {
          authStateCallback(null);
        });
      }
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthLoading).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('background', 'default-background.jpg');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('custom_background', '');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('custom_background_size', '');
      expect(window.dispatchEvent).toHaveBeenCalledWith(new Event('prayforo-background-updated'));
    });

    it('應該在初始化失敗時正確處理錯誤', () => {
      mockAuth().onAuthStateChanged = vi.fn(() => {
        throw new Error('Auth initialization failed');
      });
      
      act(() => {
        useFirebaseAuthStore.getState().initAuth();
      });
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        '初始化 Firebase 認證狀態失敗',
        expect.any(Error),
        'FirebaseAuthStore'
      );
      
      const state = useFirebaseAuthStore.getState();
      expect(state.isAuthLoading).toBe(false);
    });

    it('應該在 onAuthStateChanged 返回 undefined 時正確處理', () => {
      mockAuth().onAuthStateChanged = vi.fn(() => undefined);
      
      act(() => {
        useFirebaseAuthStore.getState().initAuth();
      });
      
      expect(mockAuth().onAuthStateChanged).toHaveBeenCalled();
      // 不應該拋出錯誤
    });

    it('應該在 localStorage 不可用時正確處理', () => {
      // 模擬 localStorage 不可用
      const originalLocalStorage = window.localStorage;
      const mockLocalStorage = {
        setItem: vi.fn(() => {
          throw new Error('localStorage not available');
        }),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      let authStateCallback: any;
      mockAuth().onAuthStateChanged = vi.fn((callback) => {
        authStateCallback = callback;
        return vi.fn();
      });
      
      act(() => {
        useFirebaseAuthStore.getState().initAuth();
      });
      
      if (authStateCallback) {
        // 使用 try-catch 來處理 localStorage 錯誤
        try {
          act(() => {
            authStateCallback(null);
          });
        } catch (error) {
          // 預期的錯誤，不需要處理
        }
      }
      
      // 恢復 localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthLoading).toBe(false);
    });
  });

  describe('signOut', () => {
    it('應該正確處理登出流程', async () => {
      const mockSignOut = vi.fn().mockResolvedValue(undefined);
      mockAuth().signOut = mockSignOut;
      
      await act(async () => {
        await useFirebaseAuthStore.getState().signOut();
      });
      
      expect(mockSignOut).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('background', 'default-background.jpg');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('custom_background', '');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('custom_background_size', '');
      expect(mockQueryClient.clear).toHaveBeenCalled();
      expect(window.location.href).toBe('/auth');
    });

    it('應該在登出失敗時正確處理錯誤', async () => {
      const mockSignOut = vi.fn().mockRejectedValue(new Error('Sign out failed'));
      mockAuth().signOut = mockSignOut;
      
      await act(async () => {
        await useFirebaseAuthStore.getState().signOut();
      });
      
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Firebase 登出失敗',
        expect.any(Error),
        'FirebaseAuthStore'
      );
    });
  });

  describe('狀態重置', () => {
    it('應該正確重置所有狀態', () => {
      // 先設置一些狀態
      act(() => {
        const store = useFirebaseAuthStore.getState();
        store.setUser({ uid: 'test' } as any);
        store.setAuthLoading(true);
        store.setDisplayName('Test User');
      });
      
      // 重置狀態
      act(() => {
        const store = useFirebaseAuthStore.getState();
        store.setUser(null);
        store.setAuthLoading(false);
        store.setDisplayName('');
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthLoading).toBe(false);
      expect(state.displayName).toBe('');
    });

    it('應該在多次狀態變化後保持一致性', () => {
      const mockUser1 = { uid: 'user1', displayName: 'User 1' } as any;
      const mockUser2 = { uid: 'user2', displayName: 'User 2' } as any;
      
      act(() => {
        const store = useFirebaseAuthStore.getState();
        store.setUser(mockUser1);
        store.setUser(mockUser2);
        store.setUser(null);
        store.setUser(mockUser1);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser1);
      expect(state.displayName).toBe('User 1');
    });
  });

  describe('邊緣情況測試', () => {
    it('應該在用戶對象包含額外屬性時正確處理', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        customProperty: 'custom value',
        nestedObject: { key: 'value' },
      } as any;
      
      act(() => {
        useFirebaseAuthStore.getState().setUser(mockUser);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('Test User');
    });

    it('應該在 displayName 包含 HTML 標籤時正確處理', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: '<script>alert("xss")</script>',
      } as any;
      
      act(() => {
        useFirebaseAuthStore.getState().setUser(mockUser);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('<script>alert("xss")</script>');
    });

    it('應該在 displayName 為很長的字串時正確處理', () => {
      const longName = 'A'.repeat(1000);
      act(() => {
        useFirebaseAuthStore.getState().setDisplayName(longName);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe(longName);
    });

    it('應該在 displayName 包含換行符時正確處理', () => {
      const nameWithNewlines = 'User\nName\nWith\nNewlines';
      act(() => {
        useFirebaseAuthStore.getState().setDisplayName(nameWithNewlines);
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe(nameWithNewlines);
    });
  });

  describe('性能測試', () => {
    it('應該在快速連續調用時正確處理', () => {
      const iterations = 100;
      
      act(() => {
        for (let i = 0; i < iterations; i++) {
          useFirebaseAuthStore.getState().setDisplayName(`User ${i}`);
        }
      });
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe(`User ${iterations - 1}`);
    });

    it('應該在大量狀態變化時保持性能', () => {
      const startTime = performance.now();
      
      act(() => {
        for (let i = 0; i < 1000; i++) {
          useFirebaseAuthStore.getState().setAuthLoading(i % 2 === 0);
        }
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 確保執行時間在合理範圍內（小於 100ms）
      expect(executionTime).toBeLessThan(100);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.isAuthLoading).toBe(false);
    });
  });
}); 