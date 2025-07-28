import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { log } from '@/lib/logger';

interface TempUserState {
  // 按用戶 ID 存儲不同的臨時名稱
  tempDisplayNames: Record<string, string>;
  // 設置特定用戶的臨時名稱
  setTempDisplayName: (userId: string, name: string) => void;
  // 獲取特定用戶的臨時名稱
  getTempDisplayName: (userId: string) => string;
  // 清除特定用戶的臨時名稱
  clearTempDisplayName: (userId: string) => void;
  // 清除所有臨時名稱
  clearAllTempDisplayNames: () => void;
  
  // 向後兼容的屬性和方法
  tempDisplayName: string;
  setTempDisplayName_legacy: (name: string) => void;
  clearTempDisplayName_legacy: () => void;
}

// 使用 persist 中間件來持久化存儲
export const useTempUserStore = create<TempUserState>()(
  persist(
    (set, get) => ({
      // 按用戶 ID 存儲不同的臨時名稱
      tempDisplayNames: {},
      
      // 設置特定用戶的臨時名稱
      setTempDisplayName: (userId, name) => {
        // 檢查是否有變更
        const currentName = get().tempDisplayNames[userId];
        if (currentName === name) return; // 如果名稱沒有變更，直接返回
        
        log.debug('更新用戶臨時名稱', { userId, oldName: currentName, newName: name }, 'tempUserStore');
        
        // 更新狀態
        set((state) => ({
          tempDisplayNames: {
            ...state.tempDisplayNames,
            [userId]: name
          }
        }));
        
        // 發送全局事件，通知所有組件用戶名稱已更新
        window.dispatchEvent(new CustomEvent('username-updated', { 
          detail: { 
            userId,
            displayName: name,
            timestamp: Date.now(),
            source: 'tempUserStore'
          }
        }));
        
        // 將用戶 ID 添加到最近互動的用戶列表
        try {
          const recentUsers = localStorage.getItem('recent_users') || '[]';
          const parsedUsers = JSON.parse(recentUsers);
          if (Array.isArray(parsedUsers)) {
            // 如果已經存在，先移除
            const index = parsedUsers.indexOf(userId);
            if (index !== -1) {
              parsedUsers.splice(index, 1);
            }
            // 添加到列表開頭
            parsedUsers.unshift(userId);
            // 只保留最近 20 個用戶
            const updatedUsers = parsedUsers.slice(0, 20);
            localStorage.setItem('recent_users', JSON.stringify(updatedUsers));
          }
        } catch (error) {
          log.error('保存最近用戶失敗', error, 'tempUserStore');
        }
      },
      
      // 獲取特定用戶的臨時名稱
      getTempDisplayName: (userId) => {
        const state = get();
        return state.tempDisplayNames[userId] || '';
      },
      
      // 清除特定用戶的臨時名稱
      clearTempDisplayName: (userId) => 
        set((state) => {
          const newTempDisplayNames = { ...state.tempDisplayNames };
          delete newTempDisplayNames[userId];
          return { tempDisplayNames: newTempDisplayNames };
        }),
      
      // 清除所有臨時名稱
      clearAllTempDisplayNames: () => set({ tempDisplayNames: {} }),
      
      // 向後兼容的屬性和方法
      tempDisplayName: '',
      setTempDisplayName_legacy: (name) => set({ tempDisplayName: name }),
      clearTempDisplayName_legacy: () => set({ tempDisplayName: '' }),
    }),
    {
      name: 'temp-user-store', // localStorage 的鍵名
      partialize: (state) => ({ tempDisplayNames: state.tempDisplayNames }), // 只持久化 tempDisplayNames
    }
  )
); 