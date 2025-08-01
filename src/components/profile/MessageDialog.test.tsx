import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageDialog } from './MessageDialog';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, style }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      style={style}
      data-testid="button"
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, disabled, maxLength, className, style }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={className}
      style={style}
      data-testid="textarea"
    />
  ),
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, onOpenChange, children }: any) => 
    open ? <div data-testid="alert-dialog" onBlur={onOpenChange}>{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  AlertDialogTitle: ({ children, className, style }: any) => (
    <h2 data-testid="dialog-title" className={className} style={style}>{children}</h2>
  ),
  AlertDialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  AlertDialogFooter: ({ children, style }: any) => (
    <div data-testid="dialog-footer" style={style}>{children}</div>
  ),
  AlertDialogAction: ({ children, onClick, disabled, className, style }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      style={style}
      data-testid="dialog-action"
    >
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, disabled, className, style }: any) => (
    <button 
      disabled={disabled} 
      className={className}
      style={style}
      data-testid="dialog-cancel"
    >
      {children}
    </button>
  ),
}));

import { toast } from 'sonner';
import { log } from '@/lib/logger';

describe('MessageDialog', () => {
  const mockOnClose = vi.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    targetUserId: 'test-user-id',
    targetUserName: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('應該在關閉時不渲染', () => {
    render(<MessageDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
  });

  it('應該在開啟時正確渲染', () => {
    render(<MessageDialog {...defaultProps} />);
    
    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('傳送訊息給 Test User');
    expect(screen.getByTestId('textarea')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-action')).toHaveTextContent('發送');
    expect(screen.getByTestId('dialog-cancel')).toHaveTextContent('取消');
  });

  it('應該在沒有用戶名時顯示預設文本', () => {
    const props = { ...defaultProps };
    delete (props as any).targetUserName;
    render(<MessageDialog {...props} />);
    
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('傳送訊息給 用戶');
  });

  it('應該正確處理文本輸入', async () => {
    const user = userEvent.setup();
    render(<MessageDialog {...defaultProps} />);
    
    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'Hello World');
    
    expect(textarea).toHaveValue('Hello World');
    expect(screen.getByText('11/500')).toBeInTheDocument();
  });

  it('應該在空訊息時禁用發送按鈕', () => {
    render(<MessageDialog {...defaultProps} />);
    
    const sendButton = screen.getByTestId('dialog-action');
    expect(sendButton).toBeDisabled();
  });

  it('應該在有訊息時啟用發送按鈕', async () => {
    const user = userEvent.setup();
    render(<MessageDialog {...defaultProps} />);
    
    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'Hello');
    
    const sendButton = screen.getByTestId('dialog-action');
    expect(sendButton).not.toBeDisabled();
  });

  it('應該在空白訊息時顯示錯誤', async () => {
    const user = userEvent.setup();
    render(<MessageDialog {...defaultProps} />);
    
    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, '   '); // 空白字符
    
    const sendButton = screen.getByTestId('dialog-action');
    await user.click(sendButton);
    
    expect(toast.error).toHaveBeenCalledWith('請輸入訊息內容');
  });

  it('應該成功發送訊息', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    
    render(<MessageDialog {...defaultProps} />);
    
    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'Hello World');
    
    const sendButton = screen.getByTestId('dialog-action');
    await user.click(sendButton);
    
    // 檢查載入狀態
    expect(sendButton).toHaveTextContent('發送中...');
    expect(sendButton).toBeDisabled();
    
    // 模擬時間推進
    await vi.advanceTimersByTimeAsync(1000);
    
    await waitFor(() => {
      expect(log.info).toHaveBeenCalledWith('訊息發送成功', {
        targetUserId: 'test-user-id',
        targetUserName: 'Test User',
        messageLength: 11
      }, 'MessageDialog');
      expect(toast.success).toHaveBeenCalledWith('訊息已發送！');
      expect(mockOnClose).toHaveBeenCalled();
    });
    
    vi.useRealTimers();
  });

  it('應該限制訊息長度', async () => {
    const user = userEvent.setup();
    render(<MessageDialog {...defaultProps} />);
    
    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute('maxLength', '500');
    
    const longMessage = 'a'.repeat(600);
    await user.type(textarea, longMessage);
    
    // 應該被限制在500字符
    expect(textarea.value.length).toBeLessThanOrEqual(500);
  });

  it('應該在發送過程中禁用取消按鈕', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    
    render(<MessageDialog {...defaultProps} />);
    
    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'Hello');
    
    const sendButton = screen.getByTestId('dialog-action');
    await user.click(sendButton);
    
    const cancelButton = screen.getByTestId('dialog-cancel');
    expect(cancelButton).toBeDisabled();
    
    vi.useRealTimers();
  });

  it('應該處理發送錯誤', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    
    // Mock console.error to prevent error output in tests
    const originalError = console.error;
    console.error = vi.fn();
    
    // Mock setTimeout to immediately reject
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn((callback: any) => {
      throw new Error('Network error');
    }) as any;
    
    render(<MessageDialog {...defaultProps} />);
    
    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'Hello');
    
    const sendButton = screen.getByTestId('dialog-action');
    await user.click(sendButton);
    
    await vi.advanceTimersByTimeAsync(1000);
    
    await waitFor(() => {
      expect(log.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('發送訊息失敗，請稍後再試');
    });
    
    // Restore
    global.setTimeout = originalSetTimeout;
    console.error = originalError;
    vi.useRealTimers();
  });

  it('應該正確顯示字符計數', async () => {
    const user = userEvent.setup();
    render(<MessageDialog {...defaultProps} />);
    
    expect(screen.getByText('0/500')).toBeInTheDocument();
    
    const textarea = screen.getByTestId('textarea');
    await user.type(textarea, 'Hello');
    
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('應該清空表單當關閉時', () => {
    const { rerender } = render(<MessageDialog {...defaultProps} />);
    
    const textarea = screen.getByTestId('textarea');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    
    // 關閉對話框
    rerender(<MessageDialog {...defaultProps} isOpen={false} />);
    
    // 重新開啟
    rerender(<MessageDialog {...defaultProps} isOpen={true} />);
    
    expect(screen.getByTestId('textarea')).toHaveValue('');
  });
}); 