const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 源資料庫設定 (prayforo)
const sourceServiceAccount = require('./prayforo-service-account-key.json');
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(sourceServiceAccount),
  projectId: 'prayforo',
  storageBucket: 'prayforo.appspot.com'
}, 'source');

// 目標資料庫設定 (foroprayo)
const targetServiceAccount = require('./foroprayo-service-account-key.json');
const targetApp = admin.initializeApp({
  credential: admin.credential.cert(targetServiceAccount),
  projectId: 'foroprayo',
  storageBucket: 'foroprayo.firebasestorage.app'
}, 'target');

const sourceDb = sourceApp.firestore();
const targetDb = targetApp.firestore();
const sourceStorage = sourceApp.storage();
const targetStorage = targetApp.storage();
const sourceAuth = sourceApp.auth();
const targetAuth = targetApp.auth();

// 需要遷移的集合列表
const COLLECTIONS = [
  'users',
  'avatars', 
  'user_backgrounds',
  'prayers',
  'prayer_responses',
  'prayer_likes',
  'prayer_response_likes',
  'baptism',
  'baptism_responses',
  'journey',
  'journey_responses',
  'miracle',
  'miracle_responses'
];

// 需要遷移的 Storage 路徑
const STORAGE_PATHS = [
  'avatars/',
  'prayer-images/',
  'response-images/',
  'test/'
];

/**
 * 遷移 Firestore 集合
 */
async function migrateFirestoreCollection(collectionName) {
  console.log(`開始遷移集合: ${collectionName}`);
  
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);
  
  const snapshot = await sourceCollection.get();
  const batch = targetDb.batch();
  
  let count = 0;
  for (const doc of snapshot.docs) {
    const docRef = targetCollection.doc(doc.id);
    batch.set(docRef, doc.data());
    count++;
    
    // Firebase batch 限制 500 個操作
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`已遷移 ${count} 個文檔到 ${collectionName}`);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`完成遷移集合: ${collectionName}, 總計 ${count} 個文檔`);
  return count;
}

/**
 * 遷移所有 Firestore 數據
 */
async function migrateFirestore() {
  console.log('開始遷移 Firestore 數據...');
  
  for (const collection of COLLECTIONS) {
    try {
      await migrateFirestoreCollection(collection);
    } catch (error) {
      console.error(`遷移集合 ${collection} 時發生錯誤:`, error);
    }
  }
  
  console.log('Firestore 數據遷移完成！');
}

/**
 * 遷移 Firebase Storage 檔案
 */
async function migrateStorage() {
  console.log('開始遷移 Firebase Storage 檔案...');
  
  const sourceBucket = sourceStorage.bucket();
  const targetBucket = targetStorage.bucket();
  
  for (const storagePath of STORAGE_PATHS) {
    try {
      console.log(`遷移 Storage 路徑: ${storagePath}`);
      
      const [files] = await sourceBucket.getFiles({
        prefix: storagePath
      });
      
      for (const file of files) {
        try {
          // 下載檔案
          const [fileContent] = await file.download();
          
          // 上傳到目標 bucket
          const targetFile = targetBucket.file(file.name);
          await targetFile.save(fileContent, {
            metadata: file.metadata
          });
          
          console.log(`已遷移檔案: ${file.name}`);
        } catch (fileError) {
          console.error(`遷移檔案 ${file.name} 時發生錯誤:`, fileError);
        }
      }
      
      console.log(`完成遷移 Storage 路徑: ${storagePath}`);
    } catch (error) {
      console.error(`遷移 Storage 路徑 ${storagePath} 時發生錯誤:`, error);
    }
  }
  
  console.log('Firebase Storage 檔案遷移完成！');
}

/**
 * 遷移 Firebase Authentication 用戶
 */
