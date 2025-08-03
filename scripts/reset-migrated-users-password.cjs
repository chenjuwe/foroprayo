const admin = require('firebase-admin');

// 目標資料庫設定 (foroprayo)
const targetServiceAccount = require('./foroprayo-service-account-key.json');
const targetApp = admin.initializeApp({
  credential: admin.credential.cert(targetServiceAccount),
  projectId: 'foroprayo',
  storageBucket: 'foroprayo.firebasestorage.app'
}, 'target');

const targetAuth = targetApp.auth();

// 已遷移的用戶列表
const MIGRATED_USERS = [
  'clinoit@gmail.com',
  'zaosipai@gmail.com', 
  'wsvcat@gmail.com',
  'clirtw@gmail.com',
  'jessicalii5201314@gmail.com',
  'catxnote@gmail.com',
  'chenjuwe@gmail.com'
];

// 新密碼
const NEW_PASSWORD = '123456';

/**
 * 根據郵箱重置用戶密碼
 */
async function resetUserPassword(email) {
  try {
    // 根據郵箱獲取用戶
    const userRecord = await targetAuth.getUserByEmail(email);
    
    // 更新用戶密碼
    await targetAuth.updateUser(userRecord.uid, {
      password: NEW_PASSWORD
    });
    
    console.log(`✅ 成功重置密碼: ${email} (UID: ${userRecord.uid})`);
    return { success: true, email, uid: userRecord.uid };
  } catch (error) {
    console.error(`❌ 重置密碼失敗: ${email} - ${error.message}`);
    return { success: false, email, error: error.message };
  }
}

/**
 * 批量重置所有遷移用戶的密碼
 */
async function resetAllMigratedUsersPasswords() {
  console.log('🔐 開始批量重置遷移用戶密碼...');
  console.log(`新密碼: ${NEW_PASSWORD}`);
  console.log('================================');
  
  const results = [];
  
  for (const email of MIGRATED_USERS) {
    const result = await resetUserPassword(email);
    results.push(result);
    
    // 添加小延遲避免 API 限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('================================');
  console.log('📊 重置結果摘要:');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ 成功: ${successful.length} 個用戶`);
  if (successful.length > 0) {
    successful.forEach(r => {
      console.log(`   - ${r.email}`);
    });
  }
  
  console.log(`❌ 失敗: ${failed.length} 個用戶`);
  if (failed.length > 0) {
    failed.forEach(r => {
      console.log(`   - ${r.email}: ${r.error}`);
    });
  }
  
  console.log('================================');
  
  if (successful.length > 0) {
    console.log('🎉 密碼重置完成！');
    console.log('');
    console.log('📋 用戶現在可以使用以下信息登入：');
    console.log('');
    successful.forEach(r => {
      console.log(`📧 ${r.email}`);
      console.log(`🔑 密碼: ${NEW_PASSWORD}`);
      console.log('');
    });
    
    console.log('🌐 登入網址: http://localhost:5173/');
  }
  
  return results;
}

/**
 * 驗證用戶是否可以使用新密碼登入
 */
async function verifyPasswordReset(email) {
  try {
    // 注意：Firebase Admin SDK 無法直接驗證密碼
    // 這個函數主要用於確認用戶存在
    const userRecord = await targetAuth.getUserByEmail(email);
    console.log(`✅ 用戶驗證通過: ${email} (UID: ${userRecord.uid})`);
    return true;
  } catch (error) {
    console.error(`❌ 用戶驗證失敗: ${email} - ${error.message}`);
    return false;
  }
}

/**
 * 主要執行函數
 */
async function main() {
  try {
    const results = await resetAllMigratedUsersPasswords();
    
    // 可選：驗證重置後的用戶狀態
    console.log('🔍 驗證用戶狀態...');
    for (const result of results) {
      if (result.success) {
        await verifyPasswordReset(result.email);
      }
    }
    
  } catch (error) {
    console.error('重置過程中發生錯誤:', error);
  } finally {
    await targetApp.delete();
  }
}

// 命令行參數處理
const args = process.argv.slice(2);
const command = args[0];

if (command === 'verify') {
  // 僅驗證用戶狀態，不重置密碼
  (async () => {
    console.log('🔍 驗證遷移用戶狀態...');
    console.log('================================');
    
    for (const email of MIGRATED_USERS) {
      await verifyPasswordReset(email);
    }
    
    await targetApp.delete();
  })();
} else {
  // 執行密碼重置
  console.log('⚠️  警告: 即將重置所有遷移用戶的密碼為: ' + NEW_PASSWORD);
  console.log('');
  console.log('影響的用戶:');
  MIGRATED_USERS.forEach(email => {
    console.log(`  - ${email}`);
  });
  console.log('');
  
  // 添加確認步驟
  if (process.env.CONFIRM_RESET !== 'yes') {
    console.log('💡 如要繼續，請執行: CONFIRM_RESET=yes node reset-migrated-users-password.cjs');
    console.log('💡 如要僅驗證用戶狀態，請執行: node reset-migrated-users-password.cjs verify');
    process.exit(0);
  }
  
  main().catch(error => {
    console.error('執行重置時發生未預期的錯誤:', error);
    process.exit(1);
  });
} 