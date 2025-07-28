import { create } from 'zustand';
import { log } from '@/lib/logger';
import { toast } from 'sonner';

interface NetworkState {
  isOnline: boolean;
  hasPreviouslyBeenOffline: boolean;
  setOnlineStatus: (status: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: navigator.onLine,
  hasPreviouslyBeenOffline: !navigator.onLine,
  
  setOnlineStatus: (status: boolean) => {
    const { isOnline, hasPreviouslyBeenOffline } = get();
    
    // 只有在狀態發生變化時才更新
    if (status !== isOnline) {
      if (!status && !hasPreviouslyBeenOffline) {
        log.warn('網路連線中斷', null, 'NetworkStore');
        toast.error("網路連線中斷", {
          description: "您目前處於離線狀態，部分功能可能無法使用。",
          duration: 5000,
        });
      }
      
      if (status && hasPreviouslyBeenOffline) {
        log.info('網路連線已恢復', null, 'NetworkStore');
        toast.success("網路連線已恢復", {
          description: "您現在處於線上狀態。",
          duration: 3000,
        });
      }
      
      set({ 
        isOnline: status,
        hasPreviouslyBeenOffline: !status
      });
    }
  }
}));

// 初始化網路監聽器
export function initNetworkListeners() {
  // 監聽瀏覽器在線/離線狀態
  window.addEventListener('online', () => {
    useNetworkStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useNetworkStore.getState().setOnlineStatus(false);
  });
} 