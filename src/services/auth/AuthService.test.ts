import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from './AuthService';
import { log } from '@/lib/logger';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  log: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('應該正確初始化服務', () => {
      expect(authService).toBeInstanceOf(AuthService);
    });
  });

  describe('getCurrentUser', () => {
    it('應該返回 null 並記錄停用訊息', async () => {
      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(log.info).toHaveBeenCalledWith('Supabase 認證功能已停用');
    });
  });

  describe('getSession', () => {
    it('應該返回 null 並記錄停用訊息', async () => {
      const result = await authService.getSession();

      expect(result).toBeNull();
      expect(log.info).toHaveBeenCalledWith('Supabase 認證功能已停用');
    });
  });

  describe('onAuthStateChange', () => {
    it('應該返回空的取消訂閱函數並記錄停用訊息', () => {
      const callback = vi.fn();
      const result = authService.onAuthStateChange(callback);

      expect(log.info).toHaveBeenCalledWith('Supabase 認證功能已停用');
      expect(result).toEqual({
        data: {
          subscription: {
            unsubscribe: expect.any(Function)
          }
        }
      });

      // 測試取消訂閱函數不會拋出錯誤
      expect(() => {
        result.data.subscription.unsubscribe();
      }).not.toThrow();
    });

    it('應該處理回調函數參數', () => {
      const callback = vi.fn();
      authService.onAuthStateChange(callback);

      // 驗證回調函數沒有被調用（因為功能被停用）
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('應該完成登出並記錄停用訊息', async () => {
      await authService.signOut();

      expect(log.info).toHaveBeenCalledWith('Supabase 認證功能已停用');
    });

    it('應該不拋出錯誤', async () => {
      await expect(authService.signOut()).resolves.toBeUndefined();
    });
  });

  describe('updateUserMetadata', () => {
    it('應該返回 null 並記錄停用訊息', async () => {
      const metadata = {
        display_name: 'Test User',
        full_name: 'Test Full Name',
        avatar_url: 'https://example.com/avatar.jpg'
      };

      const result = await authService.updateUserMetadata(metadata);

      expect(result).toBeNull();
      expect(log.info).toHaveBeenCalledWith('Supabase 認證功能已停用');
    });

    it('應該處理空的元數據對象', async () => {
      const result = await authService.updateUserMetadata({});

      expect(result).toBeNull();
      expect(log.info).toHaveBeenCalledWith('Supabase 認證功能已停用');
    });

    it('應該處理包含額外屬性的元數據', async () => {
      const metadata = {
        display_name: 'Test User',
        custom_field: 'custom_value',
        another_field: 123
      };

      const result = await authService.updateUserMetadata(metadata);

      expect(result).toBeNull();
      expect(log.info).toHaveBeenCalledWith('Supabase 認證功能已停用');
    });
  });

  describe('錯誤處理', () => {
    it('所有方法都應該安全地處理並返回預期結果', async () => {
      // 測試所有方法都不會拋出錯誤
      await expect(authService.getCurrentUser()).resolves.toBeNull();
      await expect(authService.getSession()).resolves.toBeNull();
      await expect(authService.signOut()).resolves.toBeUndefined();
      await expect(authService.updateUserMetadata({})).resolves.toBeNull();

      const authStateResult = authService.onAuthStateChange(() => {});
      expect(authStateResult).toBeDefined();
    });
  });

  describe('日誌記錄', () => {
    it('所有方法都應該記錄適當的停用訊息', async () => {
      await authService.getCurrentUser();
      await authService.getSession();
      await authService.signOut();
      await authService.updateUserMetadata({});
      authService.onAuthStateChange(() => {});

      // 每個方法都應該調用 log.info 一次，總共 5 次
      expect(log.info).toHaveBeenCalledTimes(5);
      expect(log.info).toHaveBeenCalledWith('Supabase 認證功能已停用');
    });
  });

  describe('類型安全性', () => {
    it('應該正確處理 UserMetadata 類型', async () => {
      const metadata = {
        display_name: 'string_value',
        full_name: 'string_value',
        avatar_url: 'string_value',
        custom_number: 123,
        custom_boolean: true,
        custom_object: { nested: 'value' }
      };

      const result = await authService.updateUserMetadata(metadata);
      expect(result).toBeNull();
    });

    it('應該正確處理 Session 和 User 類型的返回值', async () => {
      const user = await authService.getCurrentUser();
      const session = await authService.getSession();

      // 雖然返回 null，但類型應該是正確的
      expect(user).toBeNull();
      expect(session).toBeNull();
    });
  });

  describe('基礎服務功能', () => {
    it('應該繼承自 BaseService', () => {
      expect(authService).toHaveProperty('serviceName');
    });

    it('應該有正確的服務名稱', () => {
      // 通過測試 protected 方法來驗證服務名稱
      expect((authService as any).serviceName).toBe('AuthService');
    });
  });
}); 