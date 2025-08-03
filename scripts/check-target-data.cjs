const admin = require('firebase-admin');

// 目標資料庫設定 (foroprayo)
const targetServiceAccount = require('./foroprayo-service-account-key.json');
const targetApp = admin.initializeApp({
  credential: admin.credential.cert(targetServiceAccount),
  projectId: 'foroprayo',
  storageBucket: 'foroprayo.firebasestorage.app'
}, 'target');

const targetDb = targetApp.firestore();
const targetAuth = targetApp.auth();

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
      const snapshot = await targetDb.collection(collectionName).limit(5).get();
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
    const listUsersResult = await targetAuth.listUsers(15);
    console.log(`👥 總用戶數量: ${listUsersResult.users.length}`);
    
    if (listUsersResult.users.length > 0) {
      console.log('\n📝 用戶列表:');
      listUsersResult.users.forEach((user, index) => {
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
  }
}

/**
 * 檢查專案資訊
 */
async function checkProjectInfo() {
  console.log('🔍 檢查專案資訊...');
  console.log('================================');
  
  try {
    console.log(`📋 專案 ID: ${targetServiceAccount.project_id}`);
    console.log(`📧 服務帳戶: ${targetServiceAccount.client_email}`);
    
    // 嘗試讀取一個簡單的文檔來測試連接
    const testRef = targetDb.collection('test').doc('connection-test');
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
  console.log('🚀 開始檢查目標資料庫 (foroprayo)...');
  console.log('');
  
  try {
    await checkProjectInfo();
    await checkFirestoreData();
    await checkAuthUsers();
    
    console.log('================================');
    console.log('🎯 檢查完成！');
    
  } catch (error) {
    console.error('檢查過程中發生錯誤:', error);
  } finally {
    await targetApp.delete();
  }
}

// 執行檢查
main().catch(error => {
  console.error('執行檢查時發生未預期的錯誤:', error);
  process.exit(1);
}); 