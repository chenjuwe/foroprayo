import { db } from '@/integrations/firebase/client';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { log } from '@/lib/logger';
import { auth } from '@/integrations/firebase/client';
import { updateProfile } from 'firebase/auth';

// 使用者資料介面
export interface FirebaseUserData {
  userId: string;
  email?: string;
  displayName?: string;
  scripture?: string;
  photoURL?: string; // 添加 photoURL 欄位
  createdAt?: number;
  updatedAt: number;
}

export class FirebaseUserService {
  private static COLLECTION_NAME = 'users';

  /**
   * 獲取使用者資料
   */
  static async getUserData(userId: string): Promise<FirebaseUserData | null> {
    try {
      log.debug('開始獲取使用者資料', { userId }, 'FirebaseUserService');
      const userRef = doc(db(), this.COLLECTION_NAME, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data() as FirebaseUserData;
        log.debug('成功獲取使用者資料', { 
          userId,
          hasDisplayName: !!data.displayName,
          displayName: data.displayName || '無用戶名稱',
          hasScripture: !!data.scripture,
          scripture: data.scripture || '無經文資料'
        }, 'FirebaseUserService');
        return data;
      } else {
        log.debug('使用者資料不存在，將創建新資料', { userId }, 'FirebaseUserService');
        // 創建一個空的用戶資料
        const newUserData: FirebaseUserData = {
          userId,
          updatedAt: Date.now()
        };
        
        // 保存到 Firestore
        await setDoc(userRef, newUserData);
        
        return newUserData;
      }
    } catch (error) {
      log.error('獲取使用者資料失敗', error, 'FirebaseUserService');
      throw error;
    }
  }

