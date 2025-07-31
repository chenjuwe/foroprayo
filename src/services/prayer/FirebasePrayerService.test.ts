import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebasePrayerService } from './FirebasePrayerService';
import { db, auth } from '@/integrations/firebase/client';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { ERROR_MESSAGES } from '@/constants';
import type { Prayer, CreatePrayerRequest } from '@/types/prayer';

// Mock Timestamp class - 修復初始化問題
class MockTimestamp {
  private _seconds: number;
  private _nanoseconds: number;

  constructor(seconds: number, nanoseconds: number = 0) {
    this._seconds = seconds;
    this._nanoseconds = nanoseconds;
  }

  toDate() {
    return new Date(this._seconds * 1000);
  }

  toMillis() {
    return this._seconds * 1000;
  }

  static fromDate(date: Date) {
    return new MockTimestamp(Math.floor(date.getTime() / 1000));
  }

  static now() {
    return new MockTimestamp(Math.floor(Date.now() / 1000));
  }
}

// Mock Firebase modules - 修復 MockTimestamp 引用問題
vi.mock('@/integrations/firebase/client', () => ({
  db: vi.fn(() => ({})),
  auth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/avatar.jpg'
    }
  }))
}));

vi.mock('firebase/firestore', () => {
  // 在 mock 內部定義 MockTimestamp
  class MockTimestamp {
    private _seconds: number;
    private _nanoseconds: number;

    constructor(seconds: number, nanoseconds: number = 0) {
      this._seconds = seconds;
      this._nanoseconds = nanoseconds;
    }

    toDate() {
      return new Date(this._seconds * 1000);
    }

    toMillis() {
      return this._seconds * 1000;
    }

    static fromDate(date: Date) {
      return new MockTimestamp(Math.floor(date.getTime() / 1000));
    }

    static now() {
      return new MockTimestamp(Math.floor(Date.now() / 1000));
    }
  }

  return {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    serverTimestamp: vi.fn(() => MockTimestamp.fromDate(new Date('2024-01-01T00:00:00Z'))),
    writeBatch: vi.fn(() => ({
      delete: vi.fn(),
      commit: vi.fn()
    })),
    Timestamp: MockTimestamp
  };
});

