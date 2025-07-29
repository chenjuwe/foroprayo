import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { GUEST_DEFAULT_BACKGROUND } from '@/constants';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { log } from '@/lib/logger';

export default function Journey() {
  const { user, isLoggedIn } = useFirebaseAvatar();
  const [isGuestMode, setIsGuestMode] = useState(false);
  
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
          <h1 className="text-2xl font-bold mb-6 text-center">恩典之路</h1>
          
          <div className="bg-white rounded-xl p-4 shadow-md mb-4">
            <p className="text-gray-700 mb-4">
              歡迎來到恩典之路頁面。這裡記錄著信徒們在人生旅途中領受的恩典和上帝的帶領，見證信仰的成長歷程。
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