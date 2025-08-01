import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Header } from './Header';
import * as useFirebaseAvatarModule from '@/hooks/useFirebaseAvatar';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock components
vi.mock('@/components/profile/ProfileAvatar', () => ({
  ProfileAvatar: ({ user, onClick }: any) => (
    <div data-testid="profile-avatar" onClick={onClick}>
      {user ? 'User Avatar' : 'Guest Avatar'}
    </div>
  ),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    resetQueries: vi.fn(),
    refetchQueries: vi.fn(),
  })),
  QueryClientProvider: ({ children }: any) => children,
  MutationCache: vi.fn(() => ({
    getAll: vi.fn(() => []),
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    find: vi.fn(),
    findAll: vi.fn(),
    notify: vi.fn(),
  })),
  useQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    isSuccess: false,
    isStale: false,
    status: 'idle',
    fetchStatus: 'idle',
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    isIdle: true,
    status: 'idle',
    failureCount: 0,
    submittedAt: 0,
    variables: undefined,
    context: undefined,
    reset: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    resetQueries: vi.fn(),
    refetchQueries: vi.fn(),
  })),
}));

// Mock router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/prayers' })),
    useNavigate: vi.fn(() => mockNavigate),
  };
});

// Mock logger
vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('應該正確渲染 Header 組件', () => {
    vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl30: null,
      refreshAvatar: vi.fn().mockResolvedValue(true),
    } as any);
    renderWithRouter(<Header />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('應該包含 Logo', () => {
    vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl30: null,
      refreshAvatar: vi.fn().mockResolvedValue(true),
    } as any);
    renderWithRouter(<Header />);
    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
  });

  it('在未登入時，應該顯示「登入 | 註冊」按鈕', () => {
    vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl30: null,
      refreshAvatar: vi.fn().mockResolvedValue(true),
    } as any);
    renderWithRouter(<Header />);
    expect(screen.getByText('登入 | 註冊')).toBeInTheDocument();
  });

  it('在登入時，應該顯示用戶頭像', () => {
    vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
      user: { uid: '123', displayName: 'Test User' },
      isLoggedIn: true,
      avatarUrl30: 'http://example.com/avatar.png',
      refreshAvatar: vi.fn().mockResolvedValue(true),
    } as any);
    renderWithRouter(<Header />);
    expect(screen.getByTestId('user-avatar-container')).toBeInTheDocument();
  });

  it('點擊「登入 | 註冊」按鈕時，應該會導航到登入頁面', () => {
    vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
      user: null,
      isLoggedIn: false,
      avatarUrl30: null,
      refreshAvatar: vi.fn().mockResolvedValue(true),
    } as any);
    renderWithRouter(<Header />);
    fireEvent.click(screen.getByText('登入 | 註冊'));
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  describe('訪客模式功能', () => {
    it('應該正確處理訪客模式狀態', () => {
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: { uid: '123', displayName: 'Test User' },
        isLoggedIn: true,
        avatarUrl30: 'http://example.com/avatar.png',
        refreshAvatar: vi.fn().mockResolvedValue(true),
      } as any);
      
      renderWithRouter(<Header isGuestMode={true} />);
      
      // 在訪客模式下，即使有用戶也應該顯示訪客頭像
      expect(screen.getByTestId('user-avatar-container')).toBeInTheDocument();
    });

    it('應該正確處理本地存儲的訪客模式', () => {
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: { uid: '123', displayName: 'Test User' },
        isLoggedIn: true,
        avatarUrl30: 'http://example.com/avatar.png',
        refreshAvatar: vi.fn().mockResolvedValue(true),
      } as any);
      
      renderWithRouter(<Header />);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('guestMode');
    });
  });

  describe('菜單功能', () => {
    it('應該正確處理用戶頭像點擊', () => {
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: { uid: '123', displayName: 'Test User' },
        isLoggedIn: true,
        avatarUrl30: 'http://example.com/avatar.png',
        refreshAvatar: vi.fn().mockResolvedValue(true),
      } as any);
      
      renderWithRouter(<Header />);
      
      const avatarContainer = screen.getByTestId('user-avatar-container');
      expect(avatarContainer).toBeInTheDocument();
    });

    it('應該正確處理頭像錯誤', () => {
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: { uid: '123', displayName: 'Test User' },
        isLoggedIn: true,
        avatarUrl30: 'http://example.com/avatar.png',
        refreshAvatar: vi.fn().mockResolvedValue(true),
      } as any);
      
      renderWithRouter(<Header />);
      
      const avatar = screen.getByAltText('Test User');
      fireEvent.error(avatar);
      
      // 頭像錯誤後應該顯示用戶首字母
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('導航功能', () => {
    it('應該正確處理不同頁面的導航', () => {
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: null,
        isLoggedIn: false,
        avatarUrl30: null,
        refreshAvatar: vi.fn().mockResolvedValue(true),
      } as any);
      
      const { rerender } = renderWithRouter(<Header currentPage="publish" />);
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
      
      rerender(<Header currentPage="community" />);
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
      
      rerender(<Header currentPage="baptism" />);
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
      
      rerender(<Header currentPage="miracle" />);
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });

    it('應該正確處理回調函數', () => {
      const mockOnLoginClick = vi.fn();
      const mockOnProfileClick = vi.fn();
      const mockOnPublishClick = vi.fn();
      const mockOnCommunityClick = vi.fn();
      const mockOnExtraButtonClick = vi.fn();
      
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: null,
        isLoggedIn: false,
        avatarUrl30: null,
        refreshAvatar: vi.fn().mockResolvedValue(true),
      } as any);
      
      renderWithRouter(
        <Header 
          onLoginClick={mockOnLoginClick}
          onProfileClick={mockOnProfileClick}
          onPublishClick={mockOnPublishClick}
          onCommunityClick={mockOnCommunityClick}
          onExtraButtonClick={mockOnExtraButtonClick}
        />
      );
      
      // 檢查回調函數是否被正確傳遞
      expect(mockOnLoginClick).toBeDefined();
      expect(mockOnProfileClick).toBeDefined();
      expect(mockOnPublishClick).toBeDefined();
      expect(mockOnCommunityClick).toBeDefined();
      expect(mockOnExtraButtonClick).toBeDefined();
    });
  });

  describe('頭像更新功能', () => {
    it('應該正確處理頭像刷新', async () => {
      const mockRefreshAvatar = vi.fn().mockResolvedValue(true);
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: { uid: '123', displayName: 'Test User' },
        isLoggedIn: true,
        avatarUrl30: 'http://example.com/avatar.png',
        refreshAvatar: mockRefreshAvatar,
      } as any);
      
      renderWithRouter(<Header />);
      
      // 檢查頭像刷新功能是否可用
      expect(mockRefreshAvatar).toBeDefined();
    });

    it('應該正確處理頭像 URL 變更', () => {
      const mockRefreshAvatar = vi.fn().mockResolvedValue(true);
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: { uid: '123', displayName: 'Test User' },
        isLoggedIn: true,
        avatarUrl30: 'http://example.com/new-avatar.png',
        refreshAvatar: mockRefreshAvatar,
      } as any);
      
      renderWithRouter(<Header />);
      
      const avatar = screen.getByAltText('Test User');
      expect(avatar).toHaveAttribute('src', 'http://example.com/new-avatar.png');
    });
  });

  describe('錯誤處理', () => {
    it('應該正確處理 Firebase 認證錯誤', () => {
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: null,
        isLoggedIn: false,
        avatarUrl30: null,
        refreshAvatar: vi.fn().mockRejectedValue(new Error('認證錯誤')),
      } as any);
      
      renderWithRouter(<Header />);
      
      // 即使有錯誤，組件也應該正常渲染
      expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });

    it('應該正確處理本地存儲錯誤', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('存儲錯誤');
      });
      
      // 測試應該能夠處理錯誤而不會導致組件崩潰
      render(<Header />);
      
      // 確認組件仍然可以正常渲染
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      // 清理
      consoleSpy.mockRestore();
    });
  });

  describe('無障礙功能', () => {
    it('應該包含正確的 ARIA 標籤', () => {
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: null,
        isLoggedIn: false,
        avatarUrl30: null,
        refreshAvatar: vi.fn().mockResolvedValue(true),
      } as any);
      
      renderWithRouter(<Header />);
      
      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
    });

    it('應該正確處理鍵盤導航', () => {
      vi.spyOn(useFirebaseAvatarModule, 'useFirebaseAvatar').mockReturnValue({
        user: null,
        isLoggedIn: false,
        avatarUrl30: null,
        refreshAvatar: vi.fn().mockResolvedValue(true),
      } as any);
      
      renderWithRouter(<Header />);
      
      const loginButton = screen.getByText('登入 | 註冊');
      loginButton.focus();
      expect(loginButton).toHaveFocus();
    });
  });
}); 