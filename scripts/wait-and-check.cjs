const admin = require('firebase-admin');

// 目標資料庫設定 (foroprayo)
const targetServiceAccount = require('./foroprayo-service-account-key.json');

async function checkServices() {
  let targetApp;
  
  try {
    targetApp = admin.initializeApp({
      credential: admin.credential.cert(targetServiceAccount),
      projectId: 'foroprayo',
      storageBucket: 'foroprayo.firebasestorage.app'
    }, 'target-' + Date.now());

    const targetDb = targetApp.firestore();
    const targetAuth = targetApp.auth();

    console.log('🔍 檢查服務狀態...');
    console.log('================================');

    // 檢查 Firestore
    let firestoreReady = false;
    try {
      await targetDb.collection('test').limit(1).get();
      console.log('✅ Firestore 服務：已啟用');
      firestoreReady = true;
    } catch (error) {
      if (error.message.includes('PERMISSION_DENIED')) {
        console.log('❌ Firestore 服務：尚未啟用');
      } else {
        console.log('⚠️  Firestore 服務：未知狀態 -', error.message.substring(0, 100));
      }
    }

    // 檢查 Authentication
    let authReady = false;
    try {
      await targetAuth.listUsers(1);
      console.log('✅ Authentication 服務：已啟用');
      authReady = true;
    } catch (error) {
      if (error.message.includes('no configuration')) {
        console.log('❌ Authentication 服務：尚未啟用');
      } else {
        console.log('⚠️  Authentication 服務：未知狀態 -', error.message.substring(0, 100));
      }
    }

    return { firestoreReady, authReady };

  } finally {
    if (targetApp) {
      await targetApp.delete();
    }
  }
}

async function waitAndCheck() {
  console.log('🚀 等待 Firebase 服務啟用...');
  console.log('預計等待時間：3-5 分鐘');
  console.log('');

  const maxAttempts = 10;
  const waitTime = 30; // 30 秒

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`第 ${attempt}/${maxAttempts} 次檢查...`);
    
    const { firestoreReady, authReady } = await checkServices();
    
    if (firestoreReady && authReady) {
      console.log('');
      console.log('🎉 所有服務已啟用！現在可以執行遷移了：');
      console.log('npm run firebase:migrate');
      return;
    }

    if (attempt < maxAttempts) {
      console.log(`⏳ 等待 ${waitTime} 秒後重新檢查...\n`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
  }

  console.log('');
  console.log('⚠️  部分服務可能仍未啟用。請檢查：');
  console.log('1. 是否在 Firebase Console 中正確啟用了服務');
  console.log('2. 是否選擇了正確的專案 (foroprayo)');
  console.log('3. 是否具有該專案的適當權限');
  console.log('');
  console.log('您也可以手動再次檢查：');
  console.log('node scripts/check-target-data.cjs');
}

// 執行等待檢查
waitAndCheck().catch(error => {
  console.error('檢查過程中發生錯誤:', error);
  process.exit(1);
}); 