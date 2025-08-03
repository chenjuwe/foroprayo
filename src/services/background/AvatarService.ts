import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, isUserAuthenticated, getCurrentUser } from "@/integrations/firebase/client";
import { BaseService } from "@/services/base/BaseService";
import { log } from "@/lib/logger";

export interface UserAvatar {
  avatarUrl: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 頭像服務 - 處理用戶頭像上傳和管理
 */
export class AvatarService extends BaseService {
  constructor() {
    super('AvatarService');
  }

  /**
   * 檢查是否有權限存取用戶頭像資料
   */
  private canAccessUserAvatar(userId: string): boolean {
    const currentUser = getCurrentUser();
    return isUserAuthenticated() && currentUser?.uid === userId;
  }

  /**
   * 獲取用戶頭像
   */
  async getUserAvatar(userId: string): Promise<UserAvatar | null> {
    try {
      // 頭像資料對所有人都是可讀的
      this.logOperation('getUserAvatar', { userId });

      const docRef = doc(db(), "avatars", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          avatarUrl: data.avatarUrl || '',
          isDefault: data.isDefault || true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }

      // 返回默認頭像
      return {
        avatarUrl: '',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      // 如果是權限錯誤，返回默認頭像而不是拋出錯誤
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('頭像服務權限不足，返回默認頭像', { userId }, this.serviceName);
        return {
          avatarUrl: '',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      this.handleError(error, 'getUserAvatar');
    }
  }

  /**
   * 設定用戶頭像
   */
  async setUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
    try {
      // 檢查權限
      if (!this.canAccessUserAvatar(userId)) {
        log.warn('無權限更新用戶頭像', { userId }, this.serviceName);
        return false;
      }

      this.logOperation('setUserAvatar', { userId, hasAvatarUrl: !!avatarUrl });

      const docRef = doc(db(), "avatars", userId);
      const avatarData = {
        avatarUrl,
        isDefault: !avatarUrl,
        updatedAt: new Date(),
      };

      await setDoc(docRef, avatarData, { merge: true });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('頭像服務權限不足，無法更新頭像', { userId }, this.serviceName);
        return false;
      }
      
      return this.handleErrorSilent(error, 'setUserAvatar');
    }
  }

  /**
   * 上傳頭像圖片
   */
  async uploadAvatarImage(userId: string, file: File): Promise<string | null> {
    try {
      // 檢查權限
      if (!this.canAccessUserAvatar(userId)) {
        log.warn('無權限上傳頭像圖片', { userId }, this.serviceName);
        return null;
      }

      this.logOperation('uploadAvatarImage', { userId, fileName: file.name });

      // 檢查檔案大小（限制 2MB）
      if (file.size > 2 * 1024 * 1024) {
        log.warn('頭像圖片檔案過大', { userId, fileSize: file.size }, this.serviceName);
        return null;
      }

      // 檢查檔案類型
      if (!file.type.startsWith('image/')) {
        log.warn('頭像檔案類型不正確', { userId, fileType: file.type }, this.serviceName);
        return null;
      }

      const timestamp = Date.now();
      const fileName = `avatar_${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage(), `avatars/${userId}/${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 更新用戶頭像
      await this.setUserAvatar(userId, downloadURL);

      return downloadURL;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('頭像服務權限不足，無法上傳圖片', { userId }, this.serviceName);
        return null;
      }
      
      this.handleErrorSilent(error, 'uploadAvatarImage');
      return null;
    }
  }

  /**
   * 刪除頭像圖片
   */
  async deleteAvatarImage(userId: string, imageUrl: string): Promise<boolean> {
    try {
      // 檢查權限
      if (!this.canAccessUserAvatar(userId)) {
        log.warn('無權限刪除頭像圖片', { userId }, this.serviceName);
        return false;
      }

      this.logOperation('deleteAvatarImage', { userId, imageUrl });

      // 從 Storage 刪除檔案
      const storageRef = ref(storage(), imageUrl);
      await deleteObject(storageRef);

      // 重置為默認頭像
      await this.setUserAvatar(userId, '');

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('頭像服務權限不足，無法刪除圖片', { userId }, this.serviceName);
        return false;
      }
      
      return this.handleErrorSilent(error, 'deleteAvatarImage');
    }
  }

  /**
   * 重置用戶頭像為默認值
   */
  async resetUserAvatar(userId: string): Promise<boolean> {
    try {
      // 檢查權限
      if (!this.canAccessUserAvatar(userId)) {
        log.warn('無權限重置用戶頭像', { userId }, this.serviceName);
        return false;
      }

      this.logOperation('resetUserAvatar', { userId });

      await this.setUserAvatar(userId, '');
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        log.warn('頭像服務權限不足，無法重置頭像', { userId }, this.serviceName);
        return false;
      }
      
      return this.handleErrorSilent(error, 'resetUserAvatar');
    }
  }
} 