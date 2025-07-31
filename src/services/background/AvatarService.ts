import { BaseService } from '../base/BaseService';
import { log } from '@/lib/logger';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from '@/integrations/firebase/client';

export interface UserAvatar {
  user_id: string;
  avatar_url_96?: string;
  avatar_url_48?: string;
  avatar_url_30?: string;
  updated_at?: string;
}

interface UploadableBlob {
  blob: Blob;
  size: 'l' | 'm' | 's';
}

// 定義一個確保返回值類型的輔助類型
type AvatarUrls = {
  avatar_url_96?: string | undefined;
  avatar_url_48?: string | undefined;
  avatar_url_30?: string | undefined;
};

export class AvatarService extends BaseService {
  private readonly STORAGE_PATH = 'avatars';

  constructor() {
    super('AvatarService');
  }

  private async getUserSerialNumber(userId: string): Promise<number> {
    try {
      log.debug('嘗試獲取用戶註冊序號', { userId }, this.serviceName);
      
      const firestore = getFirestore();
      const userCounterRef = doc(firestore, 'counters', 'users');
      const counterDoc = await getDoc(userCounterRef);
      
      if (counterDoc.exists()) {
        const userData = await getDoc(doc(firestore, 'users', userId));
        if (userData.exists()) {
          const createdAt = userData.data().createdAt?.toDate?.() || new Date();
          const createdTimestamp = createdAt.getTime();
          // 使用創建時間的毫秒數生成一個較為唯一的序號
          const serialNumber = Math.floor((createdTimestamp % 10000000) / 100);
          log.debug('成功基於用戶創建時間獲取序號', { serialNumber }, this.serviceName);
          return serialNumber;
        }
      }
      
      // 如果沒有找到用戶數據或計數器，使用備用序號
      return this.getFallbackSerialNumber();
    } catch (error) {
      log.error('獲取用戶註冊序號時發生未知錯誤，使用備用序號', error, this.serviceName);
      return this.getFallbackSerialNumber();
    }
  }
  
  private getFallbackSerialNumber(): number {
    // 使用備用序號 - 基於時間戳生成一個唯一數字
    const fallbackSerial = Math.floor(Date.now() / 1000) % 100000;
    log.debug('生成備用序號', { fallbackSerial }, this.serviceName);
    return fallbackSerial;
  }

  public async uploadAndRegisterAvatars(
    userId: string,
    blobs: { l: Blob; m: Blob; s: Blob }
  ): Promise<AvatarUrls> {
    try {
      log.debug('開始上傳頭像流程', { userId }, this.serviceName);

      const storage = getStorage();
      const firestore = getFirestore();

      const serialNumber = await this.getUserSerialNumber(userId);
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
      const paddedSerial = String(serialNumber).padStart(5, '0');
      
      const uploadPromises = Object.entries(blobs).map(async ([sizeKey, blob]) => {
        const size = sizeKey as 'l' | 'm' | 's';
        const fileName = `${paddedSerial}-a-${timestamp}-${size}.webp`;
        const filePath = `${this.STORAGE_PATH}/${userId}/${fileName}`;

        // 上傳到 Firebase Storage
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, blob, {
          contentType: 'image/webp',
        });
        
        // 獲取下載 URL
        const publicUrl = await getDownloadURL(storageRef);
        
        return { size, publicUrl };
      });

      const results = await Promise.all(uploadPromises);
      log.debug('頭像上傳成功', { userId, results }, this.serviceName);

      const newUrls: Partial<UserAvatar> & AvatarUrls = {
        user_id: userId,
      };
      
      results.forEach(result => {
        if (result.size === 'l') newUrls.avatar_url_96 = result.publicUrl;
        if (result.size === 'm') newUrls.avatar_url_48 = result.publicUrl;
        if (result.size === 's') newUrls.avatar_url_30 = result.publicUrl;
      });

      // 更新 Firestore 中的頭像記錄
      await setDoc(doc(firestore, 'avatars', userId), {
        ...newUrls,
        updated_at: new Date().toISOString()
      }, { merge: true });

      log.debug('成功更新 avatars 集合', { userId, newUrls }, this.serviceName);
      
      // 同時更新用戶檔案中的頭像 URL
      await setDoc(doc(firestore, 'users', userId), {
        photoURL: newUrls.avatar_url_96,
        lastAvatarUpdate: new Date()
      }, { merge: true });

      // 返回部分對象，確保類型安全
      return {
        avatar_url_96: newUrls.avatar_url_96,
        avatar_url_48: newUrls.avatar_url_48,
        avatar_url_30: newUrls.avatar_url_30,
      };
    } catch (error) {
      log.error('頭像上傳與註冊流程失敗', error, this.serviceName);
      throw error;
    }
  }

  async getUserAvatar(userId: string | undefined): Promise<UserAvatar | null> {
    if (!userId) return null;
    
    try {
      const firestore = getFirestore();
      const avatarRef = doc(firestore, 'avatars', userId);
      const avatarDoc = await getDoc(avatarRef);

      if (!avatarDoc.exists()) {
        // 如果沒有專門的頭像文檔，嘗試從用戶檔案獲取
        const userRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().photoURL) {
          return {
            user_id: userId,
            avatar_url_96: userDoc.data().photoURL,
            avatar_url_48: userDoc.data().photoURL, // 如果沒有中尺寸，使用大尺寸
            avatar_url_30: userDoc.data().photoURL, // 如果沒有小尺寸，使用大尺寸
            updated_at: userDoc.data().lastAvatarUpdate?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        }
        
        return null;
      }
      
      const data = avatarDoc.data();
      return {
        user_id: userId,
        avatar_url_96: data.avatar_url_96,
        avatar_url_48: data.avatar_url_48,
        avatar_url_30: data.avatar_url_30,
        updated_at: data.updated_at
      };
    } catch (error) {
      log.error('獲取用戶頭像時發生未知錯誤', error, this.serviceName);
      return null;
    }
  }
}

// 導出 getUserAvatarUrlFromFirebase 函數
export const getUserAvatarUrlFromFirebase = async (userId: string) => {
  const avatarService = new AvatarService();
  const userAvatar = await avatarService.getUserAvatar(userId);
  
  if (!userAvatar) {
    return {
      large: null,
      medium: null,
      small: null
    };
  }
  
  return {
    large: userAvatar.avatar_url_96 || null,
    medium: userAvatar.avatar_url_48 || null,
    small: userAvatar.avatar_url_30 || null
  };
}; 