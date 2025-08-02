import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportDialog } from './ReportDialog';

// Mock 依賴
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn().mockReturnValue({
    toast: vi.fn().mockReturnValue({
      id: 'test-toast-id',
      dismiss: vi.fn(),
      update: vi.fn(),
    }),
    dismiss: vi.fn(),
    toasts: [],
  }),
}));

vi.mock('@/services', () => ({
  firebaseReportService: {
    getInstance: vi.fn(() => ({
      createReport: vi.fn().mockResolvedValue(true),
    })),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn((key) => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
  },
  writable: true,
});

// Import the mocked modules
import { useToast } from '@/hooks/use-toast';
import { firebaseReportService } from '@/services';

describe('ReportDialog', () => {
  const mockOnClose = vi.fn();
  const mockToast = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重設 localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    
    // 為每個測試重設模擬
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: [],
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // 標準測試屬性
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    reportType: 'prayer' as const,
    targetId: 'test-prayer-id',
    targetContent: '這是測試的禱告內容',
  };

  it('renders the dialog correctly', () => {
    render(<ReportDialog {...defaultProps} />);

    // 驗證標題和內容
    expect(screen.getByText('檢舉不當發言')).toBeInTheDocument();
    expect(screen.getByText(/請描述您認為此代禱不當的原因/)).toBeInTheDocument();
    
    // 驗證目標內容顯示
    expect(screen.getByText('這是測試的禱告內容')).toBeInTheDocument();
    
    // 驗證按鈕
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交檢舉' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交檢舉' })).toBeDisabled(); // 初始時應該禁用
  });

  it('enables submit button when reason is entered', () => {
    render(<ReportDialog {...defaultProps} />);

    // 初始按鈕應該是禁用的
    const submitButton = screen.getByRole('button', { name: '提交檢舉' });
    expect(submitButton).toBeDisabled();
    
    // 輸入檢舉原因
    const textarea = screen.getByLabelText('檢舉原因 *');
    fireEvent.change(textarea, { target: { value: '這是不當內容' } });
    
    // 按鈕現在應該是啟用的
    expect(submitButton).not.toBeDisabled();
  });

  it('calls createReport with correct parameters when form is submitted', () => {
    // 設置模擬
    const mockCreateReport = vi.fn().mockResolvedValue({ id: 'report-1' });
    vi.mocked(firebaseReportService.getInstance).mockReturnValue({
      createReport: mockCreateReport
    } as any);

    render(<ReportDialog {...defaultProps} />);

    // 輸入檢舉原因
    const textarea = screen.getByLabelText('檢舉原因 *');
    fireEvent.change(textarea, { target: { value: '這是不當內容' } });
    
    // 提交表單
    const submitButton = screen.getByRole('button', { name: '提交檢舉' });
    fireEvent.click(submitButton);

    // 驗證 createReport 被調用，參數正確
    expect(mockCreateReport).toHaveBeenCalledWith({
      report_type: 'prayer',
      target_id: 'test-prayer-id',
      target_content: '這是測試的禱告內容',
      reason: '這是不當內容',
    });
  });

  it('shows success toast and closes dialog after successful submission', () => {
    // 設置模擬
    const mockCreateReport = vi.fn().mockResolvedValue({ id: 'report-1' });
    vi.mocked(firebaseReportService.getInstance).mockReturnValue({
      createReport: mockCreateReport
    } as any);

    render(<ReportDialog {...defaultProps} />);

    // 輸入檢舉原因並提交
    const textarea = screen.getByLabelText('檢舉原因 *');
    fireEvent.change(textarea, { target: { value: '這是不當內容' } });
    fireEvent.click(screen.getByRole('button', { name: '提交檢舉' }));

    // 驗證通知和對話框關閉
    expect(mockToast).toHaveBeenCalledWith({
      title: '檢舉已提交',
      description: '我們會盡快審核您的檢舉，感謝您協助維護社群環境',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates form before submission', () => {
    render(<ReportDialog {...defaultProps} />);

    // 按鈕應該是禁用的
    const submitButton = screen.getByRole('button', { name: '提交檢舉' });
    expect(submitButton).toBeDisabled();
    
    // 輸入空值
    const textarea = screen.getByLabelText('檢舉原因 *');
    fireEvent.change(textarea, { target: { value: '   ' } });
    
    // 按鈕仍應該是禁用的
    expect(submitButton).toBeDisabled();
  });

  it('falls back to localStorage when server submission fails', () => {
    // 設置錯誤模擬
    const mockError = new Error('提交檢舉失敗');
    vi.mocked(firebaseReportService.getInstance).mockReturnValue({
      createReport: vi.fn().mockRejectedValue(mockError)
    } as any);

    // 模擬 localStorage 在錯誤情況下的行為
    mockLocalStorage.getItem.mockReturnValueOnce('[]' as any);

    render(<ReportDialog {...defaultProps} />);

    // 輸入檢舉原因並提交
    const textarea = screen.getByLabelText('檢舉原因 *');
    fireEvent.change(textarea, { target: { value: '這是不當內容' } });
    fireEvent.click(screen.getByRole('button', { name: '提交檢舉' }));

    // 仍然顯示成功通知，因為有回退機制
    expect(mockToast).toHaveBeenCalledWith({
      title: '檢舉已提交',
      description: '我們會盡快審核您的檢舉，感謝您協助維護社群環境',
    });
    
    // 驗證 localStorage 被使用來儲存檢舉
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'tempReports',
      expect.stringContaining('這是不當內容')
    );
  });

  it('closes dialog on cancel button click', () => {
    render(<ReportDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles user name display when provided', () => {
    render(<ReportDialog {...defaultProps} targetUserName="測試使用者" />);
    
    // 驗證顯示使用者名稱
    expect(screen.getByText('發言者：測試使用者')).toBeInTheDocument();
  });
}); 