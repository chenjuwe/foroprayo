import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { getUserAvatarUrlFromFirebase } from '@/services/background/AvatarService';
import { log } from '@/lib/logger';

export type AvatarSize = 96 | 48 | 30;

// 定義錯誤類型
interface AvatarError {
  message: string;
  code?: string;
  [key: string]: unknown;
}

// 定義全局狀態類型
interface GlobalAvatarState {
  avatarUrl96: string | null;
  avatarUrl48: string | null;
  avatarUrl30: string | null;
  isLoading: boolean;
  error: AvatarError | null;
}

const globalAvatarState: Record<string, GlobalAvatarState> = {};

// 測試輔助函數 - 清除全局狀態
export const clearAvatarGlobalState = () => {
  Object.keys(globalAvatarState).forEach(key => {
    delete globalAvatarState[key];
  });
};

export const useFirebaseAvatar = (userId?: string) => {
  const currentUser = useFirebaseAuthStore(state => state.user);
  const isAuthLoading = useFirebaseAuthStore(state => state.isAuthLoading);
  const [avatarUrl96, setAvatarUrl96] = useState<string | null>(null);
  const [avatarUrl48, setAvatarUrl48] = useState<string | null>(null);
  const [avatarUrl30, setAvatarUrl30] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AvatarError | null>(null);
  const effectiveUserId = userId || currentUser?.uid;

  // 添加防抖機制，避免短時間內重複更新
  const lastUpdateRef = useRef<{ timestamp: number; url: string }>({ timestamp: 0, url: '' });
  
  // 調試信息
  if (process.env.NODE_ENV === 'development') {
    log.debug('useFirebaseAvatar hook 狀態', { 
      hasUser: !!currentUser, 
      userUid: currentUser?.uid, 
      userEmail: currentUser?.email,
      isAuthLoading 
    }, 'useFirebaseAvatar');
  }

  // 取得頭像
  const fetchAvatar = useCallback(async (shouldThrowError = false) => {
    if (!effectiveUserId) return;
    setIsLoading(true);
    setError(null);
    try {
      // 這裡假設 getUserAvatarUrlFromFirebase 會回傳 { large, medium, small }
      const avatarUrls = await getUserAvatarUrlFromFirebase(effectiveUserId);
      setAvatarUrl96(avatarUrls.large);
      setAvatarUrl48(avatarUrls.medium);
      setAvatarUrl30(avatarUrls.small);
      globalAvatarState[effectiveUserId] = {
        avatarUrl96: avatarUrls.large,
        avatarUrl48: avatarUrls.medium,
        avatarUrl30: avatarUrls.small,
        isLoading: false,
        error: null,
      };
    } catch (err) {
      const error: AvatarError = err instanceof Error 
        ? { message: err.message, code: 'AVATAR_LOAD_ERROR' }
        : { message: 'Unknown error occurred', code: 'UNKNOWN_ERROR' };
        
      setError(error);
      globalAvatarState[effectiveUserId] = {
        avatarUrl96: null,
        avatarUrl48: null,
        avatarUrl30: null,
        isLoading: false,
        error: error,
      };
      
      // 如果 shouldThrowError 為 true，重新拋出錯誤
      if (shouldThrowError) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId]);

  // 初始化與 userId 變動時載入
  useEffect(() => {
    if (!effectiveUserId) return;
    if (globalAvatarState[effectiveUserId]) {
      setAvatarUrl96(globalAvatarState[effectiveUserId].avatarUrl96);
      setAvatarUrl48(globalAvatarState[effectiveUserId].avatarUrl48);
      setAvatarUrl30(globalAvatarState[effectiveUserId].avatarUrl30);
      setIsLoading(globalAvatarState[effectiveUserId].isLoading);
      setError(globalAvatarState[effectiveUserId].error);
    } else {
      fetchAvatar();
    }
  }, [effectiveUserId, fetchAvatar]);

  // 監聽 avatar-updated 事件
  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail as { userId: string };
      if (detail.userId === effectiveUserId) {
        fetchAvatar();
      }
    };
    window.addEventListener('avatar-updated', handler);
    return () => window.removeEventListener('avatar-updated', handler);
  }, [effectiveUserId, fetchAvatar]);

  // 監聽頭像預覽事件，提供即時視覺反饋
  useEffect(() => {
    const handleAvatarPreview = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventDetail = customEvent.detail as { userId: string; timestamp: number; previewURL: string };
      
      if (effectiveUserId && eventDetail.userId === effectiveUserId) {
        const previewURL = eventDetail.previewURL;
        
        // 防抖：如果短時間內收到相同的預覽 URL，跳過更新
        const now = Date.now();
        if (lastUpdateRef.current.url === previewURL && 
            now - lastUpdateRef.current.timestamp < 100) {
          log.debug('跳過重複的頭像預覽更新', { previewURL }, 'useFirebaseAvatar');
          return;
        }
        
        log.debug('檢測到頭像預覽事件', eventDetail, 'useFirebaseAvatar');
        
        // 更新防抖記錄
        lastUpdateRef.current = { timestamp: now, url: previewURL };
        
        // 直接使用預覽 URL 更新所有尺寸的頭像，不先設置 null
        setAvatarUrl96(previewURL);
        setAvatarUrl48(previewURL);
        setAvatarUrl30(previewURL);
      }
    };

    window.addEventListener('avatar-preview-updated', handleAvatarPreview);
    
    return () => {
      window.removeEventListener('avatar-preview-updated', handleAvatarPreview);
    };
  }, [effectiveUserId]);

  // 監聽頭像最終更新事件，確保平滑過渡
  useEffect(() => {
    const handleAvatarFinalUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventDetail = customEvent.detail as { userId: string; timestamp: number; newPhotoURL?: string };
      
      if (effectiveUserId && eventDetail.userId === effectiveUserId && eventDetail.newPhotoURL) {
        const finalURL = eventDetail.newPhotoURL;
        
        // 防抖：如果短時間內收到相同的 URL，跳過更新
        const now = Date.now();
        if (lastUpdateRef.current.url === finalURL && 
            now - lastUpdateRef.current.timestamp < 100) {
          log.debug('跳過重複的頭像最終更新', { finalURL }, 'useFirebaseAvatar');
          return;
        }
        
        log.debug('檢測到頭像最終更新事件', eventDetail, 'useFirebaseAvatar');
        
        // 更新防抖記錄
        lastUpdateRef.current = { timestamp: now, url: finalURL };
        
        // 預載入正式 URL 的圖片，避免切換時的閃爍
        const preloadImage = new Image();
        preloadImage.onload = () => {
          log.debug('正式頭像圖片預載入完成，開始切換', { finalURL }, 'useFirebaseAvatar');
          
          // 只有當圖片完全載入後才切換，避免閃爍
          setAvatarUrl96(finalURL);
          setAvatarUrl48(finalURL);
          setAvatarUrl30(finalURL);
          
          // 清除緩存
          // clearAvatarCache(user.uid); // 移除，因為每個 userId 獨立快取
        };
        
        preloadImage.onerror = () => {
          log.error('正式頭像圖片預載入失敗', { finalURL }, 'useFirebaseAvatar');
          // 即使預載入失敗，也要切換到正式 URL
          setAvatarUrl96(finalURL);
          setAvatarUrl48(finalURL);
          setAvatarUrl30(finalURL);
          // clearAvatarCache(user.uid); // 移除，因為每個 userId 獨立快取
        };
        
        // 開始預載入
        preloadImage.src = finalURL;
      }
    };

    window.addEventListener('avatar-final-updated', handleAvatarFinalUpdate);
    
    return () => {
      window.removeEventListener('avatar-final-updated', handleAvatarFinalUpdate);
    };
  }, [effectiveUserId]);

  // 移除頁面聚焦時的頭像刷新，避免不必要的跳動
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (user) {
  //       log.debug('頁面聚焦，刷新頭像', { userId: user.uid }, 'useFirebaseAvatar');
  //       refreshAvatar();
  //     }
  //   };
  //   
  //   window.addEventListener('focus', handleFocus);
  //   
  //   return () => {
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [user]);

  // 刷新頭像的函數 - 簡化邏輯，移除延遲刷新
  const refreshAvatar = useCallback(async () => {
    if (!effectiveUserId) {
      log.warn('嘗試刷新頭像，但用戶未登入或無效 userId', null, 'useFirebaseAvatar');
      return false;
    }

    setIsLoading(true);
    
    try {
      log.debug('開始刷新用戶頭像', { userId: effectiveUserId }, 'useFirebaseAvatar');
      
      // 清除緩存
      // clearAvatarCache(user.uid); // 移除，因為每個 userId 獨立快取
      
      // 安全地重新加載用戶資料
      try {
        // await user.reload(); // 移除，因為不再直接使用 user 物件
      } catch (reloadError) {
        log.warn('用戶資料重新加載失敗，但繼續處理', { error: reloadError }, 'useFirebaseAvatar');
        // 不中斷流程，繼續使用現有用戶資料
      }
      
      // 立即觸發狀態更新以重新計算頭像 URL，無延遲
      setAvatarUrl96(null);
      setAvatarUrl48(null);
      setAvatarUrl30(null);
      
      // 等待 fetchAvatar 完成
      await fetchAvatar(true); // 傳入 true 允許錯誤傳播
      
      log.debug('頭像已刷新', { userId: effectiveUserId }, 'useFirebaseAvatar');
      
      return true;
    } catch (error) {
      log.warn('刷新頭像失敗，但不影響主要功能', error, 'useFirebaseAvatar');
      // 不顯示錯誤提示，因為這不是關鍵功能
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, fetchAvatar]);

  // 為了向後兼容，使用大尺寸頭像作為默認 avatarUrl
  const avatarUrl = avatarUrl96;

  return {
    user: currentUser,
    isLoggedIn: !!currentUser,
    isAuthLoading,
    avatarUrl,             // 默認使用大尺寸頭像 (96px)
    avatarUrl30,           // 小尺寸頭像 (30px) - Header 上的登入後小頭像，好友訊息卡片的頭像
    avatarUrl48,           // 中尺寸頭像 (48px) - /prayers 頁面，代禱卡片和回應卡片的頭像
    avatarUrl96,           // 大尺寸頭像 (96px) - /profile 頁面的頭像
    refreshAvatar,
    isLoading,
    error,
    data: { 
      avatar_url: avatarUrl, 
      user_name: currentUser?.displayName || currentUser?.email?.split('@')[0] || '' 
    }
  };
}; 