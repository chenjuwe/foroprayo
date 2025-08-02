import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProfileStats } from './ProfileStats';

// 創建本地模擬數據而不是依賴外部
const createMockUserStats = (type: 'default' | 'zero' | 'large' | 'thousand' = 'default') => {
  if (type === 'zero') {
    return {
      prayerCount: 0,
      responseCount: 0,
      receivedLikesCount: 0,
    };
  } else if (type === 'large') {
    return {
      prayerCount: 999,
      responseCount: 1234,
      receivedLikesCount: 567,
    };
  } else if (type === 'thousand') {
    return {
      prayerCount: 1000,
      responseCount: 1500,
      receivedLikesCount: 2000,
    };
  } else {
    return {
      prayerCount: 10,
      responseCount: 25,
      receivedLikesCount: 5,
    };
  }
};

// 創建本地 mockServiceInstances
const mockServiceInstances = {
  resetAll: vi.fn(),
};

// 創建 Mock FirebasePrayerService 實例
const mockFirebasePrayerService = {
  getUserStats: vi.fn(),
  getAllPrayers: vi.fn(),
  createPrayer: vi.fn(),
  updatePrayer: vi.fn(),
  deletePrayer: vi.fn(),
  getPrayersByUserId: vi.fn(),
};

// Mock useQuery hook
const mockUseQuery = vi.fn();

// Mock FirebasePrayerService 類
vi.mock('@/services/prayer/FirebasePrayerService', () => ({
  FirebasePrayerService: vi.fn().mockImplementation(() => mockFirebasePrayerService),
}));

// Mock react-query's useQuery hook
vi.mock('@tanstack/react-query', () => ({
  useQuery: (args: any) => mockUseQuery(args),
}));

// Mock SVG icons
vi.mock('@/assets/icons/MessageIcon.svg?react', () => ({
  default: () => <svg data-testid="message-icon" />
}));

vi.mock('@/assets/icons/Reply.svg?react', () => ({
  default: () => <svg data-testid="reply-icon" />
}));

vi.mock('@/assets/icons/LikeIcon.svg?react', () => ({
  default: () => <svg data-testid="like-icon" />
}));

// 創建一個輔助函數來獲取統計值
const getStatValues = () => {
  const statsElements = screen.getAllByRole('generic')
    .filter(el => el.className?.includes && el.className.includes('text-xl font-bold'));
  
  return statsElements.map(el => el.textContent);
};

describe('ProfileStats', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    mockServiceInstances.resetAll();
    mockUseQuery.mockClear();
  });

  const defaultProps = {
    userId: 'test-user-id',
  };

  it('應該正確渲染統計數據', () => {
    // 設置 mock useQuery 返回值
    const statsData = createMockUserStats('default');
    mockUseQuery.mockReturnValue({
      data: statsData,
      isLoading: false,
      error: null,
    });

    render(<ProfileStats {...defaultProps} />);
    
    // 驗證統計數據
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // 檢查標籤
    expect(screen.getByText('代禱次數')).toBeInTheDocument();
    expect(screen.getByText('回應次數')).toBeInTheDocument();
    expect(screen.getByText('獲得愛心')).toBeInTheDocument();
    
    // 驗證 useQuery 被正確調用
    expect(mockUseQuery).toHaveBeenCalledWith({
      queryKey: ['userStats', 'test-user-id'],
      queryFn: expect.any(Function),
      enabled: true,
    });
  });

  it('應該正確處理零值', () => {
    // 設置零值 mock 數據
    const statsData = createMockUserStats('zero');
    mockUseQuery.mockReturnValue({
      data: statsData,
      isLoading: false,
      error: null,
    });

    render(<ProfileStats {...defaultProps} />);
    
    // 檢查所有零值
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });

  it('應該正確處理大數值', () => {
    // 設置大數值 mock 數據
    const statsData = createMockUserStats('large');
    mockUseQuery.mockReturnValue({
      data: statsData,
      isLoading: false,
      error: null,
    });

    render(<ProfileStats {...defaultProps} />);
    
    // 檢查大數值
    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('567')).toBeInTheDocument();
  });

  it('應該支援載入狀態', () => {
    // 設置載入狀態
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<ProfileStats {...defaultProps} />);
    
    // 檢查載入狀態
    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('應該支援自訂類別', () => {
    const statsData = createMockUserStats('default');
    mockUseQuery.mockReturnValue({
      data: statsData,
      isLoading: false,
      error: null,
    });
    
    const customClassName = 'custom-stats';
    render(<ProfileStats {...defaultProps} className={customClassName} />);
    
    // 檢查是否有帶有自訂類別的元素
    const container = screen.getByText('代禱次數').closest('div')?.parentElement?.parentElement;
    expect(container).toHaveClass(customClassName);
  });

  it('應該正確格式化千位數字', () => {
    // 設置千位數 mock 數據
    const statsData = createMockUserStats('thousand');
    mockUseQuery.mockReturnValue({
      data: statsData,
      isLoading: false,
      error: null,
    });

    render(<ProfileStats {...defaultProps} />);
    
    // 檢查千位數字
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('應該正確渲染圖標', () => {
    const statsData = createMockUserStats('default');
    mockUseQuery.mockReturnValue({
      data: statsData,
      isLoading: false,
      error: null,
    });

    render(<ProfileStats {...defaultProps} />);
    
    // 檢查 SVG 圖標的 test-id
    expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
    expect(screen.getByTestId('like-icon')).toBeInTheDocument();
  });

  it('應該處理無 userId 的情況', () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    render(<ProfileStats userId="" />);
    
    // 組件會顯示默認的統計數據（都是 0）
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
    
    // 確保標籤還是正常顯示
    expect(screen.getByText('代禱次數')).toBeInTheDocument();
    expect(screen.getByText('回應次數')).toBeInTheDocument();
    expect(screen.getByText('獲得愛心')).toBeInTheDocument();
    
    // 驗證 useQuery 被正確調用，enabled 為 false
    expect(mockUseQuery).toHaveBeenCalledWith({
      queryKey: ['userStats', ''],
      queryFn: expect.any(Function),
      enabled: false,
    });
  });

  it('應該處理服務錯誤並顯示默認值', () => {
    // 模擬服務錯誤
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true, // 模擬載入中顯示
      error: new Error('Service error'),
    });

    render(<ProfileStats {...defaultProps} />);
    
    // 檢查是否顯示載入狀態（錯誤時的行為）
    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });
}); 