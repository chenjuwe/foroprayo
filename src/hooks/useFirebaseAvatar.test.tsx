/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useFirebaseAvatar, clearAvatarGlobalState } from './useFirebaseAvatar';
import { getUserAvatarUrlFromFirebase } from '@/services/background/AvatarService';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
// 導入我們的 mock 輔助函數
import { mockFirebaseAvatarForLoggedOut, mockFirebaseAvatarForLoggedIn } from '@/test/setup';

// Mock 依賴 - 需要使用 vi.fn() 在工廠函數內部
vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: vi.fn(),
}));

vi.mock('@/services/background/AvatarService', () => ({
  getUserAvatarUrlFromFirebase: vi.fn(),
}));

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

  // 獲取 mock 函數引用
  const mockAuthStore = vi.mocked(useFirebaseAuthStore);
  const mockGetAvatar = vi.mocked(getUserAvatarUrlFromFirebase);

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 清除全局頭像狀態
    clearAvatarGlobalState();
    
    // 先使用這個設置標準狀態
    mockFirebaseAvatarForLoggedIn();
    
    // 設置預設的認證狀態
    mockAuthStore.mockImplementation((selector: any) => {
      const state = {
        user: mockUser,
        isAuthLoading: false,
      };
      return selector(state);
    });

    // 設置預設的頭像 URLs
    mockGetAvatar.mockResolvedValue(mockAvatarUrls);

    // Mock Image constructor
    global.Image = vi.fn(() => ({
      src: '',
      onload: null,
      onerror: null,
    })) as any;

    // Mock window event listeners
    vi.spyOn(window, 'addEventListener').mockImplementation((_type, _listener) => {
      // 不實際添加事件監聽器，避免測試中的副作用
    });
    
    vi.spyOn(window, 'removeEventListener').mockImplementation((_type, _listener) => {
      // 不實際移除事件監聽器
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('應該正確載入頭像 URLs', async () => {
    mockGetAvatar.mockResolvedValue(mockAvatarUrls);
    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);
    expect(result.current.avatarUrl48).toBe(mockAvatarUrls.medium);
    expect(result.current.avatarUrl30).toBe(mockAvatarUrls.small);
    expect(result.current.avatarUrl).toBe(mockAvatarUrls.large);
    expect(mockGetAvatar).toHaveBeenCalledWith(mockUser.uid);
    expect(result.current.error).toBe(null);
  });

  it('應該在用戶未登入時不載入頭像', () => {
    // 使用我們剛建立的 mock 輔助函數
    mockFirebaseAvatarForLoggedOut();
    
    mockGetAvatar.mockResolvedValue({
      large: null,
      medium: null,
      small: null
    });
    const { result } = renderHook(() => useFirebaseAvatar());
    
    expect(result.current.avatarUrl96).toBe(null);
    expect(result.current.avatarUrl48).toBe(null);
    expect(result.current.avatarUrl30).toBe(null);
    expect(result.current.avatarUrl).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(mockGetAvatar).not.toHaveBeenCalled();
  });

  it('應該使用提供的 userId', async () => {
    const customUserId = 'custom-user-id';
    mockGetAvatar.mockResolvedValue(mockAvatarUrls);
    const { result } = renderHook(() => useFirebaseAvatar(customUserId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(mockGetAvatar).toHaveBeenCalledWith(customUserId);
    expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);
  });

  it('應該處理頭像載入錯誤', async () => {
    mockGetAvatar.mockRejectedValue(new Error('Failed to load avatar'));

    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.error).toEqual({
      message: 'Failed to load avatar',
      code: 'AVATAR_LOAD_ERROR'
    });
    expect(result.current.avatarUrl96).toBe(null);
  });

  it('應該提供刷新頭像功能', async () => {
    // 初始載入
    mockGetAvatar.mockResolvedValue(mockAvatarUrls);
    const { result } = renderHook(() => useFirebaseAvatar());

    // 等待初始載入
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);

    // 設置新的頭像 URLs
    const newAvatarUrls = {
      large: 'https://example.com/new-avatar-96.jpg',
      medium: 'https://example.com/new-avatar-48.jpg',
      small: 'https://example.com/new-avatar-30.jpg',
    };

    // 在調用 refreshAvatar 之前更改 mock 返回值
    mockGetAvatar.mockResolvedValue(newAvatarUrls);

    // 調用刷新功能
    await act(async () => {
      await result.current.refreshAvatar();
    });

    await waitFor(() => {
      expect(result.current.avatarUrl96).toBe(newAvatarUrls.large);
    }, { timeout: 5000 });

    expect(result.current.avatarUrl48).toBe(newAvatarUrls.medium);
    expect(result.current.avatarUrl30).toBe(newAvatarUrls.small);
  });

  it('應該正確返回用戶資料', async () => {
    mockGetAvatar.mockResolvedValue(mockAvatarUrls);
    
    const { result } = renderHook(() => useFirebaseAvatar());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.data.avatar_url).toBe(mockAvatarUrls.large);
    expect(result.current.data.user_name).toBe(mockUser.displayName);
  });

  it('應該為沒有 displayName 的用戶使用 email 前綴', async () => {
    const userWithoutDisplayName = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: null,
    };

    mockAuthStore.mockImplementation((selector: any) => {
      const state = {
        user: userWithoutDisplayName,
        isAuthLoading: false,
      };
      return selector(state);
    });

    mockGetAvatar.mockResolvedValue(mockAvatarUrls);
    const { result } = renderHook(() => useFirebaseAvatar());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.data.user_name).toBe('test'); // email 前綴
  });

  it('應該正確處理空的 avatar URLs', async () => {
    const emptyAvatarUrls = {
      large: null,
      medium: null,
      small: null,
    };
    
    mockGetAvatar.mockResolvedValue(emptyAvatarUrls);

    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.avatarUrl96).toBe(null);
    expect(result.current.avatarUrl48).toBe(null);
    expect(result.current.avatarUrl30).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('應該正確處理不同尺寸的頭像', async () => {
    mockGetAvatar.mockResolvedValue(mockAvatarUrls);
    
    const { result } = renderHook(() => useFirebaseAvatar());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    expect(result.current.avatarUrl96).toBe(mockAvatarUrls.large);
    expect(result.current.avatarUrl48).toBe(mockAvatarUrls.medium);
    expect(result.current.avatarUrl30).toBe(mockAvatarUrls.small);
    expect(result.current.avatarUrl).toBe(result.current.avatarUrl96);
  });

  it('應該處理認證載入狀態', () => {
    mockAuthStore.mockImplementation((selector: any) => {
      const state = {
        user: null,
        isAuthLoading: true,
      };
      return selector(state);
    });

    const { result } = renderHook(() => useFirebaseAvatar());

    expect(result.current.isAuthLoading).toBe(true);
    expect(result.current.avatarUrl96).toBe(null);
  });

  it('應該處理 refreshAvatar 失敗', async () => {
    // 先成功載入
    mockGetAvatar.mockResolvedValue(mockAvatarUrls);
    const { result } = renderHook(() => useFirebaseAvatar());

    // 等待初始載入
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 5000 });

    // 在調用 refreshAvatar 之前設置失敗
    const refreshError = new Error('Refresh failed');
    mockGetAvatar.mockRejectedValue(refreshError);

    // 調用 refreshAvatar 並捕獲結果
    let refreshResult;
    await act(async () => {
      refreshResult = await result.current.refreshAvatar();
    });

    // 因為 fetchAvatar 會拋出錯誤，refreshAvatar 應該捕獲它並返回 false
    expect(refreshResult).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
}); 