  /**
   * 創建或更新使用者資料
   */
  static async setUserData(userId: string, data: Partial<FirebaseUserData>): Promise<void> {
    try {
      const timestamp = Date.now();
      const userRef = doc(db(), this.COLLECTION_NAME, userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // 更新現有資料
        log.debug('更新使用者資料', { userId, data }, 'FirebaseUserService');
        await updateDoc(userRef, {
          ...data,
          updatedAt: timestamp
        });
      } else {
        // 創建新資料
        log.debug('創建使用者資料', { userId, data }, 'FirebaseUserService');
        await setDoc(userRef, {
          userId,
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
      
      log.debug('使用者資料保存成功', { userId }, 'FirebaseUserService');
    } catch (error) {
      log.error('設置使用者資料失敗', error, 'FirebaseUserService');
      throw error;
    }
  }

  /**
   * 更新使用者的經文
   */
  static async updateScripture(userId: string, scripture: string): Promise<void> {
    try {
      log.debug('開始更新使用者經文', { userId, scripture }, 'FirebaseUserService');
      await this.setUserData(userId, { scripture });
      log.debug('使用者經文更新成功', { userId }, 'FirebaseUserService');
    } catch (error) {
      log.error('更新使用者經文失敗', error, 'FirebaseUserService');
      throw error;
    }
  }
  
  /**
   * 同步 Firebase Auth 用戶資料到 Firestore
   * 在用戶登入後調用，確保 Firestore 中的資料與 Auth 同步
   */
  static async syncUserDataFromAuth(userId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        log.warn('無法同步用戶資料：用戶未登入或 ID 不匹配', { 
          authUserId: currentUser?.uid, 
          requestedUserId: userId 
        }, 'FirebaseUserService');
        return;
      }
      
      log.debug('開始同步用戶資料從 Auth 到 Firestore', { userId }, 'FirebaseUserService');
      
      // 構建要更新的資料
      const userData: Partial<FirebaseUserData> = {
        userId: currentUser.uid
      };
      
      if (currentUser.email) {
        userData.email = currentUser.email;
      }
      
      if (currentUser.displayName) {
        userData.displayName = currentUser.displayName;
      }
      
      if (currentUser.photoURL) {
        userData.photoURL = currentUser.photoURL;
      }
      
      // 更新 Firestore
      await this.setUserData(userId, userData);
      
      // 同時更新 localStorage
      if (currentUser.displayName) {
        localStorage.setItem(`displayName_${userId}`, currentUser.displayName);
      }
      
      log.debug('用戶資料同步成功', { userId }, 'FirebaseUserService');
    } catch (error) {
      log.error('同步用戶資料失敗', error, 'FirebaseUserService');
      throw error;
    }
  }
  
  /**
   * 確保用戶名稱的持久化
   * 檢查並同步用戶名稱到所有存儲位置
   */
  static async ensureUserDisplayName(userId: string): Promise<string | null> {
    try {
      log.debug('開始確保用戶名稱持久化', { userId }, 'FirebaseUserService');
      
      // 檢查順序：
      // 1. Firebase Auth
      // 2. Firestore
      // 3. localStorage
      
      const currentUser = auth().currentUser;
      let displayName: string | null = null;
      
      // 1. 檢查 Firebase Auth
      if (currentUser && currentUser.uid === userId && currentUser.displayName) {
        displayName = currentUser.displayName;
        log.debug('從 Firebase Auth 獲取用戶名稱', { userId, displayName }, 'FirebaseUserService');
      }
      
      // 2. 如果 Auth 中沒有，檢查 Firestore
      if (!displayName) {
        const userData = await this.getUserData(userId);
        if (userData && userData.displayName) {
          displayName = userData.displayName;
          log.debug('從 Firestore 獲取用戶名稱', { userId, displayName }, 'FirebaseUserService');
          
          // 如果 Auth 中沒有但 Firestore 有，更新 Auth
          if (currentUser && currentUser.uid === userId && !currentUser.displayName) {
            try {
              await updateProfile(currentUser, { displayName });
              log.debug('已將 Firestore 中的用戶名稱同步到 Auth', { userId, displayName }, 'FirebaseUserService');
            } catch (error) {
              log.error('同步用戶名稱到 Auth 失敗', error, 'FirebaseUserService');
            }
          }
        }
      }
      
      // 3. 如果 Firestore 中也沒有，檢查 localStorage
      if (!displayName) {
        const localDisplayName = localStorage.getItem(`displayName_${userId}`);
        if (localDisplayName) {
          displayName = localDisplayName;
          log.debug('從 localStorage 獲取用戶名稱', { userId, displayName }, 'FirebaseUserService');
          
          // 將 localStorage 中的名稱同步到 Firestore 和 Auth
          await this.setUserData(userId, { displayName });
          
          if (currentUser && currentUser.uid === userId) {
            try {
              await updateProfile(currentUser, { displayName });
              log.debug('已將 localStorage 中的用戶名稱同步到 Auth 和 Firestore', { userId, displayName }, 'FirebaseUserService');
            } catch (error) {
              log.error('同步用戶名稱到 Auth 失敗', error, 'FirebaseUserService');
            }
          }
        }
      }
      
      // 4. 如果都沒有，使用 email 前綴
      if (!displayName && currentUser && currentUser.email) {
        displayName = currentUser.email.split('@')[0];
        log.debug('使用 email 前綴作為用戶名稱', { userId, displayName }, 'FirebaseUserService');
        
        // 將 email 前綴保存到所有位置
        await this.setUserData(userId, { displayName });
        localStorage.setItem(`displayName_${userId}`, displayName);
        
        try {
          await updateProfile(currentUser, { displayName });
          log.debug('已將 email 前綴同步到 Auth 和 Firestore', { userId, displayName }, 'FirebaseUserService');
        } catch (error) {
          log.error('同步用戶名稱到 Auth 失敗', error, 'FirebaseUserService');
        }
      }
      
      // 5. 如果有找到名稱，確保保存到 localStorage
      if (displayName) {
        localStorage.setItem(`displayName_${userId}`, displayName);
      }
      
      log.debug('用戶名稱持久化處理完成', { userId, displayName }, 'FirebaseUserService');
      
      return displayName;
    } catch (error) {
      log.error('確保用戶名稱持久化失敗', error, 'FirebaseUserService');
      return null;
    }
  }

  static async updateAllUserNames(userId: string, newName: string): Promise<void> {
    log.debug('開始批次更新用戶名稱', { userId, newName }, 'FirebaseUserService');
    const batch = writeBatch(db());

    try {
      // 1. 更新 'prayers' 集合
      const prayersQuery = query(collection(db(), 'prayers'), where('user_id', '==', userId));
      const prayersSnapshot = await getDocs(prayersQuery);
      prayersSnapshot.forEach(doc => {
        batch.update(doc.ref, { user_name: newName });
      });
      log.debug(`找到 ${prayersSnapshot.size} 則代禱進行更新`, null, 'FirebaseUserService');

      // 2. 更新 'prayer_responses' 集合
      const responsesQuery = query(collection(db(), 'prayer_responses'), where('user_id', '==', userId));
      const responsesSnapshot = await getDocs(responsesQuery);
      responsesSnapshot.forEach(doc => {
        batch.update(doc.ref, { user_name: newName });
      });
      log.debug(`找到 ${responsesSnapshot.size} 則回應進行更新`, null, 'FirebaseUserService');

      await batch.commit();
      log.info('用戶名稱批次更新成功', { userId, newName }, 'FirebaseUserService');
    } catch (error) {
      log.error('批次更新用戶名稱失敗', error, 'FirebaseUserService');
      throw new Error('更新用戶相關資料時發生錯誤');
    }
  }
}

export default FirebaseUserService; 

/**
 * 根據 userId 取得頭像 URL（large/medium/small）
 */
export async function getUserAvatarUrlFromFirebase(userId: string): Promise<{ large: string; medium: string; small: string }> {
  try {
    log.debug('開始獲取用戶頭像', { userId }, 'getUserAvatarUrlFromFirebase');
    
    const userData = await FirebaseUserService.getUserData(userId);
    log.debug('獲取到用戶數據', { 
      userId, 
      hasUserData: !!userData,
      hasPhotoURL: !!(userData?.photoURL),
      photoURL: userData?.photoURL
    }, 'getUserAvatarUrlFromFirebase');
    
    let baseUrl = '';
    if (userData && userData.photoURL) {
      baseUrl = userData.photoURL;
      log.debug('使用用戶的 photoURL', { baseUrl }, 'getUserAvatarUrlFromFirebase');
    }
    
    if (!baseUrl) {
      // 沒有頭像就用預設
      const name = userData?.displayName || userData?.email?.split('@')[0] || userId.substring(0, 5);
      const placeholderUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
      log.debug('使用預設頭像', { 
        name, 
        placeholderUrl,
        reason: '無 photoURL' 
      }, 'getUserAvatarUrlFromFirebase');
      
      return {
        large: placeholderUrl,
        medium: placeholderUrl,
        small: placeholderUrl
      };
    }
    
    // 假設 firebase 頭像 url 格式為 ..._large.webp
    const getSizeUrl = (size: 'large' | 'medium' | 'small') => {
      if (baseUrl.includes('_large.webp')) {
        return baseUrl.replace('_large.webp', `_${size}.webp`);
      }
      // 如果不是多尺寸格式，直接使用原始 URL
      return baseUrl;
    };
    
    const result = {
      large: getSizeUrl('large'),
      medium: getSizeUrl('medium'),
      small: getSizeUrl('small')
    };
    
    log.debug('頭像 URL 生成完成', { 
      userId,
      baseUrl,
      result 
    }, 'getUserAvatarUrlFromFirebase');
    
    return result;
  } catch (error) {
    log.error('獲取用戶頭像失敗', { userId, error }, 'getUserAvatarUrlFromFirebase');
    
    // 發生錯誤時返回預設頭像
    const fallbackName = userId.substring(0, 5);
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random&color=fff`;
    
    return {
      large: fallbackUrl,
      medium: fallbackUrl,
      small: fallbackUrl
    };
  }
} 