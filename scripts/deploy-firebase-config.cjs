#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 檢查 Firebase CLI 是否已安裝
 */
function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    console.log('✅ Firebase CLI 已安裝');
    return true;
  } catch (error) {
    console.error('❌ Firebase CLI 未安裝');
    console.log('請執行以下命令安裝 Firebase CLI:');
    console.log('npm install -g firebase-tools');
    return false;
  }
}

/**
 * 檢查是否已登入 Firebase
 */
function checkFirebaseLogin() {
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
    console.log('✅ 已登入 Firebase');
    return true;
  } catch (error) {
    console.error('❌ 未登入 Firebase');
    console.log('請執行以下命令登入:');
    console.log('firebase login');
    return false;
  }
}

/**
 * 檢查專案設定檔案
 */
function checkConfigFiles() {
  const requiredFiles = [
    'firebase.json',
    'firestore.rules',
    'firestore.indexes.json',
    'storage.rules'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error('❌ 缺少必要的設定檔案:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    return false;
  }
  
  console.log('✅ 所有設定檔案都存在');
  return true;
}

/**
 * 部署 Firestore 規則和索引
 */
function deployFirestore() {
  console.log('📤 部署 Firestore 規則和索引...');
  
  try {
    execSync('firebase deploy --only firestore', { stdio: 'inherit' });
    console.log('✅ Firestore 規則和索引部署成功');
    return true;
  } catch (error) {
    console.error('❌ Firestore 部署失敗:', error.message);
    return false;
  }
}

/**
 * 部署 Storage 規則
 */
function deployStorage() {
  console.log('📤 部署 Storage 規則...');
  
  try {
    execSync('firebase deploy --only storage', { stdio: 'inherit' });
    console.log('✅ Storage 規則部署成功');
    return true;
  } catch (error) {
    console.error('❌ Storage 部署失敗:', error.message);
    return false;
  }
}

/**
 * 驗證部署結果
 */
function verifyDeployment() {
  console.log('🔍 驗證部署結果...');
  
  try {
    // 檢查 Firestore 規則
    console.log('檢查 Firestore 規則...');
    execSync('firebase firestore:rules:list', { stdio: 'ignore' });
    
    // 檢查 Storage 規則
    console.log('檢查 Storage 規則...');
    execSync('firebase storage:rules:list', { stdio: 'ignore' });
    
    console.log('✅ 部署驗證成功');
    return true;
  } catch (error) {
    console.error('❌ 部署驗證失敗:', error.message);
    return false;
  }
}

/**
 * 主要執行函數
 */
async function main() {
  console.log('🚀 開始部署 Firebase 設定...');
  console.log('================================');
  
  // 檢查前提條件
  if (!checkFirebaseCLI()) return process.exit(1);
  if (!checkFirebaseLogin()) return process.exit(1);
  if (!checkConfigFiles()) return process.exit(1);
  
  console.log('================================');
  
  // 獲取命令行參數
  const args = process.argv.slice(2);
  const deployTarget = args[0] || 'all';
  
  let success = true;
  
  switch (deployTarget) {
    case 'firestore':
      success = deployFirestore();
      break;
      
    case 'storage':
      success = deployStorage();
      break;
      
    case 'all':
    default:
      success = deployFirestore() && deployStorage();
      break;
  }
  
  if (success) {
    console.log('================================');
    console.log('🎉 Firebase 設定部署完成！');
    
    // 顯示有用的資訊
    console.log('\n📋 接下來您可以：');
    console.log('1. 在 Firebase Console 檢查規則是否正確部署');
    console.log('2. 測試應用程式的讀寫權限');
    console.log('3. 檢查索引是否正在建立中');
    
    verifyDeployment();
  } else {
    console.log('================================');
    console.log('❌ 部署過程中發生錯誤，請檢查上述訊息');
    process.exit(1);
  }
}

// 執行主函數
if (require.main === module) {
  main().catch(error => {
    console.error('執行過程中發生未預期的錯誤:', error);
    process.exit(1);
  });
}

module.exports = {
  checkFirebaseCLI,
  checkFirebaseLogin,
  checkConfigFiles,
  deployFirestore,
  deployStorage,
  verifyDeployment
}; 