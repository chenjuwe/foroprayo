const admin = require('firebase-admin');

// 源資料庫設定 (prayforo)
const sourceServiceAccount = require('./prayforo-service-account-key.json');
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(sourceServiceAccount),
  projectId: 'prayforo',
  storageBucket: 'prayforo.appspot.com'
}, 'source');

const sourceDb = sourceApp.firestore();
const sourceAuth = sourceApp.auth();

// 需要檢查的集合列表
const COLLECTIONS = [
  'users',
  'prayers',
  'prayer_responses',
  'baptism',
  'journey',
  'miracle'
];

/**
 * 檢查 Firestore 集合數據
 */
async function checkFirestoreData() {
  console.log('🔍 檢查 Firestore 數據...');
  console.log('================================');
  
  for (const collectionName of COLLECTIONS) {
    try {
      const snapshot = await sourceDb.collection(collectionName).limit(5).get();
      console.log(`📊 ${collectionName}: ${snapshot.size} 個文檔`);
      
      if (snapshot.size > 0) {
        console.log(`   └─ 最新文檔 ID: ${snapshot.docs[0].id}`);
      }
    } catch (error) {
      console.error(`❌ 讀取 ${collectionName} 時發生錯誤:`, error.message);
    }
  }
}

/**
 * 檢查 Authentication 用戶
 */
async function checkAuthUsers() {
  console.log('\n🔍 檢查 Authentication 用戶...');
  console.log('================================');
  
  try {
    const listUsersResult = await sourceAuth.listUsers(10);
    console.log(`👥 總用戶數量: ${listUsersResult.users.length}`);
    
    if (listUsersResult.users.length > 0) {
      console.log('\n📝 前幾個用戶資訊:');
      listUsersResult.users.slice(0, 3).forEach((user, index) => {
        console.log(`   ${index + 1}. UID: ${user.uid}`);
        console.log(`      Email: ${user.email || '未設定'}`);
        console.log(`      顯示名稱: ${user.displayName || '未設定'}`);
        console.log(`      建立時間: ${user.metadata.creationTime}`);
        console.log('');
      });
    } else {
      console.log('⚠️  未找到任何用戶');
    }
    
  } catch (error) {
    console.error('❌ 讀取用戶列表時發生錯誤:', error.message);
    
    if (error.code === 'auth/insufficient-permission') {
      console.log('\n🔧 可能的解決方案:');
      console.log('1. 確保服務帳戶具有 "Firebase Authentication Admin" 權限');
      console.log('2. 在 Firebase Console 中檢查 IAM 權限設定');
    }
  }
}

/**
 * 檢查專案資訊
 */
async function checkProjectInfo() {
  console.log('\n🔍 檢查專案資訊...');
  console.log('================================');
  
  try {
    // 檢查專案 ID
    console.log(`📋 專案 ID: ${sourceServiceAccount.project_id}`);
    console.log(`📧 服務帳戶: ${sourceServiceAccount.client_email}`);
    
    // 嘗試讀取一個簡單的文檔來測試連接
    const testRef = sourceDb.collection('test').doc('connection-test');
    await testRef.get();
    console.log('✅ Firestore 連接正常');
    
  } catch (error) {
    console.error('❌ 專案連接檢查失敗:', error.message);
  }
}

/**
 * 主要執行函數
 */
async function main() {
  console.log('🚀 開始診斷源資料庫 (prayforo)...');
  console.log('');
  
  try {
    await checkProjectInfo();
    await checkFirestoreData();
    await checkAuthUsers();
    
    console.log('================================');
    console.log('🎯 診斷完成！');
    
  } catch (error) {
    console.error('診斷過程中發生錯誤:', error);
  } finally {
    await sourceApp.delete();
  }
}

// 執行診斷
main().catch(error => {
  console.error('執行診斷時發生未預期的錯誤:', error);
  process.exit(1);
}); 