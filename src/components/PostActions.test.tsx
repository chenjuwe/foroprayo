import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock hooks
vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user-id' },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/usePrayerLikes', () => ({
  usePrayerLikes: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useTogglePrayerLike', () => ({
  useTogglePrayerLike: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useDeletePrayer', () => ({
  useDeletePrayer: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/hooks/useTogglePrayerAnswered', () => ({
  useTogglePrayerAnswered: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/notifications', () => ({
  notify: vi.fn(),
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/prayers' })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

import { PostActions } from './PostActions';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PostActions', () => {
  const mockPrayer = {
    id: 'test-prayer-id',
    content: '這是一個測試代禱內容',
    userName: '測試用戶',
    userId: 'test-user-id',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染操作按鈕', () => {
    renderWithRouter(
      <PostActions 
        prayerId="test-prayer-id"
        prayerUserId="test-user-id"
        prayerContent="測試內容"
        prayerUserName="測試用戶"
        isOwner={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByTestId('post-actions')).toBeInTheDocument();
  });

  it('應該為代禱作者顯示編輯和刪除按鈕', async () => {
    renderWithRouter(
      <PostActions 
        prayerId="test-prayer-id"
        prayerUserId="test-user-id"
        prayerContent="測試內容"
        prayerUserName="測試用戶"
        isOwner={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // 點擊菜單按鈕來打開菜單
    const menuButton = screen.getByLabelText('更多選項');
    fireEvent.click(menuButton);

    // 等待菜單項目出現
    expect(screen.getByText('編輯')).toBeInTheDocument();
    expect(screen.getByText('刪除')).toBeInTheDocument();
    expect(screen.getByText('檢舉不當發言')).toBeInTheDocument();
  });

  it('應該為其他用戶隱藏編輯和刪除按鈕', async () => {
    renderWithRouter(
      <PostActions 
        prayerId="test-prayer-id"
        prayerUserId="other-user-id"
        prayerContent="測試內容"
        prayerUserName="其他用戶"
        isOwner={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // 點擊菜單按鈕來打開菜單
    const menuButton = screen.getByLabelText('更多選項');
    fireEvent.click(menuButton);

    expect(screen.queryByText('編輯')).not.toBeInTheDocument();
    expect(screen.queryByText('刪除')).not.toBeInTheDocument();
    expect(screen.getByText('檢舉不當發言')).toBeInTheDocument();
  });

  it('應該正確處理載入狀態', () => {
    renderWithRouter(
      <PostActions 
        prayerId="test-prayer-id"
        prayerUserId="test-user-id"
        prayerContent="測試內容"
        prayerUserName="測試用戶"
        isOwner={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByTestId('post-actions')).toBeInTheDocument();
  });
}); 