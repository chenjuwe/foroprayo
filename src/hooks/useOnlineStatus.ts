import { useState, useEffect, useCallback } from 'react';
import { log } from '@/lib/logger';
import { useNetworkStore } from '@/stores/networkStore';

interface OnlineStatusResult {
  isOnline: boolean;
  retryConnection: () => Promise<boolean>;
  lastChecked: Date | null;
  connectionError: string | null;
}

export function useOnlineStatus(): OnlineStatusResult {
  const { isOnline, setOnlineStatus } = useNetworkStore();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    // 優先使用 navigator.onLine，這是最快且最直接的方式
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      log.warn('網路離線 (navigator.onLine)', null, 'useOnlineStatus');
      setOnlineStatus(false);
      setConnectionError('瀏覽器偵測為離線狀態');
      setLastChecked(new Date());
      return false;
    }
    
    try {
      // 使用對 Google DNS 的輕量級請求作為備用檢查
      // 這比依賴本地 API 更可靠，因為它測試的是真實的外部網路連線
      const response = await fetch('https://8.8.8.8/', {
        method: 'HEAD',
        mode: 'no-cors', // 使用 no-cors 模式，我們只關心請求是否成功發出，不關心回應內容
        cache: 'no-store',
      });

      // 在 no-cors 模式下，我們無法讀取 status，但請求成功即表示網路通暢
      log.debug('網路連線檢查成功 (Google DNS)', null, 'useOnlineStatus');
      setOnlineStatus(true);
      setConnectionError(null);
      setLastChecked(new Date());
      return true;

    } catch (err: unknown) {
      log.error('網路連線檢查失敗', err, 'useOnlineStatus');
      setOnlineStatus(false);
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setConnectionError(`連線檢測發生錯誤: ${errorMessage}`);
      setLastChecked(new Date());
      return false;
    }
  }, [setOnlineStatus]);

  const retryConnection = useCallback(async (): Promise<boolean> => {
    log.info('手動重試連線', null, 'useOnlineStatus');
    return await checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    // 設置瀏覽器原生事件監聽
    const handleOnline = () => {
      log.info('偵測到網路恢復連線', null, 'useOnlineStatus');
      setOnlineStatus(true);
      setConnectionError(null);
      setLastChecked(new Date());
    };

    const handleOffline = () => {
      log.warn('偵測到網路離線', null, 'useOnlineStatus');
      setOnlineStatus(false);
      setConnectionError('瀏覽器偵測為離線狀態');
      setLastChecked(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始檢查
    checkConnection();

    // 定期檢查（頻率降低至 2 分鐘）
    const intervalId = setInterval(checkConnection, 120000);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection, setOnlineStatus]);

  return { 
    isOnline, 
    retryConnection, 
    lastChecked,
    connectionError
  };
} 