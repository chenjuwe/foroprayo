import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// 嘗試讀取.env檔案
let firebaseConfig = {};

try {
  const envFile = fs.readFileSync(path.resolve('.env'), 'utf8');
  
  // 讀取 Firebase 配置
  const apiKeyMatch = envFile.match(/VITE_FIREBASE_API_KEY=(.+)/);
  const authDomainMatch = envFile.match(/VITE_FIREBASE_AUTH_DOMAIN=(.+)/);
  const projectIdMatch = envFile.match(/VITE_FIREBASE_PROJECT_ID=(.+)/);
  const storageBucketMatch = envFile.match(/VITE_FIREBASE_STORAGE_BUCKET=(.+)/);
  const messagingSenderIdMatch = envFile.match(/VITE_FIREBASE_MESSAGING_SENDER_ID=(.+)/);
  const appIdMatch = envFile.match(/VITE_FIREBASE_APP_ID=(.+)/);
  
  firebaseConfig = {
    apiKey: apiKeyMatch ? apiKeyMatch[1].trim() : null,
    authDomain: authDomainMatch ? authDomainMatch[1].trim() : null,
    projectId: projectIdMatch ? projectIdMatch[1].trim() : null,
    storageBucket: storageBucketMatch ? storageBucketMatch[1].trim() : null,
    messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1].trim() : null,
    appId: appIdMatch ? appIdMatch[1].trim() : null,
  };
} catch (error) {
  console.warn('無法讀取 .env 檔案:', error.message);
}

// 檢查是否有足夠的 Firebase 配置
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  try {
    // 嘗試從 firebase.json 讀取 projectId
    const firebaseJson = JSON.parse(fs.readFileSync(path.resolve('firebase.json'), 'utf8'));
    console.log('使用 firebase.json 中的項目 ID:', firebaseJson.projectId);
    
    // 如果找不到完整配置，提示手動配置
    console.error('無法獲取完整的 Firebase 配置，請確保 .env 檔案中包含 Firebase 配置變數或手動設定');
    console.log('手動設定 Firebase 配置...');
    
    // 設定默認或讀取部分配置
    firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY || "AIza...", // 需要手動填入有效的配置
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${firebaseJson.projectId}.firebaseapp.com`,
      projectId: firebaseJson.projectId || process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${firebaseJson.projectId}.appspot.com`,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abc123def456"
    };
  } catch (error) {
    console.error('無法讀取 firebase.json:', error.message);
    console.error('請確保 .env 檔案中包含 Firebase 配置變數或手動編輯此腳本設定 Firebase 配置');
    process.exit(1);
  }
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 要查詢的電子郵件地址
const targetEmail = 'chenjuwe@gmail.com';

async function checkAvatar() {
  try {
    console.log(`正在查詢用戶 ${targetEmail} 的信息...`);
    
    // 1. 根據電子郵件查詢用戶資訊
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', targetEmail));
    const usersSnapshot = await getDocs(q);
    
    if (usersSnapshot.empty) {
      console.log(`找不到電子郵件為 ${targetEmail} 的用戶`);
      
      // 嘗試列出所有用戶
      console.log('嘗試列出所有用戶...');
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      console.log('所有用戶數量:', allUsersSnapshot.size);
      
      if (allUsersSnapshot.size > 0) {
        console.log('用戶列表示例:');
        allUsersSnapshot.docs.slice(0, 3).forEach(doc => {
          console.log('- 用戶ID:', doc.id, '資料:', doc.data());
        });
      }
      
      return;
    }
    
    // 取得第一個匹配的用戶
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log('找到用戶:', {
      id: userId,
      email: userData.email,
      displayName: userData.displayName,
      createdAt: userData.createdAt ? new Date(userData.createdAt.toDate()).toISOString() : 'N/A',
      lastLoginAt: userData.lastLoginAt ? new Date(userData.lastLoginAt.toDate()).toISOString() : 'N/A',
    });
    
    // 2. 查詢用戶配置檔案
    const userProfileDoc = await getDoc(doc(db, 'userProfiles', userId));
    
    if (userProfileDoc.exists()) {
      const profileData = userProfileDoc.data();
      console.log('用戶配置檔案:', profileData);
      console.log('用戶名:', profileData.displayName);
      console.log('頭像 URL:', profileData.photoURL);
    } else {
      console.log('無用戶配置檔案');
    }
    
    // 3. 查詢用戶頭像表 (如果有獨立集合)
    try {
      const avatarDoc = await getDoc(doc(db, 'avatars', userId));
      
      if (avatarDoc.exists()) {
        const avatarData = avatarDoc.data();
        console.log('用戶頭像資訊:', avatarData);
        console.log('頭像 URL:', avatarData.url);
        
        if (avatarData.versions) {
          console.log('頭像 URL (大):', avatarData.versions.large);
          console.log('頭像 URL (中):', avatarData.versions.medium);
          console.log('頭像 URL (小):', avatarData.versions.small);
        }
      } else {
        console.log('無獨立頭像資料');
      }
    } catch (error) {
      console.log('查詢頭像集合時出錯，可能該集合不存在:', error.message);
    }
    
  } catch (error) {
    console.error('發生未知錯誤:', error);
  } finally {
    process.exit(0);
  }
}

checkAvatar(); 