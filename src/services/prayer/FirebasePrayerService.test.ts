import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebasePrayerService } from './FirebasePrayerService';

// Mock Firebase functions
const mockAddDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockCollection = vi.fn();
const mockGetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  addDoc: mockAddDoc,
  getDocs: mockGetDocs,
  getDoc: mockGetDoc,
  doc: mockDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  collection: mockCollection,
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  Timestamp: vi.fn(),
  writeBatch: vi.fn(),
}));

// Mock Firebase client
const mockDb = vi.fn(() => ({}));
const mockAuth = vi.fn(() => ({
  currentUser: {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com'
  }
}));

vi.mock('@/integrations/firebase/client', () => ({
  db: mockDb,
  auth: mockAuth,
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

      const mockDocRef = { id: 'new-prayer-id' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('prayers-collection');
      
      // Mock getDoc for returning the created prayer
      mockGetDoc.mockResolvedValue({
        id: 'new-prayer-id',
        exists: () => true,
        data: () => ({
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
        })
      });

      const result = await service.createPrayer(mockPrayerData);

      expect(mockCollection).toHaveBeenCalledWith({}, 'prayers');
      expect(mockAddDoc).toHaveBeenCalled();
      expect(result.id).toBe('new-prayer-id');
    });

    it('應該處理創建錯誤', async () => {
      const mockPrayerData = {
        content: '測試祈禱內容',
        is_anonymous: false,
        prayer_type: 'prayer' as const,
      };

      mockAddDoc.mockRejectedValue(new Error('Creation failed'));
      mockCollection.mockReturnValue('prayers-collection');

      await expect(service.createPrayer(mockPrayerData)).rejects.toThrow('Creation failed');
    });
  });

  describe('getAllPrayers', () => {
    it('應該成功獲取祈禱列表', async () => {
      const mockPrayers = [
        { 
          id: '1', 
          data: () => ({ 
            content: '祈禱1',
            user_id: 'user-1',
            user_name: 'User 1',
            is_anonymous: false,
            created_at: new Date(),
            updated_at: new Date(),
            image_url: null,
            is_answered: false,
            response_count: 0,
            prayer_type: 'prayer'
          }) 
        },
        { 
          id: '2', 
          data: () => ({ 
            content: '祈禱2',
            user_id: 'user-2',
            user_name: 'User 2',
            is_anonymous: false,
            created_at: new Date(),
            updated_at: new Date(),
            image_url: null,
            is_answered: false,
            response_count: 0,
            prayer_type: 'prayer'
          }) 
        },
      ];

      const mockSnapshot = { docs: mockPrayers };
      mockGetDocs.mockResolvedValue(mockSnapshot);
      mockQuery.mockReturnValue('query-object');
      mockCollection.mockReturnValue('prayers-collection');
      mockOrderBy.mockReturnValue('order-by-object');

      const result = await service.getAllPrayers();

      expect(mockCollection).toHaveBeenCalledWith({}, 'prayers');
      expect(mockOrderBy).toHaveBeenCalledWith('created_at', 'desc');
      expect(mockGetDocs).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
    });

    it('應該處理查詢錯誤', async () => {
      mockGetDocs.mockRejectedValue(new Error('Query failed'));
      mockQuery.mockReturnValue('query-object');
      mockCollection.mockReturnValue('prayers-collection');

      await expect(service.getAllPrayers()).rejects.toThrow('Query failed');
    });
  });

  describe('getPrayerById', () => {
    it('應該成功獲取指定ID的祈禱', async () => {
      const mockPrayerDoc = {
        id: '1',
        exists: () => true,
        data: () => ({
          content: '測試祈禱',
          user_id: 'user-1',
          user_name: 'Test User',
          is_anonymous: false,
          created_at: new Date(),
          updated_at: new Date(),
          image_url: null,
          is_answered: false,
          response_count: 0,
          prayer_type: 'prayer'
        })
      };

      mockGetDoc.mockResolvedValue(mockPrayerDoc);
      mockDoc.mockReturnValue('prayer-doc-ref');

      const result = await service.getPrayerById('1');

      expect(mockDoc).toHaveBeenCalledWith({}, 'prayers', '1');
      expect(mockGetDoc).toHaveBeenCalledWith('prayer-doc-ref');
      expect(result?.id).toBe('1');
    });

    it('應該在祈禱不存在時返回 null', async () => {
      const mockPrayerDoc = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockPrayerDoc);
      mockDoc.mockReturnValue('prayer-doc-ref');

      const result = await service.getPrayerById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updatePrayer', () => {
    it('應該成功更新祈禱', async () => {
      mockDoc.mockReturnValue('prayer-doc-ref');
      mockUpdateDoc.mockResolvedValue(undefined);
      
      // Mock getDoc for returning the updated prayer
      mockGetDoc.mockResolvedValue({
        id: 'prayer-id',
        exists: () => true,
        data: () => ({
          content: '更新的內容',
          user_id: 'test-user-id',
          user_name: 'Test User',
          is_anonymous: false,
          created_at: new Date(),
          updated_at: new Date(),
          image_url: null,
          is_answered: false,
          response_count: 0,
          prayer_type: 'prayer'
        })
      });

      const result = await service.updatePrayer('prayer-id', '更新的內容');

      expect(mockDoc).toHaveBeenCalledWith({}, 'prayers', 'prayer-id');
      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result?.content).toBe('更新的內容');
    });

    it('應該處理更新錯誤', async () => {
      mockDoc.mockReturnValue('prayer-doc-ref');
      mockUpdateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(service.updatePrayer('prayer-id', '更新內容')).rejects.toThrow('Update failed');
    });
  });

  describe('deletePrayer', () => {
    it('應該成功刪除祈禱', async () => {
      mockDoc.mockReturnValue('prayer-doc-ref');
      mockDeleteDoc.mockResolvedValue(undefined);
      
      // Mock for existence check
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          content: '測試祈禱',
          user_id: 'test-user-id'
        })
      });
      
      // Mock for getDocs (related data cleanup)
      mockGetDocs.mockResolvedValue({ docs: [] });

      await service.deletePrayer('prayer-id');

      expect(mockDeleteDoc).toHaveBeenCalledWith('prayer-doc-ref');
    });

    it('應該處理刪除錯誤', async () => {
      mockDoc.mockReturnValue('prayer-doc-ref');
      mockDeleteDoc.mockRejectedValue(new Error('Delete failed'));
      
      // Mock for existence check
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          content: '測試祈禱',
          user_id: 'test-user-id'
        })
      });

      await expect(service.deletePrayer('prayer-id')).rejects.toThrow('Delete failed');
    });
  });

  describe('離線支持', () => {
    it('應該在離線時返回適當的錯誤', async () => {
      // 模擬離線狀態
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      const mockPrayerData = {
        content: '測試祈禱內容',
        is_anonymous: false,
        prayer_type: 'prayer' as const,
      };

      mockAddDoc.mockRejectedValue(new Error('網絡連接錯誤'));

      await expect(service.createPrayer(mockPrayerData)).rejects.toThrow('網絡連接錯誤');
    });

    afterEach(() => {
      // 重置線上狀態
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });
    });
  });
}); 