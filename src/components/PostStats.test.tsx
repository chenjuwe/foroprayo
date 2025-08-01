import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostStats } from './PostStats';

// Mock the SVG import
vi.mock('../assets/icons/Reply.svg?react', () => ({
  default: ({ style }: any) => (
    <div data-testid="reply-icon" style={style}>
      Reply Icon
    </div>
  ),
}));

// Mock react-router-dom
const mockUseLocation = vi.fn();
vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
}));

describe('PostStats', () => {
  const defaultProps = {
    prayerId: 'test-prayer-id',
    currentUserId: 'test-user-id',
    responseCount: 5,
    onResponseClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ pathname: '/prayers' });
  });

  it('應該正確渲染組件', () => {
    render(<PostStats {...defaultProps} />);

    expect(screen.getByText('5')).toBeInTheDocument(); // response count
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
  });

  it('當沒有回應時不應該顯示回應數字', () => {
    render(<PostStats {...defaultProps} responseCount={0} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
  });

  it('點擊回應圖標應該調用 onResponseClick', () => {
    const mockOnResponseClick = vi.fn();
    render(
      <PostStats 
        {...defaultProps} 
        onResponseClick={mockOnResponseClick}
      />
    );

    const replyIcon = screen.getByTestId('reply-icon');
    fireEvent.click(replyIcon.parentElement!);

    expect(mockOnResponseClick).toHaveBeenCalledTimes(1);
  });

  it('點擊愛心圖標應該觸發 handleLikeClick', () => {
    const logSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    
    render(<PostStats {...defaultProps} />);

    const heartIcon = screen.getByRole('button', { hidden: true });
    fireEvent.click(heartIcon);

    // 由於功能被暫時禁用，應該記錄調試信息
    expect(logSpy).toHaveBeenCalled();
    
    logSpy.mockRestore();
  });

  it('應該正確應用自定義樣式和類名', () => {
    const customStyle = { backgroundColor: 'red' };
    const customClassName = 'custom-class';

    render(
      <PostStats 
        {...defaultProps} 
        style={customStyle}
        className={customClassName}
      />
    );

    const container = screen.getByText('5').closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveStyle({ backgroundColor: 'red' });
  });

  it('應該正確應用自定義圖標大小', () => {
    render(
      <PostStats 
        {...defaultProps} 
        heartIconSize={20}
        replyIconSize={18}
      />
    );

    const replyIcon = screen.getByTestId('reply-icon');
    expect(replyIcon).toHaveStyle({ width: '18px', height: '18px' });

    const heartIcon = screen.getByRole('img', { hidden: true });
    expect(heartIcon).toHaveAttribute('width', '20');
    expect(heartIcon).toHaveAttribute('height', '20');
  });

  it('應該正確應用自定義間距', () => {
    render(
      <PostStats 
        {...defaultProps} 
        gap={8}
      />
    );

    const container = screen.getByText('5').closest('div')?.parentElement;
    expect(container).toHaveStyle({ gap: '8px' });
  });

  it('當回應數量大於 0 時，回應圖標應該是綠色', () => {
    render(<PostStats {...defaultProps} responseCount={3} />);

    const replyIcon = screen.getByTestId('reply-icon');
    expect(replyIcon).toHaveStyle({ color: '#16a34a' });
  });

  it('當沒有回應時，回應圖標應該是灰色', () => {
    render(<PostStats {...defaultProps} responseCount={0} />);

    const replyIcon = screen.getByTestId('reply-icon');
    expect(replyIcon).toHaveStyle({ color: '#D0D0D0' });
  });

  it('愛心圖標應該是灰色（因為功能被禁用）', () => {
    render(<PostStats {...defaultProps} />);

    const heartIcon = screen.getByRole('img', { hidden: true });
    expect(heartIcon).toHaveAttribute('fill', '#D0D0D0');
    expect(heartIcon).toHaveAttribute('stroke', '#D0D0D0');
  });

  it('當沒有 onResponseClick 時點擊回應不應該報錯', () => {
    const propsWithoutCallback = {
      prayerId: defaultProps.prayerId,
      currentUserId: defaultProps.currentUserId,
      responseCount: defaultProps.responseCount,
    };
    
    render(<PostStats {...propsWithoutCallback} />);

    const replyIcon = screen.getByTestId('reply-icon');
    
    expect(() => {
      fireEvent.click(replyIcon.parentElement!);
    }).not.toThrow();
  });

  it('事件應該停止冒泡', () => {
    const mockContainerClick = vi.fn();
    const mockResponseClick = vi.fn();

    const { container } = render(
      <div onClick={mockContainerClick}>
        <PostStats 
          {...defaultProps} 
          onResponseClick={mockResponseClick}
        />
      </div>
    );

    const replyIcon = screen.getByTestId('reply-icon');
    fireEvent.click(replyIcon.parentElement!);

    expect(mockResponseClick).toHaveBeenCalledTimes(1);
    expect(mockContainerClick).not.toHaveBeenCalled();
  });

  it('在不同路由下應該正確設置路徑相關變數', () => {
    // 測試 prayers 頁面
    mockUseLocation.mockReturnValue({ pathname: '/prayers' });
    const { rerender } = render(<PostStats {...defaultProps} />);
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();

    // 測試 log 頁面
    mockUseLocation.mockReturnValue({ pathname: '/log' });
    rerender(<PostStats {...defaultProps} />);
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();

    // 測試其他頁面
    mockUseLocation.mockReturnValue({ pathname: '/other' });
    rerender(<PostStats {...defaultProps} />);
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
  });

  it('應該正確處理大數字的回應數量', () => {
    render(<PostStats {...defaultProps} responseCount={999} />);

    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('當 currentUserId 為 null 時應該正常工作', () => {
    render(<PostStats {...defaultProps} currentUserId={null} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
  });
}); 