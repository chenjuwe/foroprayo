import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 延遲執行函數，用於減少頻繁操作（如輸入）的執行次數
 * @param fn 要執行的函數
 * @param delay 延遲時間（毫秒）
 * @returns 延遲執行的函數
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * 瀏覽器偵測工具
 * 提供統一的瀏覽器偵測功能
 */
export const browserDetection = {
  /**
   * 檢測是否為 Firefox 瀏覽器
   */
  isFirefox(): boolean {
    return typeof navigator !== 'undefined' && 
      navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  },

  /**
   * 檢測是否為 Chrome 瀏覽器
   */
  isChrome(): boolean {
    return typeof navigator !== 'undefined' && 
      navigator.userAgent.toLowerCase().indexOf('chrome') > -1 && 
      !this.isEdge() && !this.isOpera();
  },

  /**
   * 檢測是否為 Edge 瀏覽器
   */
  isEdge(): boolean {
    return typeof navigator !== 'undefined' && 
      (navigator.userAgent.toLowerCase().indexOf('edg') > -1 || 
       navigator.userAgent.toLowerCase().indexOf('edge') > -1);
  },

  /**
   * 檢測是否為 Safari 瀏覽器
   */
  isSafari(): boolean {
    return typeof navigator !== 'undefined' && 
      navigator.userAgent.toLowerCase().indexOf('safari') > -1 && 
      !this.isChrome() && !this.isEdge();
  },

  /**
   * 檢測是否為 Opera 瀏覽器
   */
  isOpera(): boolean {
    return typeof navigator !== 'undefined' && 
      (navigator.userAgent.toLowerCase().indexOf('opera') > -1 || 
       navigator.userAgent.toLowerCase().indexOf('opr') > -1);
  },

  /**
   * 檢測是否為 iOS 設備
   */
  isIOS(): boolean {
    return typeof navigator !== 'undefined' && 
      /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      !(window as { MSStream?: unknown }).MSStream;
  },

  /**
   * 檢測是否為 Android 設備
   */
  isAndroid(): boolean {
    return typeof navigator !== 'undefined' && 
      /Android/.test(navigator.userAgent);
  },

  /**
   * 取得瀏覽器名稱
   */
  getBrowserName(): string {
    if (this.isFirefox()) return 'Firefox';
    if (this.isEdge()) return 'Edge';
    if (this.isOpera()) return 'Opera';
    if (this.isChrome()) return 'Chrome';
    if (this.isSafari()) return 'Safari';
    return 'Other';
  }
};
