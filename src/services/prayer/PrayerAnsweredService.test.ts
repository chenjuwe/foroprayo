import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrayerAnsweredService, prayerAnsweredService } from './PrayerAnsweredService';
import { log } from '@/lib/logger';

// Mock logger and notifications
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/lib/notifications', () => ({
  notify: vi.fn()
}));

describe('PrayerAnsweredService', () => {
  let service: PrayerAnsweredService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the BaseService constructor for testing
    service = Object.create(PrayerAnsweredService.prototype);
    Object.setPrototypeOf(service, PrayerAnsweredService.prototype);
    // Manually initialize the service name
    (service as any).serviceName = 'PrayerAnsweredService';
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('應該正確初始化服務', () => {
      expect(service).toBeInstanceOf(PrayerAnsweredService);
    });
  });

  describe('markPrayerAsAnswered', () => {
    it('應該拋出錯誤並記錄日誌', async () => {
      const prayerId = 'prayer-1';

      await expect(service.markPrayerAsAnswered(prayerId))
        .rejects.toThrow('代禱已應允功能暫時停用');

      expect(log.info).toHaveBeenCalledWith(
        'Supabase 代禱已應允功能已停用',
        { prayerId },
        'PrayerAnsweredService'
      );
    });
  });

  describe('markResponseAsAnswered', () => {
    it('應該拋出錯誤並記錄日誌', async () => {
      const responseId = 'response-1';

      await expect(service.markResponseAsAnswered(responseId))
        .rejects.toThrow('代禱已應允功能暫時停用');

      expect(log.info).toHaveBeenCalledWith(
        'Supabase 代禱已應允功能已停用',
        { responseId },
        'PrayerAnsweredService'
      );
    });
  });

  describe('unmarkPrayerAsAnswered', () => {
    it('應該拋出錯誤並記錄日誌', async () => {
      const prayerId = 'prayer-1';

      await expect(service.unmarkPrayerAsAnswered(prayerId))
        .rejects.toThrow('代禱已應允功能暫時停用');

      expect(log.info).toHaveBeenCalledWith(
        'Supabase 代禱已應允功能已停用',
        { prayerId },
        'PrayerAnsweredService'
      );
    });
  });

  describe('unmarkResponseAsAnswered', () => {
    it('應該拋出錯誤並記錄日誌', async () => {
      const responseId = 'response-1';

      await expect(service.unmarkResponseAsAnswered(responseId))
        .rejects.toThrow('代禱已應允功能暫時停用');

      expect(log.info).toHaveBeenCalledWith(
        'Supabase 代禱已應允功能已停用',
        { responseId },
        'PrayerAnsweredService'
      );
    });
  });

  describe('togglePrayerAnswered', () => {
    it('應該拋出錯誤並記錄日誌', async () => {
      const prayerId = 'prayer-1';

      await expect(service.togglePrayerAnswered(prayerId))
        .rejects.toThrow('代禱已應允功能暫時停用');

      expect(log.info).toHaveBeenCalledWith(
        'Supabase 代禱已應允功能已停用',
        { prayerId },
        'PrayerAnsweredService'
      );
    });
  });

  describe('toggleResponseAnswered', () => {
    it('應該拋出錯誤並記錄日誌', async () => {
      const responseId = 'response-1';

      await expect(service.toggleResponseAnswered(responseId))
        .rejects.toThrow('代禱已應允功能暫時停用');

      expect(log.info).toHaveBeenCalledWith(
        'Supabase 代禱已應允功能已停用',
        { responseId },
        'PrayerAnsweredService'
      );
    });
  });

  describe('單例實例', () => {
    it('應該導出預設的服務實例', () => {
      expect(prayerAnsweredService).toBeInstanceOf(PrayerAnsweredService);
    });

    it('單例實例應該與新創建的實例具有相同的行為', async () => {
      const prayerId = 'prayer-1';

      await expect(prayerAnsweredService.markPrayerAsAnswered(prayerId))
        .rejects.toThrow('代禱已應允功能暫時停用');

      expect(log.info).toHaveBeenCalledWith(
        'Supabase 代禱已應允功能已停用',
        { prayerId },
        'PrayerAnsweredService'
      );
    });
  });

  describe('錯誤處理', () => {
    it('所有方法都應該拋出相同的錯誤訊息', async () => {
      const expectedError = '代禱已應允功能暫時停用';

      await expect(service.markPrayerAsAnswered('test')).rejects.toThrow(expectedError);
      await expect(service.markResponseAsAnswered('test')).rejects.toThrow(expectedError);
      await expect(service.unmarkPrayerAsAnswered('test')).rejects.toThrow(expectedError);
      await expect(service.unmarkResponseAsAnswered('test')).rejects.toThrow(expectedError);
      await expect(service.togglePrayerAnswered('test')).rejects.toThrow(expectedError);
      await expect(service.toggleResponseAnswered('test')).rejects.toThrow(expectedError);
    });

    it('所有方法都應該記錄相應的日誌', async () => {
      const testId = 'test-id';

      try { await service.markPrayerAsAnswered(testId); } catch {}
      try { await service.markResponseAsAnswered(testId); } catch {}
      try { await service.unmarkPrayerAsAnswered(testId); } catch {}
      try { await service.unmarkResponseAsAnswered(testId); } catch {}
      try { await service.togglePrayerAnswered(testId); } catch {}
      try { await service.toggleResponseAnswered(testId); } catch {}

      // 每個方法都應該調用 log.info 一次
      expect(log.info).toHaveBeenCalledTimes(6);
    });
  });
}); 