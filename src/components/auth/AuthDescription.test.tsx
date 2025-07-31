import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthDescription } from './AuthDescription';

describe('AuthDescription', () => {
  it('應該正確渲染登入模式的描述', () => {
    render(<AuthDescription isLogin={true} />);

    expect(screen.getByText(/登入帳號後，代禱紀錄會自動儲存於雲端/)).toBeInTheDocument();
    expect(screen.getByText(/讓每一次代禱都即時同步到你的每一個設備/)).toBeInTheDocument();
    expect(screen.getByText(/也可以跟好友互相禱告/)).toBeInTheDocument();
  });

  it('應該正確渲染註冊模式的描述', () => {
    render(<AuthDescription isLogin={false} />);

    expect(screen.getByText(/三步驟註冊帳號/)).toBeInTheDocument();
    expect(screen.getByText(/不需要其他的個人資料/)).toBeInTheDocument();
    expect(screen.getByText(/隱私安全又保密/)).toBeInTheDocument();
  });

  it('應該包含正確的 CSS 類別', () => {
    render(<AuthDescription isLogin={true} />);

    const descriptionElement = screen.getByText(/登入帳號後/).closest('div');
    expect(descriptionElement).toHaveClass('text-black', 'leading-relaxed', 'text-left');
  });

  it('應該正確設定樣式', () => {
    render(<AuthDescription isLogin={true} />);

    const descriptionElement = screen.getByText(/登入帳號後/).closest('div');
    expect(descriptionElement).toHaveStyle({
      width: '270px',
      fontSize: '14px',
      position: 'absolute',
      top: '158px',
      left: '50%',
      transform: 'translateX(-50%)',
    });
  });

  it('應該在登入模式下顯示完整的登入描述', () => {
    render(<AuthDescription isLogin={true} />);

    const descriptionText = screen.getByText(/登入帳號後，代禱紀錄會自動儲存於雲端/);
    expect(descriptionText).toBeInTheDocument();
  });

  it('應該在註冊模式下顯示完整的註冊描述', () => {
    render(<AuthDescription isLogin={false} />);

    const descriptionText = screen.getByText(/三步驟註冊帳號/);
    expect(descriptionText).toBeInTheDocument();
  });

  it('應該包含換行標籤', () => {
    render(<AuthDescription isLogin={true} />);

    const brElements = document.querySelectorAll('br');
    expect(brElements.length).toBeGreaterThan(0);
  });
}); 