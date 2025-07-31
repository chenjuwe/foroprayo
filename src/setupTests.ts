import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

// 擴展 Vitest 的匹配器
expect.extend(matchers);

// 每個測試後清理
afterEach(() => {
  cleanup();
});

// 模擬 ResizeObserver
class ResizeObserverMock {
  observe() { /* do nothing */ }
  unobserve() { /* do nothing */ }
  disconnect() { /* do nothing */ }
}

window.ResizeObserver = ResizeObserverMock;

// 模擬 matchMedia
window.matchMedia = window.matchMedia || ((query) => ({
    matches: false,
    media: query,
    onchange: null,
  addListener: vi.fn(), // 兼容舊版 API
  removeListener: vi.fn(), // 兼容舊版 API
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

// 模擬 URL.createObjectURL 和 URL.revokeObjectURL
URL.createObjectURL = vi.fn().mockImplementation((object) => {
  return `mock-url-${Math.random().toString(36).substr(2, 9)}`;
});
URL.revokeObjectURL = vi.fn();

// 模擬 Intersection Observer
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(callback: IntersectionObserverCallback) {
    setTimeout(() => {
      callback([{
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        isIntersecting: true,
        rootBounds: null,
        target: {} as Element,
        time: Date.now()
      }], this as IntersectionObserver);
    }, 50);
  }
  
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
  takeRecords() { return []; }
}

window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// 模擬 window.scrollTo
window.scrollTo = vi.fn();

// 模擬 heic2any
vi.mock('heic2any', () => ({
  default: vi.fn().mockResolvedValue([new Blob(['fake-image-data'], { type: 'image/jpeg' })])
}));

// 儲存原始控制台方法
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

// 抑制不必要的警告
console.warn = function(message, ...args) {
  // 過濾掉某些特定的警告訊息
  if (
    typeof message === 'string' && 
    (message.includes('act(...)') || 
     message.includes('Warning:') || 
     message.includes('React state updates'))
  ) {
    return;
}
  // 保留真正需要注意的警告
  originalConsoleWarn.call(console, message, ...args);
};

console.error = function(message, ...args) {
  // 過濾不必要的錯誤
  if (
    typeof message === 'string' && 
    (message.includes('act(...)') || 
     message.includes('Warning:') || 
     message.includes('React state updates'))
  ) {
    return;
  }
  originalConsoleError.call(console, message, ...args);
}; 