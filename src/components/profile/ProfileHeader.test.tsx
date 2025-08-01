import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileHeader } from './ProfileHeader';

// Mock lucide-react icons
vi.mock('lucide-react/dist/esm/icons/arrow-left', () => ({
  default: ({ size, className }: { size: number; className: string }) => (
    <div data-testid="arrow-left-icon" data-size={size} className={className}>
      ArrowLeft
    </div>
  ),
}));

describe('ProfileHeader', () => {
  const mockOnBack = vi.fn();
  
  const defaultProps = {
    onBack: mockOnBack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染標題', () => {
    render(<ProfileHeader {...defaultProps} />);
    
    const title = screen.getByText('個人帳號設定');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-lg', 'font-medium', 'text-black');
  });

  it('應該正確渲染返回按鈕', () => {
    render(<ProfileHeader {...defaultProps} />);
    
    const backButton = screen.getByRole('button');
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveClass('flex', 'items-center', 'justify-center');
    
    // 檢查圖標是否存在
    const icon = screen.getByTestId('arrow-left-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-size', '20');
    expect(icon).toHaveClass('text-gray-700');
  });

  it('應該在點擊返回按鈕時調用onBack', async () => {
    const user = userEvent.setup();
    render(<ProfileHeader {...defaultProps} />);
    
    const backButton = screen.getByRole('button');
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('應該支援鍵盤訪問', async () => {
    const user = userEvent.setup();
    render(<ProfileHeader {...defaultProps} />);
    
    const backButton = screen.getByRole('button');
    
    // 測試鍵盤導航
    await user.tab();
    expect(backButton).toHaveFocus();
    
    // 測試空格鍵點擊
    await user.keyboard(' ');
    expect(mockOnBack).toHaveBeenCalledTimes(1);
    
    // 測試Enter鍵點擊
    await user.keyboard('{Enter}');
    expect(mockOnBack).toHaveBeenCalledTimes(2);
  });

  it('應該有正確的佈局結構', () => {
    const { container } = render(<ProfileHeader {...defaultProps} />);
    
    const header = container.firstChild;
    expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    
    // 檢查是否有spacer元素用於居中
    const spacer = container.querySelector('.w-10.h-10');
    expect(spacer).toBeInTheDocument();
  });

  it('應該處理快速連續點擊', async () => {
    const user = userEvent.setup();
    render(<ProfileHeader {...defaultProps} />);
    
    const backButton = screen.getByRole('button');
    
    // 快速點擊多次
    await user.click(backButton);
    await user.click(backButton);
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(3);
  });

  it('應該正確設置按鈕的無障礙屬性', () => {
    render(<ProfileHeader {...defaultProps} />);
    
    const backButton = screen.getByRole('button');
    expect(backButton).toHaveAttribute('type', 'button');
  });

  it('應該在不同顯示模式下正確渲染', () => {
    render(<ProfileHeader {...defaultProps} />);
    
    const header = screen.getByText('個人帳號設定').closest('div');
    expect(header).toHaveClass('bg-transparent');
    
    const backButton = screen.getByRole('button');
    expect(backButton).toHaveClass('bg-white', 'shadow-sm');
  });

  it('應該處理極端條件', () => {
    // 測試空的onBack函數
    const emptyOnBack = vi.fn();
    render(<ProfileHeader onBack={emptyOnBack} />);
    
    const backButton = screen.getByRole('button');
    fireEvent.click(backButton);
    
    expect(emptyOnBack).toHaveBeenCalledTimes(1);
  });
}); 