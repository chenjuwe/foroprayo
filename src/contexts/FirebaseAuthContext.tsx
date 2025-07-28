import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { FirebaseAuthService } from '@/services/auth/FirebaseAuthService';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { log } from '@/lib/logger';

// 定義回傳結果的介面
interface AuthResult {
  user: User | null;
  error: string | null;
  fromCache?: boolean;
}

// 創建上下文類型
interface FirebaseAuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshUserAvatar: () => void;
}

// 創建上下文
const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

// 創建上下文提供者
export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // 獲取 store 中的方法，用於同步認證狀態
  const setUser = useFirebaseAuthStore(state => state.setUser);
  const setAuthLoading = useFirebaseAuthStore(state => state.setAuthLoading);
  const initAuth = useFirebaseAuthStore(state => state.initAuth);

  // 刷新用戶頭像
  const refreshUserAvatar = () => {
    if (currentUser) {
      log.debug('手動刷新用戶頭像', { userId: currentUser.uid }, 'FirebaseAuthContext');
      
      // 觸發頭像更新事件
      window.dispatchEvent(new CustomEvent('avatar-updated', { 
        detail: { 
          userId: currentUser.uid,
          timestamp: Date.now(),
          source: 'FirebaseAuthContext'
        }
      }));
      
      // 清除本地頭像緩存
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('avatar_') || key.includes('lastAvatarUpdate')
      );
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // 強制重新載入用戶資料
      currentUser.reload().then(() => {
        log.debug('用戶資料已重新載入', { userId: currentUser.uid }, 'FirebaseAuthContext');
        
        // 再次觸發頭像更新事件
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('avatar-updated', { 
            detail: { 
              userId: currentUser.uid,
              timestamp: Date.now(),
              source: 'FirebaseAuthContext',
              delayed: true
            }
          }));
        }, 500);
      });
    }
  };

  // 身份驗證狀態監聽
  useEffect(() => {
    log.debug('Firebase 認證上下文初始化', null, 'FirebaseAuthContext');
    
    // 初始化 store 中的認證狀態
    initAuth();
    
    const unsubscribe = FirebaseAuthService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
      setAuthInitialized(true);
      
      // 同步到 store
      setUser(user);
      setAuthLoading(false);
      
      if (user) {
        log.debug('Firebase 認證狀態變化: 用戶已登入', {
          userId: user.uid,
          email: user.email,
          displayName: user.displayName,
          hasPhotoURL: !!user.photoURL
        }, 'FirebaseAuthContext');
        
        // 登入成功時保存基本資訊到 localStorage
        try {
          localStorage.setItem('auth_user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            timestamp: Date.now(),
          }));
        } catch (error) {
          log.error('無法保存用戶資訊到 localStorage', error, 'FirebaseAuthContext');
        }
        
        // 用戶登入時刷新頭像
        setTimeout(() => {
          refreshUserAvatar();
        }, 300);
      } else {
        log.debug('Firebase 認證狀態變化: 用戶未登入', null, 'FirebaseAuthContext');
      }
    });

    return unsubscribe;
  }, [setUser, setAuthLoading, initAuth]);

  // 登入方法
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const result = await FirebaseAuthService.signInWithPassword(email, password) as AuthResult;
    
    // 登入成功後同步到 store
    if (result.user && !result.error) {
      setUser(result.user);
      log.debug('Firebase 登入成功', { 
        userId: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        fromCache: result.fromCache
      }, 'FirebaseAuthContext');
      
      // 更新當前用戶狀態
      setCurrentUser(result.user);
      
      // 登入成功後刷新頭像
      setTimeout(() => {
        refreshUserAvatar();
      }, 300);
    }
    
    return result;
  };

  // 註冊方法
  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    const result = await FirebaseAuthService.signUp(email, password) as AuthResult;
    
    // 註冊成功後同步到 store
    if (result.user && !result.error) {
      setUser(result.user);
      log.debug('Firebase 註冊成功', { 
        userId: result.user.uid,
        email: result.user.email
      }, 'FirebaseAuthContext');
      
      // 註冊成功後刷新頭像
      setTimeout(() => {
        refreshUserAvatar();
      }, 300);
    }
    
    return result;
  };

  // 登出方法
  const signOut = async () => {
    const result = await FirebaseAuthService.signOut();
    
    // 登出後清除 store 中的用戶資料
    if (!result.error) {
      setUser(null);
    }
    
    return result;
  };

  // 重置密碼方法
  const resetPassword = async (email: string) => {
    return await FirebaseAuthService.sendPasswordResetEmail(email);
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUserAvatar,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {!loading && children}
    </FirebaseAuthContext.Provider>
  );
};

// 創建自定義鉤子
export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}; 