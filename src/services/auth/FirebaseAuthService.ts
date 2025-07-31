import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  UserCredential
} from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { log } from "@/lib/logger";

// 配額限制處理相關設定
const RETRY_DELAY = 3000; // 增加初始重試延遲時間 (毫秒)
const MAX_RETRIES = 3; // 最大重試次數
const CACHE_KEY = 'auth_user';
const LAST_USER_KEY = 'last_user';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小時

// 簡化的使用者對象用於緩存
interface CachedUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  timestamp: number;
}

export class FirebaseAuthService {
  /**
   * 檢查並返回緩存的用戶資訊
   */
  static getCachedUser(email?: string): CachedUser | null {
    try {
      // 嘗試從緩存獲取用戶資訊
      const cachedUserString = localStorage.getItem(CACHE_KEY);
      if (!cachedUserString) return null;
      
      const cachedUser = JSON.parse(cachedUserString) as CachedUser;
      
      // 檢查緩存是否過期
      if (Date.now() - cachedUser.timestamp > CACHE_DURATION) {
        return null;
      }
      
      // 如果提供了電子郵件，檢查是否匹配
      if (email && cachedUser.email !== email) {
        // 不匹配，檢查上次用戶
        const lastUser = localStorage.getItem(LAST_USER_KEY);
        if (lastUser !== email) {
          return null;
        }
      }
      
      return cachedUser;
    } catch (e) {
      return null;
    }
  }
  
  /**
   * 保存用戶資訊到緩存
   */
  static saveUserToCache(user: User | UserCredential['user']) {
    try {
      // 保存簡化的用戶資訊
      const cachedUser: CachedUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        timestamp: Date.now()
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedUser));
      
