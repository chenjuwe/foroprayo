import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Journey from './Journey';

// Mock all dependencies
vi.mock('@/components/Header', () => ({
  Header: ({ isScrolled }: { isScrolled: boolean }) => (
    <div data-testid="header" data-scrolled={isScrolled}>Header</div>
  ),
}));

vi.mock('@/components/PrayerForm', () => ({
  PrayerForm: () => <div data-testid="prayer-form">Prayer Form</div>,
}));

vi.mock('@/components/PrayerPost', () => ({
  default: ({ post }: { post: any }) => (
    <div data-testid="prayer-post">{post.content}</div>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  PrayerPostSkeletonList: () => <div data-testid="skeleton-list">Loading...</div>,
}));

vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: vi.fn(),
}));

vi.mock('@/hooks/useJourneyPosts', () => ({
  useJourneyPosts: vi.fn(),
  useCreateJourneyPost: vi.fn(),
  useDeleteJourneyPost: vi.fn(),
}));

vi.mock('@/services/background/BackgroundService', () => ({
  BackgroundService: {
    applyBackground: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// localStorage mock is already set in setup.ts

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Journey 頁面', () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
  };

  const mockPosts = [
    {
      id: '1',
      content: '測試旅程貼文 1',
      user_id: 'test-user-id',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      content: '測試旅程貼文 2',
      user_id: 'test-user-id',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  // 保存原始的 document.body.style
  let originalBodyBackgroundColor: string;
  let originalDocumentElementBackgroundColor: string;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 保存原始背景色
    originalBodyBackgroundColor = document.body.style.backgroundColor;
    originalDocumentElementBackgroundColor = document.documentElement.style.backgroundColor;
    
    // Setup default mocks
    const { useFirebaseAvatar } = require('@/hooks/useFirebaseAvatar');
    useFirebaseAvatar.mockReturnValue({
      user: mockUser,
      isLoggedIn: true,
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    const { useJourneyPosts, useCreateJourneyPost, useDeleteJourneyPost } = require('@/hooks/useJourneyPosts');
    useJourneyPosts.mockReturnValue({
      data: mockPosts,
      isLoading: false,
      error: null,
    });
    
    useCreateJourneyPost.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
    
    useDeleteJourneyPost.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    vi.mocked(window.localStorage.getItem).mockReturnValue('false');
  });

  afterEach(() => {
    // 恢復原始背景色
    document.body.style.backgroundColor = originalBodyBackgroundColor;
    document.documentElement.style.backgroundColor = originalDocumentElementBackgroundColor;
  });

  it('應該正確渲染旅程頁面', () => {
    renderWithRouter(<Journey />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
  });

  it('應該設置正確的背景色', () => {
    renderWithRouter(<Journey />);
    
    expect(document.body.style.backgroundColor).toBe('rgb(255, 229, 217)');
    expect(document.documentElement.style.backgroundColor).toBe('rgb(255, 229, 217)');
  });

  it('應該在載入時顯示骨架屏', () => {
    const { useJourneyPosts } = require('@/hooks/useJourneyPosts');
    useJourneyPosts.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    renderWithRouter(<Journey />);
    
    expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
  });

  it('應該顯示旅程貼文列表', () => {
    renderWithRouter(<Journey />);
    
    expect(screen.getByText('測試旅程貼文 1')).toBeInTheDocument();
    expect(screen.getByText('測試旅程貼文 2')).toBeInTheDocument();
  });

  it('應該在訪客模式下正常運行', () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue('true');
    
    const { useFirebaseAvatar } = require('@/hooks/useFirebaseAvatar');
    useFirebaseAvatar.mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl: null,
    });

    renderWithRouter(<Journey />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
  });

  it('應該在未登入且非訪客模式時重定向到認證頁面', async () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue('false');
    
    const { useFirebaseAvatar } = require('@/hooks/useFirebaseAvatar');
    useFirebaseAvatar.mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl: null,
    });

    renderWithRouter(<Journey />);
    
    await waitFor(() => {
      expect(window.location.href).toBe('/auth');
    });
  });

  it('應該處理貼文載入錯誤', () => {
    const { useJourneyPosts } = require('@/hooks/useJourneyPosts');
    useJourneyPosts.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('載入失敗'),
    });

    renderWithRouter(<Journey />);
    
    // 組件應該仍然渲染，即使有錯誤
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('應該正確處理滾動狀態', () => {
    renderWithRouter(<Journey />);
    
    const header = screen.getByTestId('header');
    expect(header).toHaveAttribute('data-scrolled', 'false');
  });

  it('應該在組件卸載時恢復背景色', () => {
    const { unmount } = renderWithRouter(<Journey />);
    
    // 驗證背景色已設置
    expect(document.body.style.backgroundColor).toBe('rgb(255, 229, 217)');
    
    // 卸載組件
    unmount();
    
    // 驗證背景色被恢復
    expect(document.body.style.backgroundColor).toBe(originalBodyBackgroundColor);
    expect(document.documentElement.style.backgroundColor).toBe('');
  });
}); 