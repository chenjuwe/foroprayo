import { ERROR_MESSAGES } from '@/constants';
import { BaseService } from '@/services/base/BaseService';
import type { PrayerResponse, CreateResponseRequest, Prayer } from '@/types/prayer';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';

/**
 * 代禱回應服務 - 處理代禱回應的 CRUD 操作 (Supabase 已停用)
 */
export class PrayerResponseService extends BaseService {
  constructor() {
    super('PrayerResponseService');
  }

  async getResponsesByPrayerId(prayerId: string): Promise<PrayerResponse[]> {
    // 暫時停用 Supabase 版本
    log.info('Supabase 代禱回應查詢已停用', { prayerId }, 'PrayerResponseService');
    return [];
  }

  async createResponse(response: CreateResponseRequest): Promise<PrayerResponse> {
    // 暫時停用 Supabase 版本
    log.info('Supabase 代禱回應建立已停用', { prayerId: response.prayer_id }, 'PrayerResponseService');
    throw new Error('建立回應功能暫時停用');
  }

  async updateResponse(id: string, content: string): Promise<PrayerResponse> {
    // 暫時停用 Supabase 版本
    log.info('Supabase 代禱回應更新已停用', { responseId: id }, 'PrayerResponseService');
    throw new Error('更新回應功能暫時停用');
  }

  async deleteResponse(id: string): Promise<void> {
    // 暫時停用 Supabase 版本
    log.info('Supabase 代禱回應刪除已停用', { responseId: id }, 'PrayerResponseService');
  }

  async getMyResponses({ userId, limit = 10, offset = 0, includeOriginalPrayer = false }: { userId: string, limit?: number, offset?: number, includeOriginalPrayer?: boolean }): Promise<(PrayerResponse & { prayer?: Prayer })[]> {
    // 暫時停用 Supabase 版本
    log.info('Supabase 取得我的回應已停用', { userId }, 'PrayerResponseService');
    return [];
  }

  async updateUserNameForUser(userId: string, newUserName: string): Promise<void> {
    // 暫時停用 Supabase 版本
    log.info('Supabase 回應用戶名稱更新已停用', { userId, newUserName }, 'PrayerResponseService');
  }
} 