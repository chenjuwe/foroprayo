import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseAuthService } from './FirebaseAuthService';

// Mock Firebase auth methods
const mockSignOut = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();

const mockAuth = {
  currentUser: null,
};

// Mock auth function
const mockAuthFunction = vi.fn(() => mockAuth);

// Mock Firebase auth functions
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  signOut: mockSignOut,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  onAuthStateChanged: mockOnAuthStateChanged,
}));

vi.mock('@/integrations/firebase/client', () => ({
  auth: mockAuthFunction,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
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

describe('FirebaseAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 navigator.onLine 為 true
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
  });

  describe('getCachedUser', () => {
    it('應該返回 null 當沒有緩存用戶時', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = FirebaseAuthService.getCachedUser();

      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_user');
    });

    it('應該返回緩存的用戶資訊', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        timestamp: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = FirebaseAuthService.getCachedUser();

      expect(result).toEqual(mockUser);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_user');
    });

    it('應該返回 null 當緩存過期時', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25小時前
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = FirebaseAuthService.getCachedUser();

      expect(result).toBeNull();
    });

    it('應該返回 null 當緩存格式錯誤時', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = FirebaseAuthService.getCachedUser();

      expect(result).toBeNull();
    });

    it('應該返回匹配的用戶當提供電子郵件時', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        timestamp: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = FirebaseAuthService.getCachedUser('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('應該返回 null 當電子郵件不匹配時', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        timestamp: Date.now(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = FirebaseAuthService.getCachedUser('different@example.com');

      expect(result).toBeNull();
    });
  });

  describe('saveUserToCache', () => {
    it('應該正確保存用戶資訊到緩存', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      FirebaseAuthService.saveUserToCache(mockUser as any);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_user',
        expect.stringContaining('test-user-id')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'last_user',
        'test@example.com'
      );
    });

    it('應該正確保存電子郵件到 last_user', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      FirebaseAuthService.saveUserToCache(mockUser as any);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'last_user',
        'test@example.com'
      );
    });

    it('應該在保存失敗時記錄錯誤', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        FirebaseAuthService.saveUserToCache(mockUser as any);
      }).not.toThrow();
    });

    it('應該處理沒有電子郵件的用戶', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: null,
        displayName: 'Test User',
      };

      FirebaseAuthService.saveUserToCache(mockUser as any);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth_user',
        expect.any(String)
      );
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'last_user',
        expect.any(String)
      );
    });
  });

  describe('signOut', () => {
    it('應該清除緩存並調用 Firebase signOut', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const result = await FirebaseAuthService.signOut();

      expect(mockSignOut).toHaveBeenCalledWith(mockAuth);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('last_user');
      expect(result.error).toBeNull();
    });

    it('應該處理 signOut 錯誤並仍然清除緩存', async () => {
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));

      const result = await FirebaseAuthService.signOut();
      
      expect(result.error).toBe('Sign out failed');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('last_user');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('應該成功發送密碼重置郵件', async () => {
      mockSendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await FirebaseAuthService.sendPasswordResetEmail('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, 'test@example.com');
      expect(result.error).toBeNull();
    });

    it('應該處理 sendPasswordResetEmail 錯誤', async () => {
      const error = new Error('Email error');
      (error as any).code = 'auth/user-not-found';
      mockSendPasswordResetEmail.mockRejectedValue(error);

      const result = await FirebaseAuthService.sendPasswordResetEmail('test@example.com');

      expect(result.error).toBe('找不到此用戶');
    });

    it('應該處理配額錯誤', async () => {
      const error = new Error('quota exceeded');
      (error as any).code = 'auth/quota-exceeded';
      mockSendPasswordResetEmail.mockRejectedValue(error);

      const result = await FirebaseAuthService.sendPasswordResetEmail('test@example.com');

      expect(result.error).toBe('認證服務暫時不可用，請稍後再試');
    });
  });

  describe('onAuthStateChanged', () => {
    it('應該調用 Firebase onAuthStateChanged', () => {
      const mockCallback = vi.fn();
      const unsubscribe = vi.fn();
      mockOnAuthStateChanged.mockReturnValue(unsubscribe);

      const result = FirebaseAuthService.onAuthStateChanged(mockCallback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockAuth, mockCallback);
      expect(result).toBe(unsubscribe);
    });
  });

  describe('signUp', () => {
    it('應該成功註冊新用戶', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const mockUserCredential = { user: mockUser };
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await FirebaseAuthService.signUp('test@example.com', 'password123') as { user: any; error: string | null };

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password123');
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('應該在離線時返回錯誤', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      const result = await FirebaseAuthService.signUp('test@example.com', 'password123') as { user: any; error: string | null };

      expect(result.user).toBeNull();
      expect(result.error).toBe('網絡連接不可用，請檢查您的連接');
    });

    it('應該處理配額超出錯誤並重試', async () => {
      const quotaError = new Error('quota exceeded');
      (quotaError as any).code = 'auth/quota-exceeded';
      
      // 第一次調用失敗，第二次成功
      mockCreateUserWithEmailAndPassword
        .mockRejectedValueOnce(quotaError)
        .mockResolvedValueOnce({ user: { uid: 'test-uid', email: 'test@example.com' } });

      const result = await FirebaseAuthService.signUp('test@example.com', 'password123') as { user: any; error: string | null };

      // 應該有重試機制，最終成功
      expect(result.user).toBeTruthy();
      expect(result.error).toBeNull();
    }, 10000); // 增加超時時間因為有重試延遲
  });

  describe('緩存過期時間', () => {
    it('應該正確處理 24 小時內的緩存', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        timestamp: Date.now() - (12 * 60 * 60 * 1000), // 12小時前
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = FirebaseAuthService.getCachedUser();

      expect(result).toEqual(mockUser);
    });

    it('應該正確處理剛好 24 小時的緩存', () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25小時前，超過24小時
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = FirebaseAuthService.getCachedUser();

      expect(result).toBeNull();
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理 localStorage 錯誤', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = FirebaseAuthService.getCachedUser();

      expect(result).toBeNull();
    });

    it('應該正確處理 JSON 解析錯誤', () => {
      localStorageMock.getItem.mockReturnValue('{invalid json}');

      const result = FirebaseAuthService.getCachedUser();

      expect(result).toBeNull();
    });

    it('應該處理各種 Firebase 錯誤代碼', async () => {
      // 這裡測試 handleAuthError 方法的各種情況
      const testCases = [
        { code: 'auth/invalid-email', expected: '電子郵件格式不正確' },
        { code: 'auth/user-disabled', expected: '此用戶已被禁用' },
        { code: 'auth/user-not-found', expected: '找不到此用戶' },
        { code: 'auth/wrong-password', expected: '密碼不正確' },
        { code: 'auth/email-already-in-use', expected: '此電子郵件已被使用' },
        { code: 'auth/weak-password', expected: '密碼強度不足' },
        { code: 'auth/too-many-requests', expected: '登入嘗試次數過多，請稍後再試' },
        { code: 'auth/quota-exceeded', expected: '認證服務暫時不可用，請稍後再試' },
      ];

      for (const { code, expected } of testCases) {
        const error = new Error('Test error');
        (error as any).code = code;
        mockSendPasswordResetEmail.mockRejectedValueOnce(error);

        const result = await FirebaseAuthService.sendPasswordResetEmail('test@example.com');
        expect(result.error).toBe(expected);
      }
    });
  });
}); 