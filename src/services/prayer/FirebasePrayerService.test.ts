import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebasePrayerService } from './FirebasePrayerService';

// Firebase mock設置
const mockDocSnap = {
  exists: vi.fn(() => true),
  data: vi.fn(() => ({})),
  id: 'mock-doc-id',
};

const mockQuerySnapshot = {
  docs: [] as any[],
  size: 0,
  empty: true,
  forEach: vi.fn(),
};

const mockDocRef = {
  id: 'mock-doc-id',
  path: 'mock/path',
};

// Export mocks for use in tests
export const mockAddDoc = vi.fn(() => Promise.resolve(mockDocRef));
export const mockGetDoc = vi.fn(() => Promise.resolve(mockDocSnap));
export const mockGetDocs = vi.fn(() => Promise.resolve(mockQuerySnapshot));
export const mockSetDoc = vi.fn(() => Promise.resolve());
export const mockUpdateDoc = vi.fn(() => Promise.resolve());
export const mockDeleteDoc = vi.fn(() => Promise.resolve());
export const mockDoc = vi.fn(() => mockDocRef);
export const mockCollection = vi.fn(() => ({}));

// Mock Firebase functions
vi.mock('firebase/firestore', () => ({
  addDoc: mockAddDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  doc: mockDoc,
  collection: mockCollection,
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  Timestamp: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

// Mock Firebase client
vi.mock('@/integrations/firebase/client', () => ({
  db: vi.fn(() => ({})),
  auth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  })),
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

// Mock constants
vi.mock('@/constants', () => ({
  ERROR_MESSAGES: {
    NETWORK_ERROR: '網絡錯誤',
    UNKNOWN_ERROR: '未知錯誤',
    AUTH_ERROR: '認證錯誤',
  },
}));

// Mock getUnifiedUserName
vi.mock('@/lib/getUnifiedUserName', () => ({
  getUnifiedUserName: vi.fn(() => 'Test User'),
}));

describe('FirebasePrayerService', () => {
  let service: FirebasePrayerService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock behaviors
    mockDocSnap.exists.mockReturnValue(true);
    mockDocSnap.data.mockReturnValue({});
    service = new FirebasePrayerService();
  });

  describe('createPrayer', () => {
    it('應該成功創建祈禱', async () => {
      const mockPrayerData = {
        content: '測試祈禱內容',
        is_anonymous: false,
        prayer_type: 'prayer' as const,
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
      };

      // 設定成功的返回數據
      mockDocSnap.data.mockReturnValue({
        id: 'new-prayer-id',
        content: '測試祈禱內容',
        user_id: 'test-user-id',
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
        is_anonymous: false,
        created_at: new Date(),
        updated_at: new Date(),
        image_url: null,
        is_answered: false,
        response_count: 0,
        prayer_type: 'prayer'
      });

      const result = await service.createPrayer(mockPrayerData);

      expect(mockCollection).toHaveBeenCalledWith({}, 'prayers');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          content: '測試祈禱內容',
          user_id: 'test-user-id',
          is_anonymous: false,
          prayer_type: 'prayer',
        })
      );
      expect(result).toEqual(expect.objectContaining({
        id: 'new-prayer-id',
        content: '測試祈禱內容',
      }));
    });

    it('應該處理創建錯誤', async () => {
      const mockPrayerData = {
        content: '測試祈禱內容',
        is_anonymous: false,
        prayer_type: 'prayer' as const,
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
      };

      mockAddDoc.mockRejectedValue(new Error('Creation failed'));

      await expect(service.createPrayer(mockPrayerData))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('getAllPrayers', () => {
    it('應該成功獲取祈禱列表', async () => {
      // 設定查詢結果
      const mockPrayers = [
        {
          id: 'prayer-1',
          content: '祈禱內容1',
          user_id: 'user-1',
          created_at: new Date(),
        },
        {
          id: 'prayer-2', 
          content: '祈禱內容2',
          user_id: 'user-2',
          created_at: new Date(),
        }
      ];

      mocks.mockQuerySnapshot.docs = mockPrayers.map(prayer => ({
        id: prayer.id,
        data: () => prayer,
        exists: () => true,
      }));
      mocks.mockQuerySnapshot.size = mockPrayers.length;
      mocks.mockQuerySnapshot.empty = false;

      const result = await service.getAllPrayers();

      expect(mocks.collection).toHaveBeenCalledWith({}, 'prayers');
      expect(mocks.getDocs).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'prayer-1',
        content: '祈禱內容1',
      }));
    });

    it('應該處理查詢錯誤', async () => {
      mockFirebaseError(mocks, 'Query failed');

      await expect(service.getAllPrayers()).rejects.toThrow('Query failed');
    });
  });

  describe('getPrayerById', () => {
    it('應該成功獲取指定ID的祈禱', async () => {
      const mockPrayer = {
        id: 'prayer-1',
        content: '測試祈禱',
        user_id: 'user-1',
        created_at: new Date(),
      };

      mocks.mockDocSnap.data.mockReturnValue(mockPrayer);
      mocks.mockDocSnap.exists.mockReturnValue(true);

      const result = await service.getPrayerById('prayer-1');

      expect(mocks.doc).toHaveBeenCalledWith({}, 'prayers', 'prayer-1');
      expect(mocks.getDoc).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: 'prayer-1',
        content: '測試祈禱',
      }));
    });

    it('應該在祈禱不存在時返回 null', async () => {
      mockFirebaseEmpty(mocks);

      const result = await service.getPrayerById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updatePrayer', () => {
    it('應該成功更新祈禱', async () => {
      const newContent = '更新後的內容';

      await service.updatePrayer('prayer-1', newContent);

      expect(mocks.doc).toHaveBeenCalledWith({}, 'prayers', 'prayer-1');
      expect(mocks.updateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          content: newContent,
          updated_at: expect.any(String),
        })
      );
    });

    it('應該處理更新錯誤', async () => {
      mockFirebaseError(mocks, 'Update failed');

      await expect(service.updatePrayer('prayer-1', '新內容'))
        .rejects.toThrow('Update failed');
    });
  });

  describe('deletePrayer', () => {
    it('應該成功刪除祈禱', async () => {
      await service.deletePrayer('prayer-1');

      expect(mocks.doc).toHaveBeenCalledWith({}, 'prayers', 'prayer-1');
      expect(mocks.deleteDoc).toHaveBeenCalled();
    });

    it('應該處理刪除錯誤', async () => {
      mockFirebaseError(mocks, 'Delete failed');

      await expect(service.deletePrayer('prayer-1'))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('離線支持', () => {
    it('應該在離線時返回適當的錯誤', async () => {
      mockFirebaseError(mocks, '網絡連接錯誤');

      await expect(service.getAllPrayers())
        .rejects.toThrow('網絡連接錯誤');
    });
  });
}); 