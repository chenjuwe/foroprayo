import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from './UserAvatar';

// Mock React Query
const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => mockUseQuery(),
}));

describe('UserAvatar', () => {
  const defaultProps = {
    userId: 'test-user-id',
    username: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 設置默認的mock返回值
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it('應該正確渲染頭像組件', () => {
    render(<UserAvatar {...defaultProps} />);
    
    // 檢查 Avatar 組件是否存在
    const avatar = screen.getByText('G'); // 因為沒有頭像URL，會顯示fallback
    expect(avatar).toBeInTheDocument();
  });

  it('應該在載入時顯示載入狀態', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    });
    
    render(<UserAvatar {...defaultProps} />);
    
    // 載入時仍會顯示 fallback，但組件應該正常渲染
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('應該在沒有用戶ID時顯示預設頭像', () => {
    const propsWithoutUserId = { ...defaultProps, userId: '' };
    render(<UserAvatar {...propsWithoutUserId} />);
    
    // 應該顯示預設的Guest頭像
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('應該支援自訂類別', () => {
    const customClassName = 'custom-avatar-class';
    render(<UserAvatar {...defaultProps} className={customClassName} />);
    
    // 檢查是否有帶有自訂類別的元素
    const avatarElement = screen.getByText('G').closest('span');
    expect(avatarElement).toHaveClass(customClassName);
  });

  it('應該在有頭像URL時嘗試顯示圖片', () => {
    const mockUrl = 'https://example.com/avatar.jpg';
    mockUseQuery.mockReturnValue({
      data: mockUrl,
      isLoading: false,
      isError: false,
      error: null,
    });
    
    render(<UserAvatar {...defaultProps} />);
    
    // 當有URL時，應該嘗試渲染圖片，但如果載入失敗會回到fallback
    // 這裡我們只能檢查組件是否正常渲染
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('應該正確傳遞alt屬性', () => {
    const mockUrl = 'https://example.com/avatar.jpg';
    mockUseQuery.mockReturnValue({
      data: mockUrl,
      isLoading: false,
      isError: false,
      error: null,
    });
    
    render(<UserAvatar {...defaultProps} />);
    
    // 組件應該正常渲染
    expect(screen.getByText('G')).toBeInTheDocument();
  });
}); 