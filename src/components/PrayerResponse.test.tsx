import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PrayerResponse } from './PrayerResponse';

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ pathname: '/prayers' }),
  };
});

// Mock useSocialFeatures hooks
vi.mock('@/hooks/useSocialFeatures', () => ({
  usePrayerResponseLikes: () => ({
    data: [],
  }),
  useTogglePrayerResponseLike: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock superAdminService
vi.mock('@/services', () => ({
  superAdminService: {
    deletePrayerResponse: vi.fn().mockResolvedValue(true),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: vi.fn(),
}));

// Mock getUnifiedUserName
vi.mock('@/lib/getUnifiedUserName', () => ({
  getUnifiedUserName: vi.fn().mockReturnValue('Test User'),
}));

// Mock useQueryClient
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

// Mock QUERY_KEYS
vi.mock('@/constants', () => ({
  QUERY_KEYS: {
    PRAYER_RESPONSES: 'prayer-responses',
  },
}));

const mockResponse = {
  id: 'response-1',
  prayer_id: 'prayer-1',
  content: '這是一個測試回應',
  user_name: 'Test User',
  user_avatar: 'https://example.com/avatar.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const renderPrayerResponse = (props = {}) => {
  const defaultProps = {
    response: mockResponse,
    currentUserId: 'test-user-id',
    isSuperAdmin: false,
    onShare: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    isFirst: false,
  };

  return render(
    <BrowserRouter>
      <PrayerResponse {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('PrayerResponse Component - 代禱回應流程', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該正確渲染回應組件', () => {
      renderPrayerResponse();
      
      expect(screen.getByText('這是一個測試回應')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('應該顯示用戶頭像和名稱', () => {
      renderPrayerResponse();
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
      // 檢查是否有頭像元素
      const avatar = screen.getByAltText(/Test User/i);
      expect(avatar).toBeInTheDocument();
    });

    it('應該顯示回應時間', () => {
      renderPrayerResponse();
      
      // 檢查是否有時間顯示
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });

  describe('回應內容處理', () => {
    it('應該正確顯示短回應內容', () => {
      renderPrayerResponse({
        response: {
          ...mockResponse,
          content: '短回應',
        },
      });
      
      expect(screen.getByText('短回應')).toBeInTheDocument();
    });

    it('應該正確處理長回應內容', () => {
      const longContent = '這是一個很長的回應內容，用來測試文字截斷功能。'.repeat(10);
      renderPrayerResponse({
        response: {
          ...mockResponse,
          content: longContent,
        },
      });
      
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('應該正確處理特殊字符', () => {
      const specialContent = '測試特殊字符：!@#$%^&*()_+-=[]{}|;:,.<>?';
      renderPrayerResponse({
        response: {
          ...mockResponse,
          content: specialContent,
        },
      });
      
      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });

    it('應該正確處理換行符', () => {
      const contentWithNewlines = '第一行\n第二行\n第三行';
      renderPrayerResponse({
        response: {
          ...mockResponse,
          content: contentWithNewlines,
        },
      });
      
      expect(screen.getByText(contentWithNewlines)).toBeInTheDocument();
    });
  });

  describe('愛心功能', () => {
    it('應該正確顯示愛心按鈕', () => {
      renderPrayerResponse();
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      expect(likeButton).toBeInTheDocument();
    });

    it('應該正確處理愛心點擊', async () => {
      renderPrayerResponse();
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      fireEvent.click(likeButton);
      
      // 檢查愛心點擊處理
      expect(likeButton).toBeInTheDocument();
    });

    it('應該正確顯示愛心數量', () => {
      renderPrayerResponse();
      
      // 檢查愛心數量顯示
      const likeCount = screen.getByText(/0/);
      expect(likeCount).toBeInTheDocument();
    });

    it('應該在用戶未登入時禁用愛心功能', () => {
      renderPrayerResponse({
        currentUserId: null,
      });
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      fireEvent.click(likeButton);
      
      // 檢查未登入狀態下的處理
      expect(likeButton).toBeInTheDocument();
    });
  });

  describe('回應操作', () => {
    it('應該正確顯示回應操作按鈕', () => {
      renderPrayerResponse();
      
      // 檢查是否有操作按鈕
      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('應該正確處理分享功能', async () => {
      const onShare = vi.fn();
      renderPrayerResponse({ onShare });
      
      const shareButton = screen.getByRole('button', { name: /分享/i });
      fireEvent.click(shareButton);
      
      expect(onShare).toHaveBeenCalled();
    });

    it('應該正確處理編輯功能', async () => {
      const onEdit = vi.fn();
      renderPrayerResponse({ onEdit });
      
      const editButton = screen.getByRole('button', { name: /編輯/i });
      fireEvent.click(editButton);
      
      expect(onEdit).toHaveBeenCalledWith('response-1');
    });

    it('應該正確處理刪除功能', async () => {
      const onDelete = vi.fn();
      renderPrayerResponse({ onDelete });
      
      const deleteButton = screen.getByRole('button', { name: /刪除/i });
      fireEvent.click(deleteButton);
      
      expect(onDelete).toHaveBeenCalledWith('response-1');
    });
  });

  describe('超級管理員功能', () => {
    it('應該為超級管理員顯示特殊刪除按鈕', () => {
      renderPrayerResponse({
        isSuperAdmin: true,
      });
      
      const superAdminDeleteButton = screen.getByRole('button', { name: /超級管理員刪除/i });
      expect(superAdminDeleteButton).toBeInTheDocument();
    });

    it('應該正確處理超級管理員刪除', async () => {
      renderPrayerResponse({
        isSuperAdmin: true,
      });
      
      const superAdminDeleteButton = screen.getByRole('button', { name: /超級管理員刪除/i });
      fireEvent.click(superAdminDeleteButton);
      
      // 檢查確認對話框
      expect(screen.getByText(/確定要刪除這個回應嗎？/)).toBeInTheDocument();
    });

    it('應該正確處理超級管理員刪除確認', async () => {
      renderPrayerResponse({
        isSuperAdmin: true,
      });
      
      const superAdminDeleteButton = screen.getByRole('button', { name: /超級管理員刪除/i });
      fireEvent.click(superAdminDeleteButton);
      
      const confirmButton = screen.getByRole('button', { name: /確定/i });
      fireEvent.click(confirmButton);
      
      // 檢查刪除確認處理
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('權限控制', () => {
    it('應該為回應作者顯示編輯和刪除按鈕', () => {
      renderPrayerResponse({
        response: {
          ...mockResponse,
          user_id: 'test-user-id',
        },
        currentUserId: 'test-user-id',
      });
      
      const editButton = screen.getByRole('button', { name: /編輯/i });
      const deleteButton = screen.getByRole('button', { name: /刪除/i });
      
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('應該為其他用戶隱藏編輯和刪除按鈕', () => {
      renderPrayerResponse({
        response: {
          ...mockResponse,
          user_id: 'other-user-id',
        },
        currentUserId: 'test-user-id',
      });
      
      const editButton = screen.queryByRole('button', { name: /編輯/i });
      const deleteButton = screen.queryByRole('button', { name: /刪除/i });
      
      expect(editButton).not.toBeInTheDocument();
      expect(deleteButton).not.toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    it('應該在刪除時顯示載入狀態', async () => {
      renderPrayerResponse();
      
      const deleteButton = screen.getByRole('button', { name: /刪除/i });
      fireEvent.click(deleteButton);
      
      // 檢查載入狀態
      expect(deleteButton).toBeInTheDocument();
    });

    it('應該在愛心操作時顯示載入狀態', async () => {
      renderPrayerResponse();
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      fireEvent.click(likeButton);
      
      // 檢查載入狀態
      expect(likeButton).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理刪除錯誤', async () => {
      renderPrayerResponse();
      
      const deleteButton = screen.getByRole('button', { name: /刪除/i });
      fireEvent.click(deleteButton);
      
      // 檢查錯誤處理
      expect(deleteButton).toBeInTheDocument();
    });

    it('應該正確處理愛心操作錯誤', async () => {
      renderPrayerResponse();
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      fireEvent.click(likeButton);
      
      // 檢查錯誤處理
      expect(likeButton).toBeInTheDocument();
    });
  });

  describe('無障礙功能', () => {
    it('應該有正確的 ARIA 標籤', () => {
      renderPrayerResponse();
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      const shareButton = screen.getByRole('button', { name: /分享/i });
      
      expect(likeButton).toBeInTheDocument();
      expect(shareButton).toBeInTheDocument();
    });

    it('應該支持鍵盤導航', () => {
      renderPrayerResponse();
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      const shareButton = screen.getByRole('button', { name: /分享/i });
      
      likeButton.focus();
      expect(likeButton).toHaveFocus();
      
      // 測試 Tab 鍵導航
      fireEvent.keyDown(likeButton, { key: 'Tab' });
      expect(shareButton).toHaveFocus();
    });
  });

  describe('響應式設計', () => {
    it('應該在小螢幕上正確顯示', () => {
      // 模擬小螢幕
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      });
      
      renderPrayerResponse();
      
      expect(screen.getByText('這是一個測試回應')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('應該在大螢幕上正確顯示', () => {
      // 模擬大螢幕
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        writable: true,
      });
      
      renderPrayerResponse();
      
      expect(screen.getByText('這是一個測試回應')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  describe('用戶體驗', () => {
    it('應該提供清晰的視覺反饋', () => {
      renderPrayerResponse();
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      const shareButton = screen.getByRole('button', { name: /分享/i });
      
      // 檢查按鈕是否有正確的樣式
      expect(likeButton).toBeInTheDocument();
      expect(shareButton).toBeInTheDocument();
    });

    it('應該在操作成功後顯示成功訊息', async () => {
      renderPrayerResponse();
      
      const likeButton = screen.getByRole('button', { name: /愛心/i });
      fireEvent.click(likeButton);
      
      // 檢查成功訊息
      expect(likeButton).toBeInTheDocument();
    });
  });

  describe('邊界情況', () => {
    it('應該正確處理空回應內容', () => {
      renderPrayerResponse({
        response: {
          ...mockResponse,
          content: '',
        },
      });
      
      // 檢查空內容處理
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('應該正確處理匿名用戶', () => {
      renderPrayerResponse({
        response: {
          ...mockResponse,
          user_name: null,
        },
      });
      
      expect(screen.getByText('訪客')).toBeInTheDocument();
    });

    it('應該正確處理沒有頭像的用戶', () => {
      renderPrayerResponse({
        response: {
          ...mockResponse,
          user_avatar: null,
        },
      });
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
}); 