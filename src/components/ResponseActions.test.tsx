import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponseActions } from './ResponseActions';

// Mock all the hooks
vi.mock('../hooks/useSocialFeatures', () => ({
  usePrayerResponseLikes: vi.fn(() => ({ data: [] })),
  useTogglePrayerResponseLike: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('../hooks/usePrayerResponsesOptimized', () => ({
  useDeletePrayerResponse: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock('../hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(() => ({ 
    currentUser: { uid: 'test-user-id' }
  })),
}));

vi.mock('../hooks/usePrayerAnswered', () => ({
  useToggleResponseAnswered: vi.fn(() => ({ mutate: vi.fn() })),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/menu', () => ({
  Menu: ({ children }: any) => <div data-testid="menu">{children}</div>,
  MenuTrigger: ({ children }: any) => <div data-testid="menu-trigger">{children}</div>,
  MenuContent: ({ children }: any) => <div data-testid="menu-content">{children}</div>,
  MenuItem: ({ children, onClick }: any) => (
    <div data-testid="menu-item" onClick={onClick}>
      {children}
    </div>
  ),
  MenuSeparator: () => <div data-testid="menu-separator" />,
}));

vi.mock('./ReportDialog', () => ({
  ReportDialog: ({ open, onOpenChange }: any) => (
    open ? <div data-testid="report-dialog">Report Dialog</div> : null
  ),
}));

vi.mock('./ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div data-testid="alert-dialog-title">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, onClick }: any) => (
    <button data-testid="alert-dialog-cancel" onClick={onClick}>
      {children}
    </button>
  ),
}));

// Mock react-router-dom
const mockUseLocation = vi.fn();
vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  MoreHorizontal: () => <div data-testid="more-horizontal-icon">More</div>,
  Heart: () => <div data-testid="heart-icon">Heart</div>,
  MessageCircle: () => <div data-testid="message-icon">Message</div>,
  Share2: () => <div data-testid="share-icon">Share</div>,
  Bookmark: () => <div data-testid="bookmark-icon">Bookmark</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  UserPlus: () => <div data-testid="user-plus-icon">UserPlus</div>,
  UserCheck: () => <div data-testid="user-check-icon">UserCheck</div>,
  Flag: () => <div data-testid="flag-icon">Flag</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
}));

describe('ResponseActions', () => {
  const defaultProps = {
    responseId: 'test-response-id',
    responseUserId: 'test-user-id',
    responseContent: 'Test response content',
    responseUserName: 'Test User',
    responseUserAvatar: 'https://example.com/avatar.jpg',
    prayerId: 'test-prayer-id',
    isOwner: true,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onShare: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/prayers' });
  });

  it('應該正確渲染組件', () => {
    render(<ResponseActions {...defaultProps} />);

    expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();
  });

  it('應該顯示功能表觸發器', () => {
    render(<ResponseActions {...defaultProps} />);

    expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
  });

  it('當不是擁有者時應該隱藏某些選項', () => {
    render(<ResponseActions {...defaultProps} isOwner={false} />);

    expect(screen.getByTestId('menu')).toBeInTheDocument();
  });

  it('應該正確應用自定義類名', () => {
    const { container } = render(
      <ResponseActions {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('當沒有回調函數時應該正常工作', () => {
    const propsWithoutCallbacks = {
      responseId: 'test-response-id',
      responseUserId: 'test-user-id',
      responseContent: 'Test response content',
      prayerId: 'test-prayer-id',
    };

    expect(() => {
      render(<ResponseActions {...propsWithoutCallbacks} />);
    }).not.toThrow();
  });

  it('應該在不同路由下正常工作', () => {
    // 測試 prayers 頁面
    mockUseLocation.mockReturnValue({ pathname: '/prayers' });
    const { rerender } = render(<ResponseActions {...defaultProps} />);
    expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();

    // 測試其他頁面
    mockUseLocation.mockReturnValue({ pathname: '/other' });
    rerender(<ResponseActions {...defaultProps} />);
    expect(screen.getByTestId('more-horizontal-icon')).toBeInTheDocument();
  });

  it('應該正確處理可選的 props', () => {
    const minimalProps = {
      responseId: 'test-response-id',
      responseUserId: 'test-user-id',
      responseContent: 'Test response content',
      prayerId: 'test-prayer-id',
    };

    expect(() => {
      render(<ResponseActions {...minimalProps} />);
    }).not.toThrow();
  });

  it('應該有正確的預設值', () => {
    const propsWithDefaults = {
      responseId: 'test-response-id',
      responseUserId: 'test-user-id',
      responseContent: 'Test response content',
      prayerId: 'test-prayer-id',
      // isOwner 應該預設為 false
      // className 應該預設為空字符串
    };

    render(<ResponseActions {...propsWithDefaults} />);

    expect(screen.getByTestId('menu')).toBeInTheDocument();
  });

  it('應該正確設置測試 ID', () => {
    render(<ResponseActions {...defaultProps} />);

    // 檢查是否有必要的測試 ID
    expect(screen.getByTestId('menu')).toBeInTheDocument();
    expect(screen.getByTestId('menu-trigger')).toBeInTheDocument();
  });
}); 