async function migrateAuth() {
  console.log('開始遷移 Firebase Authentication 用戶...');
  
  let nextPageToken;
  let totalUsers = 0;
  
  do {
    try {
      const listUsersResult = await sourceAuth.listUsers(1000, nextPageToken);
      
      for (const userRecord of listUsersResult.users) {
        try {
          // 準備用戶數據
          const userData = {
            uid: userRecord.uid,
            email: userRecord.email,
            emailVerified: userRecord.emailVerified,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            disabled: userRecord.disabled,
            metadata: {
              creationTime: userRecord.metadata.creationTime,
              lastSignInTime: userRecord.metadata.lastSignInTime
            }
          };
          
          // 添加密碼哈希（如果存在）
          if (userRecord.passwordHash) {
            userData.passwordHash = userRecord.passwordHash;
            userData.passwordSalt = userRecord.passwordSalt;
          }
          
          // 創建用戶
          await targetAuth.createUser(userData);
          totalUsers++;
          
          console.log(`已遷移用戶: ${userRecord.uid} (${userRecord.email})`);
        } catch (userError) {
          if (userError.code === 'auth/uid-already-exists') {
            console.log(`用戶已存在: ${userRecord.uid}`);
          } else {
            console.error(`遷移用戶 ${userRecord.uid} 時發生錯誤:`, userError);
          }
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } catch (error) {
      console.error('獲取用戶列表時發生錯誤:', error);
      break;
    }
  } while (nextPageToken);
  
  console.log(`Firebase Authentication 用戶遷移完成！總計 ${totalUsers} 個用戶`);
}

/**
 * 執行完整遷移
 */
async function runFullMigration() {
  console.log('開始完整的 Firebase 資料庫遷移...');
  console.log('源資料庫: prayforo');
  console.log('目標資料庫: foroprayo');
  console.log('================================');
  
  try {
    // 1. 遷移 Firestore 數據
    await migrateFirestore();
    
    // 2. 遷移 Storage 檔案
    await migrateStorage();
    
    // 3. 遷移 Authentication 用戶
    await migrateAuth();
    
    console.log('================================');
    console.log('🎉 完整的 Firebase 資料庫遷移成功完成！');
  } catch (error) {
    console.error('遷移過程中發生錯誤:', error);
  } finally {
    // 關閉連接
    await sourceApp.delete();
    await targetApp.delete();
  }
}

/**
 * 僅遷移 Firestore 數據
 */
async function runFirestoreOnly() {
  console.log('開始 Firestore 數據遷移...');
  
  try {
    await migrateFirestore();
    console.log('🎉 Firestore 數據遷移完成！');
  } catch (error) {
    console.error('Firestore 遷移過程中發生錯誤:', error);
  } finally {
    await sourceApp.delete();
    await targetApp.delete();
  }
}

/**
 * 僅遷移 Storage 檔案
 */
async function runStorageOnly() {
  console.log('開始 Storage 檔案遷移...');
  
  try {
    await migrateStorage();
    console.log('🎉 Storage 檔案遷移完成！');
  } catch (error) {
    console.error('Storage 遷移過程中發生錯誤:', error);
  } finally {
    await sourceApp.delete();
    await targetApp.delete();
  }
}

/**
 * 僅遷移 Authentication 用戶
 */
async function runAuthOnly() {
  console.log('開始 Authentication 用戶遷移...');
  
  try {
    await migrateAuth();
    console.log('🎉 Authentication 用戶遷移完成！');
  } catch (error) {
    console.error('Authentication 遷移過程中發生錯誤:', error);
  } finally {
    await sourceApp.delete();
    await targetApp.delete();
  }
}

// 命令行參數處理
const args = process.argv.slice(2);
const command = args[0] || 'full';

switch (command) {
  case 'full':
    runFullMigration();
    break;
  case 'firestore':
    runFirestoreOnly();
    break;
  case 'storage':
    runStorageOnly();
    break;
  case 'auth':
    runAuthOnly();
    break;
  default:
    console.log('使用方法:');
    console.log('  node firebase-migration.cjs full      # 完整遷移（默認）');
    console.log('  node firebase-migration.cjs firestore # 僅遷移 Firestore');
    console.log('  node firebase-migration.cjs storage   # 僅遷移 Storage');
    console.log('  node firebase-migration.cjs auth      # 僅遷移 Authentication');
    break;
} 