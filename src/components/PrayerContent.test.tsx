import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock components
vi.mock('./ui/ExpandableText', () => ({
  ExpandableText: ({ children, maxLines, lineHeight }: any) => (
    <div data-testid="expandable-text">
      {children}
    </div>
  ),
}));

vi.mock('./ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt }: any) => (
    <img data-testid="optimized-image" src={src} alt={alt} />
  ),
}));

vi.mock('./ui/audio-player', () => ({
  AudioPlayer: ({ src }: any) => (
    <div data-testid="audio-player">
      <audio src={src} />
    </div>
  ),
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

import { PrayerContent } from './PrayerContent';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PrayerContent', () => {
  const mockPrayer = {
    id: 'test-prayer-id',
    content: '這是一個測試代禱內容，包含一些文字來測試組件的顯示效果。',
    user_name: '測試用戶',
    user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_anonymous: false,
    user_avatar: null,
    image_url: null,
    audioUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染代禱內容', () => {
    renderWithProviders(<PrayerContent prayer={mockPrayer} currentUserId="test-user-id" />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-text')).toBeInTheDocument();
    expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
  });

  it('應該正確顯示代禱文字', () => {
    renderWithProviders(<PrayerContent prayer={mockPrayer} currentUserId="test-user-id" />);

    expect(screen.getByText('這是一個測試代禱內容，包含一些文字來測試組件的顯示效果。')).toBeInTheDocument();
  });

  it('應該正確處理長文字內容', () => {
    const longContentPrayer = {
      ...mockPrayer,
      content: '這是一個非常長的代禱內容，包含很多文字來測試組件的顯示效果。'.repeat(10),
    };

    renderWithProviders(<PrayerContent prayer={longContentPrayer} currentUserId="test-user-id" />);

    expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
  });

  it('應該正確處理包含圖片的代禱', () => {
    const prayerWithImage = {
      ...mockPrayer,
      image_url: 'http://example.com/image.jpg',
    };

    renderWithProviders(<PrayerContent prayer={prayerWithImage} currentUserId="test-user-id" />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-text')).toBeInTheDocument();
  });

  it('應該正確處理包含音頻的代禱', () => {
    const prayerWithAudio = {
      ...mockPrayer,
      audioUrl: 'http://example.com/audio.mp3',
    };

    renderWithProviders(<PrayerContent prayer={prayerWithAudio} currentUserId="test-user-id" />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-text')).toBeInTheDocument();
  });

  it('應該正確處理包含圖片和音頻的代禱', () => {
    const prayerWithMedia = {
      ...mockPrayer,
      image_url: 'http://example.com/image.jpg',
      audioUrl: 'http://example.com/audio.mp3',
    };

    renderWithProviders(<PrayerContent prayer={prayerWithMedia} currentUserId="test-user-id" />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-text')).toBeInTheDocument();
  });

  it('應該正確處理空內容的代禱', () => {
    const emptyContentPrayer = {
      ...mockPrayer,
      content: '',
    };

    renderWithProviders(<PrayerContent prayer={emptyContentPrayer} currentUserId="test-user-id" />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
  });

  it('應該正確處理特殊字符的代禱', () => {
    const specialCharPrayer = {
      ...mockPrayer,
      content: '這是一個包含特殊字符的代禱：!@#$%^&*()_+-=[]{}|;:,.<>?',
    };

    renderWithProviders(<PrayerContent prayer={specialCharPrayer} currentUserId="test-user-id" />);

    expect(screen.getByText('這是一個包含特殊字符的代禱：!@#$%^&*()_+-=[]{}|;:,.<>?')).toBeInTheDocument();
  });

  it('應該正確處理換行符的代禱', () => {
    const newlinePrayer = {
      ...mockPrayer,
      content: '這是第一行\n這是第二行\n這是第三行',
    };

    renderWithProviders(<PrayerContent prayer={newlinePrayer} currentUserId="test-user-id" />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-text')).toBeInTheDocument();
  });

  it('應該正確處理只有圖片的代禱', () => {
    const imageOnlyPrayer = {
      ...mockPrayer,
      content: '',
      image_url: 'http://example.com/image.jpg',
    };

    renderWithProviders(<PrayerContent prayer={imageOnlyPrayer} currentUserId="test-user-id" />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-text')).toBeInTheDocument();
  });

  it('應該正確處理只有音頻的代禱', () => {
    const audioOnlyPrayer = {
      ...mockPrayer,
      content: '',
      audioUrl: 'http://example.com/audio.mp3',
    };

    renderWithProviders(<PrayerContent prayer={audioOnlyPrayer} currentUserId="test-user-id" />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-text')).toBeInTheDocument();
  });
}); 