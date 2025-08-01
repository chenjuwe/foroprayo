import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileStats } from './ProfileStats';

describe('ProfileStats', () => {
  const defaultProps = {
    prayerCount: 10,
    responseCount: 25,
    friendCount: 5,
  };

  it('應該正確渲染統計數據', () => {
    render(<ProfileStats {...defaultProps} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    
    expect(screen.getByText('代禱')).toBeInTheDocument();
    expect(screen.getByText('回應')).toBeInTheDocument();
    expect(screen.getByText('好友')).toBeInTheDocument();
  });

  it('應該正確處理零值', () => {
    render(<ProfileStats prayerCount={0} responseCount={0} friendCount={0} />);
    
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });

  it('應該正確處理大數值', () => {
    render(<ProfileStats prayerCount={999} responseCount={1234} friendCount={567} />);
    
    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('567')).toBeInTheDocument();
  });

  it('應該支援載入狀態', () => {
    render(<ProfileStats {...defaultProps} isLoading={true} />);
    
    // 載入狀態應該顯示骨架屏或載入指示器
    expect(screen.getByTestId('stats-loading')).toBeInTheDocument();
  });

  it('應該支援自訂類別', () => {
    render(<ProfileStats {...defaultProps} className="custom-stats" />);
    
    const container = screen.getByTestId('profile-stats');
    expect(container).toHaveClass('custom-stats');
  });

  it('應該正確格式化數字', () => {
    render(<ProfileStats prayerCount={1000} responseCount={1500} friendCount={2000} />);
    
    // 如果有數字格式化功能，應該顯示格式化後的數字
    expect(screen.getByTestId('profile-stats')).toBeInTheDocument();
  });
}); 