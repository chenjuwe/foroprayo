// import { supabase } from '@/integrations/supabase/client';
import { log } from '@/lib/logger';
import { compressImage } from '@/lib/image-utils';

export class PrayerImageService {
  // 暫時停用 Supabase 版本
  private static readonly BUCKET_NAME = 'prayer-images';
  private static readonly PUBLIC_FOLDER = 'public'; // 添加公共訪問目錄

  /**
   * 檢查存儲桶是否存在，如果不存在則創建
   */
  private static async ensureBucketExists(): Promise<void> {
    // 暫時停用 Supabase 存儲功能
    log.info('Supabase 存儲功能已停用', {}, 'PrayerImageService');
  }

  /**
   * 取得用戶序號（可複用 AvatarService 的邏輯，這裡簡化為時間戳）
   */
  private static async getUserSerialNumber(userId: string): Promise<number> {
    // 可根據實際需求改為 RPC
    return Math.floor(Date.now() / 1000) % 100000;
  }

  /**
   * 上傳祈禱卡片圖片，回傳 public URL
   * @param userId 用戶ID（或訪客ID）
   * @param file 原始圖片檔案
   * @returns 圖片 public URL
   */
  static async uploadPrayerImage(userId: string, file: File): Promise<string> {
    // 暫時停用 Supabase 圖片上傳功能
    log.info('Supabase 圖片上傳功能已停用', { userId, fileName: file.name }, 'PrayerImageService');
    throw new Error('圖片上傳功能暫時停用');
  }
} 