import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ReleasePrayerIcon from '../assets/icons/ReleasePrayerIcon.svg';
import SocialIcon from '../assets/icons/SocialIcon.svg';
import PrayforLogo from '../assets/icons/PrayforLogo.svg';
import MessageIcon from '../assets/icons/MessageIcon.svg';
import FriendIcon from '../assets/icons/FriendIcon.svg';

import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar'; // 使用 Firebase 頭像 hook
import { ROUTES } from '@/constants';
import { log } from '@/lib/logger';

interface HeaderProps {
  currentPage?: 'publish' | 'community';
  isLoggedIn?: boolean;
  isGuestMode?: boolean; // 新增訪客模式參數
  onLoginClick?: () => void;
  onProfileClick?: () => void;
  onPublishClick?: () => void;
  onCommunityClick?: () => void;
  onExtraButtonClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentPage = 'publish',
  isLoggedIn,
  isGuestMode = false, // 默認非訪客模式
  onLoginClick,
  onProfileClick,
  onPublishClick,
  onCommunityClick,
  onExtraButtonClick
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 只使用 Firebase 認證系統
  const { 
    user: firebaseUser, 
    isLoggedIn: firebaseIsLoggedIn, 
    avatarUrl30: firebaseAvatarUrl30, // 使用 30x30 像素的頭像
    refreshAvatar 
  } = useFirebaseAvatar();
  
  // 檢查本地存儲的訪客模式
  const [localGuestMode, setLocalGuestMode] = useState(isGuestMode);
  
  // 簡化路徑檢查 - 所有路徑都使用 Firebase
  const isFirebasePath = true;
  
  // 檢查訪客模式
  useEffect(() => {
    const storedGuestMode = localStorage.getItem('guestMode') === 'true';
    setLocalGuestMode(isGuestMode || storedGuestMode);
    
    log.debug('Header 檢查訪客模式', { 
      isGuestMode, 
      storedGuestMode, 
      effectiveGuestMode: isGuestMode || storedGuestMode
    }, 'Header');
    
    // 監聽本地存儲變更
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'guestMode') {
        const newGuestMode = e.newValue === 'true';
        setLocalGuestMode(newGuestMode);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isGuestMode]);
  
  // 只使用 Firebase 用戶
  const user = firebaseUser;
  
  // 真正的登入狀態：必須是登入且不是訪客模式
  const isUserLoggedIn = (isLoggedIn ?? firebaseIsLoggedIn) && !localGuestMode;
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [avatarError, setAvatarError] = useState(false);
  
  // 新增的狀態，用於記錄額外按鈕的菜單狀態和位置
  const [isExtraMenuOpen, setIsExtraMenuOpen] = useState(false);
  const [extraMenuPosition, setExtraMenuPosition] = useState({ top: 0, left: 0 });
  
  // 新增狀態用於強制更新頭像
  const [forceUpdate, setForceUpdate] = useState(0);
  const lastAvatarUrl = useRef<string | null>(null);
  const avatarCheckInterval = useRef<number | null>(null);

  // 移除路徑變化監聽，避免頻繁重新渲染
  // useEffect(() => {
  //   if (isFirebasePath && firebaseUser && !localGuestMode) {
  //     log.debug('Header 檢測到 Firebase 路徑變化', {
  //       path: location.pathname,
  //       hasUser: !!firebaseUser,
  //       userId: firebaseUser?.uid,
  //       avatarUrl: firebaseAvatarUrl30,
  //       displayName: firebaseUser?.displayName,
  //       isGuestMode: localGuestMode
  //     }, 'Header');
  //   }
  // }, [isFirebasePath, location.pathname, firebaseUser, firebaseAvatarUrl30, localGuestMode]);
  
  // 簡化頭像錯誤處理，只在真正需要時刷新
  useEffect(() => {
    if (isFirebasePath && firebaseUser && !firebaseAvatarUrl30 && !avatarError && !firebaseUser.photoURL) {
      log.debug('Firebase 頭像缺失，嘗試刷新', {
        userId: firebaseUser.uid,
        photoURL: firebaseUser.photoURL,
        displayName: firebaseUser.displayName
      }, 'Header');
      
      refreshAvatar();
    }
  }, [isFirebasePath, firebaseUser, firebaseAvatarUrl30, avatarError, refreshAvatar]);

