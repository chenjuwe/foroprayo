import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { Prayer, CreatePrayerRequest } from '@/types/prayer';

// 完整的 Prayer 類型
interface FullPrayer {
  id: string;
  content: string;
  is_anonymous: boolean;
  user_name: string;
  user_id: string;
  user_avatar: string | null;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  response_count?: number;
}

// Mock services
vi.mock('@/services', () => {
  const mockPrayers: FullPrayer[] = [
    {
      id: '1',
      content: 'Test prayer 1',
      is_anonymous: false,
      user_name: 'User 1',
      user_id: 'user1',
      user_avatar: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      response_count: 0
    },
    {
      id: '2',
      content: 'Test prayer 2',
      is_anonymous: false,
      user_name: 'User 2',
      user_id: 'user2',
      user_avatar: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      response_count: 0
    }
  ];

  // 創建模擬的服務實例
  const mockFirebasePrayerServiceInstance = {
    getAllPrayers: vi.fn(() => Promise.resolve(mockPrayers)),
    getPrayerById: vi.fn((id: string) => Promise.resolve(mockPrayers.find(p => p.id === id))),
    createPrayer: vi.fn((prayer) => Promise.resolve({ 
      ...prayer,
      id: 'new-id',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_avatar: null,
      response_count: 0
    })),
    updatePrayer: vi.fn((id, content) => Promise.resolve({ 
      id, 
      content,
      is_anonymous: false,
      user_name: 'Test User',
      user_id: 'user1',
      user_avatar: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T01:00:00Z',
      response_count: 0
    })),
    deletePrayer: vi.fn(() => Promise.resolve()),
    getPrayersByUserId: vi.fn(() => Promise.resolve(mockPrayers))
  };

  return {
    firebasePrayerService: {
      getInstance: vi.fn(() => mockFirebasePrayerServiceInstance)
    }
  };
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn()
  }
}));

// Mock constants
vi.mock('@/constants', () => ({
  QUERY_KEYS: {
    PRAYERS: ['prayers'],
    USER_PROFILE: (id) => ['user-profile', id]
  },
  QUERY_CONFIG: {},
  ERROR_MESSAGES: {
    PRAYER_CREATE_ERROR: 'Failed to create prayer',
    PRAYER_UPDATE_ERROR: 'Failed to update prayer',
    PRAYER_DELETE_ERROR: 'Failed to delete prayer'
  },
  SUCCESS_MESSAGES: {
    PRAYER_UPDATED: 'Prayer updated successfully',
    PRAYER_DELETED: 'Prayer deleted successfully'
  },
  CACHE_CONFIG: {
    RESOURCES: {
      PRAYERS: {
        STALE_TIME: 60000,
        GC_TIME: 300000
      },
      USER_PROFILE: {
        STALE_TIME: 60000,
        GC_TIME: 300000
      }
    }
  }
}));

// Import after mocking
import { usePrayers, useCreatePrayer, useUpdatePrayer, useDeletePrayer } from './usePrayersOptimized';
import { firebasePrayerService } from '@/services';

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('usePrayersOptimized', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePrayers', () => {
    it('should fetch prayers successfully', async () => {
      const mockPrayers: FullPrayer[] = [
        { 
          id: '1', 
          content: 'Test prayer 1',
          is_anonymous: false,
          user_name: 'User 1',
          user_id: 'user1',
          user_avatar: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          response_count: 0
        },
        { 
          id: '2', 
          content: 'Test prayer 2',
          is_anonymous: false,
          user_name: 'User 2',
          user_id: 'user2',
          user_avatar: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          response_count: 0
        }
      ];
      vi.mocked(firebasePrayerService.getInstance().getAllPrayers).mockResolvedValue(mockPrayers as Prayer[]);

      const { result } = renderHook(() => usePrayers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.data).toEqual(mockPrayers);
    });

    it('should handle error when fetching prayers', async () => {
      const mockError = new Error('Failed to fetch prayers');
      vi.mocked(firebasePrayerService.getInstance().getAllPrayers).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePrayers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useCreatePrayer', () => {
    it('should create prayer successfully', async () => {
      const newPrayer: CreatePrayerRequest = {
        content: 'New prayer',
        is_anonymous: false,
        user_name: 'Test User',
        user_id: 'user1'
      };
      const createdPrayer: FullPrayer = { 
        id: 'new-id',
        content: 'New prayer',
        is_anonymous: false,
        user_name: 'Test User',
        user_id: 'user1',
        user_avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        response_count: 0
      };

      vi.mocked(firebasePrayerService.getInstance().createPrayer).mockResolvedValue(createdPrayer as Prayer);

      const { result } = renderHook(() => useCreatePrayer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(newPrayer);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 3000 });

      expect(firebasePrayerService.getInstance().createPrayer).toHaveBeenCalledWith(newPrayer);
    });

    it('should handle error when creating prayer', async () => {
      const newPrayer: CreatePrayerRequest = {
        content: 'New prayer',
        is_anonymous: false,
        user_name: 'Test User',
        user_id: 'user1'
      };
      // 使用 Firebase 的錯誤消息
      const mockError = new Error('請先登入再發布代禱');
      vi.mocked(firebasePrayerService.getInstance().createPrayer).mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreatePrayer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate(newPrayer);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useUpdatePrayer', () => {
    it('should update prayer successfully', async () => {
      const updatedPrayer: FullPrayer = { 
        id: '1', 
        content: 'Updated prayer', 
        is_anonymous: false,
        user_name: 'User 1',
        user_id: 'user1',
        user_avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        response_count: 0
      };
      vi.mocked(firebasePrayerService.getInstance().updatePrayer).mockResolvedValue(updatedPrayer as Prayer);

      const { result } = renderHook(() => useUpdatePrayer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ id: '1', content: 'Updated prayer' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 3000 });

      expect(firebasePrayerService.getInstance().updatePrayer).toHaveBeenCalledWith('1', 'Updated prayer');
    });

    it('should handle error when updating prayer', async () => {
      // 使用 Firebase 的錯誤消息
      const mockError = new Error('請先登入再進行此操作');
      vi.mocked(firebasePrayerService.getInstance().updatePrayer).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdatePrayer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ id: '1', content: 'Updated prayer' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useDeletePrayer', () => {
    it('should delete prayer successfully', async () => {
      vi.mocked(firebasePrayerService.getInstance().deletePrayer).mockResolvedValue();

      const { result } = renderHook(() => useDeletePrayer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 3000 });

      expect(firebasePrayerService.getInstance().deletePrayer).toHaveBeenCalledWith('1');
    });

    it('should handle error when deleting prayer', async () => {
      // 使用 Firebase 的錯誤消息
      const mockError = new Error('需要登入才能刪除代禱');
      vi.mocked(firebasePrayerService.getInstance().deletePrayer).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDeletePrayer(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 3000 });

      expect(result.current.error).toEqual(mockError);
    });
  });
}); 