import { BaseService } from '../base/BaseService';
import { log } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserAvatar {
  user_id: string;
  avatar_url_96?: string;
  avatar_url_48?: string;
  avatar_url_30?: string;
  updated_at?: string;
}

interface UploadableBlob {
  blob: Blob;
  size: 'l' | 'm' | 's';
}

export class AvatarService extends BaseService {
  private supabase: SupabaseClient<any, any, any>;
  private readonly BUCKET_NAME = 'avatars';

  constructor(supabase: SupabaseClient<any, any, any>) {
    super('AvatarService');
    this.supabase = supabase;
  }

  private async getUserSerialNumber(userId: string): Promise<number> {
    try {
      log.debug('嘗試獲取用戶註冊序號', { userId }, this.serviceName);
      
      if (!this.supabase?.rpc) {
        log.error('Supabase 客戶端未初始化或不包含 rpc 方法', null, this.serviceName);
        return this.getFallbackSerialNumber();
      }
      
      const { data, error } = await this.supabase.rpc('get_user_serial_number', {
        p_user_id: userId,
      });
      
      if (error) {
        log.error('無法獲取用戶註冊序號，使用備用序號', error, this.serviceName);
        return this.getFallbackSerialNumber();
      }
      
      log.debug('成功獲取用戶註冊序號', { serialNumber: data }, this.serviceName);
      return data;
    } catch (error) {
      log.error('獲取用戶註冊序號時發生未知錯誤，使用備用序號', error, this.serviceName);
      return this.getFallbackSerialNumber();
    }
  }
  
  private getFallbackSerialNumber(): number {
    // 使用備用序號 - 基於時間戳生成一個唯一數字
    const fallbackSerial = Math.floor(Date.now() / 1000) % 100000;
    log.debug('生成備用序號', { fallbackSerial }, this.serviceName);
    return fallbackSerial;
  }

  public async uploadAndRegisterAvatars(
    userId: string,
    blobs: { l: Blob; m: Blob; s: Blob }
  ): Promise<Pick<UserAvatar, 'avatar_url_96' | 'avatar_url_48' | 'avatar_url_30'>> {
    try {
      log.debug('開始上傳頭像流程', { userId }, this.serviceName);

      if (!this.supabase?.storage) {
        log.error('Supabase 客戶端未初始化或不包含 storage 方法', null, this.serviceName);
        throw new Error('Supabase 客戶端未初始化或不包含 storage 方法');
      }

      const serialNumber = await this.getUserSerialNumber(userId);
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
      const paddedSerial = String(serialNumber).padStart(5, '0');
      
      const uploadPromises = Object.entries(blobs).map(async ([sizeKey, blob]) => {
        const size = sizeKey as 'l' | 'm' | 's';
        const fileName = `${paddedSerial}-a-${timestamp}-${size}.webp`;
        const filePath = `${userId}/${fileName}`;

        const { data, error } = await this.supabase.storage
          .from(this.BUCKET_NAME)
          .upload(filePath, blob, {
            contentType: 'image/webp',
            upsert: true,
          });

        if (error) {
          throw new Error(`上傳 ${size} 尺寸頭像失敗: ${error.message}`);
        }
        
        const { data: { publicUrl } } = this.supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(data.path);
          
        return { size, publicUrl };
      });

      const results = await Promise.all(uploadPromises);
      log.debug('頭像上傳成功', { userId, results }, this.serviceName);

      const newUrls: Partial<UserAvatar> = {
        user_id: userId,
      };
      results.forEach(result => {
        if (result.size === 'l') newUrls.avatar_url_96 = result.publicUrl;
        if (result.size === 'm') newUrls.avatar_url_48 = result.publicUrl;
        if (result.size === 's') newUrls.avatar_url_30 = result.publicUrl;
      });

      if (!this.supabase?.from) {
        log.error('Supabase 客戶端未初始化或不包含 from 方法', null, this.serviceName);
        throw new Error('Supabase 客戶端未初始化或不包含 from 方法');
      }

      const { error: upsertError } = await this.supabase
        .from('user_avatars')
        .upsert(newUrls, { onConflict: 'user_id' });

      if (upsertError) {
        throw new Error(`更新 user_avatars 表失敗: ${upsertError.message}`);
      }

      log.debug('成功更新 user_avatars 表', { userId, newUrls }, this.serviceName);
      
      return {
        avatar_url_96: newUrls.avatar_url_96,
        avatar_url_48: newUrls.avatar_url_48,
        avatar_url_30: newUrls.avatar_url_30,
      };
    } catch (error) {
      log.error('頭像上傳與註冊流程失敗', error, this.serviceName);
      throw error;
    }
  }

  async getUserAvatar(userId: string | undefined): Promise<UserAvatar | null> {
    if (!userId) return null;
    
    try {
      // 檢查 supabase 客戶端是否初始化且有 from 方法
      if (!this.supabase?.from) {
        log.error('Supabase 客戶端未初始化或不包含 from 方法', null, this.serviceName);
        return null;
      }
      
      const { data, error } = await this.supabase
        .from('user_avatars')
        .select('avatar_url_96, avatar_url_48, avatar_url_30, updated_at')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
        log.error(`獲取用戶 ${userId} 頭像失敗`, error, this.serviceName);
        throw error;
      }
      
      return data ? { ...data, user_id: userId } : null;
    } catch (error) {
      log.error('獲取用戶頭像時發生未知錯誤', error, this.serviceName);
      return null;
    }
  }
} 