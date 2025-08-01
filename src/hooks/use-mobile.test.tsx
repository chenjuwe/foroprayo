import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

describe('useIsMobile', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockMatchMedia.mockClear();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('應該在桌面設備上返回 false', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);
    
    // Mock window.innerWidth for desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    expect(result.current).toBe(false);
  });

  it('應該在移動設備上返回 true', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);
    
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    expect(result.current).toBe(true);
  });

  it('應該響應視窗大小變化', () => {
    let mediaQueryListener: (() => void) | null = null;
    
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn((event, listener) => {
        if (event === 'change') {
          mediaQueryListener = listener;
        }
      }),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);
    
    // 初始設為桌面
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    // 初始應該是 false (桌面)
    expect(result.current).toBe(false);
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    // 模擬視窗大小變化為移動設備
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      if (mediaQueryListener) {
        mediaQueryListener();
      }
    });

    expect(result.current).toBe(true);

    // 模擬視窗大小變化回桌面
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      if (mediaQueryListener) {
        mediaQueryListener();
      }
    });

    expect(result.current).toBe(false);
  });

  it('應該在組件卸載時清理事件監聽器', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { unmount } = renderHook(() => useIsMobile());

    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    unmount();

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('應該處理 matchMedia 不支援的情況', () => {
    // 模擬不支援 matchMedia 的環境
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    });

    // 這種情況下 hook 應該有合理的回退行為
    expect(() => {
      renderHook(() => useIsMobile());
    }).not.toThrow();
  });

  it('應該正確設置和清理多個監聽器', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    // 渲染多個 hook 實例
    const { unmount: unmount1 } = renderHook(() => useIsMobile());
    const { unmount: unmount2 } = renderHook(() => useIsMobile());

    expect(mockMediaQuery.addEventListener).toHaveBeenCalledTimes(2);

    // 卸載第一個實例
    unmount1();
    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledTimes(1);

    // 卸載第二個實例
    unmount2();
    expect(mockMediaQuery.removeEventListener).toHaveBeenCalledTimes(2);
  });

  it('應該使用正確的媒體查詢斷點', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);
    
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    renderHook(() => useIsMobile());

    // 驗證使用了正確的媒體查詢字符串 (767px 是 768-1)
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });
}); 