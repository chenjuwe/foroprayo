// 定義用戶對象類型
interface User {
  uid?: string;
  displayName?: string | null;
  email?: string | null;
  name?: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
  };
  [key: string]: unknown;
}

// 統一取得用戶名稱的共用函式
export function getUnifiedUserName(user: User | string | null, isAnonymous?: boolean, tempName?: string, userId?: string): string {
  // 如果是匿名帖子，始終顯示為訪客
  if (isAnonymous === true) {
    console.log('[getUnifiedUserName] 匿名模式，返回訪客', { isAnonymous });
    return '訪客';
  }
  
  // 新增：檢查 user 是否為簡單的字串形式
  if (typeof user === 'string') {
    console.log('[getUnifiedUserName] 用戶為字串，直接返回', { user });
    return user;
  }
  
  // 新增：檢查 user 是否為簡單物件，僅包含名稱
  if (user && typeof user === 'object' && 'name' in user && Object.keys(user).length === 1) {
    console.log('[getUnifiedUserName] 用戶僅包含名稱，直接返回', { name: user.name });
    return user.name;
  }
  
  // 如果沒有用戶數據，返回訪客
  if (!user) {
    console.log('[getUnifiedUserName] 無用戶資料，返回訪客', { user });
    return '訪客';
  }
  
  // 檢查用戶對象是否有名稱相關屬性
  const hasName = !!(
    user.user_metadata?.display_name || 
    user.user_metadata?.full_name || 
    user.user_metadata?.name || 
    user.name || 
    user.displayName || 
    user.email
  );
  
  // 新增：強制診斷日誌，檢查用戶數據結構
  console.log('[getUnifiedUserName] 檢查用戶數據', { 
    userId,
    tempName: tempName || '無',
    hasMetadata: !!user.user_metadata,
    hasName,
    hasEmail: !!user.email,
    displayName: user.displayName || '無',
    fullStructure: JSON.stringify(user).substring(0, 100) + '...',
  });
  
  // 按優先級查找用戶名
  const result = tempName || // 臨時名稱優先級最高
    user.user_metadata?.display_name || 
    user.user_metadata?.full_name || 
    user.user_metadata?.name || 
    user.name || 
    user.displayName || 
    (user.email ? user.email.split('@')[0] : '') || 
    '未知用戶';
  
  console.log('[getUnifiedUserName] 最終返回', { result });
  return result;
} 