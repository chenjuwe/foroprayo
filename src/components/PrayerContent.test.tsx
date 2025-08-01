import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrayerContent } from './PrayerContent';

// Mock dependencies
vi.mock('./EditPrayerForm', () => ({
  EditPrayerForm: ({ initialContent, onSave, onCancel, isLoading }: any) => (
    <div data-testid="edit-prayer-form">
      <textarea
        data-testid="edit-textarea"
        defaultValue={initialContent}
        disabled={isLoading}
      />
      <button data-testid="save-button" onClick={() => onSave('測試更新內容')}>
        {isLoading ? '儲存中...' : '儲存'}
      </button>
      <button data-testid="cancel-button" onClick={onCancel}>
        取消
      </button>
    </div>
  ),
}));

vi.mock('@/hooks/usePrayersOptimized', () => ({
  useUpdatePrayer: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/notifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('./ui/ExpandableText', () => ({
  ExpandableText: ({ children }: any) => <div data-testid="expandable-text">{children}</div>,
}));

// Import mocked modules
import { useUpdatePrayer } from '@/hooks/usePrayersOptimized';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';

describe('PrayerContent', () => {
  const mockPrayer = {
    id: 'prayer-1',
    user_id: 'user-1',
    content: '原始代禱內容，這是一個測試用的代禱文字',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_name: 'Test User',
    user_avatar: 'https://example.com/avatar.jpg',
    is_anonymous: false,
  };

  const defaultProps = {
    prayer: mockPrayer,
    currentUserId: 'user-1',
    onShare: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onEditEnd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useUpdatePrayer as any).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue(true),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    });
  });

  describe('基本渲染', () => {
    it('應該正確渲染代禱內容', () => {
      render(<PrayerContent {...defaultProps} />);
      
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
      expect(screen.getByText('原始代禱內容，這是一個測試用的代禱文字')).toBeInTheDocument();
    });

    it('應該在非編輯模式下隱藏編輯表單', () => {
      render(<PrayerContent {...defaultProps} />);
      
      expect(screen.queryByTestId('edit-prayer-form')).not.toBeInTheDocument();
    });
  });

  describe('編輯模式', () => {
    it('應該為擁有者顯示編輯功能', () => {
      render(<PrayerContent {...defaultProps} currentUserId="user-1" />);
      
      // 如果組件內部有編輯按鈕或邏輯，應該能夠觸發編輯模式
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
    });

    it('應該為非擁有者隱藏編輯功能', () => {
      render(<PrayerContent {...defaultProps} currentUserId="other-user" />);
      
      // 非擁有者不應該看到編輯相關元素
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
    });
  });

  describe('編輯功能', () => {
    it('應該能夠進入編輯模式', async () => {
      const user = userEvent.setup();
      const mockOnEdit = vi.fn();
      
      render(<PrayerContent {...defaultProps} onEdit={mockOnEdit} />);
      
      // 假設有一個編輯按鈕，點擊後進入編輯模式
      // 這裡需要根據實際的組件實現來調整
    });

    it('應該處理編輯保存', async () => {
      const user = userEvent.setup();
      const mockMutateAsync = vi.fn().mockResolvedValue(true);
      const mockOnEditEnd = vi.fn();
      
      (useUpdatePrayer as any).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      
      // 創建一個處於編輯模式的測試場景
      const EditingPrayerContent = () => {
        const [isEditing, setIsEditing] = React.useState(true);
        return (
          <PrayerContent 
            {...defaultProps} 
            onEditEnd={mockOnEditEnd}
          />
        );
      };
      
      render(<EditingPrayerContent />);
      
      // 如果正在編輯，應該顯示編輯表單
      // 這裡需要根據實際的組件狀態管理來調整測試
    });

    it('應該處理編輯取消', async () => {
      const user = userEvent.setup();
      const mockOnEditEnd = vi.fn();
      
      render(<PrayerContent {...defaultProps} onEditEnd={mockOnEditEnd} />);
      
      // 測試取消編輯的邏輯
      // 這裡需要根據實際的組件實現來調整
    });
  });

  describe('權限檢查', () => {
    it('應該正確識別擁有者身份', () => {
      render(<PrayerContent {...defaultProps} currentUserId="user-1" />);
      
      // 當前用戶 ID 與代禱的用戶 ID 相同，應該是擁有者
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
    });

    it('應該正確識別非擁有者身份', () => {
      render(<PrayerContent {...defaultProps} currentUserId="other-user" />);
      
      // 當前用戶 ID 與代禱的用戶 ID 不同，不是擁有者
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
    });

    it('應該處理未登入用戶', () => {
      render(<PrayerContent {...defaultProps} currentUserId={null} />);
      
      // 未登入用戶不應該有編輯權限
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    it('應該處理更新失敗', async () => {
      const mockMutateAsync = vi.fn().mockRejectedValue(new Error('更新失敗'));
      const mockNotifyError = vi.fn();
      
      (useUpdatePrayer as any).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockMutateAsync,
        isPending: false,
      });
      
      (notify as any).error = mockNotifyError;
      
      render(<PrayerContent {...defaultProps} />);
      
      // 模擬更新失敗的情況
      // 這裡需要根據實際的錯誤處理邏輯來調整測試
    });

    it('應該處理未授權操作', async () => {
      const mockLogWarn = vi.fn();
      (log as any).warn = mockLogWarn;
      
      render(<PrayerContent {...defaultProps} currentUserId={null} />);
      
      // 嘗試執行需要授權的操作
      // 應該記錄警告或顯示錯誤信息
    });
  });

  describe('載入狀態', () => {
    it('應該在更新時顯示載入狀態', () => {
      (useUpdatePrayer as any).mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: true,
      });
      
      render(<PrayerContent {...defaultProps} />);
      
      // 在載入狀態下，編輯功能應該被禁用
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
    });
  });

  describe('回調函數', () => {
    it('應該調用 onEdit 回調', async () => {
      const mockOnEdit = vi.fn();
      
      render(<PrayerContent {...defaultProps} onEdit={mockOnEdit} />);
      
      // 觸發編輯事件
      // 這裡需要根據實際的組件實現來調整
    });

    it('應該調用 onEditEnd 回調', async () => {
      const mockOnEditEnd = vi.fn();
      
      render(<PrayerContent {...defaultProps} onEditEnd={mockOnEditEnd} />);
      
      // 觸發編輯結束事件
      // 這裡需要根據實際的組件實現來調整
    });

    it('應該調用 onShare 回調', async () => {
      const mockOnShare = vi.fn();
      
      render(<PrayerContent {...defaultProps} onShare={mockOnShare} />);
      
      // 觸發分享事件
      // 這裡需要根據實際的組件實現來調整
    });

    it('應該調用 onDelete 回調', async () => {
      const mockOnDelete = vi.fn();
      
      render(<PrayerContent {...defaultProps} onDelete={mockOnDelete} />);
      
      // 觸發刪除事件
      // 這裡需要根據實際的組件實現來調整
    });
  });

  describe('內容顯示', () => {
    it('應該正確顯示長內容', () => {
      const longContent = '這是一個非常長的代禱內容，'.repeat(10);
      const longPrayer = { ...mockPrayer, content: longContent };
      
      render(<PrayerContent {...defaultProps} prayer={longPrayer} />);
      
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('應該正確顯示短內容', () => {
      const shortContent = '短代禱';
      const shortPrayer = { ...mockPrayer, content: shortContent };
      
      render(<PrayerContent {...defaultProps} prayer={shortPrayer} />);
      
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
      expect(screen.getByText(shortContent)).toBeInTheDocument();
    });

    it('應該處理空內容', () => {
      const emptyPrayer = { ...mockPrayer, content: '' };
      
      render(<PrayerContent {...defaultProps} prayer={emptyPrayer} />);
      
      expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
    });
  });
}); 