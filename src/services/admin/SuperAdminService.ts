// import { supabase } from '@/integrations/supabase/client';
import type { SuperAdmin, UserProfileHistory } from '@/types/common';
import { log } from '@/lib/logger';
import { BaseService } from '../base/BaseService';

export class SuperAdminService extends BaseService {
  /**
   * 檢查當前用戶是否為超級管理員 (暫時停用 Supabase 版本)
   */
  async isSuperAdmin(): Promise<boolean> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
    return false;
  }

  /**
   * 獲取所有超級管理員 (暫時停用 Supabase 版本)
   */
  async getSuperAdmins(): Promise<SuperAdmin[]> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
    return [];
  }

  /**
   * 添加超級管理員 (暫時停用 Supabase 版本)
   */
  async addSuperAdmin(email: string): Promise<SuperAdmin> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
    throw new Error('超級管理員功能暫時停用');
  }

  /**
   * 更新超級管理員狀態 (暫時停用 Supabase 版本)
   */
  async updateSuperAdminStatus(id: string, isActive: boolean): Promise<SuperAdmin> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
    throw new Error('超級管理員功能暫時停用');
  }

  /**
   * 刪除超級管理員 (暫時停用 Supabase 版本)
   */
  async deleteSuperAdmin(id: string): Promise<void> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
  }

  /**
   * 超級管理員刪除代禱 (暫時停用 Supabase 版本)
   */
  async deletePrayer(prayerId: string): Promise<void> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
  }

  /**
   * 超級管理員刪除代禱回應 (暫時停用 Supabase 版本)
   */
  async deletePrayerResponse(responseId: string): Promise<void> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
  }

  /**
   * 獲取用戶個人資料變更歷史 (暫時停用 Supabase 版本)
   */
  async getUserProfileHistory(userId: string): Promise<UserProfileHistory[]> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
    return [];
  }

  /**
   * 測試用：獲取用戶個人資料變更歷史 (暫時停用 Supabase 版本)
   */
  async testGetUserProfileHistory(userId: string): Promise<any> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
    return { data: null, error: { message: '功能暫時停用' } };
  }

  /**
   * 直接查詢所有歷史記錄 (暫時停用 Supabase 版本)
   */
  async directQueryHistory(): Promise<any> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
    return { data: null, error: { message: '功能暫時停用' } };
  }

  /**
   * 直接獲取用戶的資料歷史 (暫時停用 Supabase 版本)
   */
  async getDetailedUserHistory(userId: string): Promise<{
    success: boolean;
    data: UserProfileHistory[] | null;
    error: any;
    errorDetails: string;
    isSuperAdmin: boolean;
  }> {
    // 暫時停用 Supabase 功能
    console.log('Supabase 超級管理員功能已停用');
    return {
      success: false,
      data: null,
      error: { message: '功能暫時停用' },
      errorDetails: '功能暫時停用',
      isSuperAdmin: false
    };
  }
} 