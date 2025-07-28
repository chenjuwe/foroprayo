import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('should render the button with its children', () => {
    render(<Button>Click Me</Button>);
    
    // 使用 screen.getByRole 來找到按鈕元素
    const buttonElement = screen.getByRole('button', { name: /Click Me/i });
    
    // 斷言按鈕在文件中
    expect(buttonElement).toBeInTheDocument();
  });

  it('should call the onClick handler when clicked', () => {
    // vi.fn() 建立一個 mock 函數
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const buttonElement = screen.getByRole('button', { name: /Click Me/i });
    
    // 模擬用戶點擊事件
    fireEvent.click(buttonElement);
    
    // 斷言 handleClick 函數被呼叫了一次
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when the disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Cannot Click</Button>);
    
    const buttonElement = screen.getByRole('button', { name: /Cannot Click/i });
    
    // 斷言按鈕處於禁用狀態
    expect(buttonElement).toBeDisabled();
    
    // 模擬點擊被禁用的按鈕
    fireEvent.click(buttonElement);
    
    // 斷言點擊事件不會被觸發
    expect(handleClick).not.toHaveBeenCalled();
  });
}); 