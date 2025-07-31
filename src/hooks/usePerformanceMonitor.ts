import { useEffect, useRef } from 'react';
import { log } from '@/lib/logger';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

// 定義 Performance Entry 類型
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

export function usePerformanceMonitor() {
  const metricsRef = useRef<PerformanceMetrics | null>(null);

  useEffect(() => {
    // 只在生產環境啟用性能監控
    if (import.meta.env.DEV) {
      return;
    }

    const measurePerformance = () => {
      try {
        // 頁面載入時間
        const pageLoadTime = performance.now();

        // 最大內容繪製
        let largestContentfulPaint = 0;
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // 首次內容繪製
        let firstContentfulPaint = 0;
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          firstContentfulPaint = fcpEntry.startTime;
        }

        // 累積佈局偏移
        let cumulativeLayoutShift = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as LayoutShiftEntry;
            if (!layoutShiftEntry.hadRecentInput) {
              cumulativeLayoutShift += layoutShiftEntry.value;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // 首次輸入延遲
        let firstInputDelay = 0;
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as FirstInputEntry;
            firstInputDelay = fidEntry.processingStart - fidEntry.startTime;
            break; // 只取第一個
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // 記錄性能指標
        const metrics: PerformanceMetrics = {
          pageLoadTime,
          firstContentfulPaint,
          largestContentfulPaint,
          cumulativeLayoutShift,
          firstInputDelay,
        };

        metricsRef.current = metrics;

        // 延遲記錄，確保所有指標都已收集
        setTimeout(() => {
          log.info('Performance metrics collected', metrics, 'PerformanceMonitor');
          
          // 檢查性能問題
          if (pageLoadTime > 3000) {
            log.warn('Slow page load detected', { pageLoadTime }, 'PerformanceMonitor');
          }
          
          if (largestContentfulPaint > 2500) {
            log.warn('Slow LCP detected', { largestContentfulPaint }, 'PerformanceMonitor');
          }
          
          if (cumulativeLayoutShift > 0.1) {
            log.warn('High CLS detected', { cumulativeLayoutShift }, 'PerformanceMonitor');
          }
          
          if (firstInputDelay > 100) {
            log.warn('High FID detected', { firstInputDelay }, 'PerformanceMonitor');
          }
        }, 1000);

        // 清理觀察器
        return () => {
          lcpObserver.disconnect();
          clsObserver.disconnect();
          fidObserver.disconnect();
        };
      } catch (error) {
        log.error('Performance monitoring failed', error, 'PerformanceMonitor');
      }
    };

    // 等待頁面完全載入後測量性能
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  // 返回性能指標供組件使用
  return metricsRef.current;
}

// 記憶化助手函數
export const useStableCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, deps]);

  return useRef(((...args: Parameters<T>) => callbackRef.current(...args)) as T).current;
};

// 深度比較記憶化
export const useDeepMemo = <T>(factory: () => T, deps: React.DependencyList): T => {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  if (!ref.current || !deepEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
};

// 簡單的深度比較函數
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }
  
  return false;
}

// 性能計時器
export const usePerformanceTimer = (name: string) => {
  const start = () => {
    if (import.meta.env.DEV) {
      try {
        performance.mark(`${name}-start`);
      } catch (error) {
        log.warn('無法創建性能標記', { name, error }, 'PerformanceTimer');
      }
    }
  };

  const end = () => {
    if (import.meta.env.DEV) {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measures = performance.getEntriesByName(name);
        const latestMeasure = measures[measures.length - 1];
        if (latestMeasure) {
          log.info(`Performance timer: ${name}`, { duration: latestMeasure.duration }, 'PerformanceTimer');
        }
      } catch (error) {
        log.warn('無法測量性能', { name, error }, 'PerformanceTimer');
      }
    }
  };

  return { start, end };
}; 