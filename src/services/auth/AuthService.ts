// import { supabase } from '@/integrations/supabase/client';
// import type { User, UserCredentials, UserMetadata } from '@supabase/supabase-js';
import { log } from '@/lib/logger';
import { BaseService } from '../base/BaseService';

// 定義用戶元數據類型
interface UserMetadata {
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

// 定義會話類型
interface Session {
  user?: {
    id: string;
    email?: string;
    user_metadata?: UserMetadata;
  };
  access_token?: string;
  refresh_token?: string;
}

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
  async getCurrentUser(): Promise<{ id: string; email?: string; user_metadata?: UserMetadata } | null> {
    // 暫時停用 Supabase 認證功能
    log.info('Supabase 認證功能已停用');
    return null;
  }

  /**
   * 獲取當前會話
   */
  async getSession(): Promise<Session | null> {
    // 暫時停用 Supabase 認證功能
    log.info('Supabase 認證功能已停用');
    return null;
  }

  /**
   * 監聽認證狀態變化
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // 暫時停用 Supabase 認證功能
    log.info('Supabase 認證功能已停用');
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  /**
   * 登出
   */
  async signOut(): Promise<void> {
    // 暫時停用 Supabase 認證功能
    log.info('Supabase 認證功能已停用');
  }

  async updateUserMetadata(metadata: UserMetadata): Promise<{ id: string; user_metadata: UserMetadata } | null> {
    // 暫時停用 Supabase 認證功能
    log.info('Supabase 認證功能已停用');
    return null;
  }
} 