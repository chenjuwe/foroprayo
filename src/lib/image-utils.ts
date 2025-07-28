import { log } from '@/lib/logger';
import heic2any from 'heic2any';

interface CompressionConfig {
  size: number;
  quality?: number;
}

interface CompressedImage {
  blob: Blob;
  name: string;
}

/**
 * 處理 HEIC/HEIF 格式的圖片轉換
 * @param file 原始檔案
 * @returns 轉換後的 Blob 物件
 */
async function handleHeicConversion(file: File): Promise<Blob> {
  try {
    log.debug('開始轉換 HEIC/HEIF 檔案', { 
      fileName: file.name, 
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(2)}KB` 
    }, 'ImageUtils');
    
    // 檢查文件是否實際上是 HEIC/HEIF 格式
    const isHeicFile = file.type === 'image/heic' || 
                      file.type === 'image/heif' || 
                      file.name.toLowerCase().endsWith('.heic') || 
                      file.name.toLowerCase().endsWith('.heif');
                      
    if (!isHeicFile) {
      log.warn('文件不是 HEIC/HEIF 格式，但嘗試進行轉換', { 
        fileName: file.name, 
        fileType: file.type 
      }, 'ImageUtils');
    }

    // 嘗試使用 heic2any 進行轉換
    const convertOptions = {
      blob: file,
      toType: "image/jpeg", // 改用 JPEG 格式，可能更穩定
      quality: 0.9, // 提高質量
    };
    
    log.debug('調用 heic2any 轉換', convertOptions, 'ImageUtils');
    
    const convertedBlob = await heic2any(convertOptions);
    
    // heic2any 回傳的可能是單一 blob 或 blob 陣列
    const result = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    log.debug('HEIC/HEIF 轉換成功', { 
      resultType: result.type,
      resultSize: `${(result.size / 1024).toFixed(2)}KB`
    }, 'ImageUtils');
    
    return result;
  } catch (error) {
    log.error('HEIC 檔案轉換失敗', error, 'ImageUtils');
    
    // 提供更詳細的錯誤信息
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    log.warn(`嘗試使用原始檔案繼續處理，可能會失敗: ${errorMessage}`, null, 'ImageUtils');
    
    // 如果轉換失敗，嘗試用原始檔案繼續（雖然可能失敗）
    return file;
  }
}

/**
 * 將圖片壓縮成指定尺寸和品質的 WebP 格式
 * @param file 原始圖片檔案
 * @param configs 一個包含多個尺寸和品質設定的陣列
 * @returns 一個 Promise，解析為包含 Blob 和建議檔名的物件陣列
 */
export async function compressImage(
  file: File,
  configs: CompressionConfig[]
): Promise<CompressedImage[]> {
  try {
    log.debug('開始圖片壓縮流程', { 
      fileName: file.name, 
      fileType: file.type, 
      fileSize: `${(file.size / 1024).toFixed(2)}KB`,
      configs
    }, 'ImageUtils');

    // 處理 HEIC/HEIF 格式
    let sourceBlob: Blob;
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || 
                  (!file.type && (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')));
    
    if (isHeic) {
      log.debug('檢測到 HEIC/HEIF 格式，開始轉換', { fileName: file.name }, 'ImageUtils');
      sourceBlob = await handleHeicConversion(file);
    } else {
      sourceBlob = file;
    }

    log.debug('開始創建 ImageBitmap', { blobType: sourceBlob.type }, 'ImageUtils');
    let imageBitmap;
    try {
      imageBitmap = await createImageBitmap(sourceBlob);
      log.debug('ImageBitmap 創建成功', { 
        width: imageBitmap.width, 
        height: imageBitmap.height 
      }, 'ImageUtils');
    } catch (error) {
      log.error('創建 ImageBitmap 失敗', error, 'ImageUtils');
      throw new Error(`無法處理圖片: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      log.error('無法獲取 Canvas 上下文', null, 'ImageUtils');
      throw new Error('無法取得 Canvas context');
    }

    const compressedImages: CompressedImage[] = [];

    for (const config of configs) {
      const { size, quality = 0.8 } = config;
      const { width, height } = imageBitmap;

      const scale = Math.max(size / width, size / height);
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      canvas.width = size;
      canvas.height = size;

      // 將圖片繪製到畫布中央
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(
        imageBitmap,
        (size - scaledWidth) / 2,
        (size - scaledHeight) / 2,
        scaledWidth,
        scaledHeight
      );

      log.debug(`正在壓縮 ${size}x${size} 尺寸的圖片`, { quality }, 'ImageUtils');
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality)
      );

      if (blob) {
        const imageName = `${file.name.split('.')[0]}-${size}.webp`;
        compressedImages.push({
          blob,
          name: imageName
        });
        log.debug(`${size}x${size} 尺寸圖片壓縮完成`, { 
          name: imageName,
          size: `${(blob.size / 1024).toFixed(2)}KB` 
        }, 'ImageUtils');
      } else {
        log.warn(`${size}x${size} 尺寸圖片壓縮失敗`, null, 'ImageUtils');
      }
    }

    log.debug('圖片壓縮流程完成', { 
      totalImages: compressedImages.length,
      sizes: compressedImages.map(img => img.name)
    }, 'ImageUtils');

    return compressedImages;
  } catch (error) {
    log.error('圖片壓縮過程中發生錯誤', error, 'ImageUtils');
    throw error;
  }
} 