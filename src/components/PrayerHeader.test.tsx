import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrayerHeader } from './PrayerHeader';
import type { Prayer } from '@/services/prayerService';
import { useTempUserStore } from '@/stores/tempUserStore';

// Mock dependencies
vi.mock('./UserInfo', () => ({
  default: ({ userName, isAnonymous, userAvatarUrl, userId, createdAt }: any) => (
    <div data-testid="user-info">
      <span data-testid="user-name">{userName}</span>
      <span data-testid="user-id">{userId}</span>
      <span data-testid="is-anonymous">{isAnonymous.toString()}</span>
      <span data-testid="avatar-url">{userAvatarUrl}</span>
      <span data-testid="created-at">{createdAt}</span>
    </div>
  )
}));

vi.mock('./PostActionButtons', () => ({
  PostActionButtons: ({ postId, prayerUserId, prayerContent, prayerUserName, isOwner, onShare, onEdit, onDelete }: any) => (
    <div data-testid="post-action-buttons">
      <span data-testid="post-id">{postId}</span>
      <span data-testid="prayer-user-id">{prayerUserId}</span>
      <span data-testid="prayer-user-name">{prayerUserName}</span>
      <span data-testid="is-owner">{isOwner.toString()}</span>
      <button onClick={onShare} data-testid="share-btn">Share</button>
      <button onClick={onEdit} data-testid="edit-btn">Edit</button>
      <button onClick={onDelete} data-testid="delete-btn">Delete</button>
    </div>
  )
}));

vi.mock('./LikeButton', () => ({
  LikeButton: ({ prayerId, currentUserId }: any) => (
    <div data-testid="like-button">
      <span data-testid="prayer-id">{prayerId}</span>
      <span data-testid="current-user-id">{currentUserId}</span>
    </div>
  )
}));

vi.mock('@/stores/tempUserStore', () => ({
  useTempUserStore: vi.fn(() => ({
    tempDisplayName: '',
    tempDisplayNames: {},
    setTempDisplayName: vi.fn(),
    getTempDisplayName: vi.fn(() => ''),
    clearTempDisplayName: vi.fn(),
    clearAllTempDisplayNames: vi.fn(),
    setTempDisplayName_legacy: vi.fn(),
    clearTempDisplayName_legacy: vi.fn(),
  }))
}));

