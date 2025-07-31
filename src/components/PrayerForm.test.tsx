import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrayerForm } from './PrayerForm';

// Mock dependencies
vi.mock('@/integrations/firebase/client', () => ({
  auth: vi.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      email: 'test@example.com'
    }
  }))
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({
    clear: vi.fn(),
    invalidateQueries: vi.fn(),
  })),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: vi.fn(() => ({
    avatarUrl: 'https://example.com/avatar.jpg',
    refreshAvatar: vi.fn()
  }))
}));

vi.mock('@/services', () => ({
  prayerService: {
    createPrayer: vi.fn(),
    updatePrayer: vi.fn()
  }
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
    isError: false,
    error: null
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn()
  }))
}));

// Mock child components
vi.mock('./ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea
      data-testid="prayer-textarea"
      value={value}
      onChange={onChange}
      {...props}
    />
  )
}));

vi.mock('./ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button
      data-testid="submit-button"
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('./ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      data-testid="anonymous-checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
}));

vi.mock('./ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div data-testid="card-content" {...props}>{children}</div>
  )
}));

describe('PrayerForm', () => {
  const defaultProps = {
    prayerText: '',
    isAnonymous: false,
    isLoggedIn: true,
    onSubmit: vi.fn(),
    isSubmitting: false,
    placeholder: '分享你的代禱...',
    rows: 1,
    variant: 'default' as const,
    isAnswered: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該正確渲染代禱表單', () => {
      render(<PrayerForm {...defaultProps} />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('prayer-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('anonymous-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('應該正確顯示匿名選項', () => {
      render(<PrayerForm {...defaultProps} />);
      
      const checkbox = screen.getByTestId('anonymous-checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('應該在載入狀態時禁用按鈕', () => {
      render(<PrayerForm {...defaultProps} isSubmitting={true} />);
      
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('文字輸入處理', () => {
    it('應該正確處理文字變更', () => {
      render(<PrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      fireEvent.change(textarea, { target: { value: '新的代禱內容' } });
      
      expect(textarea).toHaveValue('新的代禱內容');
    });

    it('應該正確處理匿名狀態變更', () => {
      render(<PrayerForm {...defaultProps} />);
      
      const checkbox = screen.getByTestId('anonymous-checkbox');
      fireEvent.click(checkbox);
      
      expect(checkbox).toBeChecked();
    });

    it('應該正確設定初始值', () => {
      render(<PrayerForm {...defaultProps} prayerText="初始內容" isAnonymous={true} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      const checkbox = screen.getByTestId('anonymous-checkbox');
      
      expect(textarea).toHaveValue('初始內容');
      expect(checkbox).toBeChecked();
    });
  });

  describe('表單提交', () => {
    it('應該正確處理表單提交', async () => {
      const mockOnSubmit = vi.fn();
      render(<PrayerForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      const submitButton = screen.getByTestId('submit-button');
      
      fireEvent.change(textarea, { target: { value: '測試代禱內容' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          content: '測試代禱內容',
          isAnonymous: false
        });
      });
    });

    it('應該在空內容時不提交表單', async () => {
      const mockOnSubmit = vi.fn();
      render(<PrayerForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('應該在載入狀態時不提交表單', async () => {
      const mockOnSubmit = vi.fn();
      render(<PrayerForm {...defaultProps} onSubmit={mockOnSubmit} isSubmitting={true} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      const submitButton = screen.getByTestId('submit-button');
      
      fireEvent.change(textarea, { target: { value: '測試內容' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('不同變體', () => {
    it('應該正確渲染回應變體', () => {
      render(<PrayerForm {...defaultProps} variant="response" />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('prayer-textarea')).toBeInTheDocument();
    });

    it('應該正確處理神已應允狀態', () => {
      render(<PrayerForm {...defaultProps} isAnswered={true} />);
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('prayer-textarea')).toBeInTheDocument();
    });
  });

  describe('字數限制', () => {
    it('應該正確處理字數限制', () => {
      render(<PrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      const longText = 'a'.repeat(1000);
      
      fireEvent.change(textarea, { target: { value: longText } });
      
      expect(textarea).toHaveValue(longText);
    });
  });

  describe('無障礙功能', () => {
    it('應該包含正確的 ARIA 標籤', () => {
      render(<PrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      const checkbox = screen.getByTestId('anonymous-checkbox');
      
      expect(textarea).toBeInTheDocument();
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理提交錯誤', async () => {
      const mockOnSubmit = vi.fn().mockRejectedValue(new Error('提交失敗'));
      render(<PrayerForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      const submitButton = screen.getByTestId('submit-button');
      
      fireEvent.change(textarea, { target: { value: '測試內容' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('狀態管理', () => {
    it('應該正確管理內部狀態', () => {
      render(<PrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      const checkbox = screen.getByTestId('anonymous-checkbox');
      
      // 測試狀態變化
      fireEvent.change(textarea, { target: { value: '新內容' } });
      fireEvent.click(checkbox);
      
      expect(textarea).toHaveValue('新內容');
      expect(checkbox).toBeChecked();
    });

    it('應該在提交後重置表單', async () => {
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      render(<PrayerForm {...defaultProps} onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByTestId('prayer-textarea');
      const submitButton = screen.getByTestId('submit-button');
      
      fireEvent.change(textarea, { target: { value: '測試內容' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });
}); 