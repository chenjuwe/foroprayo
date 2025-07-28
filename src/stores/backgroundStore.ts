import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS, GUEST_DEFAULT_BACKGROUND } from '@/constants';
import { log } from '@/lib/logger';

interface BackgroundState {
  backgroundId: string;
  customBackground: string | null;
  customBackgroundSize: string | null;
  setBackground: (backgroundId: string, customUrl?: string, size?: string) => void;
  resetToDefault: () => void;
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      backgroundId: localStorage.getItem(STORAGE_KEYS.BACKGROUND) || GUEST_DEFAULT_BACKGROUND,
      customBackground: localStorage.getItem(STORAGE_KEYS.CUSTOM_BACKGROUND) || null,
      customBackgroundSize: localStorage.getItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE) || null,
      
      setBackground: (backgroundId, customUrl, size) => {
        localStorage.setItem(STORAGE_KEYS.BACKGROUND, backgroundId);
        
        if (backgroundId === 'custom' && customUrl) {
          localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND, customUrl);
          
          if (size) {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE, size);
          }
        }
        
        set({ 
          backgroundId,
          customBackground: customUrl || null,
          customBackgroundSize: size || null
        });
        
        // 觸發全局事件，讓其他頁面能即時取得最新背景
        window.dispatchEvent(new Event('prayforo-background-updated'));
        log.debug('背景設定已更新', { backgroundId }, 'BackgroundStore');
      },
      
      resetToDefault: () => {
        localStorage.setItem(STORAGE_KEYS.BACKGROUND, GUEST_DEFAULT_BACKGROUND);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND, '');
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE, '');
        
        set({
          backgroundId: GUEST_DEFAULT_BACKGROUND,
          customBackground: null,
          customBackgroundSize: null
        });
        
        window.dispatchEvent(new Event('prayforo-background-updated'));
        log.debug('背景設定已重置為預設', null, 'BackgroundStore');
      }
    }),
    {
      name: 'prayforo-background-storage',
      partialize: (state) => ({ 
        backgroundId: state.backgroundId,
        customBackground: state.customBackground,
        customBackgroundSize: state.customBackgroundSize
      })
    }
  )
); 