import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFirebaseUserData } from './useFirebaseUserData';

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
};

vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => mockAuth),
}));

// Mock Firebase Firestore
const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
};

vi.mock('@/integrations/firebase/client', () => ({
  db: mockFirestore,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useFirebaseUserData', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.currentUser = mockUser;
  });

  describe('getUserData', () => {
    it('應該成功獲取用戶數據', async () => {
      const mockUserData = {
        user_name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: new Date().toISOString(),
      };

      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockUserData,
        }),
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useFirebaseUserData());

      const userData = await result.current.getUserData('test-user-id');

      expect(userData).toEqual(mockUserData);
      expect(mockFirestore.doc).toHaveBeenCalledWith(mockFirestore.collection('users'), 'test-user-id');
    });

    it('應該在用戶不存在時返回 null', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: () => false,
          data: () => null,
        }),
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useFirebaseUserData());

      const userData = await result.current.getUserData('non-existent-user');

      expect(userData).toBeNull();
    });

    it('應該處理獲取用戶數據時的錯誤', async () => {
      const mockDocRef = {
        get: vi.fn().mockRejectedValue(new Error('Database error')),
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useFirebaseUserData());

      await expect(result.current.getUserData('test-user-id')).rejects.toThrow('Database error');
    });
  });

  describe('updateUserData', () => {
    it('應該成功更新用戶數據', async () => {
      const mockUpdateData = {
        user_name: 'Updated User Name',
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      const mockDocRef = {
        update: vi.fn().mockResolvedValue(undefined),
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useFirebaseUserData());

      await result.current.updateUserData('test-user-id', mockUpdateData);

      expect(mockFirestore.doc).toHaveBeenCalledWith(mockFirestore.collection('users'), 'test-user-id');
      expect(mockDocRef.update).toHaveBeenCalledWith(mockUpdateData);
    });

    it('應該處理更新用戶數據時的錯誤', async () => {
      const mockUpdateData = {
        user_name: 'Updated User Name',
      };

      const mockDocRef = {
        update: vi.fn().mockRejectedValue(new Error('Update failed')),
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useFirebaseUserData());

      await expect(result.current.updateUserData('test-user-id', mockUpdateData)).rejects.toThrow('Update failed');
    });
  });

  describe('createUserData', () => {
    it('應該成功創建用戶數據', async () => {
      const mockUserData = {
        user_name: 'New User',
        email: 'newuser@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: new Date().toISOString(),
      };

      const mockDocRef = {
        set: vi.fn().mockResolvedValue(undefined),
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useFirebaseUserData());

      await result.current.createUserData('new-user-id', mockUserData);

      expect(mockFirestore.doc).toHaveBeenCalledWith(mockFirestore.collection('users'), 'new-user-id');
      expect(mockDocRef.set).toHaveBeenCalledWith(mockUserData);
    });

    it('應該處理創建用戶數據時的錯誤', async () => {
      const mockUserData = {
        user_name: 'New User',
        email: 'newuser@example.com',
      };

      const mockDocRef = {
        set: vi.fn().mockRejectedValue(new Error('Create failed')),
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useFirebaseUserData());

      await expect(result.current.createUserData('new-user-id', mockUserData)).rejects.toThrow('Create failed');
    });
  });

  describe('getCurrentUserData', () => {
    it('應該獲取當前用戶的數據', async () => {
      const mockUserData = {
        user_name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockUserData,
        }),
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const { result } = renderHook(() => useFirebaseUserData());

      const userData = await result.current.getCurrentUserData();

      expect(userData).toEqual(mockUserData);
      expect(mockFirestore.doc).toHaveBeenCalledWith(mockFirestore.collection('users'), 'test-user-id');
    });

    it('應該在沒有當前用戶時返回 null', async () => {
      mockAuth.currentUser = null;

      const { result } = renderHook(() => useFirebaseUserData());

      const userData = await result.current.getCurrentUserData();

      expect(userData).toBeNull();
      expect(mockFirestore.doc).not.toHaveBeenCalled();
    });
  });
}); 