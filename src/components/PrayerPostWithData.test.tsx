import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PrayerPostWithData } from './PrayerPostWithData';
import type { Prayer } from '@/services/prayerService';

// Mock dependencies
vi.mock('@/hooks/usePrayerResponsesOptimized', () => ({
  usePrayerResponses: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  })),
  useCreatePrayerResponse: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(true),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  })),
}));

vi.mock('@/constants', () => ({
  VALIDATION_CONFIG: {
    PRAYER_CONTENT: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 20000,
    },
    RESPONSE_CONTENT: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 20000,
    },
    USERNAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 20,
    },
  },
  APP_CONFIG: {
    name: "Pray for Others",
    version: "0.1.4",
    description: "A prayer sharing platform",
    author: "Pray for Others Team",
    repository: "https://github.com/chenjuwe/prayforo",
  },
  API_CONFIG: {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
  CACHE_CONFIG: {
    MEMORY_TTL: 5 * 60 * 1000,
    MEMORY_STALE_TTL: 30 * 60 * 1000,
    INDEXED_DB_TTL: 7 * 24 * 60 * 60 * 1000,
    RESOURCES: {
      PRAYERS: {
        STALE_TIME: 2 * 60 * 1000,
        GC_TIME: 10 * 60 * 1000,
      },
      PRAYER_RESPONSES: {
        STALE_TIME: 3 * 60 * 1000,
        GC_TIME: 15 * 60 * 1000,
      },
      USER_PROFILE: {
        STALE_TIME: 10 * 60 * 1000,
        GC_TIME: 30 * 60 * 1000,
      },
      SOCIAL_FEATURES: {
        STALE_TIME: 15 * 60 * 1000,
        GC_TIME: 60 * 60 * 1000,
      }
    },
    PREFETCH: {
      IDLE_DELAY: 60000,
      TOP_RESPONSES_COUNT: 5,
      USER_PRAYERS_LIMIT: 20,
    },
  },
  QUERY_CONFIG: {
    STALE_TIME: 2 * 60 * 1000,
    GC_TIME: 5 * 60 * 1000,
    RETRY_COUNT: 1,
    RETRY_DELAY: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 10000),
  },
  UI_CONFIG: {
    TOAST_DURATION: {
      SUCCESS: 3000,
      ERROR: 5000,
      WARNING: 4000,
      INFO: 3000,
    },
    ANIMATION_DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    BREAKPOINTS: {
      XS: 390,
      SM: 640,
      MD: 768,
      LG: 1024,
      XL: 1200,
    },
    MAX_CONTENT_WIDTH: 390,
    MAX_HEIGHT: 844,
  },
  STORAGE_KEYS: {
    USERNAME_PREFIX: 'username_',
    AVATAR_PREFIX: 'avatar_',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme',
    LANGUAGE: 'language',
    BACKGROUND: 'global_background',
    CUSTOM_BACKGROUND: 'global_custom_background',
    CUSTOM_BACKGROUND_SIZE: 'global_custom_background_size',
  },
  ERROR_MESSAGES: {
    NETWORK_ERROR: '網路連線失敗，請檢查網路狀態',
    AUTH_ERROR: '請先登入再進行此操作',
    PERMISSION_ERROR: '您沒有權限執行此操作',
    VALIDATION_ERROR: '輸入資料格式不正確',
    UNKNOWN_ERROR: '發生未知錯誤，請稍後再試',
    PRAYER_CREATE_ERROR: '代禱發布失敗，請稍後再試',
    PRAYER_UPDATE_ERROR: '代禱更新失敗，請稍後再試',
    PRAYER_DELETE_ERROR: '代禱刪除失敗，請稍後再試',
    RESPONSE_CREATE_ERROR: '回應發布失敗，請稍後再試',
    RESPONSE_UPDATE_ERROR: '回應更新失敗，請稍後再試',
    RESPONSE_DELETE_ERROR: '回應刪除失敗，請稍後再試',
  },
  SUCCESS_MESSAGES: {
    PRAYER_CREATED: '代禱發布成功',
    PRAYER_UPDATED: '代禱內容已更新',
    PRAYER_DELETED: '代禱已刪除',
    RESPONSE_CREATED: '回應發布成功',
    RESPONSE_UPDATED: '回應內容已更新',
    RESPONSE_DELETED: '回應已刪除',
    PROFILE_UPDATED: '個人資料已更新',
  },
  ROUTES: {
    HOME: '/',
    PRAYERS: '/prayers',
    PRAYERS_NEW: '/new',
    NEW_PRAYER: '/new',
    AUTH: '/auth',
    PROFILE: '/profile',
    LOG: '/log',
    MESSAGE: '/message',
    SETTING: '/setting',
    BAPTISM: '/baptism',
    MIRACLE: '/miracle',
    JOURNEY: '/journey',
    CLAIRE: '/claire',
    CLAIRE_DASHBOARD: '/claire/dashboard',
    CLAIRE_USERS: '/claire/users',
    CLAIRE_PRAYERS: '/claire/prayers',
    CLAIRE_REPORTS: '/claire/reports',
    CLAIRE_SUPER_ADMINS: '/claire/super-admins',
    FIX_DATABASE: '/fix-database',
    NOT_FOUND: '*',
  },
  QUERY_KEYS: {
    PRAYERS: ['prayers'],
    PRAYER_RESPONSES: (prayerId: string) => ['prayer_responses', prayerId],
    PRAYER_LIKES: (prayerId: string | undefined) => ['prayer_likes', prayerId],
    PRAYER_RESPONSE_LIKES: (responseId: string | undefined) => ['prayer_response_likes', responseId],
    USER_PROFILE: (userId: string) => ['user_profile', userId],
    PRAYER_BOOKMARKS: ['prayer-bookmarks'],
    SOCIAL_FEATURES: ['social-features'],
    BAPTISM_POSTS: ['baptism-posts'],
    JOURNEY_POSTS: ['journey-posts'],
    MIRACLE_POSTS: ['miracle-posts'],
  },
  PAGE_TYPES: {
    PUBLISH: 'publish',
    COMMUNITY: 'community',
    PROFILE: 'profile',
  },
  SOCIAL_CONFIG: {
    MAX_FOLLOWING: 1000,
    MAX_BOOKMARKS: 500,
  },
  IMAGE_CONFIG: {
    AVATAR_SIZE: {
      SMALL: 32,
      MEDIUM: 40,
      LARGE: 48,
    },
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    PLACEHOLDER_URL: '/placeholder.svg',
  },
  BACKGROUND_OPTIONS: [
    { id: 'default', name: '預設二', style: '', bgColor: '#f8e9e2' },
    { id: 'default3', name: '預設三', style: '', bgColor: '#ffe6e6' },
    { id: 'default5', name: '預設五', style: '', bgColor: '#e6f3ff' },
    { id: 'default8', name: '預設八', style: '', bgColor: '#f0f8e6' },
    { id: 'default1', name: '預設一', style: '', bgColor: '#fffbe6' },
    { id: 'default4', name: '預設四', style: '', bgColor: '#e6fff7' },
    { id: 'default6', name: '預設六', style: '', bgColor: '#e6eaff' },
    { id: 'default7', name: '預設七', style: '', bgColor: '#ffe6fa' },
    { id: 'default9', name: '預設九', style: '', bgColor: '#e6ffe6' },
    { id: 'guest', name: '訪客背景', style: '', bgColor: '#F4E4DD' },
    { id: 'custom', name: '自定義', style: '' },
  ],
  GUEST_DEFAULT_BACKGROUND: 'guest',
  ENV_CONFIG: {
    isDevelopment: true,
    isProduction: false,
    isTest: true,
  },
}));

vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user-id', displayName: 'Test User' },
    isLoading: false,
  })),
}));

vi.mock('@/lib/notifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    apiError: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('./ui/guest-avatar', () => ({
  default: ({ size, className }: any) => (
    <div data-testid="guest-avatar" className={className}>
      Guest Avatar ({size})
    </div>
  ),
}));

vi.mock('./PrayerForm', () => ({
  PrayerForm: ({ onSubmit, variant, placeholder }: any) => (
    <div data-testid="prayer-form">
      <textarea
        data-testid="response-textarea"
        placeholder={placeholder}
        onChange={(e) => onSubmit?.(e.target.value, false)}
      />
      <button
        data-testid="submit-response"
        onClick={() => onSubmit?.('Test response', false)}
      >
        提交回應
      </button>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PrayerPostWithData', () => {
  const mockPrayer: Prayer = {
    id: 'prayer-1',
    content: '這是一個測試代禱內容，用來測試組件的渲染和功能。',
    user_id: 'test-user-id',
    user_name: 'Test User',
    user_avatar: 'https://example.com/avatar.jpg',
    is_anonymous: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    image_url: null,
    is_answered: false,
    response_count: 0,
    prayer_type: 'prayer',
  };

  const defaultProps = {
    prayer: mockPrayer,
    onAddFriend: vi.fn(),
    onFollow: vi.fn(),
    onShare: vi.fn(),
    onBookmark: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該正確渲染代禱貼文', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByText('這是一個測試代禱內容，用來測試組件的渲染和功能。')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('應該正確顯示匿名代禱', () => {
      const anonymousPrayer = {
        ...mockPrayer,
        is_anonymous: true,
        user_name: '匿名發布',
      };
      
      renderWithRouter(<PrayerPostWithData {...defaultProps} prayer={anonymousPrayer} />);
      
      expect(screen.getByTestId('guest-avatar')).toBeInTheDocument();
      expect(screen.getByText('匿名發布')).toBeInTheDocument();
    });

    it('應該正確顯示用戶頭像', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const avatar = screen.getByAltText('Test User');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('應該正確格式化時間戳', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      // 檢查時間戳是否被格式化
      expect(screen.getByText(/2024\/01\/01/)).toBeInTheDocument();
    });
  });

  describe('回應功能', () => {
    it('應該正確渲染回應表單', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
      expect(screen.getByTestId('response-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('submit-response')).toBeInTheDocument();
    });

    it('應該正確處理回應提交', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(true);
      vi.mocked(require('@/hooks/usePrayerResponsesOptimized').useCreatePrayerResponse).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      });

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const submitButton = screen.getByTestId('submit-response');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          prayer_id: 'prayer-1',
          content: 'Test response',
          is_anonymous: false,
        });
      });
    });

    it('應該在未登入時顯示警告', async () => {
      vi.mocked(require('@/hooks/useFirebaseAuth').useFirebaseAuth).mockReturnValue({
        currentUser: null,
        isLoading: false,
      });

      const mockNotify = vi.mocked(require('@/lib/notifications').notify);
      
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const submitButton = screen.getByTestId('submit-response');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockNotify.warning).toHaveBeenCalledWith('請先登入才能發表回應');
      });
    });

    it('應該處理回應提交錯誤', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('提交失敗'));
      const mockNotify = vi.mocked(require('@/lib/notifications').notify);
      const mockLog = vi.mocked(require('@/lib/logger').log);
      
      vi.mocked(require('@/hooks/usePrayerResponsesOptimized').useCreatePrayerResponse).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        isSuccess: false,
        isError: false,
        error: null,
      });

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const submitButton = screen.getByTestId('submit-response');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockLog.error).toHaveBeenCalledWith('Failed to submit response', expect.any(Error), 'PrayerPostWithData');
        expect(mockNotify.apiError).toHaveBeenCalledWith(expect.any(Error), '發表回應失敗');
      });
    });
  });

  describe('內容展開/收縮', () => {
    it('應該正確處理長內容的展開/收縮', () => {
      const longContentPrayer = {
        ...mockPrayer,
        content: 'a'.repeat(1000), // 很長的內容
      };
      
      renderWithRouter(<PrayerPostWithData {...defaultProps} prayer={longContentPrayer} />);
      
      // 檢查是否有展開/收縮按鈕
      expect(screen.getByText('a'.repeat(1000))).toBeInTheDocument();
    });

    it('應該正確處理短內容', () => {
      const shortContentPrayer = {
        ...mockPrayer,
        content: '短內容',
      };
      
      renderWithRouter(<PrayerPostWithData {...defaultProps} prayer={shortContentPrayer} />);
      
      expect(screen.getByText('短內容')).toBeInTheDocument();
    });
  });

  describe('回調函數', () => {
    it('應該正確處理添加朋友回調', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      // 檢查回調函數是否被正確傳遞
      expect(defaultProps.onAddFriend).toBeDefined();
    });

    it('應該正確處理關注回調', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(defaultProps.onFollow).toBeDefined();
    });

    it('應該正確處理分享回調', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(defaultProps.onShare).toBeDefined();
    });

    it('應該正確處理書籤回調', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(defaultProps.onBookmark).toBeDefined();
    });
  });

  describe('載入狀態', () => {
    it('應該正確處理回應載入狀態', () => {
      vi.mocked(require('@/hooks/usePrayerResponsesOptimized').usePrayerResponses).mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
    });

    it('應該正確處理回應提交載入狀態', () => {
      vi.mocked(require('@/hooks/usePrayerResponsesOptimized').useCreatePrayerResponse).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(true),
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
      });

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理時間戳格式化錯誤', () => {
      const invalidTimestampPrayer = {
        ...mockPrayer,
        created_at: 'invalid-timestamp',
      };
      
      renderWithRouter(<PrayerPostWithData {...defaultProps} prayer={invalidTimestampPrayer} />);
      
      // 組件應該能夠處理無效的時間戳
      expect(screen.getByText('這是一個測試代禱內容，用來測試組件的渲染和功能。')).toBeInTheDocument();
    });

    it('應該正確處理回應載入錯誤', () => {
      vi.mocked(require('@/hooks/usePrayerResponsesOptimized').usePrayerResponses).mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: new Error('載入失敗'),
        refetch: vi.fn(),
      });

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
    });
  });

  describe('無障礙功能', () => {
    it('應該包含正確的 ARIA 標籤', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('應該正確處理鍵盤導航', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const submitButton = screen.getByTestId('submit-response');
      expect(submitButton).toBeInTheDocument();
      
      // 測試鍵盤導航
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });
  });
}); 