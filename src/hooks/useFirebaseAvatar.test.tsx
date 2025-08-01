/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useFirebaseAvatar, type AvatarSize } from './useFirebaseAvatar';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { getUserAvatarUrlFromFirebase } from '@/services/background/AvatarService';

// Mock 外部依賴
vi.mock('@/stores/firebaseAuthStore');
vi.mock('@/services/background/AvatarService');
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useFirebaseAvatar', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockAvatarUrls = {
    large: 'https://example.com/avatar-96.jpg',
    medium: 'https://example.com/avatar-48.jpg',
    small: 'https://example.com/avatar-30.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useFirebaseAuthStore - 正確處理 Zustand selector
    (useFirebaseAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        user: mockUser,
        isAuthLoading: false,
      };
      return selector(state);
    });

    // Mock getUserAvatarUrlFromFirebase
    (getUserAvatarUrlFromFirebase as any).mockResolvedValue(mockAvatarUrls);

    // Mock global Image constructor
    const mockImage = {
      src: '',
      onload: null,
      onerror: null,
    };
    global.Image = vi.fn(() => mockImage) as any;

    // 清理全局狀態
    window.removeEventListener('avatar-updated', vi.fn());
    window.removeEventListener('avatar-preview-updated', vi.fn());
    window.removeEventListener('avatar-final-updated', vi.fn());
  });

  afterEach(() => {
    // 清理事件監聽器
    const events = ['avatar-updated', 'avatar-preview-updated', 'avatar-final-updated'];
    events.forEach(eventName => {
      const listeners = (window as any)._listeners?.[eventName] || [];
      listeners.forEach((listener: any) => {
        window.removeEventListener(eventName, listener);
      });
    });
  });

  it('應該正確載入頭像 URLs', async () => {
    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);
      expect(result.current.avatarUrl48).toBe(mockAvatarUrls.medium);
      expect(result.current.avatarUrl30).toBe(mockAvatarUrls.small);
      expect(result.current.avatarUrl).toBe(mockAvatarUrls.large); // 預設使用大尺寸
    });

    expect(getUserAvatarUrlFromFirebase).toHaveBeenCalledWith(mockUser.uid);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('應該在用戶未登入時不載入頭像', () => {
    (useFirebaseAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        user: null,
        isAuthLoading: false,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useFirebaseAvatar());

    expect(result.current.avatarUrl96).toBe(null);
    expect(result.current.avatarUrl48).toBe(null);
    expect(result.current.avatarUrl30).toBe(null);
    expect(getUserAvatarUrlFromFirebase).not.toHaveBeenCalled();
  });

  it('應該使用提供的 userId 而不是當前用戶', async () => {
    const customUserId = 'custom-user-id';
    const { result } = renderHook(() => useFirebaseAvatar(customUserId));

    await waitFor(() => {
      expect(getUserAvatarUrlFromFirebase).toHaveBeenCalledWith(customUserId);
    });
  });

  it('應該處理頭像載入錯誤', async () => {
    const mockError = new Error('Failed to load avatar');
    (getUserAvatarUrlFromFirebase as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('應該提供刷新頭像的功能', async () => {
    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);
    });

    const newAvatarUrls = {
      large: 'https://example.com/new-avatar-96.jpg',
      medium: 'https://example.com/new-avatar-48.jpg',
      small: 'https://example.com/new-avatar-30.jpg',
    };

    (getUserAvatarUrlFromFirebase as any).mockResolvedValue(newAvatarUrls);

    await act(async () => {
      await result.current.refreshAvatar();
    });

    await waitFor(() => {
      expect(result.current.avatarUrl96).toBe(newAvatarUrls.large);
      expect(result.current.avatarUrl48).toBe(newAvatarUrls.medium);
      expect(result.current.avatarUrl30).toBe(newAvatarUrls.small);
    });
  });

  it('應該回應 avatar-updated 事件', async () => {
    const { result } = renderHook(() => useFirebaseAvatar());

    // 先等待初始載入
    await waitFor(() => {
      expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);
    });

    // 清除之前的調用
    vi.clearAllMocks();

    const newAvatarUrls = {
      large: 'https://example.com/updated-avatar-96.jpg',
      medium: 'https://example.com/updated-avatar-48.jpg',
      small: 'https://example.com/updated-avatar-30.jpg',
    };

    (getUserAvatarUrlFromFirebase as any).mockResolvedValue(newAvatarUrls);

    // 觸發事件
    act(() => {
      const event = new CustomEvent('avatar-updated', {
        detail: { userId: mockUser.uid }
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(getUserAvatarUrlFromFirebase).toHaveBeenCalledWith(mockUser.uid);
    });
  });

  it('應該回應 avatar-preview-updated 事件', async () => {
    const { result } = renderHook(() => useFirebaseAvatar());

    const previewURL = 'https://example.com/preview-avatar.jpg';

    act(() => {
      const event = new CustomEvent('avatar-preview-updated', {
        detail: { 
          userId: mockUser.uid,
          timestamp: Date.now(),
          previewURL: previewURL
        }
      });
      window.dispatchEvent(event);
    });

    // 預覽更新應該立即更新所有尺寸的頭像
    expect(result.current.avatarUrl96).toBe(previewURL);
    expect(result.current.avatarUrl48).toBe(previewURL);
    expect(result.current.avatarUrl30).toBe(previewURL);
  });

  it('應該回應 avatar-final-updated 事件並預載入圖片', async () => {
    const { result } = renderHook(() => useFirebaseAvatar());

    const finalURL = 'https://example.com/final-avatar.jpg';

    // Mock Image 構造函數
    const mockImage = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: '',
    };

    globalThis.Image = (() => mockImage) as any;

    act(() => {
      const event = new CustomEvent('avatar-final-updated', {
        detail: { 
          userId: mockUser.uid,
          timestamp: Date.now(),
          newPhotoURL: finalURL
        }
      });
      window.dispatchEvent(event);
    });

    // 驗證 Image 對象被創建並設置 src
    expect(mockImage.src).toBe(finalURL);

    // 模擬圖片載入完成
    act(() => {
      if (mockImage.onload) {
        mockImage.onload();
      }
    });

    // 圖片載入完成後應該更新頭像
    expect(result.current.avatarUrl96).toBe(finalURL);
    expect(result.current.avatarUrl48).toBe(finalURL);
    expect(result.current.avatarUrl30).toBe(finalURL);
  });

  it('應該正確返回用戶資料', async () => {
    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.user).toBe(mockUser);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.data.avatar_url).toBe(mockAvatarUrls.large);
      expect(result.current.data.user_name).toBe(mockUser.displayName);
    });
  });

  it('應該為沒有 displayName 的用戶使用 email 前綴', async () => {
    const userWithoutDisplayName = {
      ...mockUser,
      displayName: null,
    };

    (useFirebaseAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        user: userWithoutDisplayName,
        isAuthLoading: false,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.data.user_name).toBe('test'); // email 的前綴部分
    });
  });

  it('應該防止重複的預覽更新', async () => {
    const { result } = renderHook(() => useFirebaseAvatar());

    const previewURL = 'https://example.com/preview-avatar.jpg';
    const timestamp = Date.now();

    // 第一次觸發事件
    act(() => {
      const event = new CustomEvent('avatar-preview-updated', {
        detail: { 
          userId: mockUser.uid,
          timestamp: timestamp,
          previewURL: previewURL
        }
      });
      window.dispatchEvent(event);
    });

    expect(result.current.avatarUrl96).toBe(previewURL);

    // 短時間內再次觸發相同的事件（應該被忽略）
    act(() => {
      const event = new CustomEvent('avatar-preview-updated', {
        detail: { 
          userId: mockUser.uid,
          timestamp: timestamp + 50, // 只相差 50ms
          previewURL: previewURL
        }
      });
      window.dispatchEvent(event);
    });

    // 應該仍然是原來的 URL，因為重複更新被防止
    expect(result.current.avatarUrl96).toBe(previewURL);
  });

  it('應該忽略其他用戶的頭像事件', async () => {
    const { result } = renderHook(() => useFirebaseAvatar());

    // 先等待初始載入
    await waitFor(() => {
      expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);
    });

    const otherUserPreviewURL = 'https://example.com/other-user-avatar.jpg';

    act(() => {
      const event = new CustomEvent('avatar-preview-updated', {
        detail: { 
          userId: 'other-user-id', // 不同的用戶 ID
          timestamp: Date.now(),
          previewURL: otherUserPreviewURL
        }
      });
      window.dispatchEvent(event);
    });

    // 頭像不應該改變，因為事件是針對其他用戶的
    expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);
  });
}); 