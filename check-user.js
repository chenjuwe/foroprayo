#!/usr/bin/env node

// 簡單的控制台查詢工具，只顯示需要的資訊
console.log(`
要檢查特定電子郵件帳號的頭像資訊，請按照以下步驟操作：

1. 在應用啟動後，打開瀏覽器控制台 (按F12鍵)
2. 運行以下腳本：

// 檢查特定用戶的頭像
async function checkUserAvatar(email) {
  // 檢查 Firebase 身份驗證狀態
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error('請先登入應用才能查詢用戶資訊');
    return;
  }
  
  console.log('正在查詢用戶:', email);
  
  // 先查詢用戶資訊
  const db = firebase.firestore();
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
    
  if (usersSnapshot.empty) {
    console.error('找不到用戶:', email);
    return;
  }
  
  const userDoc = usersSnapshot.docs[0];
  const userData = userDoc.data();
  const userId = userDoc.id;
  console.log('用戶資訊:', { id: userId, ...userData });
  
  // 查詢用戶配置檔案
  const profileDoc = await db.collection('userProfiles').doc(userId).get();
  if (profileDoc.exists) {
    const profileData = profileDoc.data();
    console.log('用戶配置檔案:', profileData);
    console.log('頭像 URL:', profileData.photoURL);
  } else {
    console.log('該用戶無配置檔案');
  }
  
  // 如果有獨立的頭像集合，也檢查它
  try {
    const avatarDoc = await db.collection('avatars').doc(userId).get();
    if (avatarDoc.exists) {
      console.log('用戶頭像資訊:', avatarDoc.data());
    }
  } catch (err) {
    console.log('查詢頭像失敗或集合不存在');
  }
}

// 執行查詢
checkUserAvatar('chenjuwe@gmail.com');

3. 如果想查看所有用戶，可以運行：

async function listAllUsers() {
  const db = firebase.firestore();
  
  // 先檢查集合是否存在
  try {
    const usersSnapshot = await db.collection('users').limit(100).get();
    
    if (usersSnapshot.empty) {
      console.log('無用戶數據或無權限訪問');
      return;
    }
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.table(users);
    console.log('用戶數量 (最多顯示100條):', users.length);
  } catch (error) {
    console.error('查詢失敗:', error);
  }
}

listAllUsers();

4. 如果想直接在瀏覽器查看頭像，可以打開頭像的URL
`); 