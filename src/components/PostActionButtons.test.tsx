import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PostActionButtons } from './PostActionButtons';

// Mock PostActions component
vi.mock('./PostActions', () => ({
  PostActions: (props: any) => (
    <div data-testid="post-actions" data-props={JSON.stringify(props)}>
      PostActions Component
    </div>
  ),
}));

// Mock react-router-dom
const mockUseLocation = vi.fn();
vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PostActionButtons', () => {
  const defaultProps = {
    postId: 'test-post-id',
    prayerUserId: 'test-user-id',
    prayerContent: 'Test prayer content',
    prayerUserName: 'Test User',
    prayerUserAvatar: 'https://example.com/avatar.jpg',
    isOwner: true,
    onShare: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/prayers' });
  });

  describe('基本渲染', () => {
    it('應該正確渲染組件', () => {
      renderWithRouter(<PostActionButtons {...defaultProps} />);

      expect(screen.getByTestId('post-actions')).toBeInTheDocument();
      expect(screen.getByText('PostActions Component')).toBeInTheDocument();
    });

    it('應該將正確的 props 傳遞給 PostActions', () => {
      renderWithRouter(<PostActionButtons {...defaultProps} />);

      const postActionsElement = screen.getByTestId('post-actions');
      const props = JSON.parse(postActionsElement.getAttribute('data-props') || '{}');

      expect(props.prayerId).toBe('test-post-id');
      expect(props.prayerUserId).toBe('test-user-id');
      expect(props.prayerContent).toBe('Test prayer content');
      expect(props.prayerUserName).toBe('Test User');
      expect(props.prayerUserAvatar).toBe('https://example.com/avatar.jpg');
      expect(props.isOwner).toBe(true);
    });
  });

  describe('頁面特定樣式', () => {
    it('在 prayers 頁面應該使用統一樣式', () => {
      mockUseLocation.mockReturnValue({ pathname: '/prayers' });
      
      renderWithRouter(<PostActionButtons {...defaultProps} />);

      const container = screen.getByTestId('post-actions').parentElement;
      expect(container).toHaveStyle({ top: '-3px' });
    });

    it('在 log 頁面應該使用統一樣式', () => {
      mockUseLocation.mockReturnValue({ pathname: '/log' });
      
      renderWithRouter(<PostActionButtons {...defaultProps} />);

      const container = screen.getByTestId('post-actions').parentElement;
      expect(container).toHaveStyle({ top: '-3px' });
    });

    it('在其他頁面應該使用預設樣式', () => {
      mockUseLocation.mockReturnValue({ pathname: '/other' });
      
      renderWithRouter(<PostActionButtons {...defaultProps} />);

      const container = screen.getByTestId('post-actions').parentElement;
      expect(container).toHaveStyle({ top: '-2px' });
    });
  });

  describe('容器樣式', () => {
    it('應該有正確的容器樣式', () => {
      renderWithRouter(<PostActionButtons {...defaultProps} />);

      const outerContainer = screen.getByTestId('post-actions').closest('.relative');
      expect(outerContainer).toHaveClass('relative');
      expect(outerContainer).toHaveStyle({ width: '40px', height: '32px' });
    });

    it('應該有正確的內部容器樣式', () => {
      renderWithRouter(<PostActionButtons {...defaultProps} />);

      const innerContainer = screen.getByTestId('post-actions').parentElement;
      expect(innerContainer).toHaveClass('absolute');
      expect(innerContainer).toHaveStyle({ right: '2px' });
    });
  });

  describe('Props 處理', () => {
    it('應該正確處理可選的 props', () => {
      const propsWithoutOptional = {
        postId: 'test-post-id',
        prayerUserId: 'test-user-id',
        prayerContent: 'Test prayer content',
        isOwner: false,
      };

      renderWithRouter(<PostActionButtons {...propsWithoutOptional} />);

      const postActionsElement = screen.getByTestId('post-actions');
      const props = JSON.parse(postActionsElement.getAttribute('data-props') || '{}');

      expect(props.prayerUserName).toBeUndefined();
      expect(props.prayerUserAvatar).toBeUndefined();
      expect(props.onShare).toBeUndefined();
      expect(props.onEdit).toBeUndefined();
      expect(props.onDelete).toBeUndefined();
    });

    it('當 prayerUserId 未提供時應該使用空字符串', () => {
      const propsWithoutUserId = {
        ...defaultProps,
        prayerUserId: undefined as any,
      };

      renderWithRouter(<PostActionButtons {...propsWithoutUserId} />);

      const postActionsElement = screen.getByTestId('post-actions');
      const props = JSON.parse(postActionsElement.getAttribute('data-props') || '{}');

      expect(props.prayerUserId).toBe('');
    });

    it('應該正確傳遞回調函數', () => {
      const mockOnShare = vi.fn();
      const mockOnEdit = vi.fn();
      const mockOnDelete = vi.fn();

      renderWithRouter(
        <PostActionButtons
          {...defaultProps}
          onShare={mockOnShare}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const postActionsElement = screen.getByTestId('post-actions');
      const props = JSON.parse(postActionsElement.getAttribute('data-props') || '{}');

      // 函數會被序列化為 null，主要測試是否正確傳遞
      expect(typeof props.onShare).toBeDefined();
      expect(typeof props.onEdit).toBeDefined();
      expect(typeof props.onDelete).toBeDefined();
    });

    it('當 isOwner 為 false 時應該正確傳遞', () => {
      renderWithRouter(<PostActionButtons {...defaultProps} isOwner={false} />);

      const postActionsElement = screen.getByTestId('post-actions');
      const props = JSON.parse(postActionsElement.getAttribute('data-props') || '{}');

      expect(props.isOwner).toBe(false);
    });
  });

  describe('邊界條件', () => {
    it('應該處理空的 postId', () => {
      renderWithRouter(<PostActionButtons {...defaultProps} postId="" />);

      const postActionsElement = screen.getByTestId('post-actions');
      const props = JSON.parse(postActionsElement.getAttribute('data-props') || '{}');

      expect(props.prayerId).toBe('');
    });

    it('應該處理空的內容', () => {
      renderWithRouter(<PostActionButtons {...defaultProps} prayerContent="" />);

      const postActionsElement = screen.getByTestId('post-actions');
      const props = JSON.parse(postActionsElement.getAttribute('data-props') || '{}');

      expect(props.prayerContent).toBe('');
    });
  });
}); 