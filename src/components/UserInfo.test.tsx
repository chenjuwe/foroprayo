import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserInfo from './UserInfo';

// Mock hooks
vi.mock('@/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: vi.fn(() => ({
    user: { uid: 'test-user-id' },
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: vi.fn(() => ({
    avatarUrl30: 'mock-avatar.jpg',
  })),
}));

vi.mock('@/lib/logger', () => ({
  log: {
    debug: vi.fn(),
    error: vi.fn(),
  },
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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/prayers' })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('UserInfo', () => {
  const mockUser = {
    userId: 'test-user-id',
    userName: '測試用戶',
    userAvatarUrl: 'https://example.com/avatar.jpg',
    userEmail: 'test@example.com',
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染用戶資訊', () => {
    renderWithRouter(
      <UserInfo 
        {...mockUser}
        onAvatarClick={mockOnClick}
      />
    );

    expect(screen.getByTestId('user-info')).toBeInTheDocument();
  });

  it('應該正確顯示用戶頭像', () => {
    renderWithRouter(
      <UserInfo 
        {...mockUser}
        onAvatarClick={mockOnClick}
      />
    );

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('應該正確顯示用戶名稱', () => {
    renderWithRouter(
      <UserInfo 
        {...mockUser}
        onNameClick={mockOnClick}
      />
    );

    expect(screen.getByTestId('user-name')).toBeInTheDocument();
    expect(screen.getByText('測試用戶')).toBeInTheDocument();
  });

  it('應該正確顯示頭像和名稱', () => {
    renderWithRouter(
      <UserInfo 
        {...mockUser}
      />
    );

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('user-name')).toBeInTheDocument();
  });

  it('應該正確處理點擊事件', () => {
    renderWithRouter(
      <UserInfo 
        {...mockUser}
        onAvatarClick={mockOnClick}
        onNameClick={mockOnClick}
      />
    );

    const userInfo = screen.getByTestId('user-info');
    fireEvent.click(userInfo);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('應該正確處理匿名用戶', () => {
    renderWithRouter(
      <UserInfo 
        isAnonymous={true}
      />
    );

    expect(screen.getByText('訪客')).toBeInTheDocument();
  });

  it('應該正確處理沒有頭像的用戶', () => {
    renderWithRouter(
      <UserInfo 
        userName="測試用戶"
      />
    );

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('應該正確處理沒有點擊事件的用戶資訊', () => {
    renderWithRouter(
      <UserInfo 
        {...mockUser}
      />
    );

    expect(screen.getByTestId('user-info')).toBeInTheDocument();
  });

  it('應該正確處理空用戶對象', () => {
    renderWithRouter(
      <UserInfo />
    );

    expect(screen.getByTestId('user-info')).toBeInTheDocument();
  });

  it('應該正確處理只有名稱的用戶', () => {
    renderWithRouter(
      <UserInfo 
        userName="測試用戶"
      />
    );

    expect(screen.getByTestId('user-name')).toBeInTheDocument();
    expect(screen.getByText('測試用戶')).toBeInTheDocument();
  });

  it('應該正確處理只有頭像的用戶', () => {
    renderWithRouter(
      <UserInfo 
        userAvatarUrl="https://example.com/avatar.jpg"
      />
    );

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    expect(screen.getByText('用戶')).toBeInTheDocument();
  });
}); 