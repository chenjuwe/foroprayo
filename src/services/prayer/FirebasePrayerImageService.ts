import { storage, auth } from '@/integrations/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { log } from '@/lib/logger';
import { compressImage } from '@/lib/image-utils';

export class FirebasePrayerImageService {
  private static readonly PRAYER_STORAGE_PATH = 'prayer-images';
  private static readonly RESPONSE_STORAGE_PATH = 'response-images';
  private static readonly PUBLIC_FOLDER = 'public';

  /**
   * 獲取用戶序號（簡化為時間戳）
   */
  private static getUserSerialNumber(userId: string): number {
    return Math.floor(Date.now() / 1000) % 100000;
  }

  /**
   * 上傳祈禱卡片圖片，回傳 public URL
   * @param userId 用戶ID（或訪客ID）
   * @param file 原始圖片檔案
   * @returns 圖片 public URL
   */
  static async uploadPrayerImage(userId: string, file: File): Promise<string> {
    try {
      console.log('開始上傳祈禱卡片圖片 (Firebase)', { userId, fileName: file.name, fileType: file.type });
      
      // 檢查是否為訪客上傳
      const isGuestUpload = userId.startsWith('guest-');
      console.log('上傳類型:', isGuestUpload ? '訪客上傳' : '已登入用戶上傳');
      
      // 壓縮圖片（只取一個尺寸）
      console.log('開始壓縮圖片...');
      const [compressed] = await compressImage(file, [
        { size: 800, quality: 0.85 }, // 800x800 webp
      ]);
      console.log('圖片壓縮完成', { 
        originalSize: file.size, 
        compressedSize: compressed.blob.size,
        compressionRatio: (file.size / compressed.blob.size).toFixed(2)
      });
      
      const serialNumber = this.getUserSerialNumber(userId);
      const paddedSerial = String(serialNumber).padStart(5, '0');
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
      const fileName = `${paddedSerial}-i-${timestamp}-l.webp`;
      
      // 訪客上傳到公共目錄，已登入用戶上傳到個人目錄
      let filePath;
      if (isGuestUpload) {
        filePath = `${this.PRAYER_STORAGE_PATH}/${this.PUBLIC_FOLDER}/guest-uploads/${fileName}`;
      } else {
        filePath = `${this.PRAYER_STORAGE_PATH}/${this.PUBLIC_FOLDER}/user-uploads/${userId}/${fileName}`;
      }
      
      console.log('準備上傳檔案到 Firebase Storage', { filePath, isGuestUpload });

      // 創建 storage reference
      const storageRef = ref(storage(), filePath);
      
      // 上傳文件
      const uploadResult = await uploadBytes(storageRef, compressed.blob, {
        contentType: 'image/webp',
      });
      
      console.log('Firebase Storage 上傳成功', { path: uploadResult.ref.fullPath });

      // 取得下載 URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('成功取得圖片下載 URL', { url: downloadURL });
      return downloadURL;
    } catch (err) {
      console.error('祈禱卡片圖片上傳處理失敗', err);
      log.error('祈禱卡片圖片上傳失敗', err, 'FirebasePrayerImageService');
      
      // 提供更詳細的錯誤信息
      let errorMessage = '圖片上傳失敗';
      if (err instanceof Error) {
        if (err.message.includes('storage/unauthorized')) {
          errorMessage = '權限不足，無法上傳圖片';
        } else if (err.message.includes('storage/quota-exceeded')) {
          errorMessage = '存儲空間已滿，請聯繫管理員';
        } else if (err.message.includes('storage/object-too-large')) {
          errorMessage = '圖片太大，請選擇較小的圖片';
        } else {
          errorMessage = err.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * 上傳回應圖片，回傳 public URL
   * @param userId 用戶ID（或訪客ID）
   * @param file 原始圖片檔案
   * @returns 圖片 public URL
   */
  static async uploadResponseImage(userId: string, file: File): Promise<string> {
    try {
      console.log('開始上傳回應圖片 (Firebase)', { userId, fileName: file.name, fileType: file.type });
      
      // 檢查是否為訪客上傳
      const isGuestUpload = userId.startsWith('guest-') || !userId;
      console.log('上傳類型:', isGuestUpload ? '訪客上傳' : '已登入用戶上傳');
      
      // 如果是訪客上傳但沒有提供 ID，生成一個臨時 ID
      if (isGuestUpload && !userId) {
        userId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      }
      
      // 壓縮圖片（只取一個尺寸）
      console.log('開始壓縮圖片...');
      const [compressed] = await compressImage(file, [
        { size: 800, quality: 0.85 }, // 800x800 webp
      ]);
      console.log('圖片壓縮完成', { 
        originalSize: file.size, 
        compressedSize: compressed.blob.size,
        compressionRatio: (file.size / compressed.blob.size).toFixed(2)
      });
      
      const serialNumber = this.getUserSerialNumber(userId);
      const paddedSerial = String(serialNumber).padStart(5, '0');
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
      const fileName = `${paddedSerial}-r-${timestamp}-l.webp`;
      
      // 訪客上傳到公共目錄，已登入用戶上傳到個人目錄
      let filePath;
      if (isGuestUpload) {
        filePath = `${this.RESPONSE_STORAGE_PATH}/${this.PUBLIC_FOLDER}/guest-uploads/${fileName}`;
      } else {
        filePath = `${this.RESPONSE_STORAGE_PATH}/${this.PUBLIC_FOLDER}/user-uploads/${userId}/${fileName}`;
      }
      
      console.log('準備上傳回應圖片到 Firebase Storage', { filePath, isGuestUpload });

      // 創建 storage reference
      const storageRef = ref(storage(), filePath);
      
      // 上傳文件
      const uploadResult = await uploadBytes(storageRef, compressed.blob, {
        contentType: 'image/webp',
      });
      
      console.log('Firebase Storage 回應圖片上傳成功', { path: uploadResult.ref.fullPath });

      // 取得下載 URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('成功取得回應圖片下載 URL', { url: downloadURL });
      return downloadURL;
    } catch (err) {
      console.error('回應圖片上傳處理失敗', err);
      log.error('回應圖片上傳失敗', err, 'FirebasePrayerImageService');
      
      // 提供更詳細的錯誤信息
      let errorMessage = '圖片上傳失敗';
      if (err instanceof Error) {
        if (err.message.includes('storage/unauthorized')) {
          errorMessage = '權限不足，無法上傳圖片';
        } else if (err.message.includes('storage/quota-exceeded')) {
          errorMessage = '存儲空間已滿，請聯繫管理員';
        } else if (err.message.includes('storage/object-too-large')) {
          errorMessage = '圖片太大，請選擇較小的圖片';
        } else {
          errorMessage = err.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }
} 