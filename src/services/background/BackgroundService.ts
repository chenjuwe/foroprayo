import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, isUserAuthenticated, getCurrentUser } from "@/integrations/firebase/client";
import { BaseService } from "@/services/base/BaseService";
import { log } from "@/lib/logger";

export interface UserBackground {
  backgroundUrl: string;
  backgroundType: 'image' | 'color';
  backgroundValue: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 背景服務 - 處理用戶背景圖片和顏色設定
 */
export class BackgroundService extends BaseService {
  constructor() {
    super('BackgroundService');
  }

  /**
   * 檢查是否有權限存取用戶背景資料
   */
  private canAccessUserBackground(userId: string): boolean {
    const currentUser = getCurrentUser();
    return isUserAuthenticated() && currentUser?.uid === userId;
  }

  /**
   * 獲取用戶背景設定
   */
  async getUserBackground(userId: string): Promise<UserBackground | null> {
    try {
      // 檢查權限（背景資料對所有人都是可讀的）
      this.logOperation('getUserBackground', { userId });

      const docRef = doc(db(), "user_backgrounds", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          backgroundUrl: data.backgroundUrl || '',
          backgroundType: data.backgroundType || 'color',
          backgroundValue: data.backgroundValue || '#ffffff',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }

      // 返回默認背景
      return {
        backgroundUrl: '',
        backgroundType: 'color',
        backgroundValue: '#ffffff',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      // 如果是權限錯誤，返回默認背景而不是拋出錯誤
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('背景服務權限不足，返回默認背景', { userId }, this.serviceName);
        return {
          backgroundUrl: '',
          backgroundType: 'color',
          backgroundValue: '#ffffff',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      this.handleError(error, 'getUserBackground');
    }
  }

  /**
   * 設定用戶背景
   */
  async setUserBackground(userId: string, background: Partial<UserBackground>): Promise<boolean> {
    try {
      // 檢查權限
      if (!this.canAccessUserBackground(userId)) {
        log.warn('無權限更新用戶背景', { userId }, this.serviceName);
        return false;
      }

      this.logOperation('setUserBackground', { userId, backgroundType: background.backgroundType });

      const docRef = doc(db(), "user_backgrounds", userId);
      const updateData = {
        ...background,
        updatedAt: new Date(),
      };

      await setDoc(docRef, updateData, { merge: true });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('背景服務權限不足，無法更新背景', { userId }, this.serviceName);
        return false;
      }
      
      return this.handleErrorSilent(error, 'setUserBackground');
    }
  }

  /**
   * 上傳背景圖片
   */
  async uploadBackgroundImage(userId: string, file: File): Promise<string | null> {
    try {
      // 檢查權限
      if (!this.canAccessUserBackground(userId)) {
        log.warn('無權限上傳背景圖片', { userId }, this.serviceName);
        return null;
      }

      this.logOperation('uploadBackgroundImage', { userId, fileName: file.name });

      // 檢查檔案大小（限制 5MB）
      if (file.size > 5 * 1024 * 1024) {
        log.warn('背景圖片檔案過大', { userId, fileSize: file.size }, this.serviceName);
        return null;
      }

      const timestamp = Date.now();
      const fileName = `background_${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage(), `backgrounds/${userId}/${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 更新用戶背景設定
      await this.setUserBackground(userId, {
        backgroundUrl: downloadURL,
        backgroundType: 'image',
        backgroundValue: downloadURL,
      });

      return downloadURL;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('背景服務權限不足，無法上傳圖片', { userId }, this.serviceName);
        return null;
      }
      
      this.handleErrorSilent(error, 'uploadBackgroundImage');
      return null;
    }
  }

  /**
   * 刪除背景圖片
   */
  async deleteBackgroundImage(userId: string, imageUrl: string): Promise<boolean> {
    try {
      // 檢查權限
      if (!this.canAccessUserBackground(userId)) {
        log.warn('無權限刪除背景圖片', { userId }, this.serviceName);
        return false;
      }

      this.logOperation('deleteBackgroundImage', { userId, imageUrl });

      // 從 Storage 刪除檔案
      const storageRef = ref(storage(), imageUrl);
      await deleteObject(storageRef);

      // 重置為默認背景
      await this.setUserBackground(userId, {
        backgroundUrl: '',
        backgroundType: 'color',
        backgroundValue: '#ffffff',
      });

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('背景服務權限不足，無法刪除圖片', { userId }, this.serviceName);
        return false;
      }
      
      return this.handleErrorSilent(error, 'deleteBackgroundImage');
    }
  }

  /**
   * 重置用戶背景為默認值
   */
  async resetUserBackground(userId: string): Promise<boolean> {
    try {
      // 檢查權限
      if (!this.canAccessUserBackground(userId)) {
        log.warn('無權限重置用戶背景', { userId }, this.serviceName);
        return false;
      }

      this.logOperation('resetUserBackground', { userId });

      const docRef = doc(db(), "user_backgrounds", userId);
      await deleteDoc(docRef);

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('背景服務權限不足，無法重置背景', { userId }, this.serviceName);
        return false;
      }
      
      return this.handleErrorSilent(error, 'resetUserBackground');
    }
  }
} 