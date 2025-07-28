import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 嘗試讀取.env檔案
let supabaseUrl, supabaseAnonKey;

try {
  const envFile = fs.readFileSync(path.resolve('.env'), 'utf8');
  const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.+)/);
  const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  
  supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
  supabaseAnonKey = keyMatch ? keyMatch[1].trim() : null;
} catch (error) {
  console.warn('無法讀取 .env 檔案:', error.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('無法獲取 Supabase URL 或 API 密鑰，請確保 .env 檔案中包含 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// 創建 Supabase 客戶端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 要查詢的電子郵件地址
const targetEmail = 'chenjuwe@gmail.com';

async function checkAvatar() {
  try {
    console.log(`正在查詢用戶 ${targetEmail} 的信息...`);
    
    // 1. 根據電子郵件查詢用戶資訊
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('查詢用戶時出錯:', userError.message);
      return;
    }

    // 找到目標用戶
    const user = users.find(u => u.email === targetEmail);

    if (!user) {
      console.log(`找不到電子郵件為 ${targetEmail} 的用戶`);
      
      // 嘗試直接查詢用戶配置檔案
      console.log('嘗試直接查詢用戶配置檔案...');
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*');
      
      console.log('所有用戶配置檔案:', profiles?.length || 0);
      return;
    }

    console.log('找到用戶:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    });

    // 2. 查詢用戶配置檔案
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('查詢用戶配置檔案時出錯:', profileError.message);
      return;
    }

    console.log('用戶配置檔案:', profileData || '無配置檔案資料');
    if (profileData) {
      console.log('用戶名:', profileData.username);
      console.log('頭像 URL:', profileData.avatar_url);
    }

    // 3. 查詢用戶頭像表
    const { data: avatarData, error: avatarError } = await supabase
      .from('user_avatars')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (avatarError && avatarError.code !== 'PGRST116') {
      console.error('查詢用戶頭像時出錯:', avatarError.message);
      return;
    }

    console.log('用戶頭像資訊:', avatarData || '無頭像資料');
    
    if (avatarData) {
      console.log('頭像 URL (大):', avatarData.avatar_url_96);
      console.log('頭像 URL (中):', avatarData.avatar_url_48);
      console.log('頭像 URL (小):', avatarData.avatar_url_30);
    }
  } catch (error) {
    console.error('發生未知錯誤:', error);
  } finally {
    process.exit(0);
  }
}

checkAvatar(); 