  // 簡化頭像更新事件監聽
  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventDetail = customEvent.detail as { userId: string; timestamp: number; newPhotoURL?: string };
      
      log.debug('檢測到頭像更新事件', eventDetail, 'Header');
      
      if (isFirebasePath && firebaseUser && eventDetail.userId === firebaseUser.uid) {
        setAvatarError(false);
        
        // 如果有新的 photoURL，立即更新，無延遲
        if (eventDetail.newPhotoURL) {
          log.debug('Header 立即更新頭像', { newPhotoURL: eventDetail.newPhotoURL }, 'Header');
          // 立即強制重新渲染，無延遲
          setForceUpdate(prev => prev + 1);
        }
      }
    };

    // 監聽頭像預覽事件，提供即時視覺反饋
    const handleAvatarPreview = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventDetail = customEvent.detail as { userId: string; timestamp: number; previewURL: string };
      
      log.debug('檢測到頭像預覽事件', eventDetail, 'Header');
      
      if (isFirebasePath && firebaseUser && eventDetail.userId === firebaseUser.uid) {
        setAvatarError(false);
        // 立即強制重新渲染以顯示預覽
        setForceUpdate(prev => prev + 1);
      }
    };
    
    window.addEventListener('avatar-updated', handleAvatarUpdated);
    window.addEventListener('avatar-preview-updated', handleAvatarPreview);
    
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdated);
      window.removeEventListener('avatar-preview-updated', handleAvatarPreview);
    };
  }, [isFirebasePath, firebaseUser]);
  
  // 移除頁面聚焦時的頭像刷新，避免跳動
  // useEffect(() => {
  //   const handleFocus = () => {
  //     if (isFirebasePath && firebaseUser) {
  //       log.debug('頁面聚焦，刷新頭像', null, 'Header');
  //       refreshAvatar();
  //     }
  //   };
  //   
  //   window.addEventListener('focus', handleFocus);
  //   
  //   return () => {
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [isFirebasePath, firebaseUser, refreshAvatar]);

  // 將 handleLoginClick, handleProfileClick, handlePublishClick 用 props 覆蓋
  const handleLogin = onLoginClick || (() => { 
    // 清除訪客模式
    localStorage.removeItem('guestMode');
    setLocalGuestMode(false);
    navigate(ROUTES.AUTH); 
  });
  const handleProfile = onProfileClick || (() => { 
    log.debug('執行 handleProfile 導航', { 
      isFirebasePath, 
      targetPath: isFirebasePath ? '/setting' : ROUTES.SETTING,
      currentPath: location.pathname 
    }, 'Header');
    navigate(isFirebasePath ? '/setting' : ROUTES.SETTING); 
  });
  const handlePublish = onPublishClick || (() => { navigate(ROUTES.PRAYERS_NEW); });
  const handleCommunity = onCommunityClick || (() => { navigate(ROUTES.PRAYERS); });
  const handleExtraButton = onExtraButtonClick || (() => { navigate(isFirebasePath ? '/profile' : ROUTES.PROFILE); });

  const toggleMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsMenuOpen(prev => !prev);
    setIsExtraMenuOpen(false); // 關閉另一個菜單
  };

  // 新增的函數，切換額外按鈕的菜單
  const toggleExtraMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsExtraMenuOpen(prev => !prev);
    setIsMenuOpen(false); // 關閉另一個菜單
  };

  const handleMenuItemClick = (action: string) => {
    setIsMenuOpen(false);
    
    if (action === 'publish') {
      handlePublish();
    } else if (action === 'community') {
      handleCommunity();
    }
  };

  // 處理額外按鈕的點擊
  const handleExtraMenuItemClick = (action: string) => {
    setIsExtraMenuOpen(false);
    
    // 添加日誌，記錄點擊的菜單項
    log.debug('點擊紫色菜單項', { action }, 'Header');
    
    if (action === 'profile') {
      navigate(isFirebasePath ? '/profile' : ROUTES.PROFILE); // 根據路徑選擇導航目標
    } else if (action === 'log') {
      navigate(isFirebasePath ? '/log' : ROUTES.LOG);      // 導航到對應的日誌頁面
    } else if (action === 'message') {
      navigate(isFirebasePath ? '/message' : ROUTES.MESSAGE);  // 導航到對應的消息頁面
    } else if (action === 'setting') {
      navigate(isFirebasePath ? '/setting' : ROUTES.SETTING);  // 導航到對應的設置頁面
    }
  };

  // Calculate menu position
  useEffect(() => {
    if (isMenuOpen) {
      const button = document.querySelector('[data-menu-trigger="true"]');
      if (button) {
        const rect = button.getBoundingClientRect();
        setMenuPosition({
          top: 47,
          left: rect.left + rect.width / 2 - 52
        });
      }
    }

    // 計算額外菜單的位置
    if (isExtraMenuOpen) {
      const button = document.querySelector('[data-extra-menu-trigger="true"]');
      if (button) {
        const rect = button.getBoundingClientRect();
        setExtraMenuPosition({
          top: 47,
          left: rect.left + rect.width / 2 - 52
        });
      }
    }
  }, [isMenuOpen, isExtraMenuOpen]);

  // Effect to close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsMenuOpen(false);
      setIsExtraMenuOpen(false);
    };

    if (isMenuOpen || isExtraMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, isExtraMenuOpen]);

  const getMenuButtonContent = () => {
    switch (currentPage) {
      case 'publish':
        return (
          <>
            <img src={ReleasePrayerIcon} alt="" style={{ width: 16, height: 16, pointerEvents: 'none' }} />
            <span style={{ pointerEvents: 'none' }}>發布代禱</span>
          </>
        );
      case 'community':
        return (
          <>
            <img src={SocialIcon} alt="" style={{ width: 16, height: 16, pointerEvents: 'none' }} />
            <span style={{ pointerEvents: 'none' }}>代禱社群</span>
          </>
        );
      default:
        return (
          <>
            <img src={ReleasePrayerIcon} alt="" style={{ width: 16, height: 16, pointerEvents: 'none' }} />
            <span style={{ pointerEvents: 'none' }}>發布代禱</span>
          </>
        );
    }
  };

  // iOS WebView 優化：菜單使用 Portal 渲染到 body
  const MenuPortal = ({ isOpen, position, onMenuItemClick, items }: { isOpen: boolean, position: { top: number, left: number }, onMenuItemClick: (action: string) => void, items: { action: string, label: string, icon: string, color: string, hoverColor: string }[] }) => {
    if (!isOpen) return null;

    return createPortal(
      <>
        {/* 背景遮罩 - 最高優先級 */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999998,
            backgroundColor: 'transparent'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onMenuItemClick(''); // 點擊遮罩關閉
          }}
        />
        
        {/* 菜單主體 - 超高優先級 */}
        <div 
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: '104px',
            height: '240px', // 固定高度為 240px
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '20px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 999999,
            pointerEvents: 'auto'
          }}
        >
          <div 
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '4px 4px 6px 4px',
              gap: items.length === 1 ? '0px' : (items.length === 2 ? '40px' : '36px') // 根據項目數量調整間距
            }}
          >
            {items.map(item => (
              <button
                key={item.action}
                onClick={() => {
                  onMenuItemClick(item.action);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  width: '92px',
                  height: '30px',
                  backgroundColor: item.color,
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'normal',
                  color: 'black',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  touchAction: 'manipulation',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = item.color;
                }}
              >
                <img src={item.icon} alt="" style={{ width: 16, height: 16 }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </>,
      document.body
    );
  };

  // 根據當前路徑選擇頭像 URL，使用小尺寸頭像 (30x30)
  const getAvatarUrl = () => {
    // 只使用 Firebase 頭像
    return firebaseAvatarUrl30 || firebaseUser?.photoURL || '';
  };
  
  const effectiveAvatarUrl = getAvatarUrl();
  
  // 添加日誌記錄，用於調試頭像問題
  useEffect(() => {
    log.debug('Header 頭像狀態:', { 
      isFirebasePath,
      firebaseAvatarUrl30,
      firebaseUserPhotoURL: firebaseUser?.photoURL,
      effectiveAvatarUrl,
      firebaseIsLoggedIn,
      firebaseUser: !!firebaseUser,
      pathname: location.pathname,
      forceUpdate,
      localGuestMode
    }, 'Header');
  }, [isFirebasePath, firebaseAvatarUrl30, effectiveAvatarUrl, firebaseIsLoggedIn, firebaseUser, location.pathname, firebaseUser?.photoURL, forceUpdate, localGuestMode]);

  const getUserInitial = (): string => {
    return firebaseUser?.displayName?.charAt(0).toUpperCase() || 
           firebaseUser?.email?.charAt(0).toUpperCase() || 'G';
  };

  const handleAvatarError = () => {
    log.warn('頭像加載失敗', { url: effectiveAvatarUrl }, 'Header');
    setAvatarError(true);
    
    // 如果是 Firebase 路徑，嘗試刷新頭像
    if (isFirebasePath && firebaseUser) {
      refreshAvatar();
    }
  };

  // 根據路徑決定發布代禱/代禱社群主按鈕顏色與文字
  let prayerButton = {
    label: '發布代禱',
    color: '#FEE25F',
    hoverColor: '#FEE25F',
    icon: ReleasePrayerIcon,
    action: 'publish',
  };
  // 只有在 /prayers 時才顯示橘色
  if (location.pathname === '/prayers') {
    prayerButton = {
      label: '代禱社群',
      color: '#FF9B50',
      hoverColor: '#FF9B50',
      icon: SocialIcon,
      action: 'community',
    };
  }

  // 根據路徑決定個人資料/代禱紀錄/好友訊息主按鈕顏色與文字
  let mainButton = {
    label: '個人資料',
    color: '#C87806',
    hoverColor: '#C87806',
    action: 'profile',
  };
  if (location.pathname.startsWith('/log')) {
    mainButton = {
      label: '代禱紀錄',
      color: '#9594f4',
      hoverColor: '#9594f4',
      action: 'log',
    };
  } else if (location.pathname.startsWith('/message')) {
    mainButton = {
      label: '好友訊息',
      color: '#3DCC00',
      hoverColor: '#3DCC00',
      action: 'message',
    };
  }

  // 添加一個鍵值，確保頭像更新時強制重新渲染
  const avatarKey = `avatar-${forceUpdate}-${effectiveAvatarUrl?.substring(0, 20) || 'none'}`;

  return (
    <>
      <div 
        className="fixed top-0 left-0 right-0 w-full bg-transparent z-50" 
        data-testid="header"
      >
        {/* Header 主體 - 保持原來的高度和間距 */}
        <header className="flex w-full items-center justify-center h-[82px] px-4 pt-[52px]">
          <div className="w-full max-w-[358px] flex items-center justify-between relative">
            {/* 左側 Logo - 保持不變 */}
            <div className="flex-shrink-0">
              <img
                src={PrayforLogo}
                alt="Logo"
                className="object-contain h-[30px] w-auto"
                style={{ color: '#000000' }}
              />
            </div>

            {/* 中間主按鈕區域 - 動態顯示發布代禱/代禱社群 */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <button
                data-menu-trigger="true"
                onClick={toggleMenu}
                className="flex items-center justify-center gap-1 text-black font-normal text-[14px] rounded-full cursor-pointer"
                aria-label="發布代禱菜單"
                aria-expanded={isMenuOpen}
                style={{ width: 92, height: 30, zIndex: 10000, pointerEvents: 'auto', userSelect: 'none', backgroundColor: prayerButton.color }}
              >
                <img src={prayerButton.icon} alt="" style={{ width: 16, height: 16 }} />
                <span>{prayerButton.label}</span>
              </button>
            </div>

            {/* 主按鈕根據路徑動態顯示 - 僅登入時顯示 */}
            {isUserLoggedIn && (
              <div className="absolute" style={{ left: 'calc(50% + 46px + 6px)' }}>
                <button
                  onClick={toggleExtraMenu}
                  className="flex items-center justify-center gap-1 text-black font-normal text-[14px] rounded-full cursor-pointer"
                  style={{ width: 92, height: 30, backgroundColor: mainButton.color }}
                  aria-label="個人資料選單"
                  data-extra-menu-trigger="true"
                >
                  <img src={SocialIcon} alt="" style={{ width: 16, height: 16 }} />
                  <span>{mainButton.label}</span>
                </button>
              </div>
            )}

            {/* 右側按鈕區域 - 使用絕對定位 */}
            {isUserLoggedIn ? (
              <div className="absolute right-0">
                <button 
                  onClick={() => {
                    log.debug('小頭像被點擊，導航到 /setting', { 
                      isFirebasePath, 
                      hasFirebaseUser: !!firebaseUser,
                      currentPath: location.pathname 
                    }, 'Header');
                    navigate('/setting');
                  }}
                  className="rounded-full overflow-hidden flex items-center justify-center bg-[#1694da]"
                  style={{ width: '30px', height: '30px' }}
                  aria-label="用戶頭像"
                  data-testid="user-avatar-container"
                >
                  {isFirebasePath && firebaseUser ? (
                    // Firebase 路徑：優先使用 30px 頭像
                    firebaseAvatarUrl30 ? (
                      <img 
                        src={firebaseAvatarUrl30}
                        alt="用戶頭像"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          log.warn('Firebase 30px 頭像加載失敗', { url: firebaseAvatarUrl30 }, 'Header');
                          e.currentTarget.style.display = 'none';
                          refreshAvatar();
                        }}
                        onLoad={() => {
                          log.debug('Firebase 30px 頭像加載成功', { url: firebaseAvatarUrl30 }, 'Header');
                        }}
                      />
                    ) : firebaseUser.photoURL ? (
                      <img 
                        src={`${firebaseUser.photoURL}?t=${Date.now()}`}
                        alt="用戶頭像"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          log.warn('Firebase 頭像加載失敗', { photoURL: firebaseUser.photoURL }, 'Header');
                          e.currentTarget.style.display = 'none';
                          refreshAvatar();
                        }}
                      />
                    ) : (
                      <div 
                        className="flex items-center justify-center w-full h-full text-white font-medium"
                        style={{ fontSize: '14px' }}
                      >
                        {firebaseUser.displayName?.charAt(0).toUpperCase() || 
                         firebaseUser.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )
                  ) : (
                    // 顯示用戶初始字母
                    <div 
                      className="flex items-center justify-center w-full h-full text-white font-medium"
                      style={{ fontSize: '14px' }}
                    >
                      {getUserInitial()}
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div className="absolute right-0">
                <button 
                  onClick={handleLogin} 
                  className="flex w-[92px] h-[30px] items-center justify-center rounded-full bg-black text-sm font-normal text-white"
                >
                  登入 | 註冊
                </button>
              </div>
            )}
          </div>
        </header>
        
        {/* 發布代禱/代禱社群下拉選單 */}
        <MenuPortal 
          isOpen={isMenuOpen} 
          position={menuPosition} 
          onMenuItemClick={handleMenuItemClick}
          items={[
            { action: 'publish', label: '發布代禱', icon: ReleasePrayerIcon, color: '#FEE25F', hoverColor: '#FEE25F' },
            { action: 'community', label: '代禱社群', icon: SocialIcon, color: '#FF9B50', hoverColor: '#FF9B50' }
          ]}
        />
        
        {/* 下拉選單內容 - 展開時顯示三個彩色選項 */}
        <MenuPortal 
          isOpen={isExtraMenuOpen} 
          position={extraMenuPosition} 
          onMenuItemClick={handleExtraMenuItemClick}
          items={[
            { action: 'profile', label: '個人資料', icon: SocialIcon, color: '#C87806', hoverColor: '#C87806' },
            { action: 'log', label: '代禱紀錄', icon: ReleasePrayerIcon, color: '#9594f4', hoverColor: '#9594f4' },
            { action: 'message', label: '好友訊息', icon: MessageIcon, color: '#3DCC00', hoverColor: '#3DCC00' }
          ]}
        />
      </div>
    </>
  );
};