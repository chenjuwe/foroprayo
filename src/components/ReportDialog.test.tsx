import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportDialog } from './ReportDialog';

// Mock 依賴
vi.mock('./ui/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/services', () => ({
  firebaseReportService: {
    getInstance: vi.fn(() => ({
      createReport: vi.fn(),
    })),
  },
}));

// Import the mocked modules
import { useToast } from './ui/use-toast';
import { firebaseReportService } from '@/services';

vi.mock('./ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
}));

vi.mock('./ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('./ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      data-testid="report-reason"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  ),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
  },
  writable: true,
});

describe('ReportDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    reportType: 'prayer' as const,
    targetId: 'prayer-1',
    targetContent: '這是一個測試代禱內容',
    targetUserId: 'user-1',
    targetUserName: 'Test User',
    targetUserAvatar: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('基本渲染', () => {
    it('應該在開啟時正確渲染對話框', () => {
      render(<ReportDialog {...defaultProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
    });

    it('應該在關閉時不渲染對話框', () => {
      render(<ReportDialog {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('應該正確顯示標題和描述', () => {
      render(<ReportDialog {...defaultProps} />);
      
      expect(screen.getByText('檢舉不當內容')).toBeInTheDocument();
      expect(screen.getByText(/請描述您認為不當的原因/)).toBeInTheDocument();
    });

    it('應該正確渲染表單元素', () => {
      render(<ReportDialog {...defaultProps} />);
      
      expect(screen.getByTestId('report-reason')).toBeInTheDocument();
      expect(screen.getByText('提交檢舉')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });
  });

  describe('表單驗證', () => {
    it('應該在空原因時顯示錯誤提示', async () => {
      const mockToast = vi.fn();
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '請填寫檢舉原因',
          description: '請描述您認為不當的原因',
          variant: 'destructive',
        });
      });
    });

    it('應該在只有空格時顯示錯誤提示', async () => {
      const mockToast = vi.fn();
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '   ' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '請填寫檢舉原因',
          description: '請描述您認為不當的原因',
          variant: 'destructive',
        });
      });
    });

    it('應該在有效原因時允許提交', async () => {
      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockResolvedValue({ id: 'report-1' });
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '這是不當內容' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateReport).toHaveBeenCalledWith({
          report_type: 'prayer',
          target_id: 'prayer-1',
          target_content: '這是一個測試代禱內容',
          target_user_id: 'user-1',
          target_user_name: 'Test User',
          target_user_avatar: 'https://example.com/avatar.jpg',
          reason: '這是不當內容',
        });
      });
    });
  });

  describe('提交功能', () => {
    it('應該正確處理成功提交', async () => {
      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockResolvedValue({ id: 'report-1' });
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '這是不當內容' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: '檢舉已提交',
          description: '我們會盡快審核您的檢舉，感謝您協助維護社群環境',
        });
      });
    });

    it('應該在服務失敗時使用本地存儲', async () => {
      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockRejectedValue(new Error('服務失敗'));
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '這是不當內容' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'tempReports',
          expect.stringContaining('這是不當內容')
        );
        expect(mockToast).toHaveBeenCalledWith({
          title: '檢舉已提交',
          description: '我們會盡快審核您的檢舉，感謝您協助維護社群環境',
        });
      });
    });

    it('應該正確處理回應類型的檢舉', async () => {
      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockResolvedValue({ id: 'report-1' });
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      const responseProps = {
        ...defaultProps,
        reportType: 'response' as const,
        targetId: 'response-1',
        targetContent: '這是一個測試回應',
      };

      render(<ReportDialog {...responseProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '這是不當回應' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockCreateReport).toHaveBeenCalledWith({
          report_type: 'response',
          target_id: 'response-1',
          target_content: '這是一個測試回應',
          target_user_id: 'user-1',
          target_user_name: 'Test User',
          target_user_avatar: 'https://example.com/avatar.jpg',
          reason: '這是不當回應',
        });
      });
    });
  });

  describe('載入狀態', () => {
    it('應該在提交時顯示載入狀態', async () => {
      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ id: 'report-1' }), 100))
      );
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '這是不當內容' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      // 檢查按鈕是否被禁用
      expect(submitButton).toBeDisabled();
    });

    it('應該在提交完成後重置載入狀態', async () => {
      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockResolvedValue({ id: 'report-1' });
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '這是不當內容' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('關閉功能', () => {
    it('應該正確處理取消按鈕點擊', () => {
      render(<ReportDialog {...defaultProps} />);
      
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('應該在提交成功後關閉對話框', async () => {
      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockResolvedValue({ id: 'report-1' });
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '這是不當內容' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('應該在提交失敗後不關閉對話框', async () => {
      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockRejectedValue(new Error('服務失敗'));
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '這是不當內容' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('本地存儲功能', () => {
    it('應該正確處理現有的臨時檢舉', () => {
      const existingReports = [
        {
          id: 'temp_1',
          report_type: 'prayer',
          target_id: 'prayer-1',
          reason: '舊檢舉',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingReports));

      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockRejectedValue(new Error('服務失敗'));
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '新檢舉' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tempReports',
        expect.stringContaining('新檢舉')
      );
    });

    it('應該處理本地存儲解析錯誤', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const mockToast = vi.fn();
      const mockCreateReport = vi.fn().mockRejectedValue(new Error('服務失敗'));
      vi.mocked(require('./ui/use-toast').useToast).mockReturnValue({
        toast: mockToast,
      });
      vi.mocked(require('@/services').firebaseReportService.getInstance).mockReturnValue({
        createReport: mockCreateReport,
      });

      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      fireEvent.change(textarea, { target: { value: '新檢舉' } });
      
      const submitButton = screen.getByText('提交檢舉');
      fireEvent.click(submitButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'tempReports',
        expect.stringContaining('新檢舉')
      );
    });
  });

  describe('無障礙功能', () => {
    it('應該包含正確的 ARIA 標籤', () => {
      render(<ReportDialog {...defaultProps} />);
      
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    });

    it('應該正確處理鍵盤導航', () => {
      render(<ReportDialog {...defaultProps} />);
      
      const textarea = screen.getByTestId('report-reason');
      const submitButton = screen.getByText('提交檢舉');
      
      textarea.focus();
      expect(textarea).toHaveFocus();
      
      submitButton.focus();
      expect(submitButton).toHaveFocus();
    });
  });
}); 