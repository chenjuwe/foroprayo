import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthFooter } from './AuthFooter';

describe('AuthFooter', () => {
  it('應該正確渲染頁腳內容', () => {
    render(<AuthFooter />);

    expect(screen.getByText(/App 版本/)).toBeInTheDocument();
    expect(screen.getByText(/聯絡建議/)).toBeInTheDocument();
    expect(screen.getByText(/amen@foroprayo.com/)).toBeInTheDocument();
  });

  it('應該包含版本資訊', () => {
    render(<AuthFooter />);

    const versionText = screen.getByText(/App 版本/);
    expect(versionText).toBeInTheDocument();
    expect(versionText.textContent).toContain('v0.3.348');
    expect(versionText.textContent).toContain('2025-11-10');
  });

  it('應該包含聯絡資訊', () => {
    render(<AuthFooter />);

    const contactText = screen.getByText(/聯絡建議/);
    const emailText = screen.getByText(/amen@foroprayo.com/);
    
    expect(contactText).toBeInTheDocument();
    expect(emailText).toBeInTheDocument();
  });

  it('應該包含正確的 CSS 類別', () => {
    render(<AuthFooter />);

    // 找到包含 "App 版本" 文字的 div，然後找到其父容器
    const versionDiv = screen.getByText(/App 版本/).closest('div');
    const container = versionDiv?.parentElement;
    expect(container).toHaveClass('space-y-1', 'text-left');
  });

  it('應該正確設定容器樣式', () => {
    render(<AuthFooter />);

    // 找到包含 "App 版本" 文字的 div，然後找到其父容器
    const versionDiv = screen.getByText(/App 版本/).closest('div');
    const container = versionDiv?.parentElement;
    expect(container).toHaveStyle({
      width: '270px',
      paddingTop: '244px',
    });
  });

  it('應該正確設定文字樣式', () => {
    render(<AuthFooter />);

    const versionDiv = screen.getByText(/App 版本/).closest('div');
    const contactDiv = screen.getByText(/聯絡建議/).closest('div');

    expect(versionDiv).toHaveClass('text-black');
    expect(contactDiv).toHaveClass('text-black');
    expect(versionDiv).toHaveStyle({ fontSize: '14px' });
    expect(contactDiv).toHaveStyle({ fontSize: '14px' });
  });

  it('應該包含兩個主要區塊', () => {
    render(<AuthFooter />);

    const divs = screen.getAllByText(/App 版本|聯絡建議/);
    expect(divs).toHaveLength(2);
  });

  it('應該正確顯示版本號格式', () => {
    render(<AuthFooter />);

    const versionText = screen.getByText(/App 版本/);
    expect(versionText.textContent).toMatch(/v\d+\.\d+\.\d+/);
  });

  it('應該正確顯示日期格式', () => {
    render(<AuthFooter />);

    const versionText = screen.getByText(/App 版本/);
    expect(versionText.textContent).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
}); 