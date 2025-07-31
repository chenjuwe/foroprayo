import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Header } from '../components/Header';
import { PrayerPostSkeletonList } from '../components/ui/skeleton';
import PrayerPost from '../components/PrayerPost';
import { PrayerForm } from '../components/PrayerForm';
import { ROUTES, STORAGE_KEYS, BACKGROUND_OPTIONS, GUEST_DEFAULT_BACKGROUND } from '@/constants';
import { usePrayers, useCreatePrayer } from '../hooks/usePrayersOptimized';
import { useFirebaseAvatar } from '../hooks/useFirebaseAvatar';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { log } from '@/lib/logger';
import type { Prayer } from '@/types/prayer';
import { BackgroundService } from '@/services/background/BackgroundService';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';
import { FirebasePrayerImageService } from '@/services/prayer/FirebasePrayerImageService';

// 移除原本的 initBackground 相關程式碼

export default function Prayers() {
  const { 
    data: prayers = [], // 提供默認值
    isLoading: prayersLoading, 
    error: prayersError,
    refetch: refetchPrayers
  } = usePrayers(); // 不帶參數調用，以獲取所有非 baptism 類型的代禱
  const createPrayerMutation = useCreatePrayer(); // 這已經是使用 Firebase 的版本
  const { user, avatarUrl, avatarUrl30, isLoggedIn, refreshAvatar } = useFirebaseAvatar(); // 使用 Firebase 頭像 hook
  const initFirebaseAuth = useFirebaseAuthStore(state => state.initAuth);
  const navigate = useNavigate();
  
  // 檢查是否為訪客模式
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  useEffect(() => {
    setIsGuestMode(localStorage.getItem('guestMode') === 'true');
  }, []);
  
  // 優化初始化 - 減少檢查次數
  useEffect(() => {
    let isMounted = true;
    
    // 僅執行一次的初始化
    const initPage = async () => {
      try {
        // 從 localStorage 獲取訪客模式狀態
        const guestMode = localStorage.getItem('guestMode') === 'true';
        
        // 如果組件仍掛載，則更新狀態
        if (isMounted) {
          setIsGuestMode(guestMode);
          
          // 在訪客模式或已登入時立即獲取代禱列表
          if (guestMode || isLoggedIn) {
            refetchPrayers();
          }
          
          // 非訪客模式下初始化 Firebase 身份驗證
          if (!guestMode) {
            initFirebaseAuth();
          }
        }
      } catch (error) {
        // 發生錯誤時不中斷頁面載入
      }
    };
    
    // 立即初始化
    initPage();
    
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, refetchPrayers, initFirebaseAuth]);
  
  // 簡化的頁面權限檢查 - 只在非訪客模式且用戶未登入時重定向
  useEffect(() => {
    try {
      const guestMode = localStorage.getItem('guestMode') === 'true';
      setIsGuestMode(guestMode);
      
      if (!guestMode && !isLoggedIn) {
        // 檢查是否有緩存的用戶資訊可用
        const cachedUser = localStorage.getItem('auth_user');
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            // 如果緩存時間在 24 小時內，視為已登入
            if (Date.now() - userData.timestamp < 24 * 60 * 60 * 1000) {
              // 允許訪問，稍後 Firebase 會自動初始化
              return;
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        }
        
        // 沒有有效的緩存且未登入，跳轉到登入頁面
        window.location.href = '/auth';
      }
    } catch (error) {
      // 忽略錯誤
    }
  }, [isLoggedIn, refetchPrayers, initFirebaseAuth]);
  
  // 添加本地狀態，用於樂觀刪除
  const [localPrayers, setLocalPrayers] = useState<Prayer[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 當prayers變化時更新本地狀態
  useEffect(() => {
    if (prayers?.length > 0) {
      setLocalPrayers(prayers);
    }
  }, [prayers]);

  const [userAvatarUrl, setUserAvatarUrl] = useState(avatarUrl);
  
  // 新增給 PrayerForm 的狀態
  const [prayerText, setPrayerText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // 背景相關狀態 - 訪客模式預設使用訪客背景
  const [selectedBackground, setSelectedBackground] = useState(GUEST_DEFAULT_BACKGROUND);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [customBackgroundImage, setCustomBackgroundImage] = useState<string>('');
  const [customBackgroundSize, setCustomBackgroundSize] = useState('');

  // 新增圖片狀態
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const backgroundService = React.useRef(new BackgroundService()).current;
  
  // 優化的 loadBackground 函數
  const loadBackground = useCallback(async () => {
    // 首先檢查是否有緩存的用戶資料
    const cachedUser = localStorage.getItem('auth_user');
    let userId = user?.uid;
    
    // 如果沒有用戶但有緩存，使用緩存的用戶 ID
    if (!userId && cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        if (userData.uid) {
          userId = userData.uid;
        }
      } catch (e) {
        // 忽略解析錯誤
      }
    }
    
    // 訪客模式或沒有用戶 ID 時使用訪客背景
    if (isGuestMode || !userId) {
      setSelectedBackground(GUEST_DEFAULT_BACKGROUND);
      return;
    }
    
    try {
      // 嘗試從 localStorage 加載已保存的背景設置
      const savedBackground = localStorage.getItem(`background_${userId}`);
      
      // 如果有已保存的背景，使用它
      if (savedBackground) {
        setSelectedBackground(savedBackground);
        
        const savedCustomBackground = localStorage.getItem(`customBackground_${userId}`);
        if (savedBackground === 'custom' && savedCustomBackground) {
          setCustomBackgroundImage(savedCustomBackground);
          
          const savedCustomBackgroundSize = localStorage.getItem(`customBackgroundSize_${userId}`);
          if (savedCustomBackgroundSize) {
            setCustomBackgroundSize(savedCustomBackgroundSize);
          }
        }
        return;
      }
      
      // 如果本地沒有背景設置，使用默認背景
      setSelectedBackground(GUEST_DEFAULT_BACKGROUND);
      
      // 非同步獲取遠端背景設置，不阻塞頁面載入
      if (navigator.onLine) {
        backgroundService.getUserBackground(userId).then(remote => {
          if (remote) {
            setSelectedBackground(remote.background_id);
            if (remote.background_id === 'custom' && remote.custom_background) {
              setCustomBackgroundImage(remote.custom_background);
              if (remote.custom_background_size) {
                setCustomBackgroundSize(remote.custom_background_size);
              }
            }
            
            // 保存到 localStorage
            localStorage.setItem(`background_${userId}`, remote.background_id);
            if (remote.background_id === 'custom' && remote.custom_background) {
              localStorage.setItem(`customBackground_${userId}`, remote.custom_background);
              if (remote.custom_background_size) {
                localStorage.setItem(`customBackgroundSize_${userId}`, remote.custom_background_size);
              }
            }
          }
        }).catch(() => {
          // 忽略錯誤
        });
      }
    } catch (error) {
      // 出錯時使用訪客背景，不中斷頁面載入
      setSelectedBackground(GUEST_DEFAULT_BACKGROUND);
    }
  }, [user?.uid, isGuestMode, backgroundService]);
  
  // 初始化背景設置
  useEffect(() => {
    // 立即載入背景
    loadBackground();
    
    // 監聽全局背景同步事件
    const handler = () => loadBackground();
    window.addEventListener('prayforo-background-updated', handler);
    return () => window.removeEventListener('prayforo-background-updated', handler);
  }, [loadBackground]);
  
  // 移除訂閱邏輯，直接使用全域 avatarUrl
  useEffect(() => {
    setUserAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  const handleLoginClick = () => {
    // 清除訪客模式
    localStorage.removeItem('guestMode');
    setIsGuestMode(false);
    navigate('/auth');
  };

  const handleProfileClick = () => {
    log.debug('Prayers handleProfileClick 被調用', { currentPath: window.location.pathname }, 'Prayers');
    navigate('/profile');
  };

  const handlePublishClick = () => {
    navigate(ROUTES.PRAYERS_NEW);
  };
  
  const handleBackgroundClick = () => {
    setShowBackgroundSelector(!showBackgroundSelector);
  };

  // 獲取當前背景樣式
  const getCurrentBackgroundStyle = (): React.CSSProperties => {
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
  
  // 簡化的圖片壓縮函數 - 優化載入速度
  const compressImageBasedOnDevice = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 基本檔案檢查
      if (file.size > 50 * 1024 * 1024) {
        reject(new Error(`圖片檔案過大 (${(file.size / (1024 * 1024)).toFixed(1)}MB)，請選擇小於 50MB 的圖片`));
        return;
      }
      
      // 檢查是否為 HEIC/HEIF 格式
      const isHeic = /\.(heic|heif)$/i.test(file.name) || 
                    file.type === 'image/heic' || 
                    file.type === 'image/heif';
      
      // 使用立即調用的異步函數處理 HEIC 轉換
      (async () => {
        try {
          // 處理 HEIC 格式轉換
          let processedFile = file;
          if (isHeic) {
            log.debug('檢測到 HEIC 格式，開始轉換', { fileName: file.name }, 'Prayers');
            try {
              // 使用動態導入 heic2any
              const HeicConverter = await import('heic2any');
              const blob = await HeicConverter.default({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.85
              }) as Blob;
              
              // 將 blob 轉換為 File 對象
              processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
                type: 'image/jpeg',
                lastModified: new Date().getTime()
              });
              
              log.debug('HEIC 轉換成功', { 
                originalSize: `${(file.size / 1024).toFixed(1)}KB`,
                convertedSize: `${(processedFile.size / 1024).toFixed(1)}KB`
              }, 'Prayers');
            } catch (error) {
              log.error('HEIC 轉換失敗', error, 'Prayers');
              reject(new Error('HEIC 圖片格式轉換失敗，請嘗試其他圖片'));
              return;
            }
          }
          
          const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!validTypes.includes(processedFile.type.toLowerCase()) && !isHeic) {
            reject(new Error(`不支援的圖片格式: ${processedFile.type}。請選擇 JPG、PNG、GIF、WebP 或 HEIC 格式的圖片`));
            return;
          }
          
          log.debug('📸 開始處理圖片:', {
            檔案名稱: processedFile.name,
            檔案類型: processedFile.type,
            檔案大小: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`
          });
          
          // 簡化的壓縮設定
          const settings = {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8
          };
          
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          const cleanup = () => {
            if (img.src && img.src.startsWith('blob:')) {
              URL.revokeObjectURL(img.src);
            }
          };
          
          const loadTimeout = setTimeout(() => {
            cleanup();
            reject(new Error('圖片載入超時，請嘗試其他圖片'));
          }, 5000); // 減少超時時間
          
          img.onload = () => {
            try {
              clearTimeout(loadTimeout);
              
              // 計算新尺寸
              let { width, height } = img;
              const aspectRatio = width / height;
              
              if (width > settings.maxWidth || height > settings.maxHeight) {
                if (aspectRatio > 1) {
                  width = settings.maxWidth;
                  height = width / aspectRatio;
                } else {
                  height = settings.maxHeight;
                  width = height * aspectRatio;
                }
              }
              
              width = Math.max(1, Math.round(width));
              height = Math.max(1, Math.round(height));
              
              // 創建 canvas 並壓縮
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                throw new Error('無法獲取 Canvas 上下文');
              }
              
              canvas.width = width;
              canvas.height = height;
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
              
              // 直接使用 JPEG 格式，提升兼容性
              const compressedDataUrl = canvas.toDataURL('image/jpeg', settings.quality);
              
              log.debug('✅ 圖片壓縮完成', {
                原始尺寸: `${img.width}x${img.height}`,
                壓縮後尺寸: `${width}x${height}`,
                原始大小: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`,
                壓縮後大小: `${(compressedDataUrl.length * 3 / 4 / (1024 * 1024)).toFixed(2)}MB`
              });
              
              cleanup();
              resolve(compressedDataUrl);
              
            } catch (error) {
              clearTimeout(loadTimeout);
              cleanup();
              reject(new Error('圖片處理失敗'));
            }
          };
          
          img.onerror = () => {
            clearTimeout(loadTimeout);
            cleanup();
            reject(new Error('圖片載入失敗'));
          };
          
          // 載入圖片
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === 'string') {
              img.src = result;
            } else {
              reject(new Error('檔案讀取失敗'));
            }
          };
          reader.onerror = () => reject(new Error('檔案讀取失敗'));
          reader.readAsDataURL(processedFile);
        } catch (error) {
          reject(error);
        }
      })();
    });
  }, []);
  
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
      }, 'Prayers');
    } else {
      log.debug('訪客發布代禱', { isLoggedIn, isGuestMode }, 'Prayers');
    }

    // 確保匿名狀態正確設定
    log.debug('發布代禱前檢查:', { isLoggedIn, isAnonymous, isGuestMode, userData });
    
    createPrayerMutation.mutate({
      content: prayerText,
      // 未登入訪客必須匿名，以避免 DB 約束錯誤
      is_anonymous: isLoggedIn ? isAnonymous : true,
      ...userData,
      image_url: imageUrl || null,
      prayer_type: 'prayer', // 指定為一般代禱類型
    }, {
      onSuccess: () => {
        setPrayerText('');
        setImageUrl(undefined);
        if(isLoggedIn) {
          setIsAnonymous(false);
        }
      }
    });
  };

  // 添加處理代禱刪除的函數
  const handlePrayerDeleted = useCallback((deletedPrayerId: string) => {
    // 樂觀更新UI - 立即從本地狀態中刪除該代禱
    setLocalPrayers(prev => prev.filter(prayer => prayer.id !== deletedPrayerId));
  }, []);

  useEffect(() => {
    const node = scrollContainerRef.current;
    if (node) {
      const handleScroll = () => {
        setIsScrolled(node.scrollTop > 10);
      };
      node.addEventListener('scroll', handleScroll);
      return () => node.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const backgroundStyle = getCurrentBackgroundStyle();

  // 移除 useEffect 設定 body 背景色，因為已經在 App.tsx 中全局設置

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* 固定背景層 */}
      <div style={getCurrentBackgroundStyle()} />

      {/* 玻璃遮罩層 */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '98px',
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(8px)' : 'none',
          zIndex: 40,
          transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
        }}
      />
      
      {/* Header 層 (固定) - 明確設置 isLoggedIn 和頭像處理函數 */}
      <Header 
        isLoggedIn={isLoggedIn} 
        isGuestMode={isGuestMode}
        onLoginClick={handleLoginClick}
        onProfileClick={handleProfileClick}
        onPublishClick={handlePublishClick}
        currentPage="community"
      />
      
      {/* 可滾動的內容層 */}
      <main 
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto pb-20"
        style={{ paddingTop: '98px' }}
      >
        <section aria-labelledby="prayer-community-heading" className="w-full px-4">
          <div className="flex flex-col max-w-[358px] mx-auto">
            {/* 分享您的代禱卡片 */}
            <div className="bg-white w-full px-4 pt-4 pb-[12px] shadow-sm">
              <PrayerForm
                prayerText={prayerText}
                isAnonymous={isAnonymous}
                isLoggedIn={isLoggedIn || isGuestMode}
                onTextChange={setPrayerText}
                onAnonymousChange={setIsAnonymous}
                onSubmit={handlePrayerSubmit}
                isSubmitting={createPrayerMutation.isPending}
                placeholder="快速分享你的代禱"
                rows={1}
                setShowBackgroundSelector={setShowBackgroundSelector}
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
                isAnswered={false}
                variant="default" // 明確指定為默認變體
              />
            </div>

            {/* 代禱列表區域 - 與上方卡片間距 16px */}
            <div className="mt-4">
              {prayersLoading && (
                <PrayerPostSkeletonList count={3} />
              )}
              
              {prayersError && (
                <div className="text-center py-8">
                  <div className="text-red-500">載入代禱時發生錯誤，請稍後再試</div>
                  <pre className="mt-2 text-xs text-gray-500 break-all">
                    {prayersError instanceof Error ? prayersError.message : '未知錯誤'}
                  </pre>
                </div>
              )}

              {!prayersLoading && !prayersError && localPrayers.length > 0 ? (
                <div className="space-y-1" role="feed" aria-label="代禱列表">
                  {localPrayers.map((prayer) => {
                    return (
                      <PrayerPost
                        key={prayer.id}
                        prayer={prayer}
                        onUpdate={() => {
                          console.log('🔄 觸發代禱更新:', prayer.id);
                        }}
                        onDeleted={handlePrayerDeleted}
                        isLoggedIn={isLoggedIn || isGuestMode}
                        initialResponseCount={prayer.response_count || 0}
                      />
                    );
                  })}
                </div>
              ) : !prayersLoading && !prayersError ? (
                <div className="text-center py-8 text-gray-500">
                  目前還沒有任何代禱
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      
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
          {/* 背景選擇器內容... */}
        </div>,
        document.body
      )}
    </div>
  );
} 