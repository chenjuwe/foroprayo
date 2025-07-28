import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wifi, WifiOff, RefreshCw, Download } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { useNetworkStore } from '@/stores/networkStore';
import { Spinner } from "@/components/ui/spinner";

export const NetworkStatusAlert: React.FC = () => {
  const { isOnline } = useNetworkStore();
  const { retryConnection, connectionError } = useOnlineStatus();
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [showOfflineCapability, setShowOfflineCapability] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      // Show offline capability message after 2 seconds
      const timer = setTimeout(() => {
        setShowOfflineCapability(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowOfflineCapability(false);
    }
  }, [isOnline]);

  // 不顯示網路正常的情況
  if (isOnline) {
    return null;
  }

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const success = await retryConnection();
      if (success) {
        notify.success('連線恢復成功');
      } else {
        notify.error('連線失敗', connectionError || '無法連接到伺服器');
      }
    } catch (err) {
      notify.error('重新連接時發生錯誤');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2 bg-red-500 text-white shadow-md">
      <div className="container mx-auto flex flex-col px-2 py-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi size={18} />
            ) : (
              <WifiOff size={18} />
            )}
            
            <div className="flex-1">
              <span className="font-medium">
                {!isOnline ? '網路已斷開' : '連線狀態異常'}
              </span>
              
              {connectionError && (
                <p className="text-xs opacity-90 mt-0.5">
                  {connectionError}
                </p>
              )}
            </div>
          </div>
          
          <Button 
            size="sm" 
            variant="secondary"
            className="text-xs bg-white/25 hover:bg-white/40 text-white"
            onClick={handleRetryConnection}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <Spinner size="small" className="mr-1" />
            ) : (
              <RefreshCw size={14} className="mr-1" />
            )}
            {isRetrying ? '重試中...' : '重試連線'}
          </Button>
        </div>

        {showOfflineCapability && (
          <div className="mt-2 text-xs flex items-center border-t border-white/20 pt-2">
            <Download size={12} className="mr-1" />
            <span>
              此應用程序支持離線模式。已緩存的內容可正常瀏覽。
            </span>
          </div>
        )}
      </div>
    </div>
  );
}; 