import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Header } from '../components/Header';
import { Textarea } from '../components/ui/textarea';
import { ROUTES, STORAGE_KEYS, BACKGROUND_OPTIONS, GUEST_DEFAULT_BACKGROUND } from '@/constants';
import { useCreatePrayer } from '../hooks/usePrayersOptimized';
import { useFirebaseAvatar } from '../hooks/useFirebaseAvatar';
import { log } from '@/lib/logger';
import { BackgroundService } from '@/services/background/BackgroundService';
import ChangeBackgroundIcon from '../assets/icons/ChangeBackgroundIcon3.svg';
import MicrophoneIcon from '../assets/icons/MicrophoneIcon2.svg';
import CameraIcon from '../assets/icons/CameraIcon2.svg';
import SendArrowIcon from '../assets/icons/SendArrowIcon2.svg';
import heic2any from 'heic2any';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';
import { PrayerForm } from '../components/PrayerForm';
import { FirebasePrayerImageService } from '@/services/prayer/FirebasePrayerImageService';
// 導入新的 Spinner 元件
import { Spinner } from "@/components/ui/spinner";
import { VALIDATION_CONFIG } from '@/constants';

export default function NewFire() {
  const createPrayerMutation = useCreatePrayer();
  const { user, avatarUrl, isLoggedIn } = useFirebaseAvatar(); // 使用 Firebase 認證
  const navigate = useNavigate();

  const [userAvatarUrl, setUserAvatarUrl] = useState(avatarUrl);

  // 新增給 PrayerForm 的狀態
  const [prayerText, setPrayerText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // 背景相關狀態
  const [selectedBackground, setSelectedBackground] = useState('default');
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [customBackgroundImage, setCustomBackgroundImage] = useState<string>('');
  const [customBackgroundSize, setCustomBackgroundSize] = useState('');

  // 新增圖片狀態
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const backgroundService = React.useRef(new BackgroundService()).current;

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      // 使用 Firebase 用戶 ID 或生成訪客 ID
      let uploadUserId;
      if (user?.uid) {
        uploadUserId = user.uid;
      } else {
        // 訪客用戶生成唯一ID
        uploadUserId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      }
      
      const url = await FirebasePrayerImageService.uploadPrayerImage(uploadUserId, file);
      setImageUrl(url);
    } catch (err: any) {
      setUploadError(err.message || '圖片上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(undefined);
  };

  // 修正 loadBackground 函數，將其提取為 useCallback
  const loadBackground = useCallback(async () => {
    if (isLoggedIn && user?.uid) {
      try {
        log.debug('載入用戶背景', { userId: user.uid }, 'NewFire');
        
        // 嘗試從 localStorage 加載已保存的背景設置
        const savedBackground = localStorage.getItem(`background_${user.uid}`);
        const savedCustomBackground = localStorage.getItem(`customBackground_${user.uid}`);
        const savedCustomBackgroundSize = localStorage.getItem(`customBackgroundSize_${user.uid}`);
        
        // 如果有已保存的背景，使用它
        if (savedBackground) {
          setSelectedBackground(savedBackground);
          if (savedBackground === 'custom' && savedCustomBackground) {
            setCustomBackgroundImage(savedCustomBackground);
            if (savedCustomBackgroundSize) {
              setCustomBackgroundSize(savedCustomBackgroundSize);
            }
          }
          
          log.debug('從本地緩存載入背景', {
            background: savedBackground,
            hasCustomImage: !!savedCustomBackground
          }, 'NewFire');
          return;
        }
        
        // 如果本地沒有背景設置，嘗試從服務器獲取
        const remote = await backgroundService.getUserBackground(user.uid);
        if (remote) {
          setSelectedBackground(remote.background_id);
          if (remote.background_id === 'custom' && remote.custom_background) {
            setCustomBackgroundImage(remote.custom_background);
            if (remote.custom_background_size) {
              setCustomBackgroundSize(remote.custom_background_size);
            }
          }
          
          // 保存到 localStorage
          localStorage.setItem(`background_${user.uid}`, remote.background_id);
          if (remote.background_id === 'custom' && remote.custom_background) {
            localStorage.setItem(`customBackground_${user.uid}`, remote.custom_background);
            if (remote.custom_background_size) {
              localStorage.setItem(`customBackgroundSize_${user.uid}`, remote.custom_background_size);
            }
          }
          
          log.debug('從服務器載入背景', {
            background: remote.background_id,
            hasCustomImage: !!remote.custom_background
          }, 'NewFire');
        } else {
          // 如果沒有保存的背景，默認使用訪客背景
          log.debug('未找到用戶背景，使用默認背景', null, 'NewFire');
          setSelectedBackground(GUEST_DEFAULT_BACKGROUND);
          localStorage.setItem(`background_${user.uid}`, GUEST_DEFAULT_BACKGROUND);
        }
      } catch (error) {
        log.error('載入背景時發生錯誤', error, 'NewFire');
        // 出錯時使用訪客背景
        setSelectedBackground(GUEST_DEFAULT_BACKGROUND);
        localStorage.setItem(`background_${user.uid}`, GUEST_DEFAULT_BACKGROUND);
      }
    } else {
      // 非登入用戶使用訪客背景
      log.debug('非登入用戶，使用訪客背景', null, 'NewFire');
      setSelectedBackground(GUEST_DEFAULT_BACKGROUND);
      
      // 訪客背景全局存儲
      localStorage.setItem(STORAGE_KEYS.BACKGROUND, GUEST_DEFAULT_BACKGROUND);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND, '');
      localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE, '');
    }
  }, [isLoggedIn, user?.uid, backgroundService]);

  // 初始化背景設置
  useEffect(() => {
    loadBackground();
    // 新增：監聽全局背景同步事件
    const handler = () => loadBackground();
    window.addEventListener('prayforo-background-updated', handler);
    return () => window.removeEventListener('prayforo-background-updated', handler);
  }, [loadBackground]);
  
  // 使用常量中的背景選項，不再需要本地定義
  // const backgroundOptions = [
  //   { id: 'default', name: '預設二', style: '', bgColor: '#f8e9e2' },
  //   { id: 'default3', name: '預設三', style: '', bgColor: '#ffe6e6' },
  //   { id: 'default5', name: '預設五', style: '', bgColor: '#e6f3ff' },
  //   { id: 'default8', name: '預設八', style: '', bgColor: '#f0f8e6' },
  //   { id: 'default1', name: '預設一', style: '', bgColor: '#fffbe6' },
  //   { id: 'default4', name: '預設四', style: '', bgColor: '#e6fff7' },
  //   { id: 'default6', name: '預設六', style: '', bgColor: '#e6eaff' },
  //   { id: 'default7', name: '預設七', style: '', bgColor: '#ffe6fa' },
  //   { id: 'default9', name: '預設九', style: '', bgColor: '#e6ffe6' },
  //   { id: 'custom', name: '自定義', style: '' },
  // ];

  // 移除本地的認證處理邏輯，因為現在由 App.tsx 全局管理

  // 移除訂閱邏輯，直接使用全域 avatarUrl
  useEffect(() => {
    setUserAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  const handleLoginClick = () => {
    log.debug('Login clicked', null, 'NewFire');
    navigate('/auth');
  };

  const handleProfileClick = () => {
    log.debug('Profile clicked', null, 'NewFireOptimized');
    navigate('/profile');
  };

  const handleCommunityClick = () => {
    navigate(ROUTES.PRAYERS);
  };
  
  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) return;

    // 獲取用戶資料
    let userData = {};
    if (isLoggedIn && user) {
      // 先從 localStorage 獲取用戶自定義的資料
      const savedUsername = localStorage.getItem(`username_${user.uid}`) || '';
      const savedDisplayName = localStorage.getItem(`displayName_${user.uid}`) || '';
      const savedAvatar = localStorage.getItem(`avatar_${user.uid}`) || '';
      
      // 優先使用 displayName，其次才是其他選項
      const userName = user.displayName || user.email?.split('@')[0] || 'User';
      
      // 使用 Firebase 用戶頭像
      const userAvatar = savedAvatar || avatarUrl;
      
      userData = {
        user_name: isAnonymous ? '訪客' : userName,
        user_avatar: userAvatar,
        user_id: user.uid,
        is_anonymous: isAnonymous,  // 明確設定匿名狀態
      };
      
      log.debug('用戶發布代禱', {
        isLoggedIn,
        isAnonymous,
        userName,
        userAvatar,
        userId: user.uid,
        savedDisplayName,
        savedUsername,
        savedAvatar
      }, 'NewFire');
    } else {
      log.debug('訪客發布代禱', { isLoggedIn, isAnonymous }, 'NewFire');
    }

    // 確保匿名狀態正確設定
    console.log('發布代禱前檢查:', { isLoggedIn, isAnonymous, userData });
    
    createPrayerMutation.mutate({
      content: prayerText,
      // 未登入訪客必須匿名，以避免 DB 約束錯誤
      is_anonymous: isLoggedIn ? isAnonymous : true,
      ...userData,
      image_url: imageUrl || null,
    }, {
      onSuccess: () => {
        setPrayerText('');
        setImageUrl(undefined);
        if(isLoggedIn) {
          setIsAnonymous(false);
        }
        navigate(ROUTES.PRAYERS);
      }
    });
  };

  // 修改背景處理函數，更新全局背景設置
  const handleBackgroundClick = () => {
    setShowBackgroundSelector(!showBackgroundSelector);
  };

  // 獲取當前背景樣式
  const getCurrentBackgroundStyle = () => {
    if (selectedBackground === 'custom' && customBackgroundImage) {
      return {
        backgroundImage: `url(${customBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      };
    }
    
    // 使用全局背景色，不再設置自己的背景色
    return {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
    };
  };
  
  // 使用 FirebasePrayerImageService 處理圖片上傳
  const handleBackgroundImageUpload = async (file: File): Promise<string> => {
    try {
      // 使用 Firebase 用戶 ID 或生成訪客 ID
      let uploadUserId;
      if (user?.uid) {
        uploadUserId = user.uid;
      } else {
        // 訪客用戶生成唯一ID
        uploadUserId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      }
      
      // 使用 FirebasePrayerImageService 上傳圖片
      const imageUrl = await FirebasePrayerImageService.uploadPrayerImage(uploadUserId, file);
      return imageUrl;
    } catch (error) {
      console.error('❌ 圖片處理失敗:', error);
      throw error;
    }
  };

  return (
    <div 
      className="flex flex-col items-center w-full"
      style={{ 
        maxWidth: '100vw',
        ...getCurrentBackgroundStyle()
      }}
    >
      <Header 
        isLoggedIn={isLoggedIn} 
        onLoginClick={handleLoginClick}
        onProfileClick={handleProfileClick}
        onCommunityClick={handleCommunityClick}
        currentPage="publish"
      />

      <section aria-labelledby="publish-prayer-heading" className="w-full flex flex-col items-center px-4" style={{ paddingTop: '240px' }}>
        {/* 代禱輸入卡片 */}
        <div className="w-full max-w-[358px] flex justify-center">
          <div
            className="shadow-sm relative w-[330px] rounded-none flex flex-col items-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            <form onSubmit={handlePrayerSubmit} className="flex flex-col items-center pt-[15px] pb-[24px]">
              <div
                className="w-[300px] h-[300px] border text-sm font-normal px-3 py-2 border-[#1694da] border-solid flex items-start"
              >
                <Textarea
                  value={prayerText}
                  onChange={(e) => setPrayerText(e.target.value)}
                  placeholder="分享你的代禱"
                  disabled={createPrayerMutation.isPending}
                  className="w-full h-full bg-transparent outline-none text-black text-sm border-none resize-none overflow-hidden p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#1694da]"
                  style={{ height: '100%' }}
                  aria-label="代禱內容輸入框"
                  autoComplete="off"
                  name="publish-prayer-content"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handlePrayerSubmit(e);
                    }
                  }}
                />
              </div>
              
              {/* 字數顯示 */}
              {prayerText && (
                <div className="text-right mt-2">
                  <span className={`text-xs ${
                    prayerText.length > VALIDATION_CONFIG.PRAYER_CONTENT.MAX_LENGTH 
                      ? 'text-red-500' 
                      : prayerText.length > VALIDATION_CONFIG.PRAYER_CONTENT.MAX_LENGTH * 0.9 
                        ? 'text-orange-500' 
                        : 'text-gray-500'
                  }`}>
                    {prayerText.length}/{VALIDATION_CONFIG.PRAYER_CONTENT.MAX_LENGTH}
                  </span>
                </div>
              )}
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
              {/* 更改背景、麥克風、照相機和箭頭圖示群組 */}
              <div className="flex justify-center mt-[24px]">
                <div className="flex items-center gap-[60px]">
                  <button 
                    type="button" 
                    onClick={handleBackgroundClick}
                    className="cursor-pointer hover:opacity-70 transition-opacity"
                    title="更改背景"
                  >
                    <img
                      src={ChangeBackgroundIcon}
                      alt="更改背景"
                      className="max-w-[18px] max-h-[18px] w-auto h-auto"
                    />
                  </button>
                  <img
                    src={MicrophoneIcon}
                    alt="麥克風"
                    className="max-w-[18px] max-h-[18px] w-auto h-auto cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => alert('語音功能開發中')}
                  />
                  <img
                    src={CameraIcon}
                    alt="照相機"
                    className="max-w-[18px] max-h-[18px] w-auto h-auto cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={handleCameraClick}
                  />
                  <button 
                    type="submit"
                    disabled={!prayerText.trim() || createPrayerMutation.isPending || uploading}
                    className={`cursor-pointer disabled:cursor-not-allowed hover:opacity-80 transition-opacity ${
                      !prayerText.trim() || createPrayerMutation.isPending
                        ? ''
                        : ''
                    }`}
                  >
                    {createPrayerMutation.isPending ? (
                      <Spinner size="small" />
                    ) : (
                      <img
                        src={SendArrowIcon}
                        alt="送出"
                        className="max-w-[18px] max-h-[18px] w-auto h-auto send-icon"
                        style={{ filter: 'none' }}
                      />
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        {/* 匿名發布選項卡片 */}
        <div className="w-full max-w-[358px] flex justify-center" style={{ marginTop: '120px' }}>
          <div
            className="h-[70px] p-4 shadow-sm flex items-center w-[330px] rounded-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            {isLoggedIn && (
              <div className="flex items-start gap-2 md:gap-3">
                {/* 自訂毛玻璃勾選框 */}
                <label htmlFor="anonymous-checkbox" style={{ position: 'relative', display: 'inline-block', width: '18px', height: '18px' }}>
                  <input
                    type="checkbox"
                    id="anonymous-checkbox"
                    checked={isAnonymous}
                    onChange={(e) => {
                      setIsAnonymous(e.target.checked);
                    }}
                    style={{
                      opacity: 0,
                      width: '18px',
                      height: '18px',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      margin: 0,
                      cursor: 'pointer',
                    }}
                    aria-checked={isAnonymous}
                    aria-label="匿名發布"
                  />
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '2px',
                      border: '1.5px solid #1694da',
                      backgroundColor: isAnonymous ? 'rgba(22,148,218,1)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                      boxSizing: 'border-box',
                    }}
                  ></div>
                </label>
                <label htmlFor="anonymous-checkbox" className="text-[#1694da] text-xs font-normal leading-5 text-left" style={{ cursor: 'pointer' }}>
                  匿名發布<br />勾選後，將不會顯示你的頭像與名稱。
                </label>
              </div>
            )}
            {!isLoggedIn && (
              <div className="flex items-start gap-2 md:gap-3">
                <div className="w-3.5 h-3.5 mt-1 flex-shrink-0"></div>
                <div className="text-[#1694da] text-xs font-normal leading-5 text-left" style={{ marginLeft: '-20px' }}>
                  訪客發布！
                  <br />
                  登入或註冊帳號，隨時觀看你的代禱紀錄。
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* 背景選擇器 - 使用 Portal 固定在螢幕中央 */}
      {showBackgroundSelector && createPortal(
        <div 
          className="bg-white shadow-lg"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '374px',
            height: '828px',
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100vh - 16px)',
            zIndex: 1000000,
            padding: '0',
            border: 'none',
            borderRadius: '40px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            transform: 'translate(-50%, -50%)',
            WebkitTransform: 'translate(-50%, -50%)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          }}
        >
          {/* 整個內容區域 - 固定距離上方60px */}
          <div style={{ 
            position: 'absolute',
            top: '60px',
            left: '16px',
            right: '16px',
            width: 'auto'
          }}>
            {/* 標題與九宮格色塊 */}
            <div className="text-gray-700 text-center" style={{ fontSize: '14px', marginBottom: '32px' }}>選擇頁面背景</div>
            <div className="flex flex-row flex-wrap justify-center items-center" style={{ gap: '12px', marginBottom: '24px', width: '336px' }}>
              {BACKGROUND_OPTIONS.filter(bg => bg.id !== 'custom').map((background) => (
                <button
                  key={background.id}
                  type="button"
                  onClick={() => {
                    setSelectedBackground(background.id);
                    setShowBackgroundSelector(false);
                    
                    // 更新全局背景設置
                    localStorage.setItem(STORAGE_KEYS.BACKGROUND, background.id);
                    
                    // 如果使用者已登入，儲存背景偏好到 localStorage
                    if (user?.uid) {
                      localStorage.setItem(`background_${user.uid}`, background.id);
                      console.log('🎨 儲存使用者背景偏好:', { userId: user.uid, backgroundId: background.id });
                      
                      // 同步到雲端
                      backgroundService.upsertUserBackground({
                        user_id: user.uid,
                        background_id: background.id,
                        custom_background: null,
                        custom_background_size: null
                      }).catch(err => console.warn('雲端背景同步失敗', err));
                    }
                  }}
                  className={`transition-all ${
                    selectedBackground === background.id 
                      ? ''
                      : 'hover:opacity-80'
                  } ${background.style}`}
                  style={{
                    width: '100px',
                    height: '100px',
                    ...( background.bgColor ? { backgroundColor: background.bgColor } : {})
                  }}
                  title={background.name}
                >
                  <span className="text-gray-600" style={{ fontSize: '14px' }}>{background.name}</span>
                </button>
              ))}
            </div>

            {/* 上傳自定義背景區塊 */}
            <div className="flex justify-center">
              <div className="border-t mb-4" style={{ width: '324px', paddingTop: '24px' }}>
                <div className="text-gray-700" style={{ fontSize: '14px', marginBottom: '32px' }}>上傳自定義背景</div>
                {/* 按鈕容器 - 改為flex排版 */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', width: '324px' }}>
                  <label
                    className="transition-all cursor-pointer flex items-center justify-center bg-blue-50"
                    style={{ 
                      borderRadius: '15px', 
                      width: selectedBackground === 'custom' && customBackgroundImage ? '212px' : '324px',
                      height: '30px',
                      border: 'none'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        
                        // 基本檢查
                        if (!file.type.startsWith('image/') && 
                            !/\.(heic|heif)$/i.test(file.name) && 
                            file.type !== 'image/heic' && 
                            file.type !== 'image/heif') {
                          alert('請選擇圖片文件');
                          event.target.value = '';
                          return;
                        }
                        
                        if (file.size > 100 * 1024 * 1024) {
                          alert('圖片檔案過大，請選擇小於 100MB 的圖片');
                          event.target.value = '';
                          return;
                        }

                        console.log('📸 開始處理圖片上傳:', {
                          檔案名稱: file.name,
                          檔案類型: file.type,
                          原始大小: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
                        });

                        try {
                          const imageUrl = await handleBackgroundImageUpload(file);
                          
                          setCustomBackgroundImage(imageUrl);
                          setSelectedBackground('custom');
                          setShowBackgroundSelector(false);
                          
                          // 設定背景大小信息
                          const sizeText = '已優化';
                          setCustomBackgroundSize(sizeText);
                          
                          // 更新全局背景設置
                          localStorage.setItem(STORAGE_KEYS.BACKGROUND, 'custom');
                          localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND, imageUrl);
                          localStorage.setItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE, sizeText);
                          
                          // 儲存到本地和雲端
                          if (user?.uid) {
                            localStorage.setItem(`background_${user.uid}`, 'custom');
                            localStorage.setItem(`customBackground_${user.uid}`, imageUrl);
                            localStorage.setItem(`customBackgroundSize_${user.uid}`, sizeText);
                            
                            backgroundService.upsertUserBackground({
                              user_id: user.uid,
                              background_id: 'custom',
                              custom_background: imageUrl,
                              custom_background_size: sizeText
                            }).catch(err => console.warn('雲端背景同步失敗', err));
                          }
                          
                          console.log('✅ 圖片上傳成功！');
                          
                        } catch (error) {
                          console.error('❌ 圖片處理失敗:', error);
                          alert('圖片處理失敗，請稍後再試');
                        }
                        
                        // 清空 input
                        event.target.value = '';
                      }}
                      className="hidden"
                    />
                    <span className="text-gray-600" style={{ fontSize: '14px' }}>
                      {selectedBackground === 'custom' && customBackgroundImage ? '✓ 已選擇' : '📁 選擇圖片'}
                    </span>
                  </label>
                  {/* 移除按鈕 - 僅在已選擇時顯示 */}
                  {selectedBackground === 'custom' && customBackgroundImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomBackgroundImage('');
                        setCustomBackgroundSize('');
                        setSelectedBackground('default');
                        
                        // 更新全局背景設置
                        localStorage.setItem(STORAGE_KEYS.BACKGROUND, 'default');
                        localStorage.removeItem(STORAGE_KEYS.CUSTOM_BACKGROUND);
                        localStorage.removeItem(STORAGE_KEYS.CUSTOM_BACKGROUND_SIZE);
                        
                        if (user?.uid) {
                          localStorage.setItem(`background_${user.uid}`, 'default');
                          localStorage.removeItem(`customBackground_${user.uid}`);
                          localStorage.removeItem(`customBackgroundSize_${user.uid}`);
                          console.log('🗑️ 清理使用者自定義背景:', { userId: user.uid });

                          // 同步雲端恢復預設
                          backgroundService.upsertUserBackground({
                            user_id: user.uid,
                            background_id: 'default',
                            custom_background: null,
                            custom_background_size: null
                          }).catch(err => console.warn('雲端背景同步失敗', err));
                        }
                      }}
                      className="bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      style={{ 
                        fontSize: '14px', 
                        width: '100px',
                        height: '30px',
                        borderRadius: '15px'
                      }}
                    >
                      移除
                    </button>
                  )}
                </div>
                <div className="text-gray-500" style={{ fontSize: '14px' }}>
                  支援 HEIC、JPG、PNG、GIF格式。圖片會自動根據你的螢幕設備最佳化處理。
                  {selectedBackground === 'custom' && customBackgroundImage && customBackgroundSize && (
                    <span className="text-green-600 px-2 py-1" style={{ fontSize: '14px', marginLeft: '8px' }}>
                      壓縮後大小：{customBackgroundSize}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 關閉按鈕 */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
              <button
                onClick={() => setShowBackgroundSelector(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
                style={{ fontSize: '14px', borderRadius: '15px', width: '324px', height: '30px' }}
              >
                關閉
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
} 