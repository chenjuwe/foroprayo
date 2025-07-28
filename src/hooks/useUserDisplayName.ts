import { useTempUserStore } from '@/stores/tempUserStore';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';

/**
 * 響應式地獲取用戶顯示名稱的自定義 hook。
 * 它會直接訂閱 tempUserStore，當用戶名稱變更時，會自動觸發使用此 hook 的組件重新渲染。
 * 
 * @param user 用戶對象
 * @param isAnonymous 是否為匿名用戶
 * @param userId 用戶 ID
 * @returns 最新的用戶顯示名稱
 */
export const useUserDisplayName = (user: any, isAnonymous?: boolean, userId?: string): string => {
  // 直接從 zustand store 中訂閱相關的用戶名稱。
  // 這會建立一個響應式的連結：當 store 中的 tempDisplayNames[userId] 變更時，
  // 任何使用此 hook 的組件都會自動重新渲染。
  const tempName = useTempUserStore(state => (userId ? state.tempDisplayNames[userId] : ''));

  // getUnifiedUserName 函數負責根據優先級返回正確的名稱。
  return getUnifiedUserName(user, isAnonymous, tempName, userId);
}; 