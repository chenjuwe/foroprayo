import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditPrayerForm } from './EditPrayerForm';

// Mock constants
vi.mock('@/constants', () => ({
  VALIDATION_CONFIG: {
    PRAYER_CONTENT: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 20000,
    },
    RESPONSE_CONTENT: {
      MIN_LENGTH: 1,
      MAX_LENGTH: 20000,
    },
    USERNAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 20,
    },
  },
}));

// Mock dependencies
vi.mock('./ui/textarea', () => ({
  Textarea: React.forwardRef(({ value, onChange, placeholder, className, style, ...props }: any, ref) => (
    <textarea
      data-testid="edit-textarea"
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      style={style}
      {...props}
    />
  )),
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

describe('EditPrayerForm', () => {
  const defaultProps = {
    initialContent: '這是一個測試代禱內容',
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
      expect(screen.getByTestId('edit-textarea')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('保存')).toBeInTheDocument();
    });

    it('應該正確顯示初始內容', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue('這是一個測試代禱內容');
    });

    it('應該正確設置佔位符文字', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveAttribute('placeholder', '編輯您的代禱內容...');
    });

    it('應該正確顯示標題樣式', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const title = screen.getByText('重新編輯');
      expect(title).toHaveStyle({ color: '#1694da' });
    });
  });

  describe('文字輸入處理', () => {
    it('應該正確處理文字變更', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      fireEvent.change(textarea, { target: { value: '新的代禱內容' } });
      
      expect(textarea).toHaveValue('新的代禱內容');
    });

    it('應該正確處理多行內容', () => {
      const multiLineContent = '第一行\n第二行\n第三行';
      render(<EditPrayerForm {...defaultProps} initialContent={multiLineContent} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue(multiLineContent);
    });

    it('應該正確處理空內容', () => {
      render(<EditPrayerForm {...defaultProps} initialContent="" />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue('');
    });
  });

  describe('按鈕狀態', () => {
    it('應該在空內容時禁用保存按鈕', () => {
      render(<EditPrayerForm {...defaultProps} initialContent="" />);
      
      const saveButton = screen.getByText('保存');
      expect(saveButton).toBeDisabled();
    });

    it('應該在只有空格時禁用保存按鈕', () => {
      render(<EditPrayerForm {...defaultProps} initialContent="   " />);
      
      const saveButton = screen.getByText('保存');
      expect(saveButton).toBeDisabled();
    });

    it('應該在有內容時啟用保存按鈕', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const saveButton = screen.getByText('保存');
      expect(saveButton).not.toBeDisabled();
    });

    it('應該在載入狀態時禁用保存按鈕', () => {
      render(<EditPrayerForm {...defaultProps} isLoading={true} />);
      
      const saveButton = screen.getByText('...');
      expect(saveButton).toBeDisabled();
    });

    it('應該在載入狀態時禁用取消按鈕', () => {
      render(<EditPrayerForm {...defaultProps} isLoading={true} />);
      
      const cancelButton = screen.getByText('取消');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('表單提交', () => {
    it('應該正確處理保存按鈕點擊', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('這是一個測試代禱內容');
    });

    it('應該正確處理表單提交', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const form = screen.getByRole('form');
      fireEvent.submit(form);
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('這是一個測試代禱內容');
    });

    it('應該在空內容時不提交表單', () => {
      render(<EditPrayerForm {...defaultProps} initialContent="" />);
      
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('應該在載入狀態時不提交表單', () => {
      render(<EditPrayerForm {...defaultProps} isLoading={true} />);
      
      const saveButton = screen.getByText('...');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('應該正確處理修改後的內容提交', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      fireEvent.change(textarea, { target: { value: '修改後的內容' } });
      
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);
      
      expect(defaultProps.onSave).toHaveBeenCalledWith('修改後的內容');
    });
  });

  describe('取消功能', () => {
    it('應該正確處理取消按鈕點擊', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('應該在載入狀態時不響應取消', () => {
      render(<EditPrayerForm {...defaultProps} isLoading={true} />);
      
      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  describe('載入狀態', () => {
    it('應該正確顯示載入狀態', () => {
      render(<EditPrayerForm {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.queryByText('保存')).not.toBeInTheDocument();
    });

    it('應該在載入狀態時應用正確的樣式', () => {
      render(<EditPrayerForm {...defaultProps} isLoading={true} />);
      
      const saveButton = screen.getByText('...');
      expect(saveButton).toHaveStyle({ backgroundColor: '#E5E7EB' });
    });

    it('應該在非載入狀態時應用正確的樣式', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const saveButton = screen.getByText('保存');
      expect(saveButton).toHaveStyle({ backgroundColor: '#95d2f4' });
    });
  });

  describe('樣式和佈局', () => {
    it('應該正確應用按鈕樣式', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const cancelButton = screen.getByText('取消');
      const saveButton = screen.getByText('保存');
      
      expect(cancelButton).toHaveStyle({
        width: '50px',
        height: '30px',
        borderRadius: '15px',
        backgroundColor: '#808080',
      });
      
      expect(saveButton).toHaveStyle({
        width: '50px',
        height: '30px',
        borderRadius: '15px',
        backgroundColor: '#95d2f4',
      });
    });

    it('應該正確應用文字區域樣式', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveClass('resize-none', 'p-3', 'bg-white');
    });
  });

  describe('內容驗證', () => {
    it('應該正確處理包含特殊字符的內容', () => {
      const specialContent = '特殊字符：!@#$%^&*()_+-=[]{}|;:,.<>?';
      render(<EditPrayerForm {...defaultProps} initialContent={specialContent} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue(specialContent);
    });

    it('應該正確處理包含換行符的內容', () => {
      const contentWithNewlines = '第一行\n第二行\n第三行';
      render(<EditPrayerForm {...defaultProps} initialContent={contentWithNewlines} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue(contentWithNewlines);
    });

    it('應該正確處理長內容', () => {
      const longContent = 'a'.repeat(1000);
      render(<EditPrayerForm {...defaultProps} initialContent={longContent} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue(longContent);
    });
  });

  describe('無障礙功能', () => {
    it('應該包含正確的表單結構', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('應該正確處理鍵盤導航', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      const saveButton = screen.getByText('保存');
      const cancelButton = screen.getByText('取消');
      
      textarea.focus();
      expect(textarea).toHaveFocus();
      
      saveButton.focus();
      expect(saveButton).toHaveFocus();
      
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();
    });

    it('應該正確處理鍵盤事件', () => {
      render(<EditPrayerForm {...defaultProps} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      
      // 測試 Ctrl+Enter 提交（如果實現了的話）
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
      
      // 測試普通 Enter 鍵
      fireEvent.keyDown(textarea, { key: 'Enter' });
    });
  });

  describe('邊界情況', () => {
    it('應該正確處理非常長的初始內容', () => {
      const veryLongContent = 'a'.repeat(10000);
      render(<EditPrayerForm {...defaultProps} initialContent={veryLongContent} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue(veryLongContent);
    });

    it('應該正確處理包含 HTML 標籤的內容', () => {
      const htmlContent = '<script>alert("test")</script><p>Hello</p>';
      render(<EditPrayerForm {...defaultProps} initialContent={htmlContent} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue(htmlContent);
    });

    it('應該正確處理 Unicode 字符', () => {
      const unicodeContent = '中文測試 🎉 😊 特殊符號';
      render(<EditPrayerForm {...defaultProps} initialContent={unicodeContent} />);
      
      const textarea = screen.getByTestId('edit-textarea');
      expect(textarea).toHaveValue(unicodeContent);
    });
  });
}); 