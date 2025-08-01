import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  const defaultProps = {
    icon: '/path/to/icon.svg',
    title: 'Test Section',
    backgroundColor: '#ff0000'
  };

  it('應該渲染基本的區塊標題', () => {
    render(<SectionHeader {...defaultProps} />);
    
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('應該正確設置圖標屬性', () => {
    render(<SectionHeader {...defaultProps} iconAlt="Test Icon" />);
    
    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('src', '/path/to/icon.svg');
    expect(icon).toHaveAttribute('alt', 'Test Icon');
  });

  it('應該使用默認的 iconAlt 值', () => {
    render(<SectionHeader {...defaultProps} />);
    
    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('alt', '');
  });

  it('應該正確應用背景顏色', () => {
    render(<SectionHeader {...defaultProps} />);
    
    const container = screen.getByText('Test Section').parentElement;
    expect(container).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('應該應用正確的 CSS 類別', () => {
    render(<SectionHeader {...defaultProps} />);
    
    const outerContainer = screen.getByText('Test Section').closest('div');
    expect(outerContainer).toHaveClass(
      'inline-flex',
      'text-sm',
      'md:text-base',
      'text-black',
      'font-bold',
      'whitespace-nowrap'
    );
  });

  it('應該正確設置內部容器的樣式', () => {
    render(<SectionHeader {...defaultProps} />);
    
    const innerContainer = screen.getByText('Test Section').parentElement;
    expect(innerContainer).toHaveClass(
      'flex',
      'items-center',
      'gap-2',
      'md:gap-3',
      'px-3',
      'md:px-4',
      'py-2',
      'md:py-3',
      'rounded-full'
    );
  });

  it('應該正確設置圖標樣式', () => {
    render(<SectionHeader {...defaultProps} />);
    
    const icon = screen.getByRole('img');
    expect(icon).toHaveClass(
      'aspect-[1]',
      'object-contain',
      'w-4',
      'md:w-5',
      'shrink-0'
    );
  });

  it('應該處理長標題', () => {
    const longTitle = 'This is a very long section title that might wrap';
    render(<SectionHeader {...defaultProps} title={longTitle} />);
    
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('應該處理空標題', () => {
    render(<SectionHeader {...defaultProps} title="" />);
    
    const titleElement = screen.getByText('Test Section').parentElement?.querySelector('div:last-child');
    expect(titleElement).toBeInTheDocument();
  });

  it('應該處理特殊字符在標題中', () => {
    const titleWithSpecialChars = 'Section & Title <>"';
    render(<SectionHeader {...defaultProps} title={titleWithSpecialChars} />);
    
    expect(screen.getByText(titleWithSpecialChars)).toBeInTheDocument();
  });

  it('應該處理不同的背景顏色格式', () => {
    const { rerender } = render(<SectionHeader {...defaultProps} backgroundColor="red" />);
    
    let container = screen.getByText('Test Section').parentElement;
    expect(container).toHaveStyle({ backgroundColor: 'red' });

    rerender(<SectionHeader {...defaultProps} backgroundColor="rgb(255, 0, 0)" />);
    container = screen.getByText('Test Section').parentElement;
    expect(container).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });

    rerender(<SectionHeader {...defaultProps} backgroundColor="rgba(255, 0, 0, 0.5)" />);
    container = screen.getByText('Test Section').parentElement;
    expect(container).toHaveStyle({ backgroundColor: 'rgba(255, 0, 0, 0.5)' });
  });

  it('應該處理不同的圖標路徑', () => {
    const { rerender } = render(<SectionHeader {...defaultProps} icon="/icon1.svg" />);
    
    let icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('src', '/icon1.svg');

    rerender(<SectionHeader {...defaultProps} icon="https://example.com/icon.png" />);
    icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('src', 'https://example.com/icon.png');

    rerender(<SectionHeader {...defaultProps} icon="./relative/path/icon.jpg" />);
    icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('src', './relative/path/icon.jpg');
  });

  it('應該正確渲染響應式設計類別', () => {
    render(<SectionHeader {...defaultProps} />);
    
    // 檢查外層容器的響應式類別
    const outerContainer = screen.getByText('Test Section').closest('div');
    expect(outerContainer).toHaveClass('text-sm', 'md:text-base');

    // 檢查內層容器的響應式類別
    const innerContainer = screen.getByText('Test Section').parentElement;
    expect(innerContainer).toHaveClass('gap-2', 'md:gap-3', 'px-3', 'md:px-4', 'py-2', 'md:py-3');

    // 檢查圖標的響應式類別
    const icon = screen.getByRole('img');
    expect(icon).toHaveClass('w-4', 'md:w-5');
  });

  it('應該處理無障礙功能', () => {
    render(<SectionHeader {...defaultProps} iconAlt="Section icon" />);
    
    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('alt', 'Section icon');
  });

  it('應該保持文字不換行', () => {
    render(<SectionHeader {...defaultProps} />);
    
    const outerContainer = screen.getByText('Test Section').closest('div');
    expect(outerContainer).toHaveClass('whitespace-nowrap');
  });

  it('應該使用正確的文字樣式', () => {
    render(<SectionHeader {...defaultProps} />);
    
    const outerContainer = screen.getByText('Test Section').closest('div');
    expect(outerContainer).toHaveClass('text-black', 'font-bold');
  });

  it('應該正確處理所有必需屬性', () => {
    // 測試缺少必需屬性的情況（在 TypeScript 中會報錯，但測試完整性）
    expect(() => {
      render(
        <SectionHeader
          icon=""
          title=""
          backgroundColor=""
        />
      );
    }).not.toThrow();
  });
}); 