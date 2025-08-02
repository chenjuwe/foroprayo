import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Miracle from './Miracle';

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

vi.mock('@/hooks/useMiraclePosts', () => ({
  useMiraclePosts: vi.fn(),
  useCreateMiraclePost: vi.fn(),
  useDeleteMiraclePost: vi.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

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

describe('Miracle 頁面', () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
  };

  const mockPosts = [
    {
      id: '1',
      content: '測試奇蹟貼文 1',
      user_id: 'test-user-id',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      content: '測試奇蹟貼文 2',
      user_id: 'test-user-id',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const { useFirebaseAvatar } = require('@/hooks/useFirebaseAvatar');
    useFirebaseAvatar.mockReturnValue({
      user: mockUser,
      isLoggedIn: true,
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    const { useMiraclePosts, useCreateMiraclePost, useDeleteMiraclePost } = require('@/hooks/useMiraclePosts');
    useMiraclePosts.mockReturnValue({
      data: mockPosts,
      isLoading: false,
      error: null,
    });
    
    useCreateMiraclePost.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });
    
    useDeleteMiraclePost.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
    });

    mockLocalStorage.getItem.mockReturnValue('false');
  });

  it('應該正確渲染奇蹟頁面', () => {
    renderWithRouter(<Miracle />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
  });

  it('應該在載入時顯示骨架屏', () => {
    const { useMiraclePosts } = require('@/hooks/useMiraclePosts');
    useMiraclePosts.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    renderWithRouter(<Miracle />);
    
    expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
  });

  it('應該顯示奇蹟貼文列表', () => {
    renderWithRouter(<Miracle />);
    
    expect(screen.getByText('測試奇蹟貼文 1')).toBeInTheDocument();
    expect(screen.getByText('測試奇蹟貼文 2')).toBeInTheDocument();
  });

  it('應該在訪客模式下正常運行', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    
    const { useFirebaseAvatar } = require('@/hooks/useFirebaseAvatar');
    useFirebaseAvatar.mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl: null,
    });

    renderWithRouter(<Miracle />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-form')).toBeInTheDocument();
  });

  it('應該在未登入且非訪客模式時重定向到認證頁面', async () => {
    mockLocalStorage.getItem.mockReturnValue('false');
    
    const { useFirebaseAvatar } = require('@/hooks/useFirebaseAvatar');
    useFirebaseAvatar.mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl: null,
    });

    renderWithRouter(<Miracle />);
    
    await waitFor(() => {
      expect(window.location.href).toBe('/auth');
    });
  });

  it('應該處理貼文載入錯誤', () => {
    const { useMiraclePosts } = require('@/hooks/useMiraclePosts');
    useMiraclePosts.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('載入失敗'),
    });

    renderWithRouter(<Miracle />);
    
    // 組件應該仍然渲染，即使有錯誤
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('應該正確處理滾動狀態', () => {
    renderWithRouter(<Miracle />);
    
    const header = screen.getByTestId('header');
    expect(header).toHaveAttribute('data-scrolled', 'false');
  });
}); 