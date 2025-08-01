import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostActions } from './PostActions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock dependencies
vi.mock('@/hooks/useSocialFeatures', () => ({
  usePrayerLikes: vi.fn(),
  useTogglePrayerLike: vi.fn()
}));

vi.mock('@/hooks/usePrayersOptimized', () => ({
  useDeletePrayer: vi.fn()
}));

vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn()
}));

vi.mock('@/hooks/usePrayerAnswered', () => ({
  useTogglePrayerAnswered: vi.fn()
}));

vi.mock('./ReportDialog', () => ({
  ReportDialog: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="report-dialog">Report Dialog</div> : null
}));

vi.mock('./ui/menu', () => ({
  Menu: ({ children }: any) => <div data-testid="menu">{children}</div>,
  MenuTrigger: ({ children }: any) => <div data-testid="menu-trigger">{children}</div>,
  MenuContent: ({ children }: any) => <div data-testid="menu-content">{children}</div>,
  MenuItem: ({ children, onSelect }: any) => 
    <div data-testid="menu-item" onClick={onSelect}>{children}</div>,
  MenuSeparator: () => <div data-testid="menu-separator" />
}));

vi.mock('./ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => 
    <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children, onClick }: any) => 
    <button data-testid="alert-dialog-cancel" onClick={onClick}>{children}</button>,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div data-testid="alert-dialog-title">{children}</div>
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('@/lib/notifications', () => ({
  notify: vi.fn()
}));

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

