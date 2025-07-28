// import { supabase } from '@/integrations/supabase/client';
// import type { User, UserCredentials, UserMetadata } from '@supabase/supabase-js';
import { log } from '@/lib/logger';
import { BaseService } from '../base/BaseService';

/**
 * 認證服務 - 處理用戶認證相關操作 (暫時停用 Supabase 版本)
 */
export class AuthService extends BaseService {
  constructor() {
    super('AuthService');
  }

  /**
   * 獲取當前用戶
   */
  async getCurrentUser(): Promise<any> {
    // 暫時停用 Supabase 認證功能
    console.log('Supabase 認證功能已停用');
    return null;
  }

  /**
   * 獲取當前會話
   */
  async getSession() {
    // 暫時停用 Supabase 認證功能
    console.log('Supabase 認證功能已停用');
    return null;
  }

  /**
   * 監聽認證狀態變化
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    // 暫時停用 Supabase 認證功能
    console.log('Supabase 認證功能已停用');
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  /**
   * 登出
   */
  async signOut() {
    // 暫時停用 Supabase 認證功能
    console.log('Supabase 認證功能已停用');
  }

  async updateUserMetadata(metadata: any): Promise<any> {
    // 暫時停用 Supabase 認證功能
    console.log('Supabase 認證功能已停用');
    return null;
  }
} 