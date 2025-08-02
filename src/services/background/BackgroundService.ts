import { db } from '@/integrations/firebase/client';
import { BaseService } from '@/services/base/BaseService';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { log } from '@/lib/logger';

export interface UserBackground {
  user_id: string;
  background_id: string;
  custom_background?: string | null;
  custom_background_size?: string | null;
  updated_at?: string;
}

/**
 * 背景服務 - 雲端同步使用者背景偏好 (Firebase 版本)
 */
export class BackgroundService extends BaseService {
  private readonly BACKGROUNDS_COLLECTION = 'user_backgrounds';
  
  constructor() {
    super('BackgroundService');
  }

  /**
   * 取得使用者背景設定
   */
  async getUserBackground(userId: string): Promise<UserBackground | null> {
    this.logOperation('getUserBackground', { userId });
    try {
      const docRef = doc(db(), this.BACKGROUNDS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        log.debug('用戶尚無背景記錄', { userId }, 'BackgroundService');
        return null; // 沒有找到記錄
      }
      
      const data = docSnap.data();
      const background: UserBackground = {
        user_id: userId,
        background_id: data.background_id,
        custom_background: data.custom_background || null,
        custom_background_size: data.custom_background_size || null,
        // 修改 Timestamp 檢查方式，使用更健壯的方法檢查
        updated_at: data.updated_at && typeof data.updated_at === 'object' && 'toDate' in data.updated_at && typeof data.updated_at.toDate === 'function'
          ? data.updated_at.toDate().toISOString() 
          : data.updated_at
      };
      
      log.debug('成功獲取用戶背景', { userId, backgroundId: background.background_id }, 'BackgroundService');
      return background;
    } catch (error) {
      // 修改錯誤處理，不重新拋出錯誤，而是記錄後使用 localStorage 回退
      log.error(`${this.serviceName} error: getUserBackground`, error, this.serviceName);
      
      // 回退到 localStorage
      const localKey = `background_${userId}`;
      const localBackground = localStorage.getItem(localKey);
      return localBackground ? JSON.parse(localBackground as string) : null;
    }
  }

  /**
   * 更新或插入使用者背景設定
   */
  async upsertUserBackground(params: UserBackground): Promise<void> {
    this.logOperation('upsertUserBackground', { userId: params.user_id, background_id: params.background_id });

    try {
      log.debug('背景雲端同步即將 upsert', { params }, 'BackgroundService');
      const docRef = doc(db(), this.BACKGROUNDS_COLLECTION, params.user_id);
      
      await setDoc(docRef, {
        user_id: params.user_id,
        background_id: params.background_id,
        custom_background: params.custom_background ?? null,
        custom_background_size: params.custom_background_size ?? null,
        updated_at: serverTimestamp()
      }, { merge: true });
      
      log.debug('成功同步用戶背景到雲端', { userId: params.user_id, backgroundId: params.background_id }, 'BackgroundService');
      
      // 觸發背景更新事件，通知其他頁面
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prayforo-background-updated'));
      }
    } catch (error) {
      // 修改錯誤處理，不重新拋出錯誤，而是記錄後使用 localStorage 回退
      log.error(`${this.serviceName} error: upsertUserBackground`, error, this.serviceName);
      
      // 回退到 localStorage
      const localKey = `background_${params.user_id}`;
      localStorage.setItem(localKey, JSON.stringify(params));
      log.warn('雲端同步失敗，已保存到本地存儲', null, 'BackgroundService');
    }
  }
} 