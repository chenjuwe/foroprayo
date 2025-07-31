import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthInputs } from './AuthInputs';

describe('AuthInputs', () => {
  const defaultProps = {
    email: '',
    password: '',
    isLoading: false,
    onEmailChange: vi.fn(),
    onPasswordChange: vi.fn(),
  };

  it('應該正確渲染輸入框', () => {
    render(<AuthInputs {...defaultProps} />);

    expect(screen.getByPlaceholderText('電子信箱')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('輸入密碼')).toBeInTheDocument();
  });

  it('應該正確設定初始值', () => {
    const email = 'test@example.com';
    const password = 'password123';
    
    render(<AuthInputs {...defaultProps} email={email} password={password} />);

    expect(screen.getByDisplayValue(email)).toBeInTheDocument();
    expect(screen.getByDisplayValue(password)).toBeInTheDocument();
  });

  it('應該在載入時禁用輸入框', () => {
    render(<AuthInputs {...defaultProps} isLoading={true} />);

    const emailInput = screen.getByPlaceholderText('電子信箱');
    const passwordInput = screen.getByPlaceholderText('輸入密碼');

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('應該處理電子郵件變更', () => {
    const onEmailChange = vi.fn();
    render(<AuthInputs {...defaultProps} onEmailChange={onEmailChange} />);

    const emailInput = screen.getByPlaceholderText('電子信箱');
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    expect(onEmailChange).toHaveBeenCalled();
  });

  it('應該處理密碼變更', () => {
    const onPasswordChange = vi.fn();
    render(<AuthInputs {...defaultProps} onPasswordChange={onPasswordChange} />);

    const passwordInput = screen.getByPlaceholderText('輸入密碼');
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    expect(onPasswordChange).toHaveBeenCalled();
  });

  it('應該正確設定輸入框屬性', () => {
    render(<AuthInputs {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('電子信箱');
    const passwordInput = screen.getByPlaceholderText('輸入密碼');

    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('autoComplete', 'off');
    expect(emailInput).toHaveAttribute('name', 'email');

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
    expect(passwordInput).toHaveAttribute('name', 'password');
  });

  it('應該正確設定樣式', () => {
    render(<AuthInputs {...defaultProps} />);

    const emailInput = screen.getByPlaceholderText('電子信箱');
    const passwordInput = screen.getByPlaceholderText('輸入密碼');

    expect(emailInput).toHaveClass('w-full', 'bg-transparent', 'border-b', 'pb-2', 'text-black', 'focus:outline-none', 'rounded-none');
    expect(passwordInput).toHaveClass('w-full', 'bg-transparent', 'border-b', 'pb-2', 'text-black', 'focus:outline-none', 'rounded-none');
  });
}); 