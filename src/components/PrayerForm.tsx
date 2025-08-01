import React, { useState, useRef, useEffect } from 'react';
import { Check, Undo } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PrayerImageService } from '@/services/prayer/PrayerImageService';
import { FirebasePrayerImageService } from '@/services/prayer/FirebasePrayerImageService';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import CameraIcon from '../assets/icons/CameraIcon2.svg';
import SendArrowIcon from '../assets/icons/SendArrowIcon2.svg';
import ChangeBackgroundIcon from '../assets/icons/ChangeBackgroundIcon3.svg';
import { Input } from './ui/input';
import { VALIDATION_CONFIG } from '@/constants';
import { log } from '@/lib/logger';

// 背景選項類型
interface BackgroundOption {
  id: string;
  name: string;
  style: string;
  bgColor?: string;
}

// 代禱表單屬性
interface PrayerFormProps {
  prayerText: string;
  isAnonymous: boolean;
  isLoggedIn: boolean;
  onTextChange?: (text: string) => void;
  onAnonymousChange?: (isAnonymous: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  isSubmitting: boolean;
  rows?: number;
  imageUrl?: string | undefined;
  setImageUrl?: (url: string | undefined) => void;
  isAnswered?: boolean; // 新增：是否為神已應允的卡片
  variant?: 'default' | 'response'; // 新增：用於區分快速發布卡片和回應卡片

  // 新增的背景相關屬性
  setPrayerText?: React.Dispatch<React.SetStateAction<string>>;
  setIsAnonymous?: React.Dispatch<React.SetStateAction<boolean>>;
  showBackgroundSelector?: boolean;
  setShowBackgroundSelector?: React.Dispatch<React.SetStateAction<boolean>>;
  selectedBackground?: string;
  setSelectedBackground?: React.Dispatch<React.SetStateAction<string>>;
  backgroundOptions?: BackgroundOption[];
  customBackgroundImage?: string;
  setCustomBackgroundImage?: React.Dispatch<React.SetStateAction<string>>;
  customBackgroundSize?: string;
  setCustomBackgroundSize?: React.Dispatch<React.SetStateAction<string>>;
}

// PrayerForm 組件
export const PrayerForm: React.FC<PrayerFormProps> = ({
  prayerText,
  isAnonymous,
  isLoggedIn,
  onTextChange,
  onAnonymousChange,
  onSubmit,
  placeholder = "分享你的代禱...",
  isSubmitting,
  rows = 1,
  setPrayerText,
  setIsAnonymous,
  showBackgroundSelector,
  setShowBackgroundSelector,
  selectedBackground,
  setSelectedBackground,
  backgroundOptions,
  customBackgroundImage,
  setCustomBackgroundImage,
  customBackgroundSize,
  setCustomBackgroundSize,
  imageUrl,
  setImageUrl,
  isAnswered = false,
  variant = 'default', // 預設值為 'default'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // 獲取登入用戶資訊
  const firebaseUser = useFirebaseAuthStore(state => state.user);
  const userId = isLoggedIn ? firebaseUser?.uid : null;

  // 自動調整文本輸入框高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // 設置高度為 auto，讓 scrollHeight 調整為正確值
    textarea.style.height = 'auto';
    // 然後設置為 scrollHeight 值
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [prayerText]);

  const handleCheckboxClick = () => {
    if (onAnonymousChange) {
      onAnonymousChange(!isAnonymous);
    } else if (setIsAnonymous) {
      setIsAnonymous(!isAnonymous);
    }
  };
  
  const handleBackgroundClick = () => {
    if (setShowBackgroundSelector) {
      setShowBackgroundSelector(true);
    }
  };
  
  const handleCameraClick = () => {
    // 確保 fileInput 存在
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    setUploadError('');
    
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      log.debug('用戶登入狀態', { isLoggedIn: !!userId, userId }, 'PrayerForm');
      
      // 使用實際用戶ID或生成訪客ID
      let uploadUserId;
      if (userId) {
        // 已登入用戶使用實際ID
        uploadUserId = userId;
        log.debug('使用已登入用戶ID上傳', { uploadUserId }, 'PrayerForm');
      } else {
        // 訪客用戶生成唯一ID
        uploadUserId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        log.debug('使用訪客ID上傳', { uploadUserId }, 'PrayerForm');
      }
      
      // 根據表單用途（代禱或回應）選擇不同的上傳方法
      let url;
      if (placeholder?.includes('回應')) {
        // 回應表單 - 使用回應圖片上傳方法
        log.debug('調用 FirebasePrayerImageService.uploadResponseImage (回應圖片)', {}, 'PrayerForm');
        url = await FirebasePrayerImageService.uploadResponseImage(uploadUserId, file);
      } else {
        // 代禱表單 - 使用代禱圖片上傳方法
        log.debug('調用 FirebasePrayerImageService.uploadPrayerImage (代禱圖片)', {}, 'PrayerForm');
        url = await FirebasePrayerImageService.uploadPrayerImage(uploadUserId, file);
      }
      
      log.debug('圖片上傳成功', { url }, 'PrayerForm');
      setImageUrl?.(url);
    } catch (err: unknown) {
      log.error('圖片上傳失敗', err, 'PrayerForm');
      // 提供更友好的錯誤信息
      let errorMessage = '圖片上傳失敗';
      
      if (err && typeof err === 'object' && 'message' in err) {
        const error = err as { message: string };
        if (error.message.includes('storage/object-too-large')) {
          errorMessage = '圖片太大，請選擇較小的圖片';
        } else if (error.message.includes('permission')) {
          errorMessage = '權限不足，無法上傳圖片';
        } else if (error.message.includes('network')) {
          errorMessage = '網絡連接問題，請檢查您的網絡';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (setImageUrl) setImageUrl(undefined);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onTextChange) {
      onTextChange(e.target.value);
    } else if (setPrayerText) {
      setPrayerText(e.target.value);
    }
  };

  const handleAnonymousChange = (checked: boolean) => {
    if (onAnonymousChange) {
      onAnonymousChange(checked);
    } else if (setIsAnonymous) {
      setIsAnonymous(checked);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full" data-testid="card">
      <div className={`w-full min-h-[42px] text-sm font-normal px-3 py-2 flex items-center border rounded-none ${
        isAnswered 
          ? 'border-pink-300 bg-pink-50' 
          : 'border-prayfor bg-white'
      }`}>
        <Textarea
          ref={textareaRef}
          value={prayerText}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={isSubmitting}
          className={`w-full outline-none text-black text-sm border-none resize-none overflow-hidden min-h-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${
            isAnswered 
              ? 'bg-pink-50 placeholder:text-pink-400' 
              : 'bg-white placeholder:text-[#1694da]'
          }`}
          style={{ height: 'auto' }}
          rows={rows}
          aria-label="代禱內容輸入框"
          autoComplete="off"
          name="prayer-content"
          data-testid="prayer-textarea"
        />
      </div>



      {/* 圖片預覽區塊 */}
      {imageUrl && (
        <div className="flex items-center gap-2 mt-2">
          <img src={imageUrl} alt="已選圖片" className="max-h-32 rounded border" style={{ maxWidth: '60%' }} />
          <button type="button" onClick={handleRemoveImage} className="text-red-500 text-xs ml-2">移除</button>
        </div>
      )}
      {uploadError && <div className="text-red-500 text-xs mt-1">{uploadError}</div>}
      {uploading && <div className="text-blue-500 text-xs mt-1">圖片上傳中...</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex w-full items-start gap-2 pt-3 md:pt-4">
        <div className="flex items-start gap-2 md:gap-3 flex-1">
          {isLoggedIn && (
            <>
              <input
                type="checkbox"
                id="anonymous-checkbox"
                checked={isAnonymous}
                onChange={(e) => handleAnonymousChange(e.target.checked)}
                className={`mt-1 h-3.5 w-3.5 shrink-0 appearance-none border rounded-none focus:ring-0 focus:outline-none ${
                  isAnswered 
                    ? 'border-pink-400 bg-transparent checked:bg-pink-400 checked:border-pink-400' 
                    : 'border-[#1694da] bg-white checked:bg-[#1694da] checked:border-[#1694da]'
                }`}
                data-testid="anonymous-checkbox"
              />
              <label htmlFor="anonymous-checkbox" className={`text-xs font-normal leading-5 text-left ${
                isAnswered ? 'text-pink-400' : 'text-[#1694da]'
              }`}>
                匿名發布
                <br />
                勾選後不會顯示你的頭像和名稱。
              </label>
            </>
          )}
          {!isLoggedIn && (
            <div className={`flex flex-col flex-1 items-start text-xs leading-5 ${
              isAnswered ? 'text-pink-400' : 'text-[#1694da]'
            }`}>
              <span>訪客發布！</span>
              <span>登入帳號，雲端同步你的代禱紀錄。</span>
            </div>
          )}
        </div>

        <div 
          className="flex items-center justify-end mt-[10px]"
          style={{ gap: '36px' }}
        >
          <button
            type="button"
            onClick={handleCameraClick}
            className="cursor-pointer transition-opacity"
            title="上傳圖片"
            disabled={uploading}
          >
            <img
              src={CameraIcon}
              alt="上傳圖片"
              style={{ 
                width: '20px',
                height: '20px' 
              }}
            />
          </button>
          
          <button
            type="submit"
            className="relative flex items-center justify-center disabled:cursor-not-allowed"
            aria-label="送出代禱"
            disabled={!prayerText.trim() || isSubmitting || uploading}
            style={{ transform: 'translateX(-4px)' }}
            data-testid="submit-button"
          >
            <img
              src={SendArrowIcon}
              alt="送出"
              style={{ 
                width: '20px',
                height: '20px'
              }}
            />
          </button>
        </div>
      </div>
    </form>
  );
};