describe('FirebasePrayerService', () => {
  let service: FirebasePrayerService;
  let mockCollection: any;
  let mockDoc: any;
  let mockQuerySnapshot: any;

  beforeEach(() => {
    service = new FirebasePrayerService();
    
    // Mock collection
    mockCollection = vi.fn();
    (collection as any).mockReturnValue(mockCollection);
    
    // Mock doc
    mockDoc = vi.fn();
    (doc as any).mockReturnValue(mockDoc);
    
    // Mock query snapshot - 修復日期格式和 ID 問題
    mockQuerySnapshot = {
      docs: [
        {
          id: 'prayer-1',
          data: () => ({
            content: 'Test prayer content',
            user_id: 'test-user-id',
            user_name: 'Test User',
            user_avatar: 'https://example.com/avatar.jpg',
            is_anonymous: false,
            created_at: new Date('2024-01-01T00:00:00Z'),
            updated_at: new Date('2024-01-01T00:00:00Z'),
            image_url: null,
            is_answered: false,
            response_count: 0,
            prayer_type: 'prayer'
          })
        }
      ]
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPrayers', () => {
    it('應該成功獲取所有代禱', async () => {
      // Arrange
      const mockQuery = vi.fn();
      (query as any).mockReturnValue(mockQuery);
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      // Act
      const result = await service.getAllPrayers();

      // Assert
      expect(query).toHaveBeenCalledWith(mockCollection, orderBy('created_at', 'desc'));
      expect(getDocs).toHaveBeenCalledWith(mockQuery);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'prayer-1',
        content: 'Test prayer content',
        user_id: 'test-user-id',
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
        is_anonymous: false,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        image_url: null,
        is_answered: false,
        response_count: 0,
        prayer_type: 'prayer'
      });
    });

    it('應該處理獲取代禱時的錯誤', async () => {
      // Arrange
      const mockError = new Error('Database error');
      (getDocs as any).mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.getAllPrayers()).rejects.toThrow('Database error');
    });
  });

  describe('getPrayerById', () => {
    it('應該成功根據 ID 獲取代禱', async () => {
      // Arrange
      const mockDocSnapshot = {
        id: 'prayer-1',
        exists: () => true,
        data: () => ({
          content: 'Test prayer content',
          user_id: 'test-user-id',
          user_name: 'Test User',
          user_avatar: 'https://example.com/avatar.jpg',
          is_anonymous: false,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          image_url: null,
          is_answered: false,
          response_count: 0,
          prayer_type: 'prayer'
        })
      };
      (getDoc as any).mockResolvedValue(mockDocSnapshot);

      // Act
      const result = await service.getPrayerById('prayer-1');

      // Assert
      expect(doc).toHaveBeenCalledWith({}, 'prayers', 'prayer-1');
      expect(getDoc).toHaveBeenCalledWith(mockDoc);
      expect(result).toEqual({
        id: 'prayer-1',
        content: 'Test prayer content',
        user_id: 'test-user-id',
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
        is_anonymous: false,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        image_url: null,
        is_answered: false,
        response_count: 0,
        prayer_type: 'prayer'
      });
    });

    it('應該在代禱不存在時返回 null', async () => {
      // Arrange
      const mockDocSnapshot = {
        exists: () => false
      };
      (getDoc as any).mockResolvedValue(mockDocSnapshot);

      // Act
      const result = await service.getPrayerById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createPrayer', () => {
    it('應該成功創建代禱', async () => {
      // Arrange
      const createPrayerRequest: CreatePrayerRequest = {
        content: 'New prayer content',
        is_anonymous: false,
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
        prayer_type: 'prayer'
      };

      const mockDocRef = { id: 'new-prayer-id' };
      (addDoc as any).mockResolvedValue(mockDocRef);

      const mockNewDocSnapshot = {
        id: 'new-prayer-id',
        exists: () => true,
        data: () => ({
          content: 'New prayer content',
          user_id: 'test-user-id',
          user_name: 'Test User',
          user_avatar: 'https://example.com/avatar.jpg',
          is_anonymous: false,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          image_url: null,
          is_answered: false,
          response_count: 0,
          prayer_type: 'prayer'
        })
      };
      (getDoc as any).mockResolvedValue(mockNewDocSnapshot);

      // Act
      const result = await service.createPrayer(createPrayerRequest);

      // Assert
      expect(addDoc).toHaveBeenCalledWith(mockCollection, {
        content: 'New prayer content',
        user_id: 'test-user-id',
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
        is_anonymous: false,
        created_at: expect.any(Object),
        updated_at: expect.any(Object),
        image_url: null,
        is_answered: false,
        response_count: 0
      });
      expect(result).toEqual({
        id: 'new-prayer-id',
        content: 'New prayer content',
        user_id: 'test-user-id',
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
        is_anonymous: false,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        image_url: null,
        is_answered: false,
        response_count: 0,
        prayer_type: 'prayer'
      });
    });

    it('應該處理創建代禱時的錯誤', async () => {
      // Arrange
      const createPrayerRequest: CreatePrayerRequest = {
        content: 'New prayer content',
        is_anonymous: false,
        prayer_type: 'prayer'
      };

      (addDoc as any).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.createPrayer(createPrayerRequest)).rejects.toThrow('Database error');
    });
  });

  describe('updatePrayer', () => {
    it('應該成功更新代禱', async () => {
      // Arrange
      const updatedContent = 'Updated prayer content';
      (updateDoc as any).mockResolvedValue(undefined);

      const mockDocSnapshot = {
        id: 'prayer-1',
        exists: () => true,
        data: () => ({
          content: updatedContent,
          user_id: 'test-user-id',
          user_name: 'Test User',
          user_avatar: 'https://example.com/avatar.jpg',
          is_anonymous: false,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          image_url: null,
          is_answered: false,
          response_count: 0,
          prayer_type: 'prayer'
        })
      };
      (getDoc as any).mockResolvedValue(mockDocSnapshot);

      // Act
      const result = await service.updatePrayer('prayer-1', updatedContent);

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(mockDoc, {
        content: updatedContent,
        updated_at: expect.any(Object)
      });
      expect(result).toEqual({
        id: 'prayer-1',
        content: updatedContent,
        user_id: 'test-user-id',
        user_name: 'Test User',
        user_avatar: 'https://example.com/avatar.jpg',
        is_anonymous: false,
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        image_url: null,
        is_answered: false,
        response_count: 0,
        prayer_type: 'prayer'
      });
    });
  });

  describe('deletePrayer', () => {
    it('應該成功刪除代禱', async () => {
      // Arrange
      (deleteDoc as any).mockResolvedValue(undefined);
      
      // Mock getPrayerById for the existence check
      const mockDocSnapshot = {
        id: 'prayer-1',
        exists: () => true,
        data: () => ({
          content: 'Test prayer content',
          user_id: 'test-user-id',
          user_name: 'Test User',
          user_avatar: 'https://example.com/avatar.jpg',
          is_anonymous: false,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          image_url: null,
          is_answered: false,
          response_count: 0,
          prayer_type: 'prayer'
        })
      };
      (getDoc as any).mockResolvedValue(mockDocSnapshot);
      
      // Mock getDocs for deleteRelatedData calls
      const mockEmptyQuerySnapshot = {
        size: 0,
        docs: []
      };
      (getDocs as any).mockResolvedValue(mockEmptyQuerySnapshot);

      // Act
      await service.deletePrayer('prayer-1');

      // Assert
      expect(deleteDoc).toHaveBeenCalledWith(mockDoc);
    });

    it('應該處理刪除代禱時的錯誤', async () => {
      // Arrange
      (deleteDoc as any).mockRejectedValue(new Error('Delete failed'));
      
      // Mock getPrayerById for the existence check
      const mockDocSnapshot = {
        id: 'prayer-1',
        exists: () => true,
        data: () => ({
          content: 'Test prayer content',
          user_id: 'test-user-id',
          user_name: 'Test User',
          user_avatar: 'https://example.com/avatar.jpg',
          is_anonymous: false,
          created_at: new Date('2024-01-01T00:00:00Z'),
          updated_at: new Date('2024-01-01T00:00:00Z'),
          image_url: null,
          is_answered: false,
          response_count: 0,
          prayer_type: 'prayer'
        })
      };
      (getDoc as any).mockResolvedValue(mockDocSnapshot);

      // Act & Assert
      await expect(service.deletePrayer('prayer-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getPrayersByUserId', () => {
    it('應該成功獲取用戶的代禱', async () => {
      // Arrange
      const mockQuery = vi.fn();
      (query as any).mockReturnValue(mockQuery);
      (getDocs as any).mockResolvedValue(mockQuerySnapshot);

      // Act
      const result = await service.getPrayersByUserId('test-user-id');

      // Assert
      expect(query).toHaveBeenCalledWith(mockCollection, where('user_id', '==', 'test-user-id'), orderBy('created_at', 'desc'));
      expect(result).toHaveLength(1);
    });
  });

  describe('getUserStats', () => {
    it('應該成功獲取用戶統計資訊', async () => {
      // Arrange
      const mockQuery = vi.fn();
      (query as any).mockReturnValue(mockQuery);
      (getDocs as any).mockResolvedValue({
        size: 2,
        docs: [
          { data: () => ({ response_count: 5 }) },
          { data: () => ({ response_count: 3 }) }
        ]
      });

      // Act
      const result = await service.getUserStats('test-user-id');

      // Assert
      expect(result).toEqual({
        prayerCount: 2,
        responseCount: 2,
        receivedLikesCount: 2
      });
    });
  });
}); 