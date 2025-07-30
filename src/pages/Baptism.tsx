import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { GUEST_DEFAULT_BACKGROUND } from '@/constants';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { log } from '@/lib/logger';
import { PrayerForm } from '@/components/PrayerForm';
import { useBaptismPosts, useCreateBaptismPost, useDeleteBaptismPost } from '@/hooks/useBaptismPosts';
import { BackgroundService } from '@/services/background/BackgroundService';
import PrayerPost from '@/components/PrayerPost';
import { PrayerPostSkeletonList } from '@/components/ui/skeleton';
import type { BaptismPost } from '@/types/prayer';
import { BACKGROUND_OPTIONS } from '@/constants';

export default function Baptism() {
  const { user, isLoggedIn, avatarUrl } = useFirebaseAvatar();
  const [isGuestMode, setIsGuestMode] = useState(false);
  const createBaptismPostMutation = useCreateBaptismPost();
  const deleteBaptismPostMutation = useDeleteBaptismPost();
  
  // 獲取受洗見證列表
  const { 
    data: posts = [], 
    isLoading: postsLoading, 
    error: postsError,
  } = useBaptismPosts();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 當 posts 變化時不需要額外的本地狀態，可以直接使用 useQuery 的 data

  // 檢查訪客模式
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
  }, [isGuestMode, isLoggedIn]);

  // 背景相關狀態 - 訪客模式預設使用訪客背景
  const [selectedBackground, setSelectedBackground] = useState(GUEST_DEFAULT_BACKGROUND);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [customBackgroundImage, setCustomBackgroundImage] = useState<string>('');
  const [customBackgroundSize, setCustomBackgroundSize] = useState('');

  // 新增給 PrayerForm 的狀態
  const [prayerText, setPrayerText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  const backgroundService = React.useRef(new BackgroundService()).current;

  // 優化的 loadBackground 函數 - 從 Prayers 頁面複製
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
  }, [isLoggedIn, user?.uid, isGuestMode, backgroundService]);
  
  // 初始化背景設置
  useEffect(() => {
    // 立即載入背景
    loadBackground();
    
    // 監聽全局背景同步事件
    const handler = () => loadBackground();
    window.addEventListener('prayforo-background-updated', handler);
    return () => window.removeEventListener('prayforo-background-updated', handler);
  }, [loadBackground]);


  // 監聽滾動事件
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

  const handlePostDeleted = useCallback((deletedPostId: string) => {
    deleteBaptismPostMutation.mutate(deletedPostId);
  }, [deleteBaptismPostMutation]);

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
    
    // 修改為直接使用 #FFE5D9 顏色，不再從 BACKGROUND_OPTIONS 中獲取
    return {
      backgroundColor: '#FFE5D9',
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
    };
  };

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) return;

    // 調試日誌
    log.debug('Submitting baptism post', { prayerText, isAnonymous, isLoggedIn, isGuestMode });

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
      
      log.debug('User data prepared', userData);
      
      log.debug('User published testimony', {
        isLoggedIn,
        isAnonymous,
        userName,
        userAvatar,
        userId: user.uid,
        savedDisplayName,
        savedUsername,
        savedAvatar
      }, 'Baptism');
    } else {
      log.debug('Guest mode submission', { isLoggedIn, isGuestMode });
      log.debug('Guest published testimony', { isLoggedIn, isGuestMode }, 'Baptism');
    }

    // 確保匿名狀態正確設定
    log.debug('Checking prayer submission before publishing', { isLoggedIn, isAnonymous, isGuestMode, userData });
    
    try {
      log.debug('Calling createBaptismPostMutation.mutate');
      createBaptismPostMutation.mutate({
        content: prayerText,
        is_anonymous: isLoggedIn ? isAnonymous : true,
        ...userData,
        image_url: imageUrl || null,
      }, {
        onSuccess: () => {
          log.info('Baptism post submission successful');
          setPrayerText('');
          setImageUrl(undefined);
          if(isLoggedIn) {
            setIsAnonymous(false);
          }
        },
        onError: (error) => {
          log.error('Failed to submit baptism post', error);
        }
      });
    } catch (error) {
      log.error('Error submitting baptism post', error);
    }
  };

  // 移除 useEffect 設定 body 背景色，因為已經在 App.tsx 中全局設置

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* 背景 */}
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

      {/* Header */}
      <Header
        currentPage="community"
        isLoggedIn={isLoggedIn}
        isGuestMode={isGuestMode}
      />

      <main 
        ref={scrollContainerRef} 
        className="h-full w-full overflow-y-auto pb-20"
        style={{ paddingTop: '98px' }}
      >
        <section aria-labelledby="baptism-heading" className="w-full px-4">
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
                isSubmitting={createBaptismPostMutation.isPending}
                placeholder="快速分享你的受洗見證"
                rows={1}
                setShowBackgroundSelector={setShowBackgroundSelector}
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
                isAnswered={false}
              />
            </div>
            
            {/* 代禱列表區域 */}
            <div className="mt-4">
              {postsLoading && (
                <PrayerPostSkeletonList count={3} />
              )}
              
              {postsError && (
                <div className="text-center py-8">
                  <div className="text-red-500">載入見證時發生錯誤，請稍後再試</div>
                  <pre className="mt-2 text-xs text-gray-500 break-all">
                    {postsError.message}
                  </pre>
                </div>
              )}

              {!postsLoading && !postsError && posts.length > 0 ? (
                <div className="space-y-1" role="feed" aria-label="見證列表">
                  {posts.map((post) => {
                    return (
                      <PrayerPost
                        key={post.id}
                        prayer={post} // No longer need casting
                        onUpdate={() => {
                          log.info('Update triggered for post:', post.id);
                        }}
                        onDeleted={handlePostDeleted}
                        isLoggedIn={isLoggedIn || isGuestMode}
                        initialResponseCount={post.response_count || 0}
                      />
                    );
                  })}
                </div>
              ) : !postsLoading && !postsError ? (
                <div className="text-center py-8 text-gray-500">
                  目前還沒有任何見證
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 