import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('應該正確渲染輸入框', () => {
    render(<Input placeholder="測試輸入" />);

    const input = screen.getByPlaceholderText('測試輸入');
    expect(input).toBeInTheDocument();
  });

  it('應該正確設定 type 屬性', () => {
    render(<Input type="email" placeholder="電子郵件" />);

    const input = screen.getByPlaceholderText('電子郵件');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('應該正確設定 placeholder', () => {
    const placeholder = '請輸入內容';
    render(<Input placeholder={placeholder} />);

    const input = screen.getByPlaceholderText(placeholder);
    expect(input).toBeInTheDocument();
  });

  it('應該正確設定 value', () => {
    const value = '測試值';
    render(<Input value={value} />);

    const input = screen.getByDisplayValue(value);
    expect(input).toBeInTheDocument();
  });

  it('應該正確設定 disabled 狀態', () => {
    render(<Input disabled placeholder="測試輸入" />);

    const input = screen.getByPlaceholderText('測試輸入');
    expect(input).toBeDisabled();
  });

  it('應該正確設定 required 屬性', () => {
    render(<Input required placeholder="測試輸入" />);

    const input = screen.getByPlaceholderText('測試輸入');
    expect(input).toHaveAttribute('required');
  });

  it('應該正確設定 name 屬性', () => {
    const name = 'test-input';
    render(<Input name={name} placeholder="測試輸入" />);

    const input = screen.getByPlaceholderText('測試輸入');
    expect(input).toHaveAttribute('name', name);
  });

  it('應該正確設定 id 屬性', () => {
    const id = 'test-id';
    render(<Input id={id} placeholder="測試輸入" />);

    const input = screen.getByPlaceholderText('測試輸入');
    expect(input).toHaveAttribute('id', id);
  });

  it('應該正確設定 className', () => {
    const customClass = 'custom-class';
    render(<Input className={customClass} placeholder="測試輸入" />);

    const input = screen.getByPlaceholderText('測試輸入');
    expect(input).toHaveClass(customClass);
  });

  it('應該包含預設的 CSS 類別', () => {
    render(<Input placeholder="測試輸入" />);

    const input = screen.getByPlaceholderText('測試輸入');
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-3',
      'py-2',
      'text-base',
      'ring-offset-background',
      'file:border-0',
      'file:bg-transparent',
      'file:text-sm',
      'file:font-medium',
      'file:text-foreground',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'md:text-sm'
    );
  });

  it('應該正確設定 ref', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="測試輸入" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('應該正確處理其他 HTML 屬性', () => {
    render(
      <Input
        placeholder="測試輸入"
        data-testid="custom-input"
        aria-label="自定義標籤"
      />
    );

    const input = screen.getByTestId('custom-input');
    expect(input).toHaveAttribute('aria-label', '自定義標籤');
  });

  it('應該正確設定不同的 type 類型', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url'];
    
    types.forEach(type => {
      const { unmount } = render(<Input type={type} placeholder={`${type} 輸入`} />);
      
      const input = screen.getByPlaceholderText(`${type} 輸入`);
      expect(input).toHaveAttribute('type', type);
      
      unmount();
    });
  });
}); 