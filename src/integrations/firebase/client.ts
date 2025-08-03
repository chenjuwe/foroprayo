import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyD6iKniBris0rzQ2v9LeAoZBcjVhhK6-WI",
  authDomain: "foroprayo.firebaseapp.com",
  projectId: "foroprayo",
  storageBucket: "foroprayo.firebasestorage.app",
  messagingSenderId: "283821115552",
  appId: "1:283821115552:web:b94921c00771a74ecc21c5",
  measurementId: "G-G82C8BMVDB"
};

// 初始化 Firebase，確保只初始化一次
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 創建單例服務
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;
let _db: Firestore | null = null;
let _analytics: Analytics | null = null;

// 獲取 Auth 實例（懶加載）
export const auth = (): Auth => {
  if (!_auth) {
    _auth = getAuth(app);
  }
  return _auth;
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
  }
  return _db;
};

// 獲取 Analytics 實例 (僅在瀏覽器環境中)（懶加載）
export const analytics = (): Analytics | null => {
  if (typeof window !== 'undefined' && !_analytics) {
    _analytics = getAnalytics(app);
  }
  return _analytics;
};

export default app; 