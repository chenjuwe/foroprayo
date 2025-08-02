import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock Firebase functions
const mockAddDoc = vi.fn(() => Promise.resolve(mockDocRef));
const mockGetDoc = vi.fn(() => Promise.resolve(mockDocSnap));
const mockGetDocs = vi.fn(() => Promise.resolve(mockQuerySnapshot));
const mockUpdateDoc = vi.fn(() => Promise.resolve());
const mockDeleteDoc = vi.fn(() => Promise.resolve());
const mockDoc = vi.fn(() => mockDocRef);
const mockCollection = vi.fn(() => ({}));

vi.mock('firebase/firestore', () => ({
  addDoc: mockAddDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
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

describe('FirebasePrayerService - 簡化測試', () => {
  let service: FirebasePrayerService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock behaviors
    mockDocSnap.exists.mockReturnValue(true);
    mockDocSnap.data.mockReturnValue({
      id: 'test-id',
      content: '測試內容',
      user_id: 'test-user-id',
      created_at: new Date(),
    });
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

      const result = await service.createPrayer(mockPrayerData);

      expect(mockCollection).toHaveBeenCalledWith({}, 'prayers');
      expect(mockAddDoc).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('應該處理創建錯誤', async () => {
      const mockPrayerData = {
        content: '測試祈禱內容',
        is_anonymous: false,
        prayer_type: 'prayer' as const,
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
      };

      mockAddDoc.mockRejectedValueOnce(new Error('Creation failed'));

      await expect(service.createPrayer(mockPrayerData))
        .rejects.toThrow('Creation failed');
    });
  });

  describe('getAllPrayers', () => {
    it('應該成功獲取祈禱列表', async () => {
      const mockPrayers = [
        { id: 'prayer-1', data: () => ({ content: '祈禱1' }) },
        { id: 'prayer-2', data: () => ({ content: '祈禱2' }) }
      ];
      
      mockQuerySnapshot.docs = mockPrayers;
      mockQuerySnapshot.size = 2;
      mockQuerySnapshot.empty = false;

      const result = await service.getAllPrayers();

      expect(mockCollection).toHaveBeenCalledWith({}, 'prayers');
      expect(mockGetDocs).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('應該處理查詢錯誤', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Query failed'));

      await expect(service.getAllPrayers()).rejects.toThrow('Query failed');
    });
  });

  describe('getPrayerById', () => {
    it('應該成功獲取指定ID的祈禱', async () => {
      const result = await service.getPrayerById('prayer-1');

      expect(mockDoc).toHaveBeenCalledWith({}, 'prayers', 'prayer-1');
      expect(mockGetDoc).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('應該在祈禱不存在時返回 null', async () => {
      mockDocSnap.exists.mockReturnValueOnce(false);

      const result = await service.getPrayerById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updatePrayer', () => {
    it('應該成功更新祈禱', async () => {
      await service.updatePrayer('prayer-1', '更新後的內容');

      expect(mockDoc).toHaveBeenCalledWith({}, 'prayers', 'prayer-1');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('deletePrayer', () => {
    it('應該成功刪除祈禱', async () => {
      await service.deletePrayer('prayer-1');

      expect(mockDoc).toHaveBeenCalledWith({}, 'prayers', 'prayer-1');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });
}); 