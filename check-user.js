#!/usr/bin/env node

// 簡單的控制台查詢工具，只顯示需要的資訊
console.log(`
要檢查特定電子郵件帳號的頭像資訊，請按照以下步驟操作：

1. 在應用啟動後，打開瀏覽器控制台 (按F12鍵)
2. 運行以下腳本：

// 檢查特定用戶的頭像
async function checkUserAvatar(email) {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) {
    console.error('請先登入應用才能查詢用戶資訊');
    return;
  }
  
  console.log('正在查詢用戶:', email);
  
  // 先查詢用戶資訊
  const { data: users, error } = await window.supabase
    .from('user_profiles')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
    
  if (error) {
    console.error('查詢用戶時出錯:', error);
    return;
  }
  
  console.log('用戶資訊:', users);
  
  if (users && users.id) {
    // 查詢用戶頭像
    const { data: avatars } = await window.supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', users.id)
      .maybeSingle();
      
    console.log('用戶頭像資訊:', avatars);
  }
}

// 執行查詢
checkUserAvatar('chenjuwe@gmail.com');

3. 如果想查看所有用戶，可以運行：

async function listAllUsers() {
  const { data, error } = await window.supabase
    .from('user_profiles')
    .select('*');
    
  if (error) {
    console.error('查詢失敗:', error);
  } else {
    console.table(data);
    console.log('共有', data.length, '個用戶');
  }
}

listAllUsers();

4. 如果想直接在瀏覽器查看頭像，可以打開頭像的URL
`); 