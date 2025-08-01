import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackgroundService, UserBackground } from './BackgroundService';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Mock Firebase modules
vi.mock('@/integrations/firebase/client', () => ({
  db: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn()
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('BackgroundService', () => {
  let backgroundService: BackgroundService;
  const mockDb = vi.fn();

  const mockUserBackground: UserBackground = {
    user_id: 'test-user-id',
    background_id: 'bg-1',
    custom_background: 'https://example.com/bg.jpg',
    custom_background_size: 'cover',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    backgroundService = new BackgroundService();
    (db as any).mockReturnValue(mockDb);
    (serverTimestamp as any).mockReturnValue({ timestamp: true });
    (Timestamp.now as any).mockReturnValue({ toDate: () => new Date() });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getUserBackground', () => {
    it('應該成功獲取用戶背景設定', async () => {
      const mockDocRef = { id: 'test-user-id' };
      const mockDocSnap = {
        exists: () => true,
        data: () => ({
          background_id: 'bg-1',
          custom_background: 'https://example.com/bg.jpg',
          custom_background_size: 'cover',
          updated_at: '2023-01-01T00:00:00Z'
        })
      };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);

      const result = await backgroundService.getUserBackground('test-user-id');

      expect(doc).toHaveBeenCalledWith(mockDb, 'user_backgrounds', 'test-user-id');
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toEqual({
        user_id: 'test-user-id',
        background_id: 'bg-1',
        custom_background: 'https://example.com/bg.jpg',
        custom_background_size: 'cover',
        updated_at: '2023-01-01T00:00:00Z'
      });
    });

    it('當用戶背景不存在時應該返回 null', async () => {
      const mockDocRef = { id: 'test-user-id' };
      const mockDocSnap = {
        exists: () => false
      };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);

      const result = await backgroundService.getUserBackground('test-user-id');

      expect(result).toBeNull();
    });

    it('當發生錯誤時應該返回 null', async () => {
      (doc as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await backgroundService.getUserBackground('test-user-id');

      expect(result).toBeNull();
    });
  });

  describe('upsertUserBackground', () => {
    it('應該成功插入/更新用戶背景', async () => {
      const backgroundData = {
        user_id: 'test-user-id',
        background_id: 'bg-2',
        custom_background: 'https://example.com/new-bg.jpg',
        custom_background_size: 'contain'
      };

      const mockDocRef = { id: 'test-user-id' };
      (doc as any).mockReturnValue(mockDocRef);
      (setDoc as any).mockResolvedValue(undefined);

      await backgroundService.upsertUserBackground(backgroundData);

      expect(doc).toHaveBeenCalledWith(mockDb, 'user_backgrounds', 'test-user-id');
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          user_id: 'test-user-id',
          background_id: 'bg-2',
          custom_background: 'https://example.com/new-bg.jpg',
          custom_background_size: 'contain',
          updated_at: expect.any(Object)
        }),
        { merge: true }
      );
    });

    it('應該處理空的自定義背景值', async () => {
      const backgroundData = {
        user_id: 'test-user-id',
        background_id: 'bg-1'
      };

      const mockDocRef = { id: 'test-user-id' };
      (doc as any).mockReturnValue(mockDocRef);
      (setDoc as any).mockResolvedValue(undefined);

      await backgroundService.upsertUserBackground(backgroundData);

      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          user_id: 'test-user-id',
          background_id: 'bg-1',
          custom_background: null,
          custom_background_size: null,
          updated_at: expect.any(Object)
        }),
        { merge: true }
      );
    });

    it('當失敗時應該回退到 localStorage', async () => {
      const backgroundData = {
        user_id: 'test-user-id',
        background_id: 'bg-2'
      };

      // Mock localStorage
      const localStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      (doc as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      await backgroundService.upsertUserBackground(backgroundData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'background_test-user-id',
        JSON.stringify(backgroundData)
      );
    });

    it('應該觸發背景更新事件', async () => {
      const backgroundData = {
        user_id: 'test-user-id',
        background_id: 'bg-2'
      };

      const mockDocRef = { id: 'test-user-id' };
      (doc as any).mockReturnValue(mockDocRef);
      (setDoc as any).mockResolvedValue(undefined);

      // Mock window.dispatchEvent
      const dispatchEventMock = vi.fn();
      Object.defineProperty(window, 'dispatchEvent', { value: dispatchEventMock });

      await backgroundService.upsertUserBackground(backgroundData);

      expect(dispatchEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'prayforo-background-updated'
        })
      );
    });
  });
}); 