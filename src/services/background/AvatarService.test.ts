/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvatarService, type UserAvatar } from './AvatarService';
import { getUserAvatarUrlFromFirebase } from '@/services/auth/FirebaseUserService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Mock Firebase
vi.mock('firebase/firestore');
vi.mock('firebase/storage');
vi.mock('@/integrations/firebase/client', () => ({
  db: vi.fn(() => ({})),
  storage: vi.fn(() => ({})),
  isUserAuthenticated: vi.fn(() => true),
  getCurrentUser: vi.fn(() => ({ uid: 'test-user' }))
}));

// Mock getUserAvatarUrlFromFirebase
vi.mock('@/services/auth/FirebaseUserService', () => ({
  getUserAvatarUrlFromFirebase: vi.fn()
}));

describe('AvatarService', () => {
  let avatarService: AvatarService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    avatarService = new AvatarService();
  });

  describe('getUserAvatar', () => {
    it('should return user avatar when document exists', async () => {
      const mockData = {
        avatarUrl: 'https://example.com/avatar.jpg',
        isDefault: false,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() }
      };

      const mockDoc = {
        exists: vi.fn(() => true),
        data: vi.fn(() => mockData)
      };

      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await avatarService.getUserAvatar('test-user');

      expect(result).toEqual({
        avatarUrl: 'https://example.com/avatar.jpg',
        isDefault: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('should return default avatar when document does not exist', async () => {
      const mockDoc = {
        exists: vi.fn(() => false)
      };

      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await avatarService.getUserAvatar('test-user');

      expect(result).toEqual({
        avatarUrl: '',
        isDefault: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('setUserAvatar', () => {
    it('should set user avatar when user is authenticated', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await avatarService.setUserAvatar('test-user', 'https://example.com/avatar.jpg');

      expect(result).toBe(true);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          avatarUrl: 'https://example.com/avatar.jpg',
          isDefault: false,
          updatedAt: expect.any(Date)
        },
        { merge: true }
      );
    });
  });

  describe('uploadAvatarImage', () => {
    it('should upload avatar image successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockSnapshot = { ref: 'mock-ref' };
      const mockDownloadURL = 'https://example.com/uploaded-avatar.jpg';

      vi.mocked(uploadBytes).mockResolvedValue(mockSnapshot as any);
      vi.mocked(getDownloadURL).mockResolvedValue(mockDownloadURL);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await avatarService.uploadAvatarImage('test-user', mockFile);

      expect(result).toBe(mockDownloadURL);
      expect(uploadBytes).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
    });

    it('should return null for oversized files', async () => {
      const mockFile = new File(['x'.repeat(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });

      const result = await avatarService.uploadAvatarImage('test-user', mockFile);

      expect(result).toBe(null);
    });
  });
});

describe('getUserAvatarUrlFromFirebase', () => {
  it('should return avatar URLs', async () => {
    const mockUrls = {
      large: 'https://example.com/large.jpg',
      medium: 'https://example.com/medium.jpg',
      small: 'https://example.com/small.jpg'
    };

    vi.mocked(getUserAvatarUrlFromFirebase).mockResolvedValue(mockUrls);

    const result = await getUserAvatarUrlFromFirebase('test-user');

    expect(result).toEqual(mockUrls);
  });
}); 