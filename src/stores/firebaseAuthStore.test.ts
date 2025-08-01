import { vi, beforeEach, describe, it, expect } from 'vitest';

// Mock Firebase auth
const mockOnAuthStateChanged = vi.fn();
const mockSignOut = vi.fn();

// 創建一個更完整的 mock auth 對象
const mockAuthInstance = {
  currentUser: null,
  signOut: mockSignOut,
};

// Mock auth 函數
const mockAuth = vi.fn(() => mockAuthInstance);

// Mock onAuthStateChanged 函數
const mockOnAuthStateChangedFunction = vi.fn();

// 設置所有 mock 在導入 store 之前
vi.mock('@/integrations/firebase/client', () => ({
  auth: mockAuth,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChangedFunction,
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
    
    // 動態導入 store
    const storeModule = await import('./firebaseAuthStore');
    useFirebaseAuthStore = storeModule.useFirebaseAuthStore;
    
    // 重置 store 狀態
    const store = useFirebaseAuthStore.getState();
    store.setUser(null);
    store.setAuthLoading(false);
    store.setDisplayName('');
  });

  describe('基本狀態管理', () => {
    it('應該有正確的初始狀態', () => {
      const state = useFirebaseAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.isAuthLoading).toBe(false);
      expect(state.displayName).toBe('');
    });

    it('setUser 應該正確更新用戶狀態', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      useFirebaseAuthStore.getState().setUser(mockUser);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('Test User');
    });

    it('setUser 應該在用戶為 null 時重置 displayName', () => {
      useFirebaseAuthStore.getState().setUser(null);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.displayName).toBe('');
    });

    it('setUser 應該在用戶沒有 displayName 時重置 displayName', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: null,
      };
      
      useFirebaseAuthStore.getState().setUser(mockUser);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('');
    });

    it('setUser 應該在用戶 displayName 為空字串時重置 displayName', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: '',
      };
      
      useFirebaseAuthStore.getState().setUser(mockUser);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('');
    });

    it('setAuthLoading 應該正確更新載入狀態', () => {
      useFirebaseAuthStore.getState().setAuthLoading(true);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.isAuthLoading).toBe(true);
    });

    it('setDisplayName 應該正確更新顯示名稱', () => {
      useFirebaseAuthStore.getState().setDisplayName('New Display Name');
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe('New Display Name');
    });

    it('setDisplayName 應該能處理空字串', () => {
      useFirebaseAuthStore.getState().setDisplayName('');
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe('');
    });

    it('setDisplayName 應該能處理特殊字符', () => {
      const specialName = '測試用戶 🎉 @#$%^&*()';
      useFirebaseAuthStore.getState().setDisplayName(specialName);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe(specialName);
    });
  });

  describe('initAuth', () => {
    it('應該正確初始化認證狀態', () => {
      mockOnAuthStateChangedFunction.mockReturnValue(vi.fn());
      
      useFirebaseAuthStore.getState().initAuth();
      
      expect(mockOnAuthStateChangedFunction).toHaveBeenCalled();
    });

    it('應該在用戶登入時正確處理狀態', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      mockOnAuthStateChangedFunction.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
      
      useFirebaseAuthStore.getState().initAuth();
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('Test User');
    });

    it('應該在用戶登入但沒有 uid 時正確處理', () => {
      const mockUser = {
        uid: null,
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      mockOnAuthStateChangedFunction.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
      
      useFirebaseAuthStore.getState().initAuth();
      
      const state = useFirebaseAuthStore.getState();
      // 根據實際實現，即使 uid 為 null，用戶對象仍會被設置
      expect(state.user).toEqual(mockUser);
    });

    it('應該在用戶登入但沒有 email 時正確處理', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: null,
        displayName: 'Test User',
      };
      
      mockOnAuthStateChangedFunction.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });
      
      useFirebaseAuthStore.getState().initAuth();
      
      const state = useFirebaseAuthStore.getState();
      // 根據實際實現，即使 email 為 null，用戶對象仍會被設置
      expect(state.user).toEqual(mockUser);
    });

    it('應該在用戶登出時正確處理狀態', () => {
      mockOnAuthStateChangedFunction.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });
      
      useFirebaseAuthStore.getState().initAuth();
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.displayName).toBe('');
    });

    it('應該在初始化失敗時正確處理錯誤', () => {
      mockOnAuthStateChangedFunction.mockImplementation(() => {
        throw new Error('Auth initialization failed');
      });
      
      // 根據實際實現，initAuth 不會拋出錯誤，而是捕獲並記錄
      expect(() => {
        useFirebaseAuthStore.getState().initAuth();
      }).not.toThrow();
    });

    it('應該在 onAuthStateChanged 返回 undefined 時正確處理', () => {
      mockOnAuthStateChangedFunction.mockReturnValue(undefined);
      
      useFirebaseAuthStore.getState().initAuth();
      
      expect(mockOnAuthStateChangedFunction).toHaveBeenCalled();
    });

    it('應該在 localStorage 不可用時正確處理', () => {
      // 模擬 localStorage 不可用
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
      });
      
      mockOnAuthStateChangedFunction.mockReturnValue(vi.fn());
      
      useFirebaseAuthStore.getState().initAuth();
      
      expect(mockOnAuthStateChangedFunction).toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('應該正確處理登出流程', async () => {
      mockSignOut.mockResolvedValue(undefined);
      
      await useFirebaseAuthStore.getState().signOut();
      
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('應該在登出失敗時正確處理錯誤', async () => {
      const mockError = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(mockError);
      
      // 根據實際實現，signOut 不會拋出錯誤，而是捕獲並記錄
      await expect(useFirebaseAuthStore.getState().signOut()).resolves.toBeUndefined();
    });
  });

  describe('狀態重置', () => {
    it('應該正確重置所有狀態', () => {
      // 先設置一些狀態
      const store = useFirebaseAuthStore.getState();
      store.setUser({ uid: 'test' } as any);
      store.setAuthLoading(true);
      store.setDisplayName('Test Name');
      
      // 重置狀態
      store.setUser(null);
      store.setAuthLoading(false);
      store.setDisplayName('');
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthLoading).toBe(false);
      expect(state.displayName).toBe('');
    });

    it('應該在多次狀態變化後保持一致性', () => {
      const mockUser1 = { uid: 'user1', displayName: 'User 1' } as any;
      const mockUser2 = { uid: 'user2', displayName: 'User 2' } as any;
      
      useFirebaseAuthStore.getState().setUser(mockUser1);
      useFirebaseAuthStore.getState().setUser(mockUser2);
      useFirebaseAuthStore.getState().setUser(null);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.displayName).toBe('');
    });
  });

  describe('邊緣情況測試', () => {
    it('應該在用戶對象包含額外屬性時正確處理', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        extraProperty: 'extra value',
      };
      
      useFirebaseAuthStore.getState().setUser(mockUser);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('Test User');
    });

    it('應該在 displayName 包含 HTML 標籤時正確處理', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: '<script>alert("xss")</script>',
      };
      
      useFirebaseAuthStore.getState().setUser(mockUser);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.displayName).toBe('<script>alert("xss")</script>');
    });

    it('應該在 displayName 為很長的字串時正確處理', () => {
      const longName = 'A'.repeat(1000);
      useFirebaseAuthStore.getState().setDisplayName(longName);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe(longName);
    });

    it('應該在 displayName 包含換行符時正確處理', () => {
      const nameWithNewlines = 'User\nName\nWith\nNewlines';
      useFirebaseAuthStore.getState().setDisplayName(nameWithNewlines);
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe(nameWithNewlines);
    });
  });

  describe('性能測試', () => {
    it('應該在快速連續調用時正確處理', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        useFirebaseAuthStore.getState().setDisplayName(`User ${i}`);
      }
      
      const state = useFirebaseAuthStore.getState();
      expect(state.displayName).toBe(`User ${iterations - 1}`);
    });

    it('應該在大量狀態變化時保持性能', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        useFirebaseAuthStore.getState().setAuthLoading(i % 2 === 0);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 確保執行時間在合理範圍內（小於 100ms）
      expect(executionTime).toBeLessThan(100);
    });
  });
}); 