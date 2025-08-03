import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { log } from '@/lib/logger';
import { FirebaseAuthService } from '@/services/auth/FirebaseAuthService';

// 認證結果介面
interface AuthResult {
  user: FirebaseUser | null;
  error: string | null;
}

// 定義認證上下文類型
interface FirebaseAuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  authInitialized: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshUserAvatar: () => void;
}

// 創建認證上下文 - 確保導出以支援現有的 hook
export const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

// 認證提供者組件
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // 從 store 獲取狀態和方法
  const { 
    user, 
    isAuthLoading, 
    setUser, 
    setAuthLoading, 
    initAuth 
  } = useFirebaseAuthStore();

  // 身份驗證狀態監聽
  useEffect(() => {
    log.debug('Firebase 認證上下文初始化', null, 'FirebaseAuthContext');
    
    // 初始化 store 中的認證狀態
    initAuth();
  }, [initAuth]);

  // 監聽 store 中的用戶狀態變化
  const storeUser = useFirebaseAuthStore(state => state.user);
  const storeIsLoading = useFirebaseAuthStore(state => state.isAuthLoading);

  useEffect(() => {
    setCurrentUser(storeUser);
    setLoading(storeIsLoading);
    setAuthInitialized(true);
    
    // 同步到 store（確保一致性）
    setUser(storeUser);
    setAuthLoading(storeIsLoading);
    
    if (storeUser) {
      log.debug('Firebase 認證狀態變化: 用戶已登入', {
        userId: storeUser.uid,
        email: storeUser.email,
        displayName: storeUser.displayName,
        photoURL: storeUser.photoURL
      }, 'FirebaseAuthContext');
      
      // 同步用戶數據到 Firestore
      (async () => {
        try {
          const { FirebaseUserService } = await import('@/services/auth/FirebaseUserService');
          await FirebaseUserService.syncUserDataFromAuth(storeUser.uid);
          log.debug('用戶數據同步完成', { userId: storeUser.uid }, 'FirebaseAuthContext');
        } catch (error) {
          log.error('用戶數據同步失敗', { error, userId: storeUser.uid }, 'FirebaseAuthContext');
        }
      })();
    } else {
      log.debug('Firebase 認證狀態變化: 用戶未登入', null, 'FirebaseAuthContext');
    }
  }, [storeUser, storeIsLoading, setUser, setAuthLoading]);

  // 登入方法
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await FirebaseAuthService.signInWithPassword(email, password) as AuthResult;
      
      if (result.user) {
        log.debug('登入成功', {
          userId: result.user.uid,
          email: result.user.email
        }, 'FirebaseAuthContext');
      }
      
      return result;
    } catch (error) {
      log.error('登入失敗', { error }, 'FirebaseAuthContext');
      return {
        user: null,
        error: error instanceof Error ? error.message : '登入失敗'
      };
    }
  };

  // 註冊方法
  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await FirebaseAuthService.signUp(email, password) as AuthResult;
      
      if (result.user) {
        log.debug('註冊成功', {
          userId: result.user.uid,
          email: result.user.email
        }, 'FirebaseAuthContext');
      }
      
      return result;
    } catch (error) {
      log.error('註冊失敗', { error }, 'FirebaseAuthContext');
      return {
        user: null,
        error: error instanceof Error ? error.message : '註冊失敗'
      };
    }
  };

  // 登出方法
  const signOut = async () => {
    try {
      const result = await FirebaseAuthService.signOut();
      log.debug('登出成功', null, 'FirebaseAuthContext');
      return result;
    } catch (error) {
      log.error('登出失敗', { error }, 'FirebaseAuthContext');
      return { error: error instanceof Error ? error.message : '登出失敗' };
    }
  };

  // 重置密碼方法
  const resetPassword = async (email: string) => {
    try {
      const result = await FirebaseAuthService.sendPasswordResetEmail(email);
      log.debug('密碼重置郵件已發送', { email }, 'FirebaseAuthContext');
      return result;
    } catch (error) {
      log.error('密碼重置失敗', { error, email }, 'FirebaseAuthContext');
      return { error: error instanceof Error ? error.message : '密碼重置失敗' };
    }
  };

  // 刷新用戶頭像 (空實現，為了兼容性)
  const refreshUserAvatar = () => {
    if (currentUser) {
      log.debug('刷新用戶頭像', { userId: currentUser.uid }, 'FirebaseAuthContext');
      // 觸發頭像更新事件
      window.dispatchEvent(new CustomEvent('avatar-updated', {
        detail: { userId: currentUser.uid, timestamp: Date.now() }
      }));
    }
  };

  const value: FirebaseAuthContextType = {
    currentUser,
    loading,
    authInitialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUserAvatar,
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

// 自定義 hook 來使用認證上下文
export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth 必須在 FirebaseAuthProvider 內使用');
  }
  return context;
}

// 確保導出名稱一致，避免 HMR 問題
export default FirebaseAuthProvider; 