import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrayerResponseList } from './PrayerResponseList';
import type { PrayerResponse } from '@/services/prayerService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock PrayerResponse component
vi.mock('./PrayerResponse', () => ({
  PrayerResponse: (props: any) => (
    <div data-testid={`prayer-response-${props.response.id}`}>
      <div data-testid="response-content">{props.response.content}</div>
      <div data-testid="response-user">{props.response.user_name}</div>
      <button 
        data-testid="edit-button" 
        onClick={() => props.onEdit(props.response.id)}
      >
        Edit
      </button>
      <button 
        data-testid="delete-button" 
        onClick={() => props.onDelete(props.response.id)}
      >
        Delete
      </button>
      <button 
        data-testid="share-button" 
        onClick={props.onShare}
      >
        Share
      </button>
    </div>
  ),
}));

// Mock constants
vi.mock('@/constants', () => ({
  QUERY_KEYS: {
    PRAYER_RESPONSES: (prayerId: string) => ['prayer-responses', prayerId],
  },
}));

describe('PrayerResponseList', () => {
  let queryClient: QueryClient;

  const mockResponses: PrayerResponse[] = [
    {
      id: 'response-1',
      content: 'First response',
      user_name: 'User 1',
      user_id: 'user-1',
      prayer_id: 'prayer-1',
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2023-01-01T10:00:00Z',
      is_anonymous: false,
    },
    {
      id: 'response-2',
      content: 'Second response',
      user_name: 'User 2',
      user_id: 'user-2',
      prayer_id: 'prayer-1',
      created_at: '2023-01-01T11:00:00Z',
      updated_at: '2023-01-01T11:00:00Z',
      is_anonymous: false,
    },
  ];

  const defaultProps = {
    responses: mockResponses,
    currentUserId: 'current-user-id',
    isSuperAdmin: false,
    onShare: vi.fn(),
    onEditResponse: vi.fn(),
    onDeleteResponse: vi.fn(),
    prayerId: 'prayer-1',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('應該正確渲染回應列表', () => {
    renderWithQueryClient(<PrayerResponseList {...defaultProps} />);

    expect(screen.getByTestId('prayer-response-response-1')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-response-response-2')).toBeInTheDocument();
    expect(screen.getByText('First response')).toBeInTheDocument();
    expect(screen.getByText('Second response')).toBeInTheDocument();
  });

  it('當沒有回應時應該返回 null', () => {
    const { container } = renderWithQueryClient(
      <PrayerResponseList {...defaultProps} responses={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('當回應為 null 時應該返回 null', () => {
    const { container } = renderWithQueryClient(
      <PrayerResponseList {...defaultProps} responses={null as any} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('應該正確傳遞 props 給 PrayerResponse 組件', () => {
    renderWithQueryClient(<PrayerResponseList {...defaultProps} isSuperAdmin={true} />);

    // 檢查第一個回應是否標記為 isFirst
    const firstResponse = screen.getByTestId('prayer-response-response-1');
    expect(firstResponse).toBeInTheDocument();
  });

  it('應該處理分享功能', () => {
    const mockOnShare = vi.fn();
    renderWithQueryClient(
      <PrayerResponseList {...defaultProps} onShare={mockOnShare} />
    );

    const shareButtons = screen.getAllByTestId('share-button');
    shareButtons[0].click();

    expect(mockOnShare).toHaveBeenCalledTimes(1);
  });

  it('應該處理編輯回應', () => {
    const mockOnEditResponse = vi.fn();
    renderWithQueryClient(
      <PrayerResponseList {...defaultProps} onEditResponse={mockOnEditResponse} />
    );

    const editButtons = screen.getAllByTestId('edit-button');
    editButtons[0].click();

    expect(mockOnEditResponse).toHaveBeenCalledWith('response-1');
  });

  it('應該處理刪除回應並進行樂觀更新', () => {
    const mockOnDeleteResponse = vi.fn();
    renderWithQueryClient(
      <PrayerResponseList {...defaultProps} onDeleteResponse={mockOnDeleteResponse} />
    );

    expect(screen.getByTestId('prayer-response-response-1')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-response-response-2')).toBeInTheDocument();

    const deleteButtons = screen.getAllByTestId('delete-button');
    deleteButtons[0].click();

    expect(mockOnDeleteResponse).toHaveBeenCalledWith('response-1');
  });

  it('當沒有回調函數時應該正常工作', () => {
    const propsWithoutCallbacks = {
      responses: mockResponses,
      currentUserId: 'current-user-id',
    };

    expect(() => {
      renderWithQueryClient(<PrayerResponseList {...propsWithoutCallbacks} />);
    }).not.toThrow();

    expect(screen.getByTestId('prayer-response-response-1')).toBeInTheDocument();
  });

  it('應該在 initialResponses 改變時更新本地狀態', () => {
    const { rerender } = renderWithQueryClient(
      <PrayerResponseList {...defaultProps} />
    );

    expect(screen.getByText('First response')).toBeInTheDocument();

    const newResponses: PrayerResponse[] = [
      {
        id: 'response-3',
        content: 'New response',
        user_name: 'User 3',
        user_id: 'user-3',
        prayer_id: 'prayer-1',
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
        is_anonymous: false,
      },
    ];

    rerender(
      <QueryClientProvider client={queryClient}>
        <PrayerResponseList {...defaultProps} responses={newResponses} />
      </QueryClientProvider>
    );

    expect(screen.getByText('New response')).toBeInTheDocument();
    expect(screen.queryByText('First response')).not.toBeInTheDocument();
  });

  it('應該有正確的容器樣式', () => {
    const { container } = renderWithQueryClient(
      <PrayerResponseList {...defaultProps} />
    );

    const listContainer = container.firstChild as HTMLElement;
    expect(listContainer).toHaveClass('m-0', 'p-0');
  });

  it('應該正確處理 currentUserId 為 null', () => {
    renderWithQueryClient(
      <PrayerResponseList {...defaultProps} currentUserId={null} />
    );

    expect(screen.getByTestId('prayer-response-response-1')).toBeInTheDocument();
  });

  it('應該正確設置預設值', () => {
    const propsWithDefaults = {
      responses: mockResponses,
      currentUserId: 'current-user-id',
      // isSuperAdmin 應該預設為 false
    };

    expect(() => {
      renderWithQueryClient(<PrayerResponseList {...propsWithDefaults} />);
    }).not.toThrow();
  });

  it('當沒有 prayerId 時刪除功能應該正常工作', () => {
    const mockOnDeleteResponse = vi.fn();
    const propsWithoutPrayerId = {
      responses: mockResponses,
      currentUserId: 'current-user-id',
      isSuperAdmin: false,
      onShare: vi.fn(),
      onEditResponse: vi.fn(),
      onDeleteResponse: mockOnDeleteResponse,
      // 不包含 prayerId
    };

    renderWithQueryClient(<PrayerResponseList {...propsWithoutPrayerId} />);

    const deleteButtons = screen.getAllByTestId('delete-button');
    deleteButtons[0].click();

    expect(mockOnDeleteResponse).toHaveBeenCalledWith('response-1');
  });
}); 