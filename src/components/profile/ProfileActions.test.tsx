import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileActions } from './ProfileActions';

describe('ProfileActions', () => {
  it('應該正確渲染所有按鈕', () => {
    render(<ProfileActions />);
    
    // 檢查所有按鈕是否存在
    expect(screen.getByRole('button', { name: '儲存變更' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '變更密碼' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '隱私設定' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '通知設定' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登出帳號' })).toBeInTheDocument();
  });

  it('應該正確應用樣式類別', () => {
    render(<ProfileActions />);
    
    const saveButton = screen.getByRole('button', { name: '儲存變更' });
    const changePasswordButton = screen.getByRole('button', { name: '變更密碼' });
    const logoutButton = screen.getByRole('button', { name: '登出帳號' });
    
    // 檢查主要按鈕樣式
    expect(saveButton).toHaveClass('bg-blue-500', 'text-white');
    
    // 檢查次要按鈕樣式
    expect(changePasswordButton).toHaveClass('bg-white', 'text-gray-700');
    
    // 檢查登出按鈕樣式
    expect(logoutButton).toHaveClass('text-red-500');
  });

  it('應該支援按鈕點擊事件', async () => {
    const user = userEvent.setup();
    render(<ProfileActions />);
    
    const saveButton = screen.getByRole('button', { name: '儲存變更' });
    const changePasswordButton = screen.getByRole('button', { name: '變更密碼' });
    const logoutButton = screen.getByRole('button', { name: '登出帳號' });
    
    // 檢查按鈕是否可點擊
    await user.click(saveButton);
    await user.click(changePasswordButton);
    await user.click(logoutButton);
    
    // 按鈕應該沒有崩潰並且仍然存在
    expect(saveButton).toBeInTheDocument();
    expect(changePasswordButton).toBeInTheDocument();
    expect(logoutButton).toBeInTheDocument();
  });

  it('應該正確設置按鈕類型', () => {
    render(<ProfileActions />);
    
    const buttons = screen.getAllByRole('button');
    
    // 所有按鈕應該都是button類型
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  it('應該有正確的佈局結構', () => {
    const { container } = render(<ProfileActions />);
    
    // 檢查主容器
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('space-y-4');
    
    // 檢查是否有正確的分組
    const groups = container.querySelectorAll('.space-y-3, .pt-4');
    expect(groups.length).toBeGreaterThan(0);
  });

  it('應該在不同螢幕尺寸下正確顯示', () => {
    render(<ProfileActions />);
    
    const buttons = screen.getAllByRole('button');
    
    // 所有按鈕應該有全寬樣式
    buttons.forEach(button => {
      expect(button).toHaveClass('w-full');
    });
  });
}); 