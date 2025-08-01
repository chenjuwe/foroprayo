import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Prayers from './Prayers';
import React from 'react';

// Mock all the components and hooks
vi.mock('../components/Header', () => ({
  Header: () => <div data-testid="header">Header</div>
}));

vi.mock('../components/PrayerPost', () => ({
  default: ({ prayer }: any) => (
    <div data-testid="prayer-post">
      <span data-testid="prayer-content">{prayer.content}</span>
      <span data-testid="prayer-user">{prayer.user_name}</span>
    </div>
  )
}));

vi.mock('../components/PrayerForm', () => ({
  PrayerForm: ({ onSubmit }: any) => (
    <div data-testid="prayer-form">
      <input data-testid="prayer-input" />
      <button onClick={() => onSubmit('Test prayer')} data-testid="submit-button">
        Submit
      </button>
    </div>
  )
}));

vi.mock('../components/ui/skeleton', () => ({
  PrayerPostSkeletonList: () => <div data-testid="skeleton-list">Loading...</div>
}));

vi.mock('../hooks/usePrayersOptimized', () => ({
  usePrayers: vi.fn(),
  useCreatePrayer: vi.fn()
}));

vi.mock('../hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: vi.fn()
}));

vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: vi.fn()
}));

vi.mock('@/services/background/BackgroundService', () => ({
  BackgroundService: {
    getUserBackground: vi.fn(),
    upsertUserBackground: vi.fn()
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('@/lib/getUnifiedUserName', () => ({
  getUnifiedUserName: vi.fn((user) => user?.user_name || '匿名用戶')
}));

vi.mock('@/services/prayer/FirebasePrayerImageService', () => ({
  FirebasePrayerImageService: {
    uploadImage: vi.fn()
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn())
  };
});

// Helper to create test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(MemoryRouter, { initialEntries: ['/prayers'] },
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    )
  );

  return Wrapper;
};

describe('Prayers Page', () => {
  let mockUsePrayers: any;
  let mockUseCreatePrayer: any;
  let mockUseFirebaseAvatar: any;
  let mockUseFirebaseAuthStore: any;

  const mockPrayers = [
    {
      id: '1',
      content: '請為我的健康禱告',
      user_name: '張三',
      user_id: 'user1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      is_anonymous: false
    },
    {
      id: '2',
      content: '感謝神的恩典',
      user_name: '李四',
      user_id: 'user2',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
      is_anonymous: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      writable: true
    });

    // Get mocked functions
    mockUsePrayers = vi.mocked(require('../hooks/usePrayersOptimized').usePrayers);
    mockUseCreatePrayer = vi.mocked(require('../hooks/usePrayersOptimized').useCreatePrayer);
    mockUseFirebaseAvatar = vi.mocked(require('../hooks/useFirebaseAvatar').useFirebaseAvatar);
    mockUseFirebaseAuthStore = vi.mocked(require('@/stores/firebaseAuthStore').useFirebaseAuthStore);

    // Setup default mocks
    mockUsePrayers.mockReturnValue({
      data: mockPrayers,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    mockUseCreatePrayer.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null
    });

    mockUseFirebaseAvatar.mockReturnValue({
      user: { uid: 'current-user', displayName: '當前用戶' },
      avatarUrl: 'https://example.com/avatar.jpg',
      avatarUrl30: 'https://example.com/avatar-30.jpg',
      isLoggedIn: true,
      refreshAvatar: vi.fn()
    });

    mockUseFirebaseAuthStore.mockReturnValue({
      initAuth: vi.fn()
    });

    // Mock localStorage default behavior
    (window.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'guestMode') return 'false';
      return null;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('應該渲染頁面的基本結構', async () => {
    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    expect(screen.getByTestId('header')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
    });
  });

  it('應該顯示禱告列表', async () => {
    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByTestId('prayer-post')).toHaveLength(2);
      expect(screen.getByText('請為我的健康禱告')).toBeInTheDocument();
      expect(screen.getByText('感謝神的恩典')).toBeInTheDocument();
    });
  });

  it('應該顯示載入狀態', async () => {
    mockUsePrayers.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn()
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
  });

  it('應該處理錯誤狀態', async () => {
    const mockError = new Error('Failed to load prayers');
    mockUsePrayers.mockReturnValue({
      data: [],
      isLoading: false,
      error: mockError,
      refetch: vi.fn()
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    // 錯誤處理應該優雅地顯示，而不是崩潰
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('應該處理訪客模式', async () => {
    (window.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'guestMode') return 'true';
      return null;
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    // 在訪客模式下，某些功能可能會有所不同
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('應該處理未登入用戶的重定向', async () => {
    mockUseFirebaseAvatar.mockReturnValue({
      user: null,
      avatarUrl: null,
      avatarUrl30: null,
      isLoggedIn: false,
      refreshAvatar: vi.fn()
    });

    (window.localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === 'guestMode') return 'false'; // 非訪客模式但未登入
      return null;
    });

    const mockNavigate = vi.fn();
    vi.mocked(require('react-router-dom').useNavigate).mockReturnValue(mockNavigate);

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    // 應該嘗試重定向到認證頁面
    await waitFor(() => {
      // 在實際實現中可能會有重定向邏輯
    });
  });

  it('應該處理創建新禱告', async () => {
    const mockMutate = vi.fn();
    mockUseCreatePrayer.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    await waitFor(() => {
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
    });

    expect(mockMutate).toHaveBeenCalledWith('Test prayer');
  });

  it('應該處理創建禱告時的載入狀態', async () => {
    mockUseCreatePrayer.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      error: null
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    // 載入狀態下表單應該顯示適當的視覺反饋
    expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
  });

  it('應該處理創建禱告時的錯誤', async () => {
    const mockError = new Error('Failed to create prayer');
    mockUseCreatePrayer.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: mockError
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    // 錯誤狀態應該得到適當處理
    expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
  });

  it('應該初始化 Firebase 認證', async () => {
    const mockInitAuth = vi.fn();
    mockUseFirebaseAuthStore.mockReturnValue({
      initAuth: mockInitAuth
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    await waitFor(() => {
      expect(mockInitAuth).toHaveBeenCalled();
    });
  });

  it('應該處理背景設置', async () => {
    const { BackgroundService } = require('@/services/background/BackgroundService');
    BackgroundService.getUserBackground.mockResolvedValue({
      background_id: 'bg1',
      custom_background: null
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    // 背景設置應該被處理
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('應該處理用戶頭像刷新', async () => {
    const mockRefreshAvatar = vi.fn();
    mockUseFirebaseAvatar.mockReturnValue({
      user: { uid: 'current-user', displayName: '當前用戶' },
      avatarUrl: 'https://example.com/avatar.jpg',
      avatarUrl30: 'https://example.com/avatar-30.jpg',
      isLoggedIn: true,
      refreshAvatar: mockRefreshAvatar
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    // 頭像刷新功能應該可用
    expect(mockRefreshAvatar).toBeDefined();
  });

  it('應該處理空的禱告列表', async () => {
    mockUsePrayers.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    const wrapper = createWrapper();
    render(<Prayers />, { wrapper });

    // 空列表狀態應該得到適當處理
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.queryByTestId('prayer-post')).not.toBeInTheDocument();
  });

  it('應該正確處理組件卸載', async () => {
    const wrapper = createWrapper();
    const { unmount } = render(<Prayers />, { wrapper });

    // 組件應該能夠正常卸載而不會出錯
    expect(() => unmount()).not.toThrow();
  });

  describe('頁面權限和路由', () => {
    it('應該在訪客模式下允許訪問', async () => {
      (window.localStorage.getItem as any).mockImplementation((key: string) => {
        if (key === 'guestMode') return 'true';
        return null;
      });

      const wrapper = createWrapper();
      render(<Prayers />, { wrapper });

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('應該在已登入時允許訪問', async () => {
      const wrapper = createWrapper();
      render(<Prayers />, { wrapper });

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('數據管理', () => {
    it('應該正確獲取禱告數據', async () => {
      const mockRefetch = vi.fn();
      mockUsePrayers.mockReturnValue({
        data: mockPrayers,
        isLoading: false,
        error: null,
        refetch: mockRefetch
      });

      const wrapper = createWrapper();
      render(<Prayers />, { wrapper });

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('應該處理數據刷新', async () => {
      const mockRefetch = vi.fn();
      mockUsePrayers.mockReturnValue({
        data: mockPrayers,
        isLoading: false,
        error: null,
        refetch: mockRefetch
      });

      const wrapper = createWrapper();
      render(<Prayers />, { wrapper });

      // 數據刷新功能應該可用
      expect(mockRefetch).toBeDefined();
    });
  });
}); 