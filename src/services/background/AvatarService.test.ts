/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AvatarService, getUserAvatarUrlFromFirebase, type UserAvatar } from './AvatarService';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';



describe('AvatarService', () => {
  let avatarService: AvatarService;
  
  const mockUserId = 'test-user-id';
  const mockBlobs = {
    l: new Blob(['large-image'], { type: 'image/webp' }),
    m: new Blob(['medium-image'], { type: 'image/webp' }),
    s: new Blob(['small-image'], { type: 'image/webp' }),
  };

  const mockAvatarUrls = {
    avatar_url_96: 'https://example.com/avatar-96.webp',
    avatar_url_48: 'https://example.com/avatar-48.webp',
    avatar_url_30: 'https://example.com/avatar-30.webp',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    avatarService = new AvatarService();
    
    // Mock Firestore functions
    vi.mocked(getFirestore).mockReturnValue({} as any);
    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockAvatarUrls,
    } as any);

    // Mock Storage functions
    vi.mocked(getStorage).mockReturnValue({} as any);
    vi.mocked(ref).mockReturnValue({} as any);
    vi.mocked(uploadBytes).mockResolvedValue({} as any);
    vi.mocked(getDownloadURL).mockImplementation((storageRef: any) => {
      const fileName = storageRef.toString();
      if (fileName.includes('-l.webp')) return Promise.resolve(mockAvatarUrls.avatar_url_96);
      if (fileName.includes('-m.webp')) return Promise.resolve(mockAvatarUrls.avatar_url_48);
      if (fileName.includes('-s.webp')) return Promise.resolve(mockAvatarUrls.avatar_url_30);
      return Promise.resolve('https://example.com/unknown.webp');
    });
  });

  describe('uploadAndRegisterAvatars', () => {
    it('應該成功上傳並註冊頭像', async () => {
      // Mock user counter data
      vi.mocked(getDoc).mockImplementation((docRef: any) => {
        const path = docRef.toString();
        if (path.includes('counters/users')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ count: 100 }),
          } as any);
        }
        if (path.includes(`users/${mockUserId}`)) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ createdAt: { toDate: () => new Date('2023-01-01') } }),
          } as any);
        }
        return Promise.resolve({ exists: () => false } as any);
      } as any);

      const result = await avatarService.uploadAndRegisterAvatars(mockUserId, mockBlobs);

      expect(uploadBytes).toHaveBeenCalledTimes(3);
      expect(getDownloadURL).toHaveBeenCalledTimes(3);
      expect(setDoc).toHaveBeenCalledTimes(2); // avatars collection + users collection
      
      expect(result).toEqual({
        avatar_url_96: mockAvatarUrls.avatar_url_96,
        avatar_url_48: mockAvatarUrls.avatar_url_48,
        avatar_url_30: mockAvatarUrls.avatar_url_30,
      });
    });

    it('應該使用備用序號當無法獲取用戶資料時', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      const result = await avatarService.uploadAndRegisterAvatars(mockUserId, mockBlobs);

      expect(result).toEqual({
        avatar_url_96: mockAvatarUrls.avatar_url_96,
        avatar_url_48: mockAvatarUrls.avatar_url_48,
        avatar_url_30: mockAvatarUrls.avatar_url_30,
      });
    });

    it('應該處理上傳錯誤', async () => {
      const uploadError = new Error('Upload failed');
      (uploadBytes as any).mockRejectedValue(uploadError);

      await expect(
        avatarService.uploadAndRegisterAvatars(mockUserId, mockBlobs)
      ).rejects.toThrow('Upload failed');
    });

    it('應該使用正確的檔案命名格式', async () => {
      (getDoc as any).mockImplementation((docRef: any) => {
        const path = docRef.toString();
        if (path.includes(`users/${mockUserId}`)) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ createdAt: { toDate: () => new Date('2023-01-01T10:30:45') } }),
          });
        }
        return Promise.resolve({ exists: () => false });
      });

      await avatarService.uploadAndRegisterAvatars(mockUserId, mockBlobs);

      // 驗證 ref 被呼叫時使用了正確的路徑格式
      expect(ref).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/avatars\/test-user-id\/\d{5}-a-\d{14}-[lms]\.webp/)
      );
    });
  });

  describe('getUserAvatar', () => {
    it('應該成功獲取用戶頭像', async () => {
      const mockUserAvatar: UserAvatar = {
        user_id: mockUserId,
        avatar_url_96: mockAvatarUrls.avatar_url_96,
        avatar_url_48: mockAvatarUrls.avatar_url_48,
        avatar_url_30: mockAvatarUrls.avatar_url_30,
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => mockUserAvatar,
      });

      const result = await avatarService.getUserAvatar(mockUserId);

      expect(result).toEqual(mockUserAvatar);
      expect(getDoc).toHaveBeenCalledWith(expect.anything());
    });

    it('應該在用戶 ID 為空時返回 null', async () => {
      const result = await avatarService.getUserAvatar(undefined);
      expect(result).toBeNull();
    });

    it('應該在沒有專門頭像文檔時從用戶檔案獲取', async () => {
      (getDoc as any).mockImplementation((docRef: any) => {
        const path = docRef.toString();
        if (path.includes('avatars/')) {
          return Promise.resolve({ exists: () => false });
        }
        if (path.includes('users/')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({
              photoURL: 'https://example.com/user-photo.jpg',
              lastAvatarUpdate: { toDate: () => new Date('2023-01-01') },
            }),
          });
        }
        return Promise.resolve({ exists: () => false });
      });

      const result = await avatarService.getUserAvatar(mockUserId);

      expect(result).toEqual({
        user_id: mockUserId,
        avatar_url_96: 'https://example.com/user-photo.jpg',
        avatar_url_48: 'https://example.com/user-photo.jpg',
        avatar_url_30: 'https://example.com/user-photo.jpg',
        updated_at: expect.any(String),
      });
    });

    it('應該在沒有任何頭像資料時返回 null', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => false,
      });

      const result = await avatarService.getUserAvatar(mockUserId);
      expect(result).toBeNull();
    });

    it('應該處理獲取頭像錯誤', async () => {
      const getError = new Error('Firestore error');
      (getDoc as any).mockRejectedValue(getError);

      const result = await avatarService.getUserAvatar(mockUserId);
      expect(result).toBeNull();
    });
  });

  describe('getUserSerialNumber (private method)', () => {
    it('應該基於用戶創建時間生成序號', async () => {
      const mockCreatedAt = new Date('2023-01-01T10:30:45');
      
      (getDoc as any).mockImplementation((docRef: any) => {
        const path = docRef.toString();
        if (path.includes('counters/users')) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ count: 100 }),
          });
        }
        if (path.includes(`users/${mockUserId}`)) {
          return Promise.resolve({
            exists: () => true,
            data: () => ({ createdAt: { toDate: () => mockCreatedAt } }),
          });
        }
        return Promise.resolve({ exists: () => false });
      });

      // 透過呼叫 uploadAndRegisterAvatars 來間接測試 getUserSerialNumber
      await avatarService.uploadAndRegisterAvatars(mockUserId, mockBlobs);

      // 驗證產生的檔案名稱包含基於時間戳的序號
      expect(ref).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/avatars\/test-user-id\/\d{5}-a-\d{14}-[lms]\.webp/)
      );
    });
  });

  describe('getFallbackSerialNumber (private method)', () => {
    it('應該在無法獲取用戶資料時使用備用序號', async () => {
      (getDoc as any).mockRejectedValue(new Error('Database error'));

      // 透過呼叫 uploadAndRegisterAvatars 來測試備用序號機制
      await avatarService.uploadAndRegisterAvatars(mockUserId, mockBlobs);

      // 應該仍然能夠成功上傳，使用備用序號
      expect(uploadBytes).toHaveBeenCalledTimes(3);
      expect(ref).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/avatars\/test-user-id\/\d{5}-a-\d{14}-[lms]\.webp/)
      );
    });
  });
});

