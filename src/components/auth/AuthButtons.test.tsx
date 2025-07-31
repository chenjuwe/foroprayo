import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthButtons } from './AuthButtons';

describe('AuthButtons', () => {
  const defaultProps = {
    isLogin: true,
    isLoading: false,
    onForgotPassword: vi.fn(),
    onToggle: vi.fn(),
    onGuestAccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染登入模式的按鈕', () => {
    render(<AuthButtons {...defaultProps} isLogin={true} />);

    const forgotPasswordButton = screen.getByText('忘記密碼');
    const toggleButton = screen.getByText('註冊帳號');

    expect(forgotPasswordButton).toBeInTheDocument();
    expect(toggleButton).toBeInTheDocument();
  });

  it('應該正確渲染註冊模式的按鈕', () => {
    render(<AuthButtons {...defaultProps} isLogin={false} />);

    const forgotPasswordButton = screen.getByText('忘記密碼');
    const toggleButton = screen.getByText('登入帳號');

    expect(forgotPasswordButton).toBeInTheDocument();
    expect(toggleButton).toBeInTheDocument();
  });

  it('應該在載入狀態時禁用按鈕', () => {
    render(<AuthButtons {...defaultProps} isLoading={true} />);

    const forgotPasswordButton = screen.getByText('忘記密碼');
    const toggleButton = screen.getByText('註冊帳號');

    expect(forgotPasswordButton).toBeDisabled();
    expect(toggleButton).toBeDisabled();
  });

  it('應該在非載入狀態時啟用按鈕', () => {
    render(<AuthButtons {...defaultProps} isLoading={false} />);

    const forgotPasswordButton = screen.getByText('忘記密碼');
    const toggleButton = screen.getByText('註冊帳號');

    expect(forgotPasswordButton).not.toBeDisabled();
    expect(toggleButton).not.toBeDisabled();
  });

  it('應該處理忘記密碼按鈕點擊', () => {
    const onForgotPassword = vi.fn();
    render(<AuthButtons {...defaultProps} onForgotPassword={onForgotPassword} />);

    const forgotPasswordButton = screen.getByText('忘記密碼');
    fireEvent.click(forgotPasswordButton);

    expect(onForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('應該處理切換模式按鈕點擊', () => {
    const onToggle = vi.fn();
    render(<AuthButtons {...defaultProps} onToggle={onToggle} />);

    const toggleButton = screen.getByText('註冊帳號');
    fireEvent.click(toggleButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('應該正確設定按鈕樣式', () => {
    render(<AuthButtons {...defaultProps} />);

    const forgotPasswordButton = screen.getByText('忘記密碼');
    const toggleButton = screen.getByText('註冊帳號');

    // 檢查內聯樣式
    expect(forgotPasswordButton).toHaveStyle({
      color: '#1694da',
      fontSize: '14px',
    });
    expect(toggleButton).toHaveStyle({
      color: '#1694da',
      fontSize: '14px',
    });
  });

  it('應該正確設定按鈕類型', () => {
    render(<AuthButtons {...defaultProps} />);

    const forgotPasswordButton = screen.getByText('忘記密碼');
    const toggleButton = screen.getByText('註冊帳號');

    expect(forgotPasswordButton).toHaveAttribute('type', 'button');
    expect(toggleButton).toHaveAttribute('type', 'button');
  });

  it('應該包含正確的 CSS 類別', () => {
    render(<AuthButtons {...defaultProps} />);

    const container = screen.getByText('忘記密碼').closest('div');
    expect(container).toHaveClass('flex', 'justify-between', 'items-center', 'pt-4');
  });

  it('應該正確設定容器寬度', () => {
    render(<AuthButtons {...defaultProps} />);

    const container = screen.getByText('忘記密碼').closest('div');
    expect(container).toHaveStyle({ width: '270px' });
  });

  it('應該在登入模式下顯示正確的切換按鈕文字', () => {
    render(<AuthButtons {...defaultProps} isLogin={true} />);

    const toggleButton = screen.getByText('註冊帳號');
    expect(toggleButton).toBeInTheDocument();
  });

  it('應該在註冊模式下顯示正確的切換按鈕文字', () => {
    render(<AuthButtons {...defaultProps} isLogin={false} />);

    const toggleButton = screen.getByText('登入帳號');
    expect(toggleButton).toBeInTheDocument();
  });
}); 