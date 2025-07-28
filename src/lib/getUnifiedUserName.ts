// 統一取得用戶名稱的共用函式
export function getUnifiedUserName(user: any, isAnonymous?: boolean, tempName?: string, userId?: string): string {
  if (!user || isAnonymous) return '訪客';
  return (
    tempName || // 首先使用臨時名稱（如果提供）
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : '') ||
    (user?.displayName || '') || // 新增對 Firebase user 的支援
    '訪客'
  );
} 