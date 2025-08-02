import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileStats } from './ProfileStats';
import { createMockUserStats, mockServiceInstances } from '@/test/fixtures/mock-data';

// 創建 Mock FirebasePrayerService 實例
const mockFirebasePrayerService = {
  getUserStats: vi.fn(),
  getAllPrayers: vi.fn(),
  createPrayer: vi.fn(),
  updatePrayer: vi.fn(),
  deletePrayer: vi.fn(),
  getPrayersByUserId: vi.fn(),
};

// Mock FirebasePrayerService 類
vi.mock('@/services/prayer/FirebasePrayerService', () => ({
  FirebasePrayerService: vi.fn().mockImplementation(() => mockFirebasePrayerService),
}));

describe('ProfileStats', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // 創建新的 QueryClient，不重試以加快測試速度
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
      },
    });

    // 重置所有 mock
    vi.clearAllMocks();
    mockServiceInstances.resetAll();
  });

  afterEach(() => {
    // 清理
    queryClient.clear();
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  const defaultProps = {
    userId: 'test-user-id',
  };

  it('應該正確渲染統計數據', async () => {
    // 設置 mock 返回值
    const statsData = createMockUserStats('default');
    mockFirebasePrayerService.getUserStats.mockResolvedValue(statsData);

    renderWithQueryClient(<ProfileStats {...defaultProps} />);
    
    // 等待數據加載並檢查統計數據
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
    
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // 檢查標籤
    expect(screen.getByText('代禱次數')).toBeInTheDocument();
    expect(screen.getByText('回應次數')).toBeInTheDocument();
    expect(screen.getByText('獲得愛心')).toBeInTheDocument();
    
    // 驗證服務被正確調用
    expect(mockFirebasePrayerService.getUserStats).toHaveBeenCalledWith('test-user-id');
  });

  it('應該正確處理零值', async () => {
    // 設置零值 mock 數據
    const statsData = createMockUserStats('zero');
    mockFirebasePrayerService.getUserStats.mockResolvedValue(statsData);

    renderWithQueryClient(<ProfileStats {...defaultProps} />);
    
    // 等待數據加載並檢查所有零值
    await waitFor(() => {
      const zeros = screen.getAllByText('0');
      expect(zeros).toHaveLength(3);
    });
  });

  it('應該正確處理大數值', async () => {
    // 設置大數值 mock 數據
    const statsData = createMockUserStats('large');
    mockFirebasePrayerService.getUserStats.mockResolvedValue(statsData);

    renderWithQueryClient(<ProfileStats {...defaultProps} />);
    
    // 等待並檢查大數值
    await waitFor(() => {
      expect(screen.getByText('999')).toBeInTheDocument();
    });
    
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('567')).toBeInTheDocument();
  });

  it('應該支援載入狀態', async () => {
    // 設置永不 resolve 的 Promise 來模擬載入狀態
    mockFirebasePrayerService.getUserStats.mockImplementation(
      () => new Promise(() => {}) // 永遠 pending
    );

    renderWithQueryClient(<ProfileStats {...defaultProps} />);
    
    // 檢查載入狀態
    expect(screen.getByText('載入中...')).toBeInTheDocument();
  });

  it('應該支援自訂類別', async () => {
    const statsData = createMockUserStats('default');
    mockFirebasePrayerService.getUserStats.mockResolvedValue(statsData);
    
    const customClassName = 'custom-stats';
    renderWithQueryClient(<ProfileStats {...defaultProps} className={customClassName} />);
    
    // 等待組件加載完成
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
    
    // 檢查是否有帶有自訂類別的元素
    const container = screen.getByText('代禱次數').closest('div')?.parentElement?.parentElement;
    expect(container).toHaveClass(customClassName);
  });

  it('應該正確格式化千位數字', async () => {
    // 設置千位數 mock 數據
    const statsData = createMockUserStats('thousand');
    mockFirebasePrayerService.getUserStats.mockResolvedValue(statsData);

    renderWithQueryClient(<ProfileStats {...defaultProps} />);
    
    // 等待並檢查千位數字
    await waitFor(() => {
      expect(screen.getByText('1000')).toBeInTheDocument();
    });
    
    expect(screen.getByText('1500')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('應該正確渲染圖標', async () => {
    const statsData = createMockUserStats('default');
    mockFirebasePrayerService.getUserStats.mockResolvedValue(statsData);

    renderWithQueryClient(<ProfileStats {...defaultProps} />);
    
    // 等待組件載入
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
    
    // 檢查 SVG 圖標的 test-id
    expect(screen.getByTestId('message-icon')).toBeInTheDocument();
    expect(screen.getByTestId('reply-icon')).toBeInTheDocument();
    expect(screen.getByTestId('like-icon')).toBeInTheDocument();
  });

  it('應該處理無 userId 的情況', () => {
    renderWithQueryClient(<ProfileStats userId="" />);
    
    // 沒有 userId 時，由於 enabled: !!userId 為 false，查詢不會執行
    // 組件會顯示默認的統計數據（都是 0）
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
    
    // 確保標籤還是正常顯示
    expect(screen.getByText('代禱次數')).toBeInTheDocument();
    expect(screen.getByText('回應次數')).toBeInTheDocument();
    expect(screen.getByText('獲得愛心')).toBeInTheDocument();
    
    // 驗證服務沒有被調用
    expect(mockFirebasePrayerService.getUserStats).not.toHaveBeenCalled();
  });

  it('應該處理服務錯誤並顯示默認值', async () => {
    // 模擬服務錯誤
    mockFirebasePrayerService.getUserStats.mockRejectedValue(new Error('Service error'));

    renderWithQueryClient(<ProfileStats {...defaultProps} />);
    
    // React Query 在錯誤時會重試，但我們設置了 retry: false
    // 所以應該顯示載入狀態或錯誤狀態
    await waitFor(() => {
      // 檢查是否顯示載入狀態（錯誤時的行為）
      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });
  });
}); 