import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
// 導入新的 Spinner 元件
import { Spinner } from "./spinner";

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  // 懶載入選項
  lazy?: boolean;
  // 佔位符
  placeholder?: string;
  // 錯誤時的後備圖片
  fallback?: string;
  // 圓形頭像模式
  isAvatar?: boolean;
  // loading 動畫
  showLoadingAnimation?: boolean;
  className?: string;
  fallbackSrc?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  width?: number;
  height?: number;
  cropCircle?: boolean;
}

// 圖片壓縮函數
const compressImage = (
  file: string, 
  maxWidth: number = 100, 
  maxHeight: number = 100, 
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 計算新的尺寸
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 繪製壓縮後的圖片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 轉換為 base64
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      // 如果壓縮失敗，返回原圖
      resolve(file);
    };
    
    img.src = file;
  });
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 85,
  lazy = true,
  fallback = '/placeholder.svg',
  className = '',
  cropCircle = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // 簡化的懶載入邏輯
  useEffect(() => {
    if (!lazy || shouldLoad || typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, shouldLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(true);
  };

  const imageSrc = isError && fallback ? fallback : src;

  const baseClasses = cn(
    'transition-opacity duration-300',
    cropCircle && 'rounded-full object-cover',
    !isLoaded && props.showLoadingAnimation && 'animate-pulse bg-gray-200',
    className
  );

  if (!shouldLoad) {
    return (
      <div
        ref={imgRef}
        className={cn(
          baseClasses,
          'bg-gray-200 flex items-center justify-center min-h-[40px]'
        )}
        style={{
          width: props.width || 'auto',
          height: props.height || 'auto',
        }}
      >
        {props.placeholder && (
          <span className="text-xs text-gray-500 text-center px-2">
            {props.placeholder}
          </span>
        )}
      </div>
    );
  }

  if (!isLoaded && props.showLoadingAnimation) {
    return (
      <div
        className={cn(
          baseClasses,
          'bg-gray-200 flex items-center justify-center'
        )}
        style={{
          width: props.width || 'auto',
          height: props.height || 'auto',
        }}
      >
        <Spinner size="small" variant="default" />
      </div>
    );
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsError(true);
    setIsLoaded(true);
    if (fallback) {
      const target = e.target as HTMLImageElement;
      target.src = fallback;
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleImageError}
      className={cn(
        baseClasses,
        'transition-opacity duration-300'
      )}
      loading={lazy ? 'lazy' : 'eager'}
      {...props}
    />
  );
};

// 專門用於頭像的優化組件
export const Avatar: React.FC<OptimizedImageProps> = (props) => {
  return <OptimizedImage {...props} isAvatar={true} />;
};

// 專門用於代禱卡片圖片的組件
export const PrayerImage: React.FC<OptimizedImageProps> = (props) => {
  return (
    <OptimizedImage
      {...props}
      lazy={true}
      showLoadingAnimation={true}
      placeholder="載入中..."
    />
  );
}; 