import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Header } from './Header';
import * as useFirebaseAvatarModule from '@/hooks/useFirebaseAvatar';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
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
}); 