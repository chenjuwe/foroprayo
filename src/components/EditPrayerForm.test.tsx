import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditPrayerForm } from './EditPrayerForm';

// Mock constants
vi.mock('@/constants', () => ({
  VALIDATION_CONFIG: {
    prayer: {
      max_length: 20000,
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
    it('應該正確渲染表單元素', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      expect(screen.getByText('編輯代禱')).toBeInTheDocument();
      expect(screen.getByDisplayValue('原始代禱內容')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '儲存' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
    });

    it('應該顯示字數統計', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      expect(screen.getByText('6 / 20000')).toBeInTheDocument();
    });

    it('應該在載入時禁用儲存按鈕', () => {
      render(<EditPrayerForm {...defaultProps} isLoading={true} />);
      
      const saveButton = screen.getByRole('button', { name: '儲存中...' });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('內容編輯', () => {
    it('應該允許使用者編輯內容', async () => {
      const user = userEvent.setup();
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      await user.clear(textarea);
      await user.type(textarea, '新的代禱內容');
      
      expect(textarea).toHaveValue('新的代禱內容');
    });

    it('應該更新字數統計', async () => {
      const user = userEvent.setup();
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      await user.clear(textarea);
      await user.type(textarea, '測試內容');
      
      expect(screen.getByText('4 / 20000')).toBeInTheDocument();
    });

    it('應該根據內容計算初始行數', () => {
      const multilineContent = '第一行\n第二行\n第三行';
      render(<EditPrayerForm {...defaultProps} initialContent={multilineContent} />);
      
      const textarea = screen.getByDisplayValue(multilineContent);
      expect(textarea).toHaveAttribute('rows', '3');
    });
  });

  describe('表單提交', () => {
    it('應該在提交時調用 onSave', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn();
      render(<EditPrayerForm {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      await user.clear(textarea);
      await user.type(textarea, '更新的內容');
      
      const saveButton = screen.getByRole('button', { name: '儲存' });
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith('更新的內容');
    });

    it('應該在表單提交時調用 onSave', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn();
      render(<EditPrayerForm {...defaultProps} onSave={mockOnSave} />);
      
      const form = screen.getByRole('form');
      await user.type(screen.getByDisplayValue('原始代禱內容'), '更新');
      
      fireEvent.submit(form);
      
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('應該阻止提交空內容', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn();
      render(<EditPrayerForm {...defaultProps} onSave={mockOnSave} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      await user.clear(textarea);
      await user.type(textarea, '   '); // 只有空格
      
      const saveButton = screen.getByRole('button', { name: '儲存' });
      await user.click(saveButton);
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('取消功能', () => {
    it('應該在點擊取消時調用 onCancel', async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();
      render(<EditPrayerForm {...defaultProps} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: '取消' });
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
      const user = userEvent.setup();
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      await user.clear(textarea);
      
      // 創建超過限制的內容
      const longContent = 'a'.repeat(20001);
      await user.type(textarea, longContent);
      
      expect(screen.getByText('20001 / 20000')).toBeInTheDocument();
      expect(screen.getByText('20001 / 20000')).toHaveClass('text-red-500');
    });
  });

  describe('無障礙功能', () => {
    it('應該有正確的 aria 標籤', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      expect(textarea).toHaveAttribute('aria-label', '編輯代禱內容');
      
      const saveButton = screen.getByRole('button', { name: '儲存' });
      expect(saveButton).toHaveAttribute('aria-label', '儲存代禱');
      
      const cancelButton = screen.getByRole('button', { name: '取消' });
      expect(cancelButton).toHaveAttribute('aria-label', '取消編輯');
    });

    it('應該支援鍵盤導航', async () => {
      const user = userEvent.setup();
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByDisplayValue('原始代禱內容');
      const saveButton = screen.getByRole('button', { name: '儲存' });
      const cancelButton = screen.getByRole('button', { name: '取消' });
      
      // Tab 鍵導航
      await user.tab();
      expect(textarea).toHaveFocus();
      
      await user.tab();
      expect(saveButton).toHaveFocus();
      
      await user.tab();
      expect(cancelButton).toHaveFocus();
    });
  });
}); 