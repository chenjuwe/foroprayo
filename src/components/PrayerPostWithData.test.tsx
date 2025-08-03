import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrayerPostWithData } from './PrayerPostWithData';
import { useFirebaseUserData } from '@/hooks/useFirebaseUserData';
import { mockPrayer } from '@/test/fixtures/mock-data';

// Mock the hooks
vi.mock('@/hooks/useFirebaseUserData');
vi.mock('@/contexts/FirebaseAuthContext', () => ({
  useFirebaseAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user', email: 'test@example.com' },
  })),
}));

// Mock子组件
vi.mock('./PrayerPost', () => ({
  PrayerPost: ({ prayer, userData }: any) => (
    <div data-testid="prayer-post">
      <div>Prayer: {prayer.content}</div>
      <div>User: {userData?.displayName || 'Anonymous'}</div>
    </div>
  ),
}));

// Import the mocked hook
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

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
  },
}));

// 工具函數：包裝組件進行渲染
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter data-testid="browser-router">
      {component}
    </BrowserRouter>
  );
};

// 默認的 Prayer 對象
const defaultPrayer = mockPrayer;

// 默認的 Props
const defaultProps = {
  prayer: defaultPrayer,
  onAddFriend: vi.fn(),
  onFollow: vi.fn(),
  onShare: vi.fn(),
  onBookmark: vi.fn(),
};

describe('PrayerPostWithData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默認 mock 設置
    vi.mocked(usePrayerResponses).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    
    vi.mocked(useCreatePrayerResponse).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as any);
    
    vi.mocked(useFirebaseAuth).mockReturnValue({
      currentUser: { uid: 'current-user-id' },
      loading: false,
      error: null,
    } as any);
  });

  describe('基本渲染', () => {
    it('應該正確渲染代禱內容', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByText('這是一個測試代禱內容，用來測試組件的渲染和功能。')).toBeInTheDocument();
      expect(screen.getByText('test-user-id')).toBeInTheDocument();
    });

    it('應該正確顯示用戶頭像', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const avatar = screen.getByAltText('test-user-id的頭像');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('應該顯示格式化的時間戳', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByText('2024/01/01 上午08:00')).toBeInTheDocument();
    });

    it('應該顯示加好友和追蹤按鈕', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByText('加好友')).toBeInTheDocument();
      expect(screen.getByText('追蹤')).toBeInTheDocument();
    });
  });

  describe('匿名代禱', () => {
    it('應該正確顯示匿名代禱', () => {
      const anonymousPrayer = { ...defaultPrayer, is_anonymous: true };
      renderWithRouter(<PrayerPostWithData {...defaultProps} prayer={anonymousPrayer} />);
      
      expect(screen.getByText('匿名發布')).toBeInTheDocument();
      expect(screen.queryByText('加好友')).not.toBeInTheDocument();
      expect(screen.queryByText('追蹤')).not.toBeInTheDocument();
    });
  });

  describe('回應功能', () => {
    it('應該正確渲染回應表單', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('寫下你的回應代禱')).toBeInTheDocument();
      expect(screen.getByText('送出回應')).toBeInTheDocument();
    });

    it('應該正確處理回應提交', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(true);
      vi.mocked(useCreatePrayerResponse).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('寫下你的回應代禱');
      const submitButton = screen.getByText('送出回應');

      fireEvent.change(textarea, { target: { value: '這是一個測試回應' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            prayer_id: 'test-prayer-id',
            content: '這是一個測試回應',
            is_anonymous: false,
          })
        );
      });
    });

    it('應該在未登入時顯示警告', async () => {
      vi.mocked(useFirebaseAuth).mockReturnValue({
        currentUser: null,
        loading: false,
        error: null,
      } as any);

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('寫下你的回應代禱');
      const submitButton = screen.getByText('送出回應');

      fireEvent.change(textarea, { target: { value: '這是一個測試回應' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(notify.warning).toHaveBeenCalledWith('請先登入才能發表回應');
      });
    });

    it('應該處理回應提交錯誤', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('提交失敗'));
      vi.mocked(useCreatePrayerResponse).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: false,
        error: null,
      } as any);

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('寫下你的回應代禱');
      const submitButton = screen.getByText('送出回應');

      fireEvent.change(textarea, { target: { value: '這是一個測試回應' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(notify.error).toHaveBeenCalled();
        expect(log.error).toHaveBeenCalled();
      });
    });
  });

  describe('回應顯示', () => {
    it('應該正確顯示現有回應', () => {
      const mockResponses = [
        {
          id: 'response-1',
          prayer_id: 'test-prayer-id',
          user_id: 'user-1',
          content: '這是第一個回應',
          created_at: '2024-01-01T01:00:00Z',
          is_anonymous: false,
        },
        {
          id: 'response-2',
          prayer_id: 'test-prayer-id',
          user_id: 'user-2',
          content: '這是第二個回應',
          created_at: '2024-01-01T02:00:00Z',
          is_anonymous: true,
        },
      ];

      vi.mocked(usePrayerResponses).mockReturnValue({
        data: mockResponses,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      expect(screen.getByText('這是第一個回應')).toBeInTheDocument();
      expect(screen.getByText('這是第二個回應')).toBeInTheDocument();
      expect(screen.getByText('用戶回應')).toBeInTheDocument();
      expect(screen.getByText('匿名回應')).toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    it('應該正確處理回應載入狀態', () => {
      vi.mocked(usePrayerResponses).mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      // 組件應該正常渲染，即使回應正在載入
      expect(screen.getByText('這是一個測試代禱內容，用來測試組件的渲染和功能。')).toBeInTheDocument();
    });

    it('應該正確處理回應提交載入狀態', () => {
      vi.mocked(useCreatePrayerResponse).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(true),
        isPending: true,
        isError: false,
        error: null,
      } as any);

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const submitButton = screen.getByText('送出回應');
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理回應載入錯誤', () => {
      const mockError = new Error('載入失敗');
      vi.mocked(usePrayerResponses).mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      // 組件應該正常渲染，即使回應載入失敗
      expect(screen.getByText('這是一個測試代禱內容，用來測試組件的渲染和功能。')).toBeInTheDocument();
    });
  });

  describe('用戶互動', () => {
    it('應該正確處理按鈕點擊', () => {
      renderWithRouter(<PrayerPostWithData {...defaultProps} />);
      
      const addFriendButton = screen.getByText('加好友');
      const followButton = screen.getByText('追蹤');

      fireEvent.click(addFriendButton);
      fireEvent.click(followButton);

      expect(defaultProps.onAddFriend).toHaveBeenCalled();
      expect(defaultProps.onFollow).toHaveBeenCalled();
    });
  });
}); 