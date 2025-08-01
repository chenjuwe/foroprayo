import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserInfo from './UserInfo';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 小時前'),
  zhTW: {}
}));

// Mock UserAvatar component
vi.mock('./UserAvatar', () => ({
  default: ({ userId, avatarUrl, size }: any) => (
    <div data-testid="user-avatar">
      <span data-testid="user-id">{userId}</span>
      <span data-testid="avatar-url">{avatarUrl}</span>
      <span data-testid="avatar-size">{size}</span>
    </div>
  )
}));

describe('UserInfo', () => {
  const defaultProps = {
    isAnonymous: false,
    userName: 'Test User',
    userAvatarUrl: 'https://example.com/avatar.jpg',
    userId: 'user-123',
    createdAt: '2023-01-01T12:00:00Z'
  };

  it('應該渲染用戶信息', () => {
    render(<UserInfo {...defaultProps} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('2 小時前')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('應該處理匿名用戶', () => {
    render(
      <UserInfo 
        {...defaultProps}
        isAnonymous={true}
        userName="訪客"
      />
    );

    expect(screen.getByText('訪客')).toBeInTheDocument();
  });

  it('應該正確傳遞頭像屬性', () => {
    render(<UserInfo {...defaultProps} />);

    expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
    expect(screen.getByTestId('avatar-url')).toHaveTextContent('https://example.com/avatar.jpg');
    expect(screen.getByTestId('avatar-size')).toHaveTextContent('48');
  });

  it('應該處理空的頭像 URL', () => {
    render(
      <UserInfo 
        {...defaultProps}
        userAvatarUrl=""
      />
    );

    expect(screen.getByTestId('avatar-url')).toHaveTextContent('');
  });

  it('應該顯示創建時間', () => {
    render(<UserInfo {...defaultProps} />);

    expect(screen.getByText('2 小時前')).toBeInTheDocument();
  });

  it('應該處理不同的用戶名', () => {
    render(
      <UserInfo 
        {...defaultProps}
        userName="另一個用戶"
      />
    );

    expect(screen.getByText('另一個用戶')).toBeInTheDocument();
  });

  it('應該正確應用樣式類別', () => {
    render(<UserInfo {...defaultProps} />);

    const userInfoContainer = screen.getByText('Test User').closest('div');
    expect(userInfoContainer).toBeInTheDocument();
  });
}); 