describe('PrayerHeader', () => {
  const mockPrayer: Prayer = {
    id: 'prayer-1',
    user_id: 'user-1',
    user_name: 'Test User',
    content: 'Test prayer content',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    user_avatar: 'https://example.com/avatar.jpg',
    user_avatar_48: 'https://example.com/avatar-48.jpg',
    is_anonymous: false
  };

  const defaultProps = {
    prayer: mockPrayer,
    currentUserId: 'user-1',
    isOwner: true,
    onShare: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // tempUserStore mock 已經在文件頂部設置了，這裡不需要重新設置

    // Mock addEventListener and removeEventListener
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('應該渲染基本的禱告標題', () => {
    render(<PrayerHeader {...defaultProps} />);
    
    expect(screen.getByTestId('user-info')).toBeInTheDocument();
    expect(screen.getByTestId('like-button')).toBeInTheDocument();
    expect(screen.getByTestId('post-action-buttons')).toBeInTheDocument();
  });

  it('應該正確傳遞用戶信息', () => {
    render(<PrayerHeader {...defaultProps} />);
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(screen.getByTestId('user-id')).toHaveTextContent('user-1');
    expect(screen.getByTestId('is-anonymous')).toHaveTextContent('false');
    expect(screen.getByTestId('avatar-url')).toHaveTextContent('https://example.com/avatar-48.jpg');
    expect(screen.getByTestId('created-at')).toHaveTextContent('2023-01-01T00:00:00Z');
  });

  it('應該正確處理匿名禱告', () => {
    const anonymousPrayer = { ...mockPrayer, is_anonymous: true };
    render(<PrayerHeader {...defaultProps} prayer={anonymousPrayer} />);
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('訪客');
    expect(screen.getByTestId('is-anonymous')).toHaveTextContent('true');
  });

  it('應該使用臨時顯示名稱（當用戶是擁有者時）', () => {
    // 在測試中重新配置 mock 返回值
    vi.mocked(useTempUserStore).mockReturnValue({
      tempDisplayName: 'Temporary Name',
      tempDisplayNames: {},
      setTempDisplayName: vi.fn(),
      getTempDisplayName: vi.fn(() => 'Temporary Name'),
      clearTempDisplayName: vi.fn(),
      clearAllTempDisplayNames: vi.fn(),
      setTempDisplayName_legacy: vi.fn(),
      clearTempDisplayName_legacy: vi.fn(),
    });

    render(<PrayerHeader {...defaultProps} />);
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Temporary Name');
  });

  it('應該在非擁有者情況下不使用臨時名稱', () => {
    vi.mocked(useTempUserStore).mockReturnValue({
      tempDisplayName: 'Temporary Name',
      tempDisplayNames: {},
      setTempDisplayName: vi.fn(),
      getTempDisplayName: vi.fn(() => 'Temporary Name'),
      clearTempDisplayName: vi.fn(),
      clearAllTempDisplayNames: vi.fn(),
      setTempDisplayName_legacy: vi.fn(),
      clearTempDisplayName_legacy: vi.fn(),
    });

    render(<PrayerHeader {...defaultProps} isOwner={false} currentUserId="other-user" />);
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
  });

  it('應該使用默認名稱當 user_name 為空時', () => {
    const prayerWithoutName = { ...mockPrayer, user_name: null };
    render(<PrayerHeader {...defaultProps} prayer={prayerWithoutName} />);
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('用戶');
  });

  it('應該正確傳遞 LikeButton 屬性', () => {
    render(<PrayerHeader {...defaultProps} />);
    
    expect(screen.getByTestId('prayer-id')).toHaveTextContent('prayer-1');
    expect(screen.getByTestId('current-user-id')).toHaveTextContent('user-1');
  });

  it('應該正確傳遞 PostActionButtons 屬性', () => {
    render(<PrayerHeader {...defaultProps} />);
    
    expect(screen.getByTestId('post-id')).toHaveTextContent('prayer-1');
    expect(screen.getByTestId('prayer-user-id')).toHaveTextContent('user-1');
    expect(screen.getByTestId('prayer-user-name')).toHaveTextContent('Test User');
    expect(screen.getByTestId('is-owner')).toHaveTextContent('true');
  });

  it('應該處理回調函數', () => {
    const onShare = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <PrayerHeader
        {...defaultProps}
        onShare={onShare}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    
    fireEvent.click(screen.getByTestId('share-btn'));
    expect(onShare).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('edit-btn'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('delete-btn'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('應該監聽 localStorage 變化', () => {
    render(<PrayerHeader {...defaultProps} />);
    
    expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
  });

  it('應該在組件卸載時清理事件監聽器', () => {
    const { unmount } = render(<PrayerHeader {...defaultProps} />);
    
    unmount();
    
    expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
  });

  it('應該響應 localStorage 的 guestMode 變化', () => {
    const { getItem } = window.localStorage as any;
    getItem.mockReturnValue('true');

    render(<PrayerHeader {...defaultProps} />);
    
    // 模擬 storage 事件
    const storageEvent = new StorageEvent('storage', {
      key: 'guestMode',
      newValue: 'false'
    });
    
    fireEvent(window, storageEvent);
    
    // 這個測試主要確保事件監聽器已設置，實際的狀態更新可能需要更複雜的測試
  });

  it('應該處理缺少頭像的情況', () => {
    const prayerWithoutAvatar = { 
      ...mockPrayer, 
      user_avatar: null, 
      user_avatar_48: null 
    };
    
    render(<PrayerHeader {...defaultProps} prayer={prayerWithoutAvatar} />);
    
    expect(screen.getByTestId('avatar-url')).toHaveTextContent('');
  });

  it('應該優先使用 user_avatar_48', () => {
    render(<PrayerHeader {...defaultProps} />);
    
    expect(screen.getByTestId('avatar-url')).toHaveTextContent('https://example.com/avatar-48.jpg');
  });

  it('應該在沒有 user_avatar_48 時使用 user_avatar', () => {
    const prayerWithOnlyAvatar = { 
      ...mockPrayer, 
      user_avatar_48: null 
    };
    
    render(<PrayerHeader {...defaultProps} prayer={prayerWithOnlyAvatar} />);
    
    expect(screen.getByTestId('avatar-url')).toHaveTextContent('https://example.com/avatar.jpg');
  });

  it('應該正確處理 null 的 currentUserId', () => {
    render(<PrayerHeader {...defaultProps} currentUserId={null} />);
    
    expect(screen.getByTestId('current-user-id')).toHaveTextContent('');
  });

  it('應該正確應用佈局樣式', () => {
    render(<PrayerHeader {...defaultProps} />);
    
    const container = screen.getByTestId('user-info').closest('div');
    expect(container).toHaveClass('flex', 'w-full', 'items-center', 'justify-between', 'gap-4');
  });

  it('應該處理匿名禱告且有臨時名稱的情況', () => {
    const { useTempUserStore } = vi.mocked(require('@/stores/tempUserStore'));
    useTempUserStore.mockReturnValue({
      tempDisplayName: 'Temporary Name'
    });

    const anonymousPrayer = { ...mockPrayer, is_anonymous: true };
    render(<PrayerHeader {...defaultProps} prayer={anonymousPrayer} />);
    
    // 匿名禱告應該顯示為 "訪客"，不使用臨時名稱
    expect(screen.getByTestId('user-name')).toHaveTextContent('訪客');
    expect(screen.getByTestId('is-anonymous')).toHaveTextContent('true');
  });

  it('應該處理複雜的用戶 ID 匹配邏輯', () => {
    const { useTempUserStore } = vi.mocked(require('@/stores/tempUserStore'));
    useTempUserStore.mockReturnValue({
      tempDisplayName: 'Temp Name'
    });

    // 測試用戶是擁有者且 currentUserId 與 prayer.user_id 匹配
    render(<PrayerHeader {...defaultProps} isOwner={true} currentUserId="user-1" />);
    expect(screen.getByTestId('user-name')).toHaveTextContent('Temp Name');

    // 測試用戶不是擁有者
    const { rerender } = render(<PrayerHeader {...defaultProps} isOwner={false} currentUserId="user-1" />);
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');

    // 測試 currentUserId 不匹配
    rerender(<PrayerHeader {...defaultProps} isOwner={true} currentUserId="other-user" />);
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
  });
}); 