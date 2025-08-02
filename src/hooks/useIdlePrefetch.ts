import { useEffect } from 'react';
import { queryClient } from '@/config/queryClient';
import { log } from '@/lib/logger';

/**
 * 當用戶閒置時預取數據的 Hook
 * 
 * @param userId 當前用戶 ID
 */
export function useIdlePrefetch(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    
    // 確保只在用戶有登入時執行
    let idleCallbackId: number;
    let timeoutId: NodeJS.Timeout;
    
    const handleIdle = () => {
      log.debug('用戶閒置，開始預取數據', null, 'useIdlePrefetch');
      
      // 為了避免性能問題，設置 5 秒延遲，確保用戶真的閒置
      timeoutId = setTimeout(() => {
        try {
          // 預取數據
          queryClient.prefetchQuery({
            queryKey: ['prayers', { page: 0, limit: 10 }],
            staleTime: 5 * 60 * 1000, // 5 分鐘過期
          });
          
          log.debug('閒置預取成功', null, 'useIdlePrefetch');
        } catch (error) {
          log.error('閒置預取失敗', error, 'useIdlePrefetch');
        }
      }, 5000);
    };
    
    // 安全檢查：確保 window 物件存在，並且 requestIdleCallback 可用
    const hasIdleCallback = typeof window !== 'undefined' && 
                          'requestIdleCallback' in window && 
                          typeof window.requestIdleCallback === 'function';
    
    if (hasIdleCallback) {
      try {
        // 使用 try-catch 防止在測試環境中的問題
        idleCallbackId = window.requestIdleCallback(handleIdle, { timeout: 10000 });
      } catch (error) {
        // 出錯時使用備用方案
        log.warn('requestIdleCallback 失敗，使用 setTimeout 備用', error, 'useIdlePrefetch');
        timeoutId = setTimeout(handleIdle, 15000);
      }
    } else {
      // 備用方案：使用 setTimeout
      timeoutId = setTimeout(handleIdle, 15000);
    }
    
    // 清理函數
    return () => {
      const hasIdleCallback = typeof window !== 'undefined' && 
                            'requestIdleCallback' in window && 
                            typeof window.cancelIdleCallback === 'function';
      
      if (hasIdleCallback && idleCallbackId) {
        try {
          window.cancelIdleCallback(idleCallbackId);
        } catch (error) {
          log.warn('cancelIdleCallback 失敗', error, 'useIdlePrefetch');
        }
      }
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [userId]); // 只在 userId 變化時重新執行
} 