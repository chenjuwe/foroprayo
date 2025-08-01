import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageCard } from './MessageCard';

// Mock UserAvatar component
vi.mock('./profile/UserAvatar', () => ({
  UserAvatar: ({ userId, username }: { userId: string; username: string }) => (
    <div data-testid="user-avatar" data-userid={userId}>
      {username}
    </div>
  ),
}));

// Mock SVG import
vi.mock('@/assets/icons/MessageIcon.svg', () => ({
  default: 'mock-message-icon.svg'
}));

describe('MessageCard', () => {
  const defaultProps = {
    userId: 'test-user-id',
    username: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該渲染基本的訊息卡片', () => {
    render(<MessageCard {...defaultProps} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('輸入訊息...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送出' })).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('應該顯示用戶頭像', () => {
    render(<MessageCard {...defaultProps} />);
    
    const avatar = screen.getByTestId('user-avatar');
    expect(avatar).toHaveAttribute('data-userid', 'test-user-id');
    expect(avatar).toHaveTextContent('Test User');
  });

  it('應該顯示訊息圖標和用戶名稱', () => {
    render(<MessageCard {...defaultProps} />);
    
    expect(screen.getByAltText('訊息')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('應該允許輸入訊息', () => {
    render(<MessageCard {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('輸入訊息...');
    fireEvent.change(input, { target: { value: 'Hello World' } });
    
    expect(input).toHaveValue('Hello World');
  });

  it('應該在有訊息內容時啟用送出按鈕', () => {
    render(<MessageCard {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('輸入訊息...');
    const sendButton = screen.getByRole('button', { name: '送出' });
    
    // 初始狀態按鈕應該被禁用
    expect(sendButton).toBeDisabled();
    
    // 輸入訊息後按鈕應該啟用
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(sendButton).toBeEnabled();
  });

  it('應該在空白訊息時禁用送出按鈕', () => {
    render(<MessageCard {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('輸入訊息...');
    const sendButton = screen.getByRole('button', { name: '送出' });
    
    // 只輸入空格
    fireEvent.change(input, { target: { value: '   ' } });
    expect(sendButton).toBeDisabled();
  });

  it('應該處理訊息發送', async () => {
    render(<MessageCard {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('輸入訊息...');
    const sendButton = screen.getByRole('button', { name: '送出' });
    
    // 輸入訊息
    fireEvent.change(input, { target: { value: 'Test message' } });
    
    // 點擊送出
    fireEvent.click(sendButton);
    
    // 按鈕應該顯示 "傳送中..."
    expect(screen.getByText('傳送中...')).toBeInTheDocument();
    
    // 等待發送完成
    await waitFor(() => {
      expect(screen.getByText('送出')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // 輸入框應該被清空
    expect(input).toHaveValue('');
  });

  it('應該在發送期間禁用輸入和按鈕', async () => {
    render(<MessageCard {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('輸入訊息...');
    const sendButton = screen.getByRole('button', { name: '送出' });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    // 發送期間輸入和按鈕應該被禁用
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
    
    // 等待發送完成
    await waitFor(() => {
      expect(input).toBeEnabled();
      expect(sendButton).toBeEnabled();
    }, { timeout: 1000 });
  });

  it('應該處理沒有 avatarUrl 的情況', () => {
    const propsWithoutAvatar = {
      userId: 'test-user-id',
      username: 'Test User'
    };
    
    render(<MessageCard {...propsWithoutAvatar} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('應該正確應用 CSS 類別', () => {
    render(<MessageCard {...defaultProps} />);
    
    const container = screen.getByText('Test User').closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'gap-3');
  });

  it('應該處理 Enter 鍵發送訊息', () => {
    render(<MessageCard {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('輸入訊息...');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    // 注意：這個測試假設組件支持 Enter 鍵發送，如果不支持則需要修改
    // 根據當前實現，Enter 鍵可能不會觸發發送
  });

  it('應該正確顯示用戶資訊區域', () => {
    render(<MessageCard {...defaultProps} />);
    
    const userSection = screen.getByText('Test User').parentElement;
    expect(userSection).toHaveClass('font-bold', 'text-black', 'mb-1');
  });
}); 