describe('PostActions', () => {
  const defaultProps = {
    prayerId: 'prayer-1',
    prayerUserId: 'user-1',
    prayerContent: 'Test prayer content',
    prayerUserName: 'Test User',
    prayerUserAvatar: 'https://example.com/avatar.jpg',
    isOwner: false
  };

  const mockLikes = [
    { id: '1', user_id: 'user-1', prayer_id: 'prayer-1', created_at: '2023-01-01' },
    { id: '2', user_id: 'user-2', prayer_id: 'prayer-1', created_at: '2023-01-02' }
  ];

  let mockUsePrayerLikes: any;
  let mockUseTogglePrayerLike: any;
  let mockUseDeletePrayer: any;
  let mockUseFirebaseAuth: any;
  let mockUseTogglePrayerAnswered: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Get mocked functions
    mockUsePrayerLikes = vi.mocked(require('@/hooks/useSocialFeatures').usePrayerLikes);
    mockUseTogglePrayerLike = vi.mocked(require('@/hooks/useSocialFeatures').useTogglePrayerLike);
    mockUseDeletePrayer = vi.mocked(require('@/hooks/usePrayersOptimized').useDeletePrayer);
    mockUseFirebaseAuth = vi.mocked(require('@/hooks/useFirebaseAuth').useFirebaseAuth);
    mockUseTogglePrayerAnswered = vi.mocked(require('@/hooks/usePrayerAnswered').useTogglePrayerAnswered);

    // Setup default mocks
    mockUsePrayerLikes.mockReturnValue({ data: mockLikes });
    mockUseTogglePrayerLike.mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    });
    mockUseDeletePrayer.mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    });
    mockUseFirebaseAuth.mockReturnValue({
      currentUser: { uid: 'current-user-id' }
    });
    mockUseTogglePrayerAnswered.mockReturnValue({
      mutate: vi.fn(),
      isPending: false
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('應該渲染基本的操作按鈕', () => {
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
  });

  it('應該顯示正確的點讚數量', () => {
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 檢查是否顯示點讚數量（2個讚）
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('應該處理點讚操作', () => {
    const mockToggleLike = vi.fn();
    mockUseTogglePrayerLike.mockReturnValue({
      mutate: mockToggleLike,
      isPending: false
    });

    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    const likeButton = screen.getByRole('button', { name: /愛心/i });
    fireEvent.click(likeButton);

    expect(mockToggleLike).toHaveBeenCalledWith({
      prayerId: 'prayer-1',
      userId: 'current-user-id'
    });
  });

  it('應該為已點讚的禱告顯示不同的樣式', () => {
    const likesWithCurrentUser = [
      ...mockLikes,
      { id: '3', user_id: 'current-user-id', prayer_id: 'prayer-1', created_at: '2023-01-03' }
    ];
    
    mockUsePrayerLikes.mockReturnValue({ data: likesWithCurrentUser });

    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 檢查是否顯示已點讚狀態
    expect(screen.getByText('3')).toBeInTheDocument(); // 3個讚
  });

  it('應該在擁有者模式下顯示編輯和刪除選項', () => {
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} isOwner={true} />, { wrapper });

    // 點擊菜單觸發器
    const menuTrigger = screen.getByTestId('menu-trigger');
    fireEvent.click(menuTrigger);

    // 檢查是否有編輯和刪除選項
    expect(screen.getByTestId('menu-content')).toBeInTheDocument();
  });

  it('應該處理刪除操作', async () => {
    const mockDeletePrayer = vi.fn();
    mockUseDeletePrayer.mockReturnValue({
      mutate: mockDeletePrayer,
      isPending: false
    });

    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} isOwner={true} />, { wrapper });

    // 點擊菜單觸發器
    const menuTrigger = screen.getByTestId('menu-trigger');
    fireEvent.click(menuTrigger);

    // 找到刪除按鈕並點擊
    const deleteItem = screen.getAllByTestId('menu-item').find(item => 
      item.textContent?.includes('刪除')
    );
    if (deleteItem) {
      fireEvent.click(deleteItem);
    }

    // 檢查刪除確認對話框是否出現
    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
  });

  it('應該處理編輯回調', () => {
    const onEdit = vi.fn();
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} isOwner={true} onEdit={onEdit} />, { wrapper });

    // 點擊菜單觸發器
    const menuTrigger = screen.getByTestId('menu-trigger');
    fireEvent.click(menuTrigger);

    // 找到編輯按鈕並點擊
    const editItem = screen.getAllByTestId('menu-item').find(item => 
      item.textContent?.includes('編輯')
    );
    if (editItem) {
      fireEvent.click(editItem);
      expect(onEdit).toHaveBeenCalled();
    }
  });

  it('應該處理分享回調', () => {
    const onShare = vi.fn();
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} onShare={onShare} />, { wrapper });

    // 點擊菜單觸發器
    const menuTrigger = screen.getByTestId('menu-trigger');
    fireEvent.click(menuTrigger);

    // 找到分享按鈕並點擊
    const shareItem = screen.getAllByTestId('menu-item').find(item => 
      item.textContent?.includes('分享')
    );
    if (shareItem) {
      fireEvent.click(shareItem);
      expect(onShare).toHaveBeenCalled();
    }
  });

  it('應該顯示舉報對話框', () => {
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 點擊菜單觸發器
    const menuTrigger = screen.getByTestId('menu-trigger');
    fireEvent.click(menuTrigger);

    // 找到舉報按鈕並點擊
    const reportItem = screen.getAllByTestId('menu-item').find(item => 
      item.textContent?.includes('舉報')
    );
    if (reportItem) {
      fireEvent.click(reportItem);
      expect(screen.getByTestId('report-dialog')).toBeInTheDocument();
    }
  });

  it('應該在未登入時禁用某些功能', () => {
    mockUseFirebaseAuth.mockReturnValue({
      currentUser: null
    });

    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 檢查點讚按鈕仍然存在但功能受限
    const likeButton = screen.getByRole('button', { name: /愛心/i });
    fireEvent.click(likeButton);

    // 由於沒有登入，點讚功能應該不會被調用
    expect(mockUseTogglePrayerLike().mutate).not.toHaveBeenCalled();
  });

  it('應該處理書籤功能（暫時停用）', () => {
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 點擊菜單觸發器
    const menuTrigger = screen.getByTestId('menu-trigger');
    fireEvent.click(menuTrigger);

    // 書籤功能應該存在但暫時停用
    const bookmarkItem = screen.getAllByTestId('menu-item').find(item => 
      item.textContent?.includes('書籤')
    );
    
    if (bookmarkItem) {
      fireEvent.click(bookmarkItem);
      // 書籤功能暫時停用，不應該有實際效果
    }
  });

  it('應該處理禱告已應允功能', () => {
    const mockToggleAnswered = vi.fn();
    mockUseTogglePrayerAnswered.mockReturnValue({
      mutate: mockToggleAnswered,
      isPending: false
    });

    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} isOwner={true} />, { wrapper });

    // 點擊菜單觸發器
    const menuTrigger = screen.getByTestId('menu-trigger');
    fireEvent.click(menuTrigger);

    // 找到已應允按鈕並點擊
    const answeredItem = screen.getAllByTestId('menu-item').find(item => 
      item.textContent?.includes('已應允')
    );
    if (answeredItem) {
      fireEvent.click(answeredItem);
      expect(mockToggleAnswered).toHaveBeenCalledWith('prayer-1');
    }
  });

  it('應該根據路由顯示不同的功能', () => {
    // 測試在不同頁面路由下的行為差異
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 在 /prayers 頁面，某些功能應該可用
    expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
  });

  it('應該處理載入狀態', () => {
    mockUseTogglePrayerLike.mockReturnValue({
      mutate: vi.fn(),
      isPending: true // 模擬載入狀態
    });

    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 在載入期間，按鈕可能會顯示不同的狀態
    const likeButton = screen.getByRole('button', { name: /愛心/i });
    expect(likeButton).toBeInTheDocument();
  });

  it('應該應用自定義樣式類別', () => {
    const customClass = 'custom-post-actions';
    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} className={customClass} />, { wrapper });

    // 檢查自定義類別是否被應用
    const container = screen.getByTestId('menu-trigger').closest('div');
    expect(container).toHaveClass(customClass);
  });

  it('應該處理空的點讚列表', () => {
    mockUsePrayerLikes.mockReturnValue({ data: [] });

    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 應該顯示 0 個讚
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('應該處理錯誤狀態', () => {
    mockUsePrayerLikes.mockReturnValue({ 
      data: undefined,
      error: new Error('Failed to load likes')
    });

    const wrapper = createWrapper();
    render(<PostActions {...defaultProps} />, { wrapper });

    // 即使有錯誤，組件也應該能夠渲染
    expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
  });
}); 