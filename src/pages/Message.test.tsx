import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Message from './Message';

// Mock all dependencies
vi.mock('@/components/Header', () => ({
  Header: ({ isScrolled }: { isScrolled: boolean }) => (
    <div data-testid="header" data-scrolled={isScrolled}>Header</div>
  ),
}));

vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: vi.fn(),
}));

vi.mock('@/hooks/useSocialFeatures', () => ({
  useSocialFeatures: vi.fn(),
}));

vi.mock('@/components/profile/MessageDialog', () => ({
  MessageDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="message-dialog">
        Message Dialog
        <button onClick={onClose} data-testid="close-dialog">Close</button>
      </div>
    ) : null,
}));

vi.mock('@/components/FriendRequestCard', () => ({
  FriendRequestCard: ({ request }: { request: any }) => (
    <div data-testid="friend-request-card">{request.sender_name}</div>
  ),
}));

// localStorage mock is set up globally in test setup

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

describe('Message 頁面', () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
  };

  const mockFriendRequests = [
    {
      id: '1',
      sender_id: 'sender-1',
      sender_name: 'Friend 1',
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      sender_id: 'sender-2',
      sender_name: 'Friend 2',
      status: 'pending',
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

    const { useSocialFeatures } = require('@/hooks/useSocialFeatures');
    useSocialFeatures.mockReturnValue({
      friendRequests: mockFriendRequests,
      isLoadingRequests: false,
      friends: [],
      isLoadingFriends: false,
      sendFriendRequest: vi.fn(),
      acceptFriendRequest: vi.fn(),
      rejectFriendRequest: vi.fn(),
      sendMessage: vi.fn(),
      unfriend: vi.fn(),
    });

    vi.mocked(window.localStorage.getItem).mockReturnValue('false');
  });

  it('應該正確渲染訊息頁面', () => {
    renderWithRouter(<Message />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('訊息與好友')).toBeInTheDocument();
  });

  it('應該顯示好友請求列表', () => {
    renderWithRouter(<Message />);
    
    expect(screen.getByText('好友邀請')).toBeInTheDocument();
    expect(screen.getByText('Friend 1')).toBeInTheDocument();
    expect(screen.getByText('Friend 2')).toBeInTheDocument();
  });

  it('應該在沒有好友請求時顯示空狀態', () => {
    const { useSocialFeatures } = require('@/hooks/useSocialFeatures');
    useSocialFeatures.mockReturnValue({
      friendRequests: [],
      isLoadingRequests: false,
      friends: [],
      isLoadingFriends: false,
      sendFriendRequest: vi.fn(),
      acceptFriendRequest: vi.fn(),
      rejectFriendRequest: vi.fn(),
      sendMessage: vi.fn(),
      unfriend: vi.fn(),
    });

    renderWithRouter(<Message />);
    
    expect(screen.getByText('目前沒有好友邀請')).toBeInTheDocument();
  });

  it('應該在載入時顯示載入狀態', () => {
    const { useSocialFeatures } = require('@/hooks/useSocialFeatures');
    useSocialFeatures.mockReturnValue({
      friendRequests: [],
      isLoadingRequests: true,
      friends: [],
      isLoadingFriends: true,
      sendFriendRequest: vi.fn(),
      acceptFriendRequest: vi.fn(),
      rejectFriendRequest: vi.fn(),
      sendMessage: vi.fn(),
      unfriend: vi.fn(),
    });

    renderWithRouter(<Message />);
    
    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('應該在訪客模式下正常運行', () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue('true');
    
    const { useFirebaseAvatar } = require('@/hooks/useFirebaseAvatar');
    useFirebaseAvatar.mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl: null,
    });

    renderWithRouter(<Message />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('應該在未登入且非訪客模式時重定向到認證頁面', async () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue('false');
    
    const { useFirebaseAvatar } = require('@/hooks/useFirebaseAvatar');
    useFirebaseAvatar.mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl: null,
    });

    renderWithRouter(<Message />);
    
    await waitFor(() => {
      expect(window.location.href).toBe('/auth');
    });
  });

  it('應該正確處理滾動狀態', () => {
    renderWithRouter(<Message />);
    
    const header = screen.getByTestId('header');
    expect(header).toHaveAttribute('data-scrolled', 'false');
  });

  it('應該支持響應式設計', () => {
    renderWithRouter(<Message />);
    
    // 檢查是否有響應式 CSS 類別
    const container = screen.getByText('訊息與好友').closest('div');
    expect(container).toHaveClass('px-4', 'md:px-8');
  });
}); 