describe('getUserAvatarUrlFromFirebase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該返回用戶頭像 URLs', async () => {
    const mockUserAvatar: UserAvatar = {
      user_id: 'test-user',
      avatar_url_96: 'https://example.com/avatar-96.jpg',
      avatar_url_48: 'https://example.com/avatar-48.jpg',
      avatar_url_30: 'https://example.com/avatar-30.jpg',
    };

    // Mock AvatarService.getUserAvatar
    vi.spyOn(AvatarService.prototype, 'getUserAvatar').mockResolvedValue(mockUserAvatar);

    const result = await getUserAvatarUrlFromFirebase('test-user');

    expect(result).toEqual({
      large: mockUserAvatar.avatar_url_96,
      medium: mockUserAvatar.avatar_url_48,
      small: mockUserAvatar.avatar_url_30,
    });
  });

  it('應該在沒有頭像時返回 null 值', async () => {
    vi.spyOn(AvatarService.prototype, 'getUserAvatar').mockResolvedValue(null);

    const result = await getUserAvatarUrlFromFirebase('test-user');

    expect(result).toEqual({
      large: null,
      medium: null,
      small: null,
    });
  });

  it('應該處理部分缺失的頭像 URLs', async () => {
    const mockUserAvatar: UserAvatar = {
      user_id: 'test-user',
      avatar_url_96: 'https://example.com/avatar-96.jpg',
      // avatar_url_48 缺失
      avatar_url_30: 'https://example.com/avatar-30.jpg',
    };

    vi.spyOn(AvatarService.prototype, 'getUserAvatar').mockResolvedValue(mockUserAvatar);

    const result = await getUserAvatarUrlFromFirebase('test-user');

    expect(result).toEqual({
      large: mockUserAvatar.avatar_url_96,
      medium: null,
      small: mockUserAvatar.avatar_url_30,
    });
  });
}); 