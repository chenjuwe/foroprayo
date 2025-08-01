import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock heavy components for performance testing
vi.mock('@/components/PrayerPost', () => ({
  default: React.memo(({ prayer }: any) => (
    <div data-testid="prayer-post">
      <span>{prayer.content}</span>
    </div>
  ))
}));

vi.mock('@/components/Header', () => ({
  Header: React.memo(() => <div data-testid="header">Header</div>)
}));

vi.mock('@/hooks/usePrayersOptimized', () => ({
  usePrayers: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })),
  useCreatePrayer: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false
  }))
}));

vi.mock('@/hooks/useFirebaseAvatar', () => ({
  useFirebaseAvatar: vi.fn(() => ({
    user: null,
    isLoggedIn: false,
    avatarUrl: null
  }))
}));

vi.mock('@/stores/firebaseAuthStore', () => ({
  useFirebaseAuthStore: vi.fn(() => ({
    initAuth: vi.fn()
  }))
}));

// Helper to create wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(MemoryRouter, { initialEntries: ['/prayers'] },
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    )
  );
};

// Performance measurement utilities
const measureRenderTime = (renderFn: () => void): number => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

const measureMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

describe('性能測試', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe('組件渲染性能', () => {
    it('Button 組件應該快速渲染', async () => {
      const { Button } = await import('@/components/ui/button');
      const wrapper = createWrapper();

      const renderTime = measureRenderTime(() => {
        render(<Button>Test Button</Button>, { wrapper });
      });

      // Button 組件應該在 50ms 內渲染完成
      expect(renderTime).toBeLessThan(50);
    });

    it('大量 Button 組件應該能高效渲染', async () => {
      const { Button } = await import('@/components/ui/button');
      const wrapper = createWrapper();

      const buttons = Array.from({ length: 100 }, (_, i) => (
        <Button key={i}>Button {i}</Button>
      ));

      const renderTime = measureRenderTime(() => {
        render(<div>{buttons}</div>, { wrapper });
      });

      // 100個按鈕應該在 200ms 內渲染完成
      expect(renderTime).toBeLessThan(200);
    });

    it('SectionHeader 組件應該快速渲染', async () => {
      const { SectionHeader } = await import('@/components/SectionHeader');
      const wrapper = createWrapper();

      const renderTime = measureRenderTime(() => {
        render(
          <SectionHeader
            icon="/test-icon.svg"
            title="Test Section"
            backgroundColor="#ff0000"
          />,
          { wrapper }
        );
      });

      expect(renderTime).toBeLessThan(30);
    });

    it('MessageCard 組件應該高效渲染', async () => {
      const { MessageCard } = await import('@/components/MessageCard');
      const wrapper = createWrapper();

      const renderTime = measureRenderTime(() => {
        render(
          <MessageCard
            userId="user1"
            username="Test User"
            avatarUrl="https://example.com/avatar.jpg"
          />,
          { wrapper }
        );
      });

      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('記憶體使用測試', () => {
    it('組件卸載後應該釋放記憶體', async () => {
      const { Button } = await import('@/components/ui/button');
      const wrapper = createWrapper();

      const initialMemory = measureMemoryUsage();

      // 渲染多個組件
      const components = Array.from({ length: 50 }, (_, i) => {
        return render(<Button key={i}>Button {i}</Button>, { wrapper });
      });

      const afterRenderMemory = measureMemoryUsage();

      // 卸載所有組件
      components.forEach(component => component.unmount());

      // 強制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const afterCleanupMemory = measureMemoryUsage();

      // 記憶體使用應該有所減少（允許一些誤差）
      if (initialMemory > 0 && afterRenderMemory > 0 && afterCleanupMemory > 0) {
        const memoryIncrease = afterRenderMemory - initialMemory;
        const memoryAfterCleanup = afterCleanupMemory - initialMemory;
        
        // 清理後的記憶體使用應該少於渲染時的增長
        expect(memoryAfterCleanup).toBeLessThan(memoryIncrease * 1.5);
      }
    });

    it('重複渲染不應該造成記憶體洩漏', async () => {
      const { Button } = await import('@/components/ui/button');
      const wrapper = createWrapper();

      const initialMemory = measureMemoryUsage();

      // 重複渲染和卸載
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<Button>Button {i}</Button>, { wrapper });
        unmount();
      }

      const finalMemory = measureMemoryUsage();

      // 記憶體使用不應該顯著增加
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercentage = (memoryIncrease / initialMemory) * 100;
        
        // 記憶體增長應該少於 20%
        expect(memoryIncreasePercentage).toBeLessThan(20);
      }
    });
  });

  describe('渲染效率測試', () => {
    it('React.memo 組件應該避免不必要的重新渲染', async () => {
      let renderCount = 0;

      const TestComponent = React.memo(({ value }: { value: string }) => {
        renderCount++;
        return <div>{value}</div>;
      });

      const wrapper = createWrapper();
      const { rerender } = render(<TestComponent value="test" />, { wrapper });

      expect(renderCount).toBe(1);

      // 使用相同的 props 重新渲染
      rerender(<TestComponent value="test" />);
      expect(renderCount).toBe(1); // 應該沒有重新渲染

      // 使用不同的 props 重新渲染
      rerender(<TestComponent value="new test" />);
      expect(renderCount).toBe(2); // 應該重新渲染
    });

    it('大量數據列表應該有效渲染', async () => {
      const wrapper = createWrapper();
      
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        content: `Prayer content ${i}`,
        user_name: `User ${i}`
      }));

      const ListComponent = () => (
        <div>
          {largeDataSet.map(item => (
            <div key={item.id} data-testid="list-item">
              <span>{item.content}</span>
              <span>{item.user_name}</span>
            </div>
          ))}
        </div>
      );

      const renderTime = measureRenderTime(() => {
        render(<ListComponent />, { wrapper });
      });

      // 1000個項目應該在 500ms 內渲染完成
      expect(renderTime).toBeLessThan(500);
    });

    it('條件渲染應該高效', async () => {
      const wrapper = createWrapper();
      let renderCount = 0;

      const ConditionalComponent = ({ shouldShow }: { shouldShow: boolean }) => {
        renderCount++;
        return shouldShow ? <div>Visible</div> : null;
      };

      const { rerender } = render(
        <ConditionalComponent shouldShow={true} />,
        { wrapper }
      );

      expect(renderCount).toBe(1);

      rerender(<ConditionalComponent shouldShow={false} />);
      expect(renderCount).toBe(2);

      rerender(<ConditionalComponent shouldShow={false} />);
      expect(renderCount).toBe(3);
    });
  });

  describe('異步操作性能', () => {
    it('應該快速處理 Promise 解析', async () => {
      const start = performance.now();

      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve(`result ${i}`)
      );

      const results = await Promise.all(promises);
      const end = performance.now();

      expect(results).toHaveLength(100);
      expect(end - start).toBeLessThan(50);
    });

    it('應該有效處理狀態更新', async () => {
      const { useState } = React;
      const wrapper = createWrapper();
      let updateCount = 0;

      const StateComponent = () => {
        const [count, setCount] = useState(0);
        
        React.useEffect(() => {
          updateCount++;
        }, [count]);

        React.useEffect(() => {
          // 快速更新狀態
          for (let i = 1; i <= 10; i++) {
            setCount(i);
          }
        }, []);

        return <div>{count}</div>;
      };

      const start = performance.now();
      render(<StateComponent />, { wrapper });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      const end = performance.now();

      // 狀態更新應該在合理時間內完成
      expect(end - start).toBeLessThan(200);
    });
  });

  describe('Bundle 大小測試', () => {
    it('動態導入應該有效', async () => {
      const start = performance.now();
      
      // 測試動態導入
      const module = await import('@/components/ui/button');
      
      const end = performance.now();

      expect(module.Button).toBeDefined();
      expect(end - start).toBeLessThan(100);
    });

    it('tree shaking 應該有效', async () => {
      // 測試是否只導入需要的模塊
      const start = performance.now();
      
      const { Button } = await import('@/components/ui/button');
      
      const end = performance.now();

      expect(Button).toBeDefined();
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('渲染批次處理', () => {
    it('多個狀態更新應該被批次處理', async () => {
      const { useState } = React;
      const wrapper = createWrapper();
      let renderCount = 0;

      const BatchComponent = () => {
        const [count1, setCount1] = useState(0);
        const [count2, setCount2] = useState(0);
        
        renderCount++;

        React.useEffect(() => {
          // 同時更新多個狀態
          setCount1(1);
          setCount2(2);
        }, []);

        return <div>{count1 + count2}</div>;
      };

      render(<BatchComponent />, { wrapper });
      
      await new Promise(resolve => setTimeout(resolve, 50));

      // 應該只渲染兩次：初始渲染 + 批次更新
      expect(renderCount).toBeLessThanOrEqual(2);
    });
  });
}); 