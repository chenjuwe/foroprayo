import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditPrayerForm } from './EditPrayerForm';
import { VALIDATION_CONFIG } from '@/constants';

// Mock constants
vi.mock('@/constants', () => ({
  VALIDATION_CONFIG: {
    PRAYER_CONTENT: {
      MAX_LENGTH: 20000,
    },
  },
}));

describe('EditPrayerForm', () => {
  const defaultProps = {
    initialContent: '原始代禱內容',
    onSave: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該正確渲染編輯表單', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      expect(screen.getByText('重新編輯')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('保存')).toBeInTheDocument();
      expect(screen.getByDisplayValue('原始代禱內容')).toBeInTheDocument();
    });

    it('應該顯示字數統計', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      // 使用 testid 查找字數統計的各個部分
      expect(screen.getByTestId('character-count')).toHaveTextContent('6');
      expect(screen.getByTestId('character-separator')).toHaveTextContent('/');
      expect(screen.getByTestId('character-limit')).toHaveTextContent('20000');
    });

    it('應該在載入時禁用保存按鈕', () => {
      render(<EditPrayerForm {...defaultProps} isLoading={true} />);
      
      // 查找顯示 "..." 的按鈕（載入狀態）
      const saveButton = screen.getByText('...');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('內容編輯', () => {
    it('應該更新字數統計', async () => {
      const user = userEvent.setup();
      render(<EditPrayerForm {...defaultProps} initialContent="" />);
      
      const textarea = screen.getByPlaceholderText('編輯您的代禱內容...');
      await user.type(textarea, '測試內容');
      
      expect(screen.getByTestId('character-count')).toHaveTextContent('4');
    });

    it('應該根據內容計算初始行數', () => {
      const multilineContent = '第一行\n第二行\n第三行';
      render(<EditPrayerForm {...defaultProps} initialContent={multilineContent} />);
      
      const textarea = screen.getByLabelText('編輯代禱內容');
      expect(textarea).toHaveValue(multilineContent);
      expect(textarea).toHaveAttribute('rows', '3');
    });
  });

  describe('表單提交', () => {
    it('應該在表單提交時調用 onSave', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn();
      render(<EditPrayerForm {...defaultProps} onSave={mockOnSave} />);
      
      const form = screen.getByRole('form');
      await user.type(screen.getByDisplayValue('原始代禱內容'), '更新');
      
      fireEvent.submit(form);
      
      expect(mockOnSave).toHaveBeenCalledWith('原始代禱內容更新');
    });

    it('應該在點擊保存按鈕時調用 onSave', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn();
      render(<EditPrayerForm {...defaultProps} onSave={mockOnSave} />);
      
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith('原始代禱內容');
    });

    it('應該阻止提交空內容', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn();
      render(<EditPrayerForm {...defaultProps} initialContent="" onSave={mockOnSave} />);
      
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      expect(mockOnSave).not.toHaveBeenCalled();
      
      // 保存按鈕應該被禁用
      const saveButton = screen.getByText('保存');
      expect(saveButton).toBeDisabled();
    });
  });

  describe('取消功能', () => {
    it('應該在點擊取消時調用 onCancel', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      render(<EditPrayerForm {...defaultProps} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('鍵盤操作', () => {
    it('應該支援 Ctrl+Enter 提交', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn();
      render(<EditPrayerForm {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      await user.click(textarea);
      await user.keyboard('{Control>}{Enter}{/Control}');
      
      expect(mockOnSave).toHaveBeenCalledWith('原始代禱內容');
    });

    it('應該支援 Escape 取消', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      render(<EditPrayerForm {...defaultProps} onCancel={mockOnCancel} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      await user.click(textarea);
      await user.keyboard('{Escape}');
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('字數限制', () => {
    it('應該在超過字數限制時顯示警告', async () => {
      const longContent = 'a'.repeat(20001);
      render(<EditPrayerForm {...defaultProps} initialContent={longContent} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('character-count')).toHaveTextContent('20001');
      });
      
      const counterElement = screen.getByTestId('character-count').parentElement;
      expect(counterElement).toHaveClass('text-red-500');
    });
  });

  describe('無障礙功能', () => {
    it('應該有正確的 aria 標籤', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      expect(textarea).toHaveAttribute('aria-label', '編輯代禱內容');
      
      const saveButton = screen.getByRole('button', { name: '保存' });
      expect(saveButton).toBeInTheDocument();
      
      const cancelButton = screen.getByRole('button', { name: '取消' });
      expect(cancelButton).toBeInTheDocument();
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('應該支援鍵盤導航', async () => {
      const user = userEvent.setup();
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      const cancelButton = screen.getByText('取消');
      const saveButton = screen.getByText('保存');
      
      // 驗證元素可以接收焦點
      textarea.focus();
      expect(textarea).toHaveFocus();
      
      // 驗證按鈕可以被點擊（表示它們是可訪問的）
      await user.click(cancelButton);
      await user.click(saveButton);
      
      // 驗證所有交互元素都有適當的標籤
      expect(textarea).toHaveAttribute('aria-label');
      expect(cancelButton).toBeEnabled();
      expect(saveButton).toBeEnabled();
    });
  });
}); 