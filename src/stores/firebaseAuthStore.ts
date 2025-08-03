import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { addAuthStateListener } from '@/integrations/firebase/client';
import { log } from '@/lib/logger';
import { STORAGE_KEYS, GUEST_DEFAULT_BACKGROUND } from '@/constants';
import { queryClient } from '@/config/queryClient';
import { backgroundSyncService } from '@/services/sync/BackgroundSyncService';

interface FirebaseAuthState {
  user: FirebaseUser | null;
  isAuthLoading: boolean;
  displayName: string;
  setUser: (user: FirebaseUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setDisplayName: (name: string) => void;
  initAuth: () => void;
  signOut: () => Promise<void>;
}

let unsubscribeAuth: (() => void) | null = null;

export const useFirebaseAuthStore = create<FirebaseAuthState>((set, get) => ({
  user: null,
  isAuthLoading: true,
  displayName: '',
  
  setUser: (user) => {
    set({ user });
    // 自動同步 displayName
    if (user && user.displayName) {
      set({ displayName: user.displayName });
    } else {
      set({ displayName: '' });
    }
  },
  
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setDisplayName: (name) => set({ displayName: name }),
  
  initAuth: () => {
    try {
      // 清除之前的監聽器
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      
      // 使用統一的認證狀態管理
      unsubscribeAuth = addAuthStateListener((user) => {
        if (user) {
          set({ 
            user: user, 
            isAuthLoading: false,
            displayName: user.displayName || ''
          });
          
          log.debug('Firebase 用戶登入', { 
            userId: user.uid, 
            email: user.email,
            displayName: user.displayName
          }, 'FirebaseAuthStore');
          
          // 同步用戶背景設定
          if (user.uid) {
            backgroundSyncService.syncUserBackground(user.uid);
          }
          
          // 刷新相關查詢
          queryClient.invalidateQueries({ queryKey: ['avatar', user.uid] });
          queryClient.invalidateQueries({ queryKey: ['prayers'] });
        } else {
          set({ 
            user: null, 
            isAuthLoading: false,
            displayName: ''
          });
          
          log.debug('Firebase 用戶登出', {}, 'FirebaseAuthStore');
          
          // 設置訪客背景
          localStorage.setItem(STORAGE_KEYS.BACKGROUND, GUEST_DEFAULT_BACKGROUND);
          localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND, '');
          localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE, '');
          window.dispatchEvent(new Event('foroprayo-background-updated'));
        }
      });
    } catch (error) {
      log.error('初始化 Firebase 認證狀態失敗', error, 'FirebaseAuthStore');
      set({ isAuthLoading: false });
    }
  },
  
  signOut: async () => {
    try {
      const { auth } = await import('@/integrations/firebase/client');
      await auth().signOut();
      
      // 設置訪客背景
      localStorage.setItem(STORAGE_KEYS.BACKGROUND, GUEST_DEFAULT_BACKGROUND);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND, '');
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE, '');
      
      // 清除 query cache
      queryClient.clear();
      
      // 重定向到登入頁
      window.location.href = '/auth';
    } catch (error) {
      log.error('Firebase 登出失敗', error, 'FirebaseAuthStore');
    }
  }
})); 