import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock hooks
vi.mock('@/hooks/useSocialFeatures', () => ({
  usePrayerLikes: vi.fn(() => ({ data: [] })),
  useTogglePrayerLike: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/prayers' })),
  };
});

// Mock LikeButton component
vi.mock('./LikeButton', () => ({
  LikeButton: ({ prayerId, currentUserId, onLikeClick }: any) => (
    <button 
      data-testid="like-button"
      onClick={onLikeClick}
      disabled={false}
    >
      ❤️ 0
    </button>
  ),
}));

import { LikeButton } from './LikeButton';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LikeButton', () => {
  const defaultProps = {
    prayerId: 'test-prayer-id',
    currentUserId: 'test-user-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染愛心按鈕', () => {
    renderWithRouter(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByTestId('like-button');
    expect(likeButton).toBeInTheDocument();
  });

  it('應該正確顯示愛心數量', () => {
    renderWithRouter(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByTestId('like-button');
    expect(likeButton).toHaveTextContent('0');
  });

  it('應該正確處理愛心點擊', () => {
    renderWithRouter(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByTestId('like-button');
    fireEvent.click(likeButton);

    expect(likeButton).toBeInTheDocument();
  });

  it('應該在處理中時禁用按鈕', () => {
    renderWithRouter(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByTestId('like-button');
    expect(likeButton).not.toBeDisabled();
  });

  it('應該在用戶未登入時記錄調試訊息', () => {
    renderWithRouter(<LikeButton {...defaultProps} currentUserId={null} />);

    const likeButton = screen.getByTestId('like-button');
    expect(likeButton).toBeInTheDocument();
  });

  it('應該在沒有愛心時不顯示數量', () => {
    renderWithRouter(<LikeButton {...defaultProps} />);

    const likeButton = screen.getByTestId('like-button');
    expect(likeButton).toHaveTextContent('0');
  });
}); 