      // 保存最後使用的電子郵件
      if (user.email) {
        localStorage.setItem(LAST_USER_KEY, user.email);
      }
    } catch (e) {
      // 忽略緩存錯誤
    }
  }
  
  /**
   * 使用電子郵件和密碼登入，添加重試邏輯處理配額限制
   */
  static async signInWithPassword(email: string, password: string, retryCount = 0) {
    try {
      // 首先檢查網絡連接
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // 離線模式 - 嘗試使用緩存
        const cachedUser = this.getCachedUser(email);
        if (cachedUser) {
          return { 
            user: cachedUser as unknown as User, 
            error: null, 
            fromCache: true,
            offline: true
          };
        }
        throw new Error('網絡連接不可用，請檢查您的連接');
      }
      
      // 在登入前檢查緩存 - 如果有匹配的緩存用戶，直接返回
      const cachedUser = this.getCachedUser(email);
      if (cachedUser) {
        // 後台嘗試實際登入，但不阻塞使用者體驗
        setTimeout(async () => {
          try {
            const result = await signInWithEmailAndPassword(auth(), email, password);
            this.saveUserToCache(result.user);
          } catch (e) {
            // 忽略後台登入錯誤
          }
        }, 100);
        
        // 立即返回緩存的用戶資訊
        return {
          user: cachedUser as unknown as User,
          error: null,
          fromCache: true
        };
      }

      // 正常登入流程
      const userCredential = await signInWithEmailAndPassword(auth(), email, password);
      // 登入成功時，保存用戶資訊到緩存
      this.saveUserToCache(userCredential.user);
      
      return { user: userCredential.user, error: null, fromCache: false };
    } catch (error: unknown) {
      // 檢查是否為配額超出或資源不足錯誤
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      const errorCode = (error as { code?: string })?.code;
      
      if (errorCode === 'auth/quota-exceeded' || 
          errorMessage?.includes('quota') || 
          errorMessage?.includes('metric') || 
          errorMessage?.includes('INSUFFICIENT_RESOURCES')) {
        
        // 記錄警告
        log.warn('Firebase 認證資源限制', { retryCount, errorCode }, 'FirebaseAuthService');
        
        // 嘗試從緩存恢復
        const cachedUser = this.getCachedUser(email);
        if (cachedUser) {
          log.debug('使用緩存認證', { email }, 'FirebaseAuthService');
          return { 
            user: cachedUser as unknown as User, 
            error: null,
            fromCache: true,
            resourceLimit: true
          };
        }
        
        // 檢查是否還有重試機會
        if (retryCount < MAX_RETRIES) {
          // 使用指數退避策略計算下一次重試延遲
          const delay = RETRY_DELAY * Math.pow(2, retryCount) + Math.floor(Math.random() * 500);
          
          // 返回延遲重試承諾
          return new Promise((resolve) => {
            setTimeout(async () => {
              resolve(await this.signInWithPassword(email, password, retryCount + 1));
            }, delay);
          });
        }
        
        return { 
          user: null, 
          error: '認證服務暫時不可用，請稍後再試',
          resourceLimit: true
        };
      }
      
      // 其他錯誤
      return { user: null, error: this.handleAuthError(error) };
    }
  }

  /**
   * 使用電子郵件和密碼註冊，添加重試邏輯處理配額限制
   */
  static async signUp(email: string, password: string, retryCount = 0) {
    try {
      // 首先檢查網絡連接
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('網絡連接不可用，請檢查您的連接');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth(), email, password);
      // 註冊成功時，保存用戶資訊到緩存
      this.saveUserToCache(userCredential.user);
      
      return { user: userCredential.user, error: null };
    } catch (error: unknown) {
      // 檢查是否為配額超出或資源不足錯誤
      if ((error as { code?: string })?.code === 'auth/quota-exceeded' || 
          (error as Error).message?.includes('quota') || 
          (error as Error).message?.includes('metric') || 
          (error as Error).message?.includes('INSUFFICIENT_RESOURCES')) {
        
        // 記錄警告
        log.warn('Firebase 註冊資源限制', { retryCount, errorCode: (error as { code?: string })?.code }, 'FirebaseAuthService');
        
        // 檢查是否還有重試機會
        if (retryCount < MAX_RETRIES) {
          // 使用指數退避策略計算下一次重試延遲
          const delay = RETRY_DELAY * Math.pow(2, retryCount) + Math.floor(Math.random() * 500);
          
          // 返回延遲重試承諾
          return new Promise((resolve) => {
            setTimeout(async () => {
              resolve(await this.signUp(email, password, retryCount + 1));
            }, delay);
          });
        }
        
        return { 
          user: null, 
          error: '註冊服務暫時不可用，請稍後再試',
          resourceLimit: true
        };
      }
      
      // 其他錯誤
      return { user: null, error: this.handleAuthError(error) };
    }
  }

  /**
   * 登出
   */
  static async signOut() {
    try {
      // 清除緩存
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(LAST_USER_KEY);
      
      // 執行 Firebase 登出
      await firebaseSignOut(auth());
      return { error: null };
    } catch (error: unknown) {
      // 即使 Firebase 登出失敗，也清除本地緩存
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(LAST_USER_KEY);
      
      return { error: this.handleAuthError(error) };
    }
  }

  /**
   * 發送密碼重置郵件
   */
  static async sendPasswordResetEmail(email: string) {
    try {
      await sendPasswordResetEmail(auth(), email);
      return { error: null };
    } catch (error: unknown) {
      return { error: this.handleAuthError(error) };
    }
  }

  /**
   * 監聽身份驗證狀態變化
   */
  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth(), callback);
  }

  /**
   * 處理身份驗證錯誤
   */
  private static handleAuthError(error: unknown): string {
    const errorCode = (error as { code?: string })?.code;
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    
    switch (errorCode) {
      case 'auth/invalid-email':
        return '電子郵件格式不正確';
      case 'auth/user-disabled':
        return '此用戶已被禁用';
      case 'auth/user-not-found':
        return '找不到此用戶';
      case 'auth/wrong-password':
        return '密碼不正確';
      case 'auth/email-already-in-use':
        return '此電子郵件已被使用';
      case 'auth/weak-password':
        return '密碼強度不足';
      case 'auth/too-many-requests':
        return '登入嘗試次數過多，請稍後再試';
      case 'auth/quota-exceeded':
        return '認證服務暫時不可用，請稍後再試';
      default:
        // 檢查錯誤訊息中是否包含配額相關字眼
        if (errorMessage?.includes('quota') || errorMessage?.includes('limit') || errorMessage?.includes('INSUFFICIENT_RESOURCES')) {
          return '認證服務暫時不可用，請稍後再試';
        }
        return errorMessage || '發生未知錯誤';
    }
  }
} 