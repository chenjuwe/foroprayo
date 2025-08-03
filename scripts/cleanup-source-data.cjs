const admin = require('firebase-admin');

// 源資料庫設定 (prayforo) - 將被清理
const sourceServiceAccount = require('./prayforo-service-account-key.json');
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(sourceServiceAccount),
  projectId: 'prayforo',
  storageBucket: 'prayforo.appspot.com'
}, 'source');

const sourceDb = sourceApp.firestore();
const sourceAuth = sourceApp.auth();

// 需要清理的集合列表
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

/**
 * 詢問用戶確認
 */
function askConfirmation() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️  警告：此操作將永久刪除 prayforo 專案中的所有數據！');
    console.log('包括：');
    console.log('  - 所有 Firestore 集合和文檔');
    console.log('  - 所有 Authentication 用戶');
    console.log('');
    console.log('數據已經成功複製到 foroprayo 專案。');
    console.log('');

    rl.question('您確定要刪除 prayforo 中的所有數據嗎？ (輸入 "YES" 確認): ', (answer) => {
      rl.close();
      resolve(answer === 'YES');
    });
  });
}

/**
 * 清理 Firestore 集合
 */
async function cleanupFirestoreCollection(collectionName) {
  console.log(`🗑️  清理集合: ${collectionName}`);
  
  const collection = sourceDb.collection(collectionName);
  const snapshot = await collection.get();
  
  if (snapshot.empty) {
    console.log(`   └─ 集合 ${collectionName} 已為空`);
    return 0;
  }

  const batch = sourceDb.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    
    // Firebase batch 限制 500 個操作
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`   └─ 已刪除 ${count} 個文檔從 ${collectionName}`);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`✅ 完成清理集合: ${collectionName}, 總計刪除 ${count} 個文檔`);
  return count;
}

/**
 * 清理所有 Firestore 數據
 */
async function cleanupFirestore() {
  console.log('🗑️  開始清理 Firestore 數據...');
  console.log('================================');
  
  let totalDeleted = 0;
  
  for (const collection of COLLECTIONS) {
    try {
      const deleted = await cleanupFirestoreCollection(collection);
      totalDeleted += deleted;
    } catch (error) {
      console.error(`❌ 清理集合 ${collection} 時發生錯誤:`, error.message);
    }
  }
  
  console.log(`🗑️  Firestore 清理完成！總計刪除 ${totalDeleted} 個文檔`);
}

/**
 * 清理 Firebase Authentication 用戶
 */
async function cleanupAuth() {
  console.log('🗑️  開始清理 Authentication 用戶...');
  console.log('================================');
  
  let nextPageToken;
  let totalDeleted = 0;
  
  do {
    try {
      const listUsersResult = await sourceAuth.listUsers(1000, nextPageToken);
      
      for (const userRecord of listUsersResult.users) {
        try {
          await sourceAuth.deleteUser(userRecord.uid);
          totalDeleted++;
          console.log(`🗑️  已刪除用戶: ${userRecord.uid} (${userRecord.email})`);
        } catch (userError) {
          console.error(`❌ 刪除用戶 ${userRecord.uid} 時發生錯誤:`, userError.message);
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } catch (error) {
      console.error('❌ 獲取用戶列表時發生錯誤:', error.message);
      break;
    }
  } while (nextPageToken);
  
  console.log(`🗑️  Authentication 清理完成！總計刪除 ${totalDeleted} 個用戶`);
}

/**
 * 執行完整清理
 */
async function runCleanup() {
  console.log('🗑️  開始清理源資料庫 (prayforo)...');
  console.log('目標：將複製操作變成真正的遷移操作');
  console.log('================================');
  
  // 詢問確認
  const confirmed = await askConfirmation();
  
  if (!confirmed) {
    console.log('❌ 操作已取消');
    return;
  }
  
  console.log('');
  console.log('🚀 開始清理操作...');
  console.log('================================');
  
  try {
    // 1. 清理 Firestore 數據
    await cleanupFirestore();
    
    // 2. 清理 Authentication 用戶
    await cleanupAuth();
    
    console.log('================================');
    console.log('🎉 清理完成！遷移操作已完成！');
    console.log('');
    console.log('現在：');
    console.log('✅ foroprayo 專案包含所有數據');
    console.log('🗑️  prayforo 專案已清空');
    console.log('');
    console.log('這樣就完成了真正的「遷移」而不是「複製」！');
    
  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error);
  } finally {
    await sourceApp.delete();
  }
}

/**
 * 僅清理 Firestore 數據
 */
async function runFirestoreCleanup() {
  console.log('🗑️  開始清理 Firestore 數據...');
  
  const confirmed = await askConfirmation();
  if (!confirmed) {
    console.log('❌ 操作已取消');
    return;
  }
  
  try {
    await cleanupFirestore();
    console.log('🎉 Firestore 清理完成！');
  } catch (error) {
    console.error('❌ Firestore 清理過程中發生錯誤:', error);
  } finally {
    await sourceApp.delete();
  }
}

/**
 * 僅清理 Authentication 用戶
 */
async function runAuthCleanup() {
  console.log('🗑️  開始清理 Authentication 用戶...');
  
  const confirmed = await askConfirmation();
  if (!confirmed) {
    console.log('❌ 操作已取消');
    return;
  }
  
  try {
    await cleanupAuth();
    console.log('🎉 Authentication 清理完成！');
  } catch (error) {
    console.error('❌ Authentication 清理過程中發生錯誤:', error);
  } finally {
    await sourceApp.delete();
  }
}

// 命令行參數處理
const args = process.argv.slice(2);
const command = args[0] || 'full';

switch (command) {
  case 'full':
    runCleanup();
    break;
  case 'firestore':
    runFirestoreCleanup();
    break;
  case 'auth':
    runAuthCleanup();
    break;
  default:
    console.log('使用方法:');
    console.log('  node cleanup-source-data.cjs full      # 完整清理（默認）');
    console.log('  node cleanup-source-data.cjs firestore # 僅清理 Firestore');
    console.log('  node cleanup-source-data.cjs auth      # 僅清理 Authentication');
    break;
} 