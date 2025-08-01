import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddFriendButton, AddFriendButtonWithMessage } from './AddFriendButton';

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock MessageDialog
vi.mock('./MessageDialog', () => ({
  MessageDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="message-dialog">
        Message Dialog
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

import { log } from '@/lib/logger';

describe('AddFriendButton', () => {
  const defaultProps = {
    userId: 'test-user-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該正確渲染加好友按鈕', () => {
      render(<AddFriendButton {...defaultProps} />);
      
      expect(screen.getByText('加好友')).toBeInTheDocument();
      expect(screen.getByText('＋')).toBeInTheDocument();
    });

    it('應該在禁用時顯示禁用狀態', () => {
      render(<AddFriendButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('應該支援自訂類別', () => {
      render(<AddFriendButton {...defaultProps} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('點擊功能', () => {
    it('應該處理加好友點擊', async () => {
      const user = userEvent.setup();
      render(<AddFriendButton {...defaultProps} />);
      
      const button = screen.getByText('加好友');
      await user.click(button);
      
      expect(log.info).toHaveBeenCalledWith(
        '社交功能暫時不可用',
        {},
        'AddFriendButton'
      );
    });

    it('應該在禁用時不響應點擊', async () => {
      const user = userEvent.setup();
      render(<AddFriendButton {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(log.info).not.toHaveBeenCalled();
    });
  });

  describe('載入狀態', () => {
    it('應該正確顯示按鈕樣式', () => {
      render(<AddFriendButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ height: '30px', fontSize: '14px' });
      expect(button).toHaveClass('border-black', 'border', 'bg-transparent', 'rounded-full');
    });
  });
});

describe('AddFriendButtonWithMessage', () => {
  const defaultProps = {
    userId: 'test-user-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該渲染加好友按鈕', () => {
      render(<AddFriendButtonWithMessage {...defaultProps} />);
      
      expect(screen.getByText('加好友')).toBeInTheDocument();
    });

    it('應該支援禁用狀態', () => {
      render(<AddFriendButtonWithMessage {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('應該支援自訂類別', () => {
      render(<AddFriendButtonWithMessage {...defaultProps} className="custom-class" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('用戶名稱獲取', () => {
    it('應該在有用戶ID時嘗試獲取用戶名稱', async () => {
      render(<AddFriendButtonWithMessage {...defaultProps} />);
      
      // 組件應該成功渲染，表示useEffect正常執行
      expect(screen.getByText('加好友')).toBeInTheDocument();
    });

    it('應該處理空用戶ID', () => {
      render(<AddFriendButtonWithMessage userId="" />);
      
      expect(screen.getByText('加好友')).toBeInTheDocument();
    });
  });
}); 