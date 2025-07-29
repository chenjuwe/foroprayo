import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { GUEST_DEFAULT_BACKGROUND } from '@/constants';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { log } from '@/lib/logger';
import { PrayerForm } from '@/components/PrayerForm';
import { useCreatePrayer } from '@/hooks/usePrayersOptimized';
import { FirebasePrayerImageService } from '@/services/prayer/FirebasePrayerImageService';
import { BackgroundService } from '@/services/background/BackgroundService';

export default function Baptism() {
  const { user, isLoggedIn, avatarUrl } = useFirebaseAvatar();
  const [isGuestMode, setIsGuestMode] = useState(false);
  const createPrayerMutation = useCreatePrayer(); // 使用 Firebase 的版本
  
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

  const getCurrentBackgroundStyle = (): React.CSSProperties => {
    const bgOption = { id: 'guest', style: '', bgColor: '#F4E4DD' };
    
    return {
      background: bgOption.bgColor || '#F4E4DD',
      height: '100%',
      minHeight: '100vh',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: -10
    };
  };

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) return;

    // 調試日誌
    console.log('🔍 開始提交見證', { prayerText, isAnonymous, isLoggedIn, isGuestMode });

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
      
      console.log('👤 用戶資料準備完成', userData);
      
      log.debug('用戶發布見證', {
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
      console.log('👤 訪客模式提交', { isLoggedIn, isGuestMode });
      log.debug('訪客發布見證', { isLoggedIn, isGuestMode }, 'Baptism');
    }

    // 確保匿名狀態正確設定
    console.log('📝 發布見證前檢查:', { isLoggedIn, isAnonymous, isGuestMode, userData });
    
    try {
      console.log('🚀 調用 createPrayerMutation.mutate');
      createPrayerMutation.mutate({
        content: prayerText,
        // 未登入訪客必須匿名，以避免 DB 約束錯誤
        is_anonymous: isLoggedIn ? isAnonymous : true,
        ...userData,
        image_url: imageUrl || null,
      }, {
        onSuccess: () => {
          console.log('✅ 見證發布成功');
          setPrayerText('');
          setImageUrl(undefined);
          if(isLoggedIn) {
            setIsAnonymous(false);
          }
        },
        onError: (error) => {
          console.error('❌ 見證發布失敗', error);
        }
      });
    } catch (error) {
      console.error('❌ 發布見證時發生錯誤', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* 背景 */}
      <div style={getCurrentBackgroundStyle()} />

      {/* Header */}
      <Header
        currentPage="community"
        isLoggedIn={isLoggedIn}
        isGuestMode={isGuestMode}
      />

      <main className="pt-[82px] pb-20 px-4 max-w-[390px] mx-auto">
        <div className="mt-6">
          <h1 className="text-2xl font-bold mb-6 text-center">受洗故事</h1>
          
          {/* 分享您的代禱卡片 - 從 Prayers 頁面複製 */}
          <div className="bg-white w-full px-4 pt-4 pb-[12px] shadow-sm mb-4 rounded-xl">
            <PrayerForm
              prayerText={prayerText}
              isAnonymous={isAnonymous}
              isLoggedIn={isLoggedIn || isGuestMode}
              onTextChange={setPrayerText}
              onAnonymousChange={setIsAnonymous}
              onSubmit={handlePrayerSubmit}
              isSubmitting={createPrayerMutation.isPending}
              placeholder="快速分享你的受洗見證"
              rows={1}
              setShowBackgroundSelector={setShowBackgroundSelector}
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              isAnswered={false}
            />
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md mb-4">
            <p className="text-gray-700 mb-4">
              歡迎來到受洗故事頁面。這裡將分享信徒受洗的經歷和見證，展示神在每個人生命中的奇妙工作。
            </p>
            <p className="text-gray-700">
              此頁面正在建設中，即將推出更多精彩內容。敬請期待！
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 