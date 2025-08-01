import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebaseUserService, FirebaseUserData } from './FirebaseUserService';
import { db, auth } from '@/integrations/firebase/client';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

// Mock Firebase modules
vi.mock('@/integrations/firebase/client', () => ({
  db: vi.fn(),
  auth: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn()
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('FirebaseUserService', () => {
  const mockDb = vi.fn();
  const mockAuth = { currentUser: { uid: 'test-user-id' } };
  const mockUserData: FirebaseUserData = {
    userId: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    scripture: 'Test Scripture',
    photoURL: 'https://example.com/photo.jpg',
    createdAt: 1234567890,
    updatedAt: 1234567890
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (db as any).mockReturnValue(mockDb);
    (auth as any).mockReturnValue(mockAuth);
    (serverTimestamp as any).mockReturnValue({ timestamp: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getUserData', () => {
    it('應該成功獲取用戶資料', async () => {
      const mockDocRef = { id: 'test-user-id' };
      const mockDocSnap = {
        exists: () => true,
        data: () => mockUserData
      };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);

      const result = await FirebaseUserService.getUserData('test-user-id');

      expect(doc).toHaveBeenCalledWith(mockDb, 'users', 'test-user-id');
      expect(getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result).toEqual(mockUserData);
    });

    it('當用戶不存在時應該返回 null', async () => {
      const mockDocRef = { id: 'test-user-id' };
      const mockDocSnap = {
        exists: () => false
      };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);

      const result = await FirebaseUserService.getUserData('test-user-id');

      expect(result).toBeNull();
    });

    it('當發生錯誤時應該返回 null', async () => {
      (doc as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await FirebaseUserService.getUserData('test-user-id');

      expect(result).toBeNull();
    });
  });

  describe('setUserData', () => {
    it('應該成功創建新用戶資料', async () => {
      const userData = {
        email: 'new@example.com',
        displayName: 'New User'
      };

      const mockDocRef = { id: 'new-user-id' };
      const mockDocSnap = { exists: () => false };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);
      (setDoc as any).mockResolvedValue(undefined);

      await FirebaseUserService.setUserData('new-user-id', userData);

      expect(doc).toHaveBeenCalledWith(mockDb, 'users', 'new-user-id');
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          userId: 'new-user-id',
          ...userData,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number)
        })
      );
    });

    it('應該成功更新現有用戶資料', async () => {
      const updateData = { displayName: 'Updated Name' };
      const mockDocRef = { id: 'test-user-id' };
      const mockDocSnap = { exists: () => true };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);
      (updateDoc as any).mockResolvedValue(undefined);

      await FirebaseUserService.setUserData('test-user-id', updateData);

      expect(doc).toHaveBeenCalledWith(mockDb, 'users', 'test-user-id');
      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Number)
        })
      );
    });

    it('當設置失敗時應該拋出錯誤', async () => {
      const userData = { displayName: 'Test' };

      (doc as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(FirebaseUserService.setUserData('test-user-id', userData))
        .rejects.toThrow('Database error');
    });
  });

  describe('updateScripture', () => {
    it('應該成功更新用戶經文', async () => {
      const scripture = 'John 3:16';
      const mockDocRef = { id: 'test-user-id' };
      const mockDocSnap = { exists: () => true };

      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);
      (updateDoc as any).mockResolvedValue(undefined);

      await FirebaseUserService.updateScripture('test-user-id', scripture);

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          scripture,
          updatedAt: expect.any(Number)
        })
      );
    });

    it('當更新經文失敗時應該拋出錯誤', async () => {
      (doc as any).mockImplementation(() => {
        throw new Error('Update failed');
      });

      await expect(FirebaseUserService.updateScripture('test-user-id', 'scripture'))
        .rejects.toThrow('Update failed');
    });
  });

  describe('syncUserDataFromAuth', () => {
    it('應該成功同步 Auth 用戶資料到 Firestore', async () => {
      const mockUser = {
        uid: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg'
      };

      const mockDocRef = { id: 'test-user-id' };
      const mockDocSnap = { exists: () => true };

      (auth as any).mockReturnValue({ currentUser: mockUser });
      (doc as any).mockReturnValue(mockDocRef);
      (getDoc as any).mockResolvedValue(mockDocSnap);
      (updateDoc as any).mockResolvedValue(undefined);

      await FirebaseUserService.syncUserDataFromAuth('test-user-id');

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          userId: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          updatedAt: expect.any(Number)
        })
      );
    });

    it('當用戶未登入時應該返回', async () => {
      (auth as any).mockReturnValue({ currentUser: null });

      await FirebaseUserService.syncUserDataFromAuth('test-user-id');

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });
}); 