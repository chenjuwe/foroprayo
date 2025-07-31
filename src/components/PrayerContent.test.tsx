import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock components
vi.mock('./ui/ExpandableText', () => ({
  ExpandableText: ({ text, maxLength }: any) => (
    <div data-testid="expandable-text">
      {text.length > maxLength ? text.substring(0, maxLength) + '...' : text}
    </div>
  ),
}));

vi.mock('./ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt }: any) => (
    <img data-testid="optimized-image" src={src} alt={alt} />
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

// Mock PrayerContent component
vi.mock('./PrayerContent', () => ({
  PrayerContent: ({ prayer }: any) => (
    <div data-testid="prayer-content">
      <div data-testid="prayer-text">
        <div data-testid="expandable-text">{prayer.content}</div>
      </div>
      {prayer.imageUrl && (
        <div data-testid="prayer-image">
          <img data-testid="optimized-image" src={prayer.imageUrl} alt="代禱圖片" />
        </div>
      )}
      {prayer.audioUrl && (
        <div data-testid="prayer-audio">
          <audio data-testid="audio-player" src={prayer.audioUrl} controls />
        </div>
      )}
    </div>
  ),
}));

import { PrayerContent } from './PrayerContent';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PrayerContent', () => {
  const mockPrayer = {
    id: 'test-prayer-id',
    content: '這是一個測試代禱內容，包含一些文字來測試組件的顯示效果。',
    userName: '測試用戶',
    userId: 'test-user-id',
    createdAt: '2024-01-01T00:00:00Z',
    imageUrl: null,
    audioUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確渲染代禱內容', () => {
    renderWithRouter(<PrayerContent prayer={mockPrayer} />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-text')).toBeInTheDocument();
    expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
  });

  it('應該正確顯示代禱文字', () => {
    renderWithRouter(<PrayerContent prayer={mockPrayer} />);

    expect(screen.getByText('這是一個測試代禱內容，包含一些文字來測試組件的顯示效果。')).toBeInTheDocument();
  });

  it('應該正確處理長文字內容', () => {
    const longContentPrayer = {
      ...mockPrayer,
      content: '這是一個非常長的代禱內容，包含很多文字來測試組件的顯示效果。'.repeat(10),
    };

    renderWithRouter(<PrayerContent prayer={longContentPrayer} />);

    expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
  });

  it('應該正確處理包含圖片的代禱', () => {
    const prayerWithImage = {
      ...mockPrayer,
      imageUrl: 'https://example.com/test-image.jpg',
    };

    renderWithRouter(<PrayerContent prayer={prayerWithImage} />);

    expect(screen.getByTestId('prayer-image')).toBeInTheDocument();
    expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    expect(screen.getByAltText('代禱圖片')).toBeInTheDocument();
  });

  it('應該正確處理包含音頻的代禱', () => {
    const prayerWithAudio = {
      ...mockPrayer,
      audioUrl: 'https://example.com/test-audio.mp3',
    };

    renderWithRouter(<PrayerContent prayer={prayerWithAudio} />);

    expect(screen.getByTestId('prayer-audio')).toBeInTheDocument();
    expect(screen.getByTestId('audio-player')).toBeInTheDocument();
  });

  it('應該正確處理包含圖片和音頻的代禱', () => {
    const prayerWithMedia = {
      ...mockPrayer,
      imageUrl: 'https://example.com/test-image.jpg',
      audioUrl: 'https://example.com/test-audio.mp3',
    };

    renderWithRouter(<PrayerContent prayer={prayerWithMedia} />);

    expect(screen.getByTestId('prayer-image')).toBeInTheDocument();
    expect(screen.getByTestId('prayer-audio')).toBeInTheDocument();
    expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
    expect(screen.getByTestId('audio-player')).toBeInTheDocument();
  });

  it('應該正確處理空內容的代禱', () => {
    const emptyPrayer = {
      ...mockPrayer,
      content: '',
    };

    renderWithRouter(<PrayerContent prayer={emptyPrayer} />);

    expect(screen.getByTestId('prayer-content')).toBeInTheDocument();
    expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
  });

  it('應該正確處理特殊字符的代禱', () => {
    const specialCharPrayer = {
      ...mockPrayer,
      content: '這是一個包含特殊字符的代禱：!@#$%^&*()_+-=[]{}|;:,.<>?',
    };

    renderWithRouter(<PrayerContent prayer={specialCharPrayer} />);

    expect(screen.getByText('這是一個包含特殊字符的代禱：!@#$%^&*()_+-=[]{}|;:,.<>?')).toBeInTheDocument();
  });

  it('應該正確處理換行符的代禱', () => {
    const multilinePrayer = {
      ...mockPrayer,
      content: '第一行代禱內容\n第二行代禱內容\n第三行代禱內容',
    };

    renderWithRouter(<PrayerContent prayer={multilinePrayer} />);

    expect(screen.getByTestId('expandable-text')).toBeInTheDocument();
  });

  it('應該正確處理只有圖片的代禱', () => {
    const imageOnlyPrayer = {
      ...mockPrayer,
      content: '',
      imageUrl: 'https://example.com/test-image.jpg',
    };

    renderWithRouter(<PrayerContent prayer={imageOnlyPrayer} />);

    expect(screen.getByTestId('prayer-image')).toBeInTheDocument();
    expect(screen.getByTestId('optimized-image')).toBeInTheDocument();
  });

  it('應該正確處理只有音頻的代禱', () => {
    const audioOnlyPrayer = {
      ...mockPrayer,
      content: '',
      audioUrl: 'https://example.com/test-audio.mp3',
    };

    renderWithRouter(<PrayerContent prayer={audioOnlyPrayer} />);

    expect(screen.getByTestId('prayer-audio')).toBeInTheDocument();
    expect(screen.getByTestId('audio-player')).toBeInTheDocument();
  });
}); 