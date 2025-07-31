import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthToggle } from './AuthToggle';

describe('AuthToggle', () => {
  const defaultProps = {
    isLogin: true,
    onToggle: vi.fn(),
    isLoading: false,
  };

  it('應該正確渲染登入模式的切換按鈕', () => {
    render(<AuthToggle {...defaultProps} />);

    expect(screen.getByText('登入帳號')).toBeInTheDocument();
  });

  it('應該正確渲染註冊模式的切換按鈕', () => {
    render(<AuthToggle {...defaultProps} isLogin={false} />);

    expect(screen.getByText('註冊帳號')).toBeInTheDocument();
  });

  it('應該處理切換按鈕點擊', () => {
    const onToggle = vi.fn();
    render(<AuthToggle {...defaultProps} onToggle={onToggle} />);

    const toggleButton = screen.getByText('登入帳號');
    fireEvent.click(toggleButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('應該在載入狀態時禁用按鈕', () => {
    render(<AuthToggle {...defaultProps} isLoading={true} />);

    const toggleButton = screen.getByText('登入帳號');
    expect(toggleButton).toBeDisabled();
  });

  it('應該在非載入狀態時啟用按鈕', () => {
    render(<AuthToggle {...defaultProps} isLoading={false} />);

    const toggleButton = screen.getByText('登入帳號');
    expect(toggleButton).not.toBeDisabled();
  });

  it('應該包含正確的 CSS 類別', () => {
    render(<AuthToggle {...defaultProps} />);

    const toggleButton = screen.getByText('登入帳號');
    expect(toggleButton).toHaveClass('text-black');
  });

  it('應該正確設定按鈕樣式', () => {
    render(<AuthToggle {...defaultProps} />);

    const toggleButton = screen.getByText('登入帳號');
    expect(toggleButton).toHaveStyle({
      backgroundColor: 'rgb(255, 179, 179)',
      width: '100px',
      height: '30px',
      borderRadius: '15px',
      fontSize: '14px',
    });
  });

  it('應該正確設定容器樣式', () => {
    render(<AuthToggle {...defaultProps} />);

    const container = screen.getByText('登入帳號').closest('div');
    expect(container).toHaveStyle({
      position: 'absolute',
      top: '77px',
      left: '50%',
      transform: 'translateX(-50%)',
    });
  });
}); 