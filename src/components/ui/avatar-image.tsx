import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { log } from '@/lib/logger';

interface AvatarImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: number; // 頭像尺寸，用於優化
  email?: string; // 用於顯示預設頭像的首字母
}

// 圖片壓縮和緩存
class ImageOptimizer {
  private static cache = new Map<string, string>();
  
  static async compressImage(
    src: string, 
    targetSize: number = 100, 
    quality: number = 0.7
  ): Promise<string> {
    // 檢查緩存
    const cacheKey = `${src}_${targetSize}_${quality}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 如果是小圖片或預設圖片，直接返回
    if (src.includes('placeholder.svg') || src.includes('/lovable-uploads/')) {
      return src;
    }

    // 如果是 data URL 且不太大，直接返回
    if (src.startsWith('data:image') && src.length < 50000) {
      return src;
    }

    try {
      const compressed = await this.compressDataUrl(src, targetSize, quality);
      this.cache.set(cacheKey, compressed);
      return compressed;
    } catch (error) {
      log.warn('圖片壓縮失敗', error, 'ImageOptimizer');
      return src;
    }
  }

  private static compressDataUrl(
    dataUrl: string, 
    targetSize: number, 
    quality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('無法取得 canvas context'));
        return;
      }

      img.onload = () => {
        // 設定 canvas 尺寸為目標尺寸
        canvas.width = targetSize;
        canvas.height = targetSize;

        // 繪製圓形遮罩
        ctx.beginPath();
        ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // 計算圖片縮放和定位
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        // 繪製圖片
        ctx.drawImage(img, x, y, size, size, 0, 0, targetSize, targetSize);

        // 轉換為壓縮後的 data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('圖片載入失敗'));
      };

      img.src = dataUrl;
    });
  }
}

/**
 * 根據尺寸獲取字級
 */
const getFontSize = (size: number): number => {
  if (size <= 30) return 14;
  if (size <= 48) return 22;
  return 44;
};

/**
 * 從 email 獲取首字母
 */
const getInitial = (email?: string): string => {
  if (!email) return '?';
  // 取第一個字母並轉大寫
  return email.charAt(0).toUpperCase();
};

/**
 * 將 URL 轉換為不同格式的 URL
 * 例如: https://example.com/image.webp -> https://example.com/image.jpg
 */
const getJpegUrl = (webpUrl: string): string => {
  // 如果是 data URL 或空字串，直接返回
  if (!webpUrl || webpUrl.startsWith('data:') || webpUrl === '') {
    return webpUrl;
  }
  
  try {
    // 處理 Supabase 存儲的 URL
    if (webpUrl.includes('.webp')) {
      return webpUrl.replace('.webp', '.jpg');
    }
    
    // 如果 URL 中沒有明確的 .webp 副檔名，保持原樣
    return webpUrl;
  } catch (error) {
    log.warn('URL 格式轉換失敗', { webpUrl, error }, 'AvatarImage');
    return webpUrl;
  }
};

/**
 * 預設頭像元件 - 顯示顏色圓形與首字母
 */
const DefaultAvatar: React.FC<{
  size: number;
  email: string;
  className?: string;
}> = ({ size, email, className = '' }) => {
  const fontSize = getFontSize(size);
  
  return (
    <div 
      data-testid="default-avatar"
      className={`flex items-center justify-center rounded-full ${className}`}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: '#95d2f4', 
        fontSize: `${fontSize}px`,
        fontWeight: 500,
        color: '#000000'
      }}
    >
      G
    </div>
  );
};

/**
 * 圖片頭像元件 - 顯示實際頭像圖片
 */
const ImageAvatar: React.FC<{
  src: string;
  alt: string;
  size: number;
  className?: string;
  onError: () => void;
}> = ({ src, alt, size, className = '', onError }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lowQualityLoaded, setLowQualityLoaded] = useState<boolean>(false);
  const jpegSrc = getJpegUrl(src);
  
  // 生成低品質縮圖URL
  const thumbnailSrc = useMemo(() => {
    // 如果原始圖片是WebP格式，使用對應的JPEG縮圖
    if (src.includes('_96.webp')) {
      return src.replace('_96.webp', '_30.jpg');
    } else if (src.includes('_48.webp')) {
      return src.replace('_48.webp', '_30.jpg');
    } else {
      return jpegSrc;
    }
  }, [src, jpegSrc]);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleThumbnailLoad = () => {
    setLowQualityLoaded(true);
  };
  
  // 檢查 src 是否有效
  useEffect(() => {
    if (!src || src === '') {
      log.warn('圖片 src 無效', { src }, 'ImageAvatar');
      onError();
    }
  }, [src, onError]);
  
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* 載入中動畫 */}
      {isLoading && !lowQualityLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded-full"
          style={{ width: size, height: size }}
        />
      )}
      
      {/* 低品質縮圖 (先顯示) */}
      {isLoading && thumbnailSrc && (
        <img
          src={thumbnailSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover rounded-full blur-sm"
          style={{ 
            opacity: lowQualityLoaded ? 1 : 0,
            transition: 'opacity 300ms ease'
          }}
          onLoad={handleThumbnailLoad}
          onError={() => {
            log.warn('縮圖載入失敗', { thumbnailSrc }, 'ImageAvatar');
          }}
        />
      )}
      
      {/* 高品質圖片 */}
      {src && jpegSrc && (
        <picture>
          <source srcSet={src} type="image/webp" />
          <source srcSet={jpegSrc} type="image/jpeg" />
          <img
            src={jpegSrc}
            alt={alt}
            data-testid="avatar-image"
            className={`opacity-0 transition-opacity duration-300 object-cover rounded-full ${
              lowQualityLoaded && !isLoading ? 'opacity-100' : ''
            }`}
            style={{ width: size, height: size }}
            onLoad={handleLoad}
            onError={onError}
            loading="lazy"
            decoding="async"
          />
        </picture>
      )}
    </div>
  );
};

/**
 * 主要頭像組件 - 根據情況選擇顯示預設頭像或實際頭像
 */
export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  className = '',
  size = 48,
  email = '',
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  
  // 檢查是否應該顯示預設頭像
  const shouldShowDefault = !src || src === '' || src === '/placeholder.svg' || hasError;
  
  // 記錄頭像渲染情況
  useEffect(() => {
    log.debug('AvatarImage 渲染', { 
      src, 
      hasError, 
      shouldShowDefault,
      email: email ? `${email.charAt(0)}...` : undefined,
      size 
    }, 'AvatarImage');
  }, [src, hasError, shouldShowDefault, email, size]);
  
  // 處理圖片載入錯誤
  const handleError = useCallback(() => {
    log.warn('頭像圖片載入失敗', { src }, 'AvatarImage');
    setHasError(true);
  }, [src]);
  
  // 恢復正常邏輯：根據條件渲染不同的頭像組件
  if (shouldShowDefault) {
    return <DefaultAvatar size={size} email={email || '?'} className={className} />;
  }
  
  return <ImageAvatar 
    src={src} 
    alt={alt} 
    size={size} 
    className={className} 
    onError={handleError} 
  />;
}; 