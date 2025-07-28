import React from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { log } from "@/lib/logger";
import "./App.css";

import { NetworkStatusAlert } from './components/NetworkStatusAlert';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { router } from "./routes";
import { queryClient } from "./config/queryClient";

import { initNetworkListeners } from "./stores/networkStore";
import { cacheService } from "./services/sync/CacheService";
import { useIdlePrefetch } from "./hooks/useIdlePrefetch";
import { FirebaseAuthProvider } from "./contexts/FirebaseAuthContext";
import { useFirebaseAuth } from "./contexts/FirebaseAuthContext";
import { useFirebaseAvatar } from "./hooks/useFirebaseAvatar";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "@/integrations/firebase/client";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { FirebaseUserService } from "@/services/auth/FirebaseUserService";
import { useTempUserStore } from "./stores/tempUserStore";

// 初始化緩存服務
cacheService.initialize(queryClient);

// 全局用戶監聽器管理
const activeListeners: { [key: string]: () => void } = {};

// 全局頭像同步組件
function AvatarSyncComponent() {
  const { refreshAvatar } = useFirebaseAvatar();
  
  // 監聽 Firebase 認證狀態變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth(), async (user) => {
      if (user) {
        log.debug('Auth state changed, user logged in. Reloading user data...', { userId: user.uid });
        try {
          await user.reload();
          log.debug('User data reloaded successfully.', { userId: user.uid, displayName: user.displayName });

          // 確保用戶資料同步到 Firestore
          await FirebaseUserService.syncUserDataFromAuth(user.uid);
          
          // 確保用戶名稱的持久化，並獲取權威名稱
          const canonicalName = await FirebaseUserService.ensureUserDisplayName(user.uid);
          log.debug('Canonical name ensured.', { userId: user.uid, canonicalName });

          // 用權威名稱更新 zustand store
          if (canonicalName) {
            useTempUserStore.getState().setTempDisplayName(user.uid, canonicalName);
            log.debug('Updated tempUserStore with canonical name.', { userId: user.uid, canonicalName });
          }

          // 刷新頭像
          refreshAvatar();
        
          // 觸發頭像更新事件
          window.dispatchEvent(new CustomEvent('avatar-updated', { 
            detail: { 
              userId: user.uid,
              timestamp: Date.now(),
              source: 'AvatarSyncComponent'
            }
          }));

        } catch (error) {
          log.error('處理 Auth 狀態變更失敗', error, 'AvatarSyncComponent');
        }
      }
    });
    
    // 監聽頁面可見性變化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentUser = auth().currentUser;
        if (currentUser) {
          log.debug('頁面變為可見，刷新頭像和用戶資料', { userId: currentUser.uid });
          
          currentUser.reload().then(async () => {
            try {
              // 確保用戶資料同步
              await FirebaseUserService.syncUserDataFromAuth(currentUser.uid);
              
              // 確保用戶名稱的持久化
              const canonicalName = await FirebaseUserService.ensureUserDisplayName(currentUser.uid);

              // 用權威名稱更新 zustand store
              if (canonicalName) {
                useTempUserStore.getState().setTempDisplayName(currentUser.uid, canonicalName);
              }
            } catch (error) {
              log.error('同步用戶資料失敗 (visibility)', error, 'AvatarSyncComponent');
            }
            
            // 刷新頭像
            refreshAvatar();
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 清理函數
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshAvatar]);
  
  // 動態監聽頁面上所有用戶的資料變更
  useEffect(() => {
    const setupListeners = () => {
      const userElements = document.querySelectorAll('[data-user-id]');
      const userIdsOnPage = new Set<string>();
      userElements.forEach(el => {
        const userId = el.getAttribute('data-user-id');
        if (userId) {
          userIdsOnPage.add(userId);
        }
      });

      userIdsOnPage.forEach(userId => {
        // 如果已經在監聽，則跳過
        if (activeListeners[userId]) {
          return;
        }

        log.debug(`Setting up new listener for user: ${userId}`);
        const userDocRef = doc(db(), 'users', userId);
        
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            log.debug(`Detected data change for user: ${userId}`, { userData });

            // 更新用戶名稱
            if (userData.displayName) {
              useTempUserStore.getState().setTempDisplayName(userId, userData.displayName);
            }

            // 更新頭像 (透過事件)
            if (userData.photoURL) {
              window.dispatchEvent(new CustomEvent('avatar-updated', { 
                detail: { 
                  userId: userId,
                  timestamp: Date.now(),
                  newPhotoURL: userData.photoURL,
                  source: 'FirestoreSync'
                }
              }));
            }
          }
        }, (error) => {
          log.error(`Error listening to user ${userId}:`, error);
        });

        // 保存取消訂閱的函數
        activeListeners[userId] = unsubscribe;
      });
    };

    // 使用 MutationObserver 來監聽 DOM 變化，以便在用戶出現時立即設置監聽
    const observer = new MutationObserver(setupListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    // 初始運行一次
    setupListeners();

    // 清理函數
    return () => {
      observer.disconnect();
      Object.values(activeListeners).forEach(unsubscribe => unsubscribe());
      // 清空 activeListeners 以便下次重新建立
      for (const key in activeListeners) {
        delete activeListeners[key];
      }
    };
  }, []);
  
  return null;
}

// 初始化網路監聽
initNetworkListeners();

// 主應用元件
function App() {
  log.info('App initializing', null, 'App');
  
  // 啟用性能監控
  usePerformanceMonitor();

  // 獲取持久化配置
  const persistOptions = cacheService.getPersistQueryClientProviderProps();

  // 簡化應用結構，避免過度嵌套
  return (
    <React.StrictMode>
      <PersistQueryClientProvider {...persistOptions}>
        <FirebaseAuthProvider>
          <NetworkStatusAlert />
          <AvatarSyncComponent />
          <Suspense fallback={
            <div className="w-full h-screen flex items-center justify-center">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
          }>
            <RouterProvider router={router} />
          </Suspense>
          <Toaster />
        </FirebaseAuthProvider>
      </PersistQueryClientProvider>
    </React.StrictMode>
  );
}

export default App;