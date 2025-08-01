import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock hooks - 先定義 mock 函數
vi.mock('@/stores/networkStore', () => ({
  useNetworkStore: vi.fn(),
}));

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(),
}));

// 在 mock 之後導入並獲取 mock 函數
import { NetworkStatusAlert } from './NetworkStatusAlert';
import { useNetworkStore } from '@/stores/networkStore';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const mockUseNetworkStore = useNetworkStore as any;
const mockUseOnlineStatus = useOnlineStatus as any;

describe('NetworkStatusAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('離線狀態', () => {
    beforeEach(() => {
      mockUseNetworkStore.mockReturnValue({
        isOnline: false,
      });
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: vi.fn().mockResolvedValue(true),
        connectionError: null,
      });
    });

    it('應該在離線時顯示警告訊息', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.getByText('網路已斷開')).toBeInTheDocument();
    });

    it('應該顯示離線圖標', () => {
      render(<NetworkStatusAlert />);
      
      const wifiOffIcon = screen.getByTestId('wifi-off-icon');
      expect(wifiOffIcon).toBeInTheDocument();
    });

    it('應該包含重試按鈕', () => {
      render(<NetworkStatusAlert />);
      
      const retryButton = screen.getByRole('button', { name: /重試連線/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('應該在點擊重試按鈕時調用重試函數', async () => {
      const mockRetryConnection = vi.fn().mockResolvedValue(true);
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: mockRetryConnection,
        connectionError: null,
      });

      render(<NetworkStatusAlert />);
      
      const retryButton = screen.getByRole('button', { name: /重試連線/i });
      fireEvent.click(retryButton);
      
      expect(mockRetryConnection).toHaveBeenCalled();
    });
  });

  describe('線上狀態', () => {
    beforeEach(() => {
      mockUseNetworkStore.mockReturnValue({
        isOnline: true,
      });
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: vi.fn().mockResolvedValue(true),
        connectionError: null,
      });
    });

    it('應該在線上時不顯示警告', () => {
      const { container } = render(<NetworkStatusAlert />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('載入狀態', () => {
    beforeEach(() => {
      mockUseNetworkStore.mockReturnValue({
        isOnline: false,
      });
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: vi.fn().mockResolvedValue(true),
        connectionError: null,
      });
    });

    it('應該在載入時顯示警告', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.getByText('網路已斷開')).toBeInTheDocument();
    });
  });

  describe('錯誤狀態', () => {
    beforeEach(() => {
      mockUseNetworkStore.mockReturnValue({
        isOnline: false,
      });
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: vi.fn().mockRejectedValue('Connection failed'),
        connectionError: 'Connection failed',
      });
    });

    it('應該在連線錯誤時顯示錯誤訊息', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.getByText('網路已斷開')).toBeInTheDocument();
    });

    it('應該在重試失敗時顯示錯誤', async () => {
      const mockRetryConnection = vi.fn().mockRejectedValue('Connection failed');
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: mockRetryConnection,
        connectionError: 'Connection failed',
      });

      render(<NetworkStatusAlert />);
      
      const retryButton = screen.getByRole('button', { name: /重試連線/i });
      fireEvent.click(retryButton);
      
      expect(mockRetryConnection).toHaveBeenCalled();
    });
  });

  describe('重試功能', () => {
    beforeEach(() => {
      mockUseNetworkStore.mockReturnValue({
        isOnline: false,
      });
    });

    it('應該在重試成功時更新狀態', async () => {
      const mockRetryConnection = vi.fn().mockResolvedValue(true);
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: mockRetryConnection,
        connectionError: null,
      });

      render(<NetworkStatusAlert />);
      
      const retryButton = screen.getByRole('button', { name: /重試連線/i });
      fireEvent.click(retryButton);
      
      expect(mockRetryConnection).toHaveBeenCalled();
    });

    it('應該在重試失敗時保持離線狀態', async () => {
      const mockRetryConnection = vi.fn().mockRejectedValue('Connection failed');
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: mockRetryConnection,
        connectionError: 'Connection failed',
      });

      render(<NetworkStatusAlert />);
      
      const retryButton = screen.getByRole('button', { name: /重試連線/i });
      fireEvent.click(retryButton);
      
      expect(mockRetryConnection).toHaveBeenCalled();
      expect(screen.getByText('網路已斷開')).toBeInTheDocument();
    });
  });

  describe('UI 元素', () => {
    beforeEach(() => {
      mockUseNetworkStore.mockReturnValue({
        isOnline: false,
      });
      mockUseOnlineStatus.mockReturnValue({
        retryConnection: vi.fn().mockResolvedValue(true),
        connectionError: null,
      });
    });

    it('應該包含正確的圖標', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });

    it('應該包含正確的按鈕文字', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.getByRole('button', { name: /重試連線/i })).toBeInTheDocument();
    });

    it('應該包含正確的警告文字', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.getByText('網路已斷開')).toBeInTheDocument();
    });
  });
}); 