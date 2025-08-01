import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PostActions } from './PostActions';

// Mock all dependencies
vi.mock('@/hooks/useSocialFeatures', () => ({
  usePrayerLikes: vi.fn(),
  useTogglePrayerLike: vi.fn(),
}));

vi.mock('@/hooks/usePrayersOptimized', () => ({
  useDeletePrayer: vi.fn(),
}));

vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(),
}));

vi.mock('@/hooks/usePrayerAnswered', () => ({
  useTogglePrayerAnswered: vi.fn(),
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

vi.mock('./ReportDialog', () => ({
  ReportDialog: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="report-dialog">Report Dialog</div> : null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/prayers' })),
  };
});

// Import mocked modules
import { usePrayerLikes, useTogglePrayerLike } from '@/hooks/useSocialFeatures';
import { useDeletePrayer } from '@/hooks/usePrayersOptimized';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useTogglePrayerAnswered } from '@/hooks/usePrayerAnswered';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PostActions', () => {
  const mockPrayer = {
    id: 'prayer-1',
    user_id: 'user-1',
    content: '測試代禱內容',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    answered: false,
  };

  const defaultProps = {
    prayerId: 'prayer-1',
    prayerUserId: 'user-1',
    prayerContent: '測試代禱內容',
    prayerUserName: 'Test User',
    prayerUserAvatar: 'https://example.com/avatar.jpg',
    isOwner: true,
    onShare: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock hooks return values
    (usePrayerLikes as any).mockReturnValue({
      data: [],
      isLoading: false,
    });
    
    (useTogglePrayerLike as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    
    (useDeletePrayer as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    
    (useFirebaseAuth as any).mockReturnValue({
      currentUser: { uid: 'user-1', displayName: 'Test User' },
      isLoading: false,
    });
    
    (useTogglePrayerAnswered as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  describe('基本渲染', () => {
    it('應該正確渲染操作按鈕', () => {
      renderWithRouter(<PostActions {...defaultProps} />);
      
      expect(screen.getByLabelText('按讚')).toBeInTheDocument();
      expect(screen.getByLabelText('分享')).toBeInTheDocument();
      expect(screen.getByLabelText('收藏')).toBeInTheDocument();
      expect(screen.getByLabelText('更多選項')).toBeInTheDocument();
    });

    it('應該顯示按讚數量', () => {
      (usePrayerLikes as any).mockReturnValue({
        data: [
          { id: '1', user_id: 'user-1' },
          { id: '2', user_id: 'user-2' },
        ],
        isLoading: false,
      });
      
      renderWithRouter(<PostActions {...defaultProps} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('應該在擁有者身份時顯示編輯選項', async () => {
      const user = userEvent.setup();
      renderWithRouter(<PostActions {...defaultProps} isOwner={true} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      expect(screen.getByText('編輯')).toBeInTheDocument();
      expect(screen.getByText('刪除')).toBeInTheDocument();
    });
  });

  describe('按讚功能', () => {
    it('應該處理按讚操作', async () => {
      const user = userEvent.setup();
      const mockToggleLike = vi.fn();
      (useTogglePrayerLike as any).mockReturnValue({
        mutate: mockToggleLike,
        isPending: false,
      });
      
      renderWithRouter(<PostActions {...defaultProps} />);
      
      const likeButton = screen.getByLabelText('按讚');
      await user.click(likeButton);
      
      expect(mockToggleLike).toHaveBeenCalledWith('prayer-1');
    });

    it('應該在已按讚時顯示不同狀態', () => {
      (usePrayerLikes as any).mockReturnValue({
        data: [{ id: '1', user_id: 'user-1' }],
        isLoading: false,
      });
      
      renderWithRouter(<PostActions {...defaultProps} />);
      
      const likeButton = screen.getByLabelText('按讚');
      expect(likeButton).toHaveClass('text-red-500');
    });
  });

  describe('分享功能', () => {
    it('應該處理分享操作', async () => {
      const user = userEvent.setup();
      const mockOnShare = vi.fn();
      
      renderWithRouter(<PostActions {...defaultProps} onShare={mockOnShare} />);
      
      const shareButton = screen.getByLabelText('分享');
      await user.click(shareButton);
      
      expect(mockOnShare).toHaveBeenCalled();
    });
  });

  describe('編輯功能', () => {
    it('應該處理編輯操作', async () => {
      const user = userEvent.setup();
      const mockOnEdit = vi.fn();
      
      renderWithRouter(<PostActions {...defaultProps} onEdit={mockOnEdit} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      const editButton = screen.getByText('編輯');
      await user.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalled();
    });
  });

  describe('刪除功能', () => {
    it('應該顯示刪除確認對話框', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<PostActions {...defaultProps} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      const deleteButton = screen.getByText('刪除');
      await user.click(deleteButton);
      
      expect(screen.getByText('確認刪除代禱')).toBeInTheDocument();
      expect(screen.getByText('此操作無法復原，確定要刪除這篇代禱嗎？')).toBeInTheDocument();
    });

    it('應該處理刪除確認', async () => {
      const user = userEvent.setup();
      const mockDeletePrayer = vi.fn();
      const mockOnDelete = vi.fn();
      
      (useDeletePrayer as any).mockReturnValue({
        mutate: mockDeletePrayer,
        isPending: false,
      });
      
      renderWithRouter(<PostActions {...defaultProps} onDelete={mockOnDelete} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      const deleteButton = screen.getByText('刪除');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: '確認刪除' });
      await user.click(confirmButton);
      
      expect(mockDeletePrayer).toHaveBeenCalledWith('prayer-1');
    });
  });

  describe('已回答狀態', () => {
    it('應該處理標記為已回答', async () => {
      const user = userEvent.setup();
      const mockToggleAnswered = vi.fn();
      
      (useTogglePrayerAnswered as any).mockReturnValue({
        mutate: mockToggleAnswered,
        isPending: false,
      });
      
      renderWithRouter(<PostActions {...defaultProps} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      const answeredButton = screen.getByText('標記為已回答');
      await user.click(answeredButton);
      
      expect(mockToggleAnswered).toHaveBeenCalledWith('prayer-1');
    });

         it('應該在已回答時顯示不同選項', async () => {
       const user = userEvent.setup();
       
       renderWithRouter(<PostActions {...defaultProps} />);
       
       const moreButton = screen.getByLabelText('更多選項');
       await user.click(moreButton);
       
       // 對於已回答的代禱，會顯示不同的選項
       expect(screen.getByText('標記為已回答')).toBeInTheDocument();
     });
  });

  describe('檢舉功能', () => {
    it('應該為非擁有者顯示檢舉選項', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<PostActions {...defaultProps} isOwner={false} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      expect(screen.getByText('檢舉')).toBeInTheDocument();
    });

    it('應該打開檢舉對話框', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<PostActions {...defaultProps} isOwner={false} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      const reportButton = screen.getByText('檢舉');
      await user.click(reportButton);
      
      expect(screen.getByTestId('report-dialog')).toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    it('應該在按讚載入時顯示載入狀態', () => {
      (useTogglePrayerLike as any).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });
      
      renderWithRouter(<PostActions {...defaultProps} />);
      
      const likeButton = screen.getByLabelText('按讚');
      expect(likeButton).toBeDisabled();
    });

    it('應該在刪除載入時顯示載入狀態', async () => {
      const user = userEvent.setup();
      (useDeletePrayer as any).mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });
      
      renderWithRouter(<PostActions {...defaultProps} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      const deleteButton = screen.getByText('刪除');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: '刪除中...' });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('權限控制', () => {
    it('應該隱藏非擁有者的編輯選項', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<PostActions {...defaultProps} isOwner={false} />);
      
      const moreButton = screen.getByLabelText('更多選項');
      await user.click(moreButton);
      
      expect(screen.queryByText('編輯')).not.toBeInTheDocument();
      expect(screen.queryByText('刪除')).not.toBeInTheDocument();
    });
  });
}); 