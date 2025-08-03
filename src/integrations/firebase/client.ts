import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFirestore, Firestore } from "firebase/firestore";
import { log } from "@/lib/logger";

// Firebase 配置
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBcFamR8al69jVzgia0kxKIcf5inLpxt0I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "foroprayo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "foroprayo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "foroprayo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "863364228350",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:863364228350:web:9aa4648b3582c8670a71af",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YX85B6N0M8"
};

// 初始化 Firebase，確保只初始化一次
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 創建單例服務
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;
let _db: Firestore | null = null;
let _analytics: Analytics | null = null;

// 全域驗證狀態
let _currentUser: User | null = null;
let _authInitialized = false;
let _authStateListeners: ((user: User | null) => void)[] = [];

// 獲取 Auth 實例（懶加載）
export const auth = (): Auth => {
  if (!_auth) {
    _auth = getAuth(app);
    
    // 設置認證持久化為本地存儲
    setPersistence(_auth, browserLocalPersistence).then(() => {
      log.debug('Firebase Auth 持久化設置為本地存儲', {}, 'FirebaseClient');
    }).catch((error) => {
      log.error('設置 Firebase Auth 持久化失敗', error, 'FirebaseClient');
    });
    
    // 設置驗證狀態監聽器（只設置一次）
    if (!_authInitialized) {
      _authInitialized = true;
      onAuthStateChanged(_auth, (user) => {
        _currentUser = user;
        log.debug('Firebase Auth 狀態變更', { 
          userId: user?.uid, 
          email: user?.email,
          displayName: user?.displayName,
          isAuthenticated: !!user,
          timestamp: new Date().toISOString()
        }, 'FirebaseClient');
        
        // 通知所有監聽器
        _authStateListeners.forEach(listener => {
          try {
            listener(user);
          } catch (error) {
            log.error('Auth 狀態監聽器執行失敗', error, 'FirebaseClient');
          }
        });
      });
    }
  }
  return _auth;
};

// 添加認證狀態監聽器
export const addAuthStateListener = (listener: (user: User | null) => void): (() => void) => {
  _authStateListeners.push(listener);
  
  // 如果已經有用戶，立即調用監聽器
  if (_currentUser !== undefined) {
    listener(_currentUser);
  }
  
  // 返回取消訂閱函數
  return () => {
    const index = _authStateListeners.indexOf(listener);
    if (index > -1) {
      _authStateListeners.splice(index, 1);
    }
  };
};

// 獲取 Storage 實例（懶加載）
export const storage = (): FirebaseStorage => {
  if (!_storage) {
    _storage = getStorage(app);
  }
  return _storage;
};

// 獲取 Firestore 實例（懶加載）
export const db = (): Firestore => {
  if (!_db) {
    _db = getFirestore(app);
    
    // 檢查 Firestore 連線狀態
    log.debug('Firestore 初始化完成', { 
      projectId: firebaseConfig.projectId 
    }, 'FirebaseClient');
  }
  return _db;
};

// 獲取 Analytics 實例 (僅在瀏覽器環境中)（懶加載）
export const analytics = (): Analytics | null => {
  if (typeof window !== 'undefined' && !_analytics) {
    try {
      _analytics = getAnalytics(app);
    } catch (error) {
      log.error('Analytics 初始化失敗', error, 'FirebaseClient');
    }
  }
  return _analytics;
};

// 檢查用戶是否已驗證
export const isUserAuthenticated = (): boolean => {
  return !!_currentUser;
};

// 獲取當前用戶
export const getCurrentUser = (): User | null => {
  return _currentUser;
};

// 等待驗證初始化完成
export const waitForAuthInit = (): Promise<User | null> => {
  return new Promise((resolve) => {
    if (_authInitialized && _currentUser !== undefined) {
      resolve(_currentUser);
      return;
    }
    
    const authInstance = auth();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export default app; 