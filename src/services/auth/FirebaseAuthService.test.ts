import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirebaseAuthService } from './FirebaseAuthService';

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
};

vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => mockAuth),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
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
      const mockSignOut = vi.fn().mockResolvedValue(undefined);
      mockAuth.signOut = mockSignOut;

      await FirebaseAuthService.signOut();

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('應該處理 signOut 錯誤', async () => {
      const mockSignOut = vi.fn().mockRejectedValue(new Error('Sign out failed'));
      mockAuth.signOut = mockSignOut;

      const result = await FirebaseAuthService.signOut();
      expect(result.error).toBe('Sign out failed');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('應該在離線時返回錯誤', async () => {
      // 模擬離線狀態
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      const mockSendPasswordResetEmail = vi.fn().mockRejectedValue(new Error('authInstance._getRecaptchaConfig is not a function'));
      mockAuth.sendPasswordResetEmail = mockSendPasswordResetEmail;

      const result = await FirebaseAuthService.sendPasswordResetEmail('test@example.com');

      expect(result.error).toBe('authInstance._getRecaptchaConfig is not a function');
    });

    it('應該在線上時調用 Firebase sendPasswordResetEmail', async () => {
      // 模擬線上狀態
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      const mockSendPasswordResetEmail = vi.fn().mockResolvedValue(undefined);
      mockAuth.sendPasswordResetEmail = mockSendPasswordResetEmail;

      const result = await FirebaseAuthService.sendPasswordResetEmail('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.error).toBeNull();
    });

    it('應該處理 sendPasswordResetEmail 錯誤', async () => {
      // 模擬線上狀態
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      const mockSendPasswordResetEmail = vi.fn().mockRejectedValue(new Error('Email error'));
      mockAuth.sendPasswordResetEmail = mockSendPasswordResetEmail;

      const result = await FirebaseAuthService.sendPasswordResetEmail('test@example.com');

      expect(result.error).toBe('Email error');
    });
  });

  describe('onAuthStateChanged', () => {
    it('應該調用 Firebase onAuthStateChanged', () => {
      const mockCallback = vi.fn();
      const mockOnAuthStateChanged = vi.fn().mockReturnValue(vi.fn());
      mockAuth.onAuthStateChanged = mockOnAuthStateChanged;

      FirebaseAuthService.onAuthStateChanged(mockCallback);

      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(mockCallback, undefined, undefined);
    });
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
  });
}); 