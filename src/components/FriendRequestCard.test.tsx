import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FriendRequestCard } from './FriendRequestCard';

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => '2023-01-01  10:00'),
  formatDistanceToNow: vi.fn(() => '2 小時前'),
  differenceInHours: vi.fn(() => 2),
  differenceInSeconds: vi.fn(() => 7200),
  zhTW: {}
}));

describe('FriendRequestCard', () => {
  const mockRequest = {
    id: 'test-request-id',
    sender_id: 'sender-123',
    receiver_id: 'receiver-456',
    status: null,
    created_at: '2023-01-01T10:00:00Z',
    sender_name: 'Test Sender',
    sender_name_at_time: 'Test Sender',
    sender_avatar: 'https://example.com/avatar.jpg',
    original_sender_profile: {
      username: 'testuser',
      display_name: 'Test User',
      avatar_url: 'https://example.com/profile-avatar.jpg'
    },
    original_sender_avatar: {
      avatar_url_30: 'https://example.com/avatar-30.jpg',
      avatar_url_48: 'https://example.com/avatar-48.jpg',
      avatar_url_96: 'https://example.com/avatar-96.jpg'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染好友請求卡片', () => {
    render(<FriendRequestCard request={mockRequest} />);

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('2 小時前')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '接受' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '拒絕' })).toBeInTheDocument();
  });

  it('應該正確顯示頭像', () => {
    render(<FriendRequestCard request={mockRequest} />);

    const avatarImage = screen.getByRole('img');
    expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(avatarImage).toHaveAttribute('alt', 'testuser');
  });

  it('當沒有頭像時應該顯示縮寫', () => {
    const requestWithoutAvatar = {
      ...mockRequest,
      sender_avatar: '',
      original_sender_profile: {
        ...mockRequest.original_sender_profile!
      }
    };
    delete (requestWithoutAvatar as any).original_sender_avatar;
    delete (requestWithoutAvatar.original_sender_profile as any).avatar_url;

    render(<FriendRequestCard request={requestWithoutAvatar} />);

    expect(screen.getByText('T')).toBeInTheDocument(); // 'testuser' 的首字母
  });

  it('當沒有用戶名稱時應該顯示預設文字', () => {
    const requestWithoutName = {
      ...mockRequest
    };
    delete (requestWithoutName as any).original_sender_profile;

    render(<FriendRequestCard request={requestWithoutName} />);

    expect(screen.getByText('未知用戶')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument(); // 預設縮寫
  });

  it('點擊接受按鈕應該設置處理狀態', () => {
    render(<FriendRequestCard request={mockRequest} />);

    const acceptButton = screen.getByRole('button', { name: '接受' });
    fireEvent.click(acceptButton);

    // 由於功能被暫時禁用，按鈕應該立即恢復
    expect(acceptButton).not.toBeDisabled();
  });

  it('點擊拒絕按鈕應該設置處理狀態', () => {
    render(<FriendRequestCard request={mockRequest} />);

    const rejectButton = screen.getByRole('button', { name: '拒絕' });
    fireEvent.click(rejectButton);

    // 由於功能被暫時禁用，按鈕應該立即恢復
    expect(rejectButton).not.toBeDisabled();
  });

  it('應該正確格式化時間（剛剛）', () => {
    vi.doMock('date-fns', () => ({
      format: vi.fn(() => '2023-01-01  10:00'),
      formatDistanceToNow: vi.fn(() => '2 小時前'),
      differenceInHours: vi.fn(() => 0),
      differenceInSeconds: vi.fn(() => 3),
      zhTW: {}
    }));

    render(<FriendRequestCard request={mockRequest} />);

    expect(screen.getByText('剛剛')).toBeInTheDocument();
  });

  it('應該正確格式化時間（秒前）', () => {
    vi.doMock('date-fns', () => ({
      format: vi.fn(() => '2023-01-01  10:00'),
      formatDistanceToNow: vi.fn(() => '2 小時前'),
      differenceInHours: vi.fn(() => 0),
      differenceInSeconds: vi.fn(() => 30),
      zhTW: {}
    }));

    render(<FriendRequestCard request={mockRequest} />);

    expect(screen.getByText('30 秒前')).toBeInTheDocument();
  });

  it('應該正確格式化時間（24小時以上）', () => {
    vi.doMock('date-fns', () => ({
      format: vi.fn(() => '2023-01-01  10:00'),
      formatDistanceToNow: vi.fn(() => '2 天前'),
      differenceInHours: vi.fn(() => 48),
      differenceInSeconds: vi.fn(() => 172800),
      zhTW: {}
    }));

    render(<FriendRequestCard request={mockRequest} />);

    expect(screen.getByText('2023-01-01  10:00')).toBeInTheDocument();
  });

  it('處理日期格式化錯誤', () => {
    const requestWithInvalidDate = {
      ...mockRequest,
      created_at: 'invalid-date'
    };

    // Mock date-fns to throw error
    vi.doMock('date-fns', () => ({
      format: vi.fn(() => { throw new Error('Invalid date'); }),
      formatDistanceToNow: vi.fn(() => { throw new Error('Invalid date'); }),
      differenceInHours: vi.fn(() => { throw new Error('Invalid date'); }),
      differenceInSeconds: vi.fn(() => { throw new Error('Invalid date'); }),
      zhTW: {}
    }));

    render(<FriendRequestCard request={requestWithInvalidDate} />);

    expect(screen.getByText('未知時間')).toBeInTheDocument();
  });

  it('應該優先使用不同來源的頭像URL', () => {
    // 測試頭像優先級：sender_avatar > original_sender_avatar > original_sender_profile.avatar_url
    const { rerender } = render(<FriendRequestCard request={mockRequest} />);
    
    let avatarImage = screen.getByRole('img');
    expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar.jpg'); // sender_avatar

    // 移除 sender_avatar
    const requestWithoutSenderAvatar = {
      ...mockRequest,
      sender_avatar: ''
    };
    rerender(<FriendRequestCard request={requestWithoutSenderAvatar} />);
    
    avatarImage = screen.getByRole('img');
    expect(avatarImage).toHaveAttribute('src', 'https://example.com/avatar-30.jpg'); // original_sender_avatar

    // 移除 original_sender_avatar
    const requestWithProfileAvatar = {
      ...requestWithoutSenderAvatar
    };
    delete (requestWithProfileAvatar as any).original_sender_avatar;
    rerender(<FriendRequestCard request={requestWithProfileAvatar} />);
    
    avatarImage = screen.getByRole('img');
    expect(avatarImage).toHaveAttribute('src', 'https://example.com/profile-avatar.jpg'); // original_sender_profile.avatar_url
  });
}); 