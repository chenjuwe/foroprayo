import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NetworkStatusAlert } from './NetworkStatusAlert';

// Mock useOnlineStatus hook
const mockUseOnlineStatus = vi.fn();

vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('NetworkStatusAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('離線狀態', () => {
    beforeEach(() => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        isOffline: true,
      });
    });

    it('應該在離線時顯示警告訊息', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.getByText('網路連線異常')).toBeInTheDocument();
      expect(screen.getByText('請檢查網路設定')).toBeInTheDocument();
    });

    it('應該顯示離線圖標', () => {
      render(<NetworkStatusAlert />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200');
    });

    it('應該包含重試按鈕', () => {
      render(<NetworkStatusAlert />);
      
      const retryButton = screen.getByRole('button', { name: /重試/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('應該在點擊重試按鈕時重新載入頁面', () => {
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      render(<NetworkStatusAlert />);
      
      const retryButton = screen.getByRole('button', { name: /重試/i });
      fireEvent.click(retryButton);
      
      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('線上狀態', () => {
    beforeEach(() => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        isOffline: false,
      });
    });

    it('應該在線上時不顯示警告', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.queryByText('網路連線異常')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    beforeEach(() => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: undefined,
        isOffline: undefined,
      });
    });

    it('應該在載入時不顯示警告', () => {
      render(<NetworkStatusAlert />);
      
      expect(screen.queryByText('網路連線異常')).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('動畫效果', () => {
    beforeEach(() => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        isOffline: true,
      });
    });

    it('應該包含正確的動畫類別', () => {
      render(<NetworkStatusAlert />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('animate-in', 'slide-in-from-top-2');
    });
  });

  describe('無障礙功能', () => {
    beforeEach(() => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        isOffline: true,
      });
    });

    it('應該有正確的 ARIA 標籤', () => {
      render(<NetworkStatusAlert />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('重試按鈕應該有正確的標籤', () => {
      render(<NetworkStatusAlert />);
      
      const retryButton = screen.getByRole('button', { name: /重試/i });
      expect(retryButton).toHaveAttribute('aria-label', '重試連線');
    });
  });

  describe('樣式測試', () => {
    beforeEach(() => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        isOffline: true,
      });
    });

    it('應該有正確的警告樣式', () => {
      render(<NetworkStatusAlert />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass(
        'bg-yellow-50',
        'border-yellow-200',
        'text-yellow-800',
        'rounded-lg',
        'border',
        'p-4'
      );
    });

    it('圖標應該有正確的樣式', () => {
      render(<NetworkStatusAlert />);
      
      const icon = screen.getByTestId('network-icon');
      expect(icon).toHaveClass('h-5', 'w-5', 'text-yellow-400');
    });

    it('文字應該有正確的樣式', () => {
      render(<NetworkStatusAlert />);
      
      const title = screen.getByText('網路連線異常');
      expect(title).toHaveClass('font-medium');
    });
  });

  describe('響應式設計', () => {
    beforeEach(() => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        isOffline: true,
      });
    });

    it('應該在小螢幕上正確顯示', () => {
      // 模擬小螢幕
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      });

      render(<NetworkStatusAlert />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('應該在大螢幕上正確顯示', () => {
      // 模擬大螢幕
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        writable: true,
      });

      render(<NetworkStatusAlert />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });
}); 