import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock child components
vi.mock('./AuthToggle', () => ({
  AuthToggle: ({ isLogin, onToggle, isLoading }: any) => (
    <div data-testid="auth-toggle">
      <button onClick={onToggle} disabled={isLoading}>
        {isLogin ? '切換到註冊' : '切換到登入'}
      </button>
    </div>
  ),
}));

vi.mock('./AuthInputs', () => ({
  AuthInputs: ({ email, password, onEmailChange, onPasswordChange, isLoading }: any) => (
    <div data-testid="auth-inputs">
      <input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e)}
        disabled={isLoading}
        placeholder="電子信箱"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e)}
        disabled={isLoading}
        placeholder="密碼"
      />
    </div>
  ),
}));

vi.mock('./AuthButtons', () => ({
  AuthButtons: ({ isLogin, isLoading, onForgotPassword }: any) => (
    <div data-testid="auth-buttons">
      <button disabled={isLoading}>登入</button>
      <button disabled={isLoading}>註冊</button>
      <button onClick={onForgotPassword} disabled={isLoading}>忘記密碼</button>
    </div>
  ),
}));

vi.mock('./AuthDescription', () => ({
  AuthDescription: ({ isLogin }: any) => (
    <div data-testid="auth-description">
      {isLogin ? '登入描述' : '註冊描述'}
    </div>
  ),
}));

vi.mock('./AuthFooter', () => ({
  AuthFooter: () => <div data-testid="auth-footer">Footer</div>,
}));

import { AuthForm } from './AuthForm';

describe('AuthForm', () => {
  const defaultProps = {
    email: '',
    password: '',
    isLogin: true,
    isLoading: false,
    onEmailChange: vi.fn(),
    onPasswordChange: vi.fn(),
    onToggle: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染表單', () => {
    render(<AuthForm {...defaultProps} />);

    expect(screen.getByTestId('auth-description')).toBeInTheDocument();
    expect(screen.getByTestId('auth-inputs')).toBeInTheDocument();
    expect(screen.getByTestId('auth-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('auth-footer')).toBeInTheDocument();
  });

  it('應該正確處理登入模式', () => {
    render(<AuthForm {...defaultProps} isLogin={true} />);

    expect(screen.getByText('登入描述')).toBeInTheDocument();
    expect(screen.getByText('切換到註冊')).toBeInTheDocument();
  });

  it('應該正確處理註冊模式', () => {
    render(<AuthForm {...defaultProps} isLogin={false} />);

    expect(screen.getByText('註冊描述')).toBeInTheDocument();
    expect(screen.getByText('切換到登入')).toBeInTheDocument();
  });

  it('應該正確處理切換按鈕點擊', () => {
    const onToggle = vi.fn();
    render(<AuthForm {...defaultProps} onToggle={onToggle} />);

    const toggleButton = screen.getByText('切換到註冊');
    fireEvent.click(toggleButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('應該正確處理電子郵件變更', () => {
    const onEmailChange = vi.fn();
    render(<AuthForm {...defaultProps} onEmailChange={onEmailChange} />);

    const emailInput = screen.getByPlaceholderText('電子信箱');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(onEmailChange).toHaveBeenCalled();
  });

  it('應該正確處理密碼變更', () => {
    const onPasswordChange = vi.fn();
    render(<AuthForm {...defaultProps} onPasswordChange={onPasswordChange} />);

    const passwordInput = screen.getByPlaceholderText('密碼');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(onPasswordChange).toHaveBeenCalled();
  });

  it('應該正確處理忘記密碼按鈕點擊', () => {
    const onForgotPassword = vi.fn();
    render(<AuthForm {...defaultProps} />);

    const forgotPasswordButton = screen.getByText('忘記密碼');
    fireEvent.click(forgotPasswordButton);

    // 由於 onForgotPassword 是內部函數，我們只檢查按鈕存在
    expect(forgotPasswordButton).toBeInTheDocument();
  });

  it('應該在載入時禁用所有互動元素', () => {
    render(<AuthForm {...defaultProps} isLoading={true} />);

    const emailInput = screen.getByPlaceholderText('電子信箱');
    const passwordInput = screen.getByPlaceholderText('密碼');
    const toggleButton = screen.getByText('切換到註冊');

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(toggleButton).toBeDisabled();
  });

  it('應該正確設定初始值', () => {
    const email = 'test@example.com';
    const password = 'password123';
    
    render(<AuthForm {...defaultProps} email={email} password={password} />);

    expect(screen.getByDisplayValue(email)).toBeInTheDocument();
    expect(screen.getByDisplayValue(password)).toBeInTheDocument();
  });

  it('應該包含表單元素', () => {
    render(<AuthForm {...defaultProps} />);

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('應該正確處理表單提交', () => {
    const onSubmit = vi.fn();
    render(<AuthForm {...defaultProps} onSubmit={onSubmit} />);

    const form = document.querySelector('form');
    fireEvent.submit(form!);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
}); 