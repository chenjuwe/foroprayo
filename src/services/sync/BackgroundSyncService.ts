import { log } from "@/lib/logger";
import { STORAGE_KEYS } from "@/constants";
import { BackgroundService } from "../background/BackgroundService";

export class BackgroundSyncService {
  constructor() {}

  async syncUserBackground(userId: string): Promise<void> {
    try {
      const backgroundService = new BackgroundService();
      const remote = await backgroundService.getUserBackground(userId);
      if (remote) {
        localStorage.setItem(`background_${userId}`, remote.background_id);
        if (remote.background_id === 'custom' && remote.custom_background) {
          localStorage.setItem(`customBackground_${userId}`, remote.custom_background);
          if (remote.custom_background_size) {
            localStorage.setItem(`customBackgroundSize_${userId}`, remote.custom_background_size);
          }
        }
        // 也同步全局 key
        localStorage.setItem(STORAGE_KEYS.BACKGROUND, remote.background_id);
        if (remote.background_id === 'custom' && remote.custom_background) {
          localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND, remote.custom_background);
          if (remote.custom_background_size) {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE, remote.custom_background_size);
          }
        }
        // 觸發全局事件，讓其他頁面能即時取得最新背景
        window.dispatchEvent(new Event('prayforo-background-updated'));
      }
    } catch (error) {
      log.error('同步用戶背景失敗', error, 'BackgroundSyncService');
    }
  }
}

export const backgroundSyncService = new BackgroundSyncService(); 