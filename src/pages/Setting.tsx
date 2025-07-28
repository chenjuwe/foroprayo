import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { log } from '@/lib/logger';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';
import { useTempUserStore } from '@/stores/tempUserStore';
import { debounce } from '@/lib/utils';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { updateProfile, updatePassword, updateEmail } from 'firebase/auth';
import { auth } from '@/integrations/firebase/client';
import { FirebasePrayerService } from '@/services/prayer/FirebasePrayerService';
import { FirebasePrayerResponseService } from '@/services/prayer/FirebasePrayerResponseService';
import { FirebaseUserService } from '@/services/auth/FirebaseUserService';

export default function Setting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthLoading, refreshAvatar } = useFirebaseAvatar();

  const [newUsername, setNewUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setTempDisplayName = useTempUserStore(state => state.setTempDisplayName);
  const userId = user?.uid || '';
  
  const usernameInputRef = useRef('');
  
  useEffect(() => {
    const preventFormSubmit = (e: Event) => {
      if (e.target instanceof HTMLFormElement) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    document.addEventListener('submit', preventFormSubmit, true);
    
    return () => {
      document.removeEventListener('submit', preventFormSubmit, true);
    };
  }, []);
  
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/auth');
    }
  }, [user, isAuthLoading, navigate]);
  
  // 監聽全局用戶名稱更新，並將其同步到本地狀態
  const tempDisplayName = useTempUserStore(state => (userId ? state.tempDisplayNames[userId] : ''));

  useEffect(() => {
    if (tempDisplayName) {
      setNewUsername(tempDisplayName);
      log.debug('從 tempUserStore 同步用戶名稱到本地狀態', { userId, tempDisplayName }, 'Setting');
    }
  }, [tempDisplayName, userId]);

  // 提取保存用戶名稱的核心邏輯到一個非 debounce 函數
  const saveUsername = async (username: string) => {
    if (!user || !username.trim()) return;
    
    if (username.trim() === user.displayName) return;
    
    try {
      // 1. 更新 Firebase Auth 用戶資料
      await updateProfile(user, { displayName: username });
      
      // 2. 同步更新 Firestore 用戶資料
      await FirebaseUserService.setUserData(user.uid, { displayName: username });

      await queryClient.invalidateQueries({ queryKey: ['prayers'] });
      await queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      
      // 3. 保存成功後，直接更新 Zustand store，這將觸發所有組件更新
      setTempDisplayName(user.uid, username);
      
      // 將新用戶名保存到 localStorage，確保頁面刷新後仍然顯示
      localStorage.setItem(`displayName_${user.uid}`, username);
      
      // 刷新頭像以更新顯示
      refreshAvatar();
      
      toast.success('用戶名稱已更新');
      
      return true; // 返回成功標誌
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '請稍後再試';
      toast.error('用戶名稱更新失敗', { description: errorMessage });
      log.error('用戶名稱更新失敗', error, 'Setting');
      return false; // 返回失敗標誌
    }
  };

  const debouncedSaveUsername = React.useCallback(
    debounce(async (username: string) => {
      await saveUsername(username);
    }, 1000),
    [user, refreshAvatar, queryClient, setTempDisplayName]
  );

  const handleUsernameChange = (value: string) => {
    setNewUsername(value);
    
    if (value.trim()) {
      debouncedSaveUsername(value);
    }
  };
  
  const handleConfirmChanges = async () => {
    // 如果有新的用戶名稱，立即保存（不等待 debounce）
    if (newUsername.trim() && newUsername.trim() !== user?.displayName) {
      await saveUsername(newUsername);
    }

    if (password.trim()) {
      setLoading(true);
      
      try {
        if (user) {
          await updatePassword(user, password);
          toast.success('密碼更新成功！');
        } else {
          throw new Error('用戶未登入');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '請稍後再試';
        toast.error('密碼更新失敗', { description: errorMessage });
        log.error('密碼更新失敗', error, 'Setting');
      } finally {
        setLoading(false);
      }
    }
    
    navigate('/prayers');
  };

  const handleLogout = async () => {
    try {
      // 顯示登出中提示
      toast.loading('登出中...', { duration: 1500 });
      
      // 立即啟動跳轉計時器 - 無論如何，2秒後都會跳轉
      const redirectTimer = setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      
      // 創建清理任務
      const cleanupTasks = [];
      
      // 1. 清除基本全局緩存 (最優先)
      localStorage.removeItem('guestMode');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('last_user');
      
      // 2. 非阻塞方式清除用戶特定緩存
      if (user?.uid) {
        const cleanupUserCache = () => {
          try {
            // 使用更高效的批量處理
            const userPrefix = user.uid.substring(0, 8); // 只使用 UID 前綴提高比對效率
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (
                key.includes(userPrefix) || 
                key.startsWith('avatar_') || 
                key.includes('background_') ||
                key.includes('customBackground_')
              )) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // 忽略清除緩存錯誤
          }
        };
        cleanupTasks.push(cleanupUserCache());
      }
      
      // 3. 非阻塞方式清除查詢緩存
      const clearQueryCache = async () => {
        try {
          // 只清除關鍵查詢而不是全部清除
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['prayers'] }),
            queryClient.invalidateQueries({ queryKey: ['user'] }),
            queryClient.invalidateQueries({ queryKey: ['avatar'] })
          ]);
        } catch (e) {
          // 忽略清除緩存錯誤
        }
      };
      cleanupTasks.push(clearQueryCache());
      
      // 4. 執行 Firebase 登出 (並行執行)
      const firebaseLogout = auth().signOut();
      cleanupTasks.push(firebaseLogout);
      
      // 等待所有任務完成或超時
      await Promise.race([
        Promise.all(cleanupTasks),
        new Promise(resolve => setTimeout(resolve, 1500)) // 最多等待 1.5 秒
      ]);
      
      // 顯示成功訊息
      toast.dismiss();
      toast.success('已成功登出');
      
      // 確保立即跳轉
      window.location.href = '/auth';
    } catch (error: any) {
      // 清除計時器
      toast.dismiss();
      toast.error('登出處理中', { description: "正在重新導向..." });
      
      // 無論如何強制跳轉
      window.location.href = '/auth?force=true';
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>載入中...</div>
      </div>
    );
  }

  // 自定義表單，不使用 ProfileForm 的經文輸入功能
  const renderCustomForm = () => {
    return (
      <div className="flex flex-col items-center justify-center w-full" style={{ padding: '10px 0', marginBottom: '20px', paddingTop: '102px' }}>
        {/* 信箱帳號 */}
        <div className="relative" style={{ width: '270px', marginBottom: '20px' }}>
          <div className="absolute top-[2px] left-0" style={{ fontSize: '14px', color: '#1694da' }}>
            信箱帳號
          </div>
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="w-full bg-transparent border-b pb-2 text-[#1694da] focus:outline-none focus:border-[#1694da] text-sm rounded-none"
            style={{ paddingLeft: '70px', textAlign: 'left', borderColor: '#1694da' }}
          />
        </div>
        
        {/* 用戶名稱 */}
        <div className="relative" style={{ width: '270px', marginBottom: '20px' }}>
          <input
            type="text"
            value=""
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="輸入新的用戶名稱"
            className="w-full bg-transparent border-b border-[#1694da] pb-2 text-black placeholder-[#1694da] focus:outline-none focus:border-[#1694da] text-sm rounded-none"
            style={{ textAlign: 'left', paddingLeft: '0' }}
            autoComplete="off"
            data-form-type="other"
          />
        </div>
        
        {/* 密碼 */}
        <div className="relative" style={{ width: '270px', marginBottom: '20px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="輸入新的密碼"
            className="w-full bg-transparent border-b border-[#1694da] pb-2 text-black placeholder-[#1694da] focus:outline-none focus:border-[#1694da] text-sm rounded-none"
            style={{ textAlign: 'left', paddingLeft: '0' }}
            autoComplete="new-password"
            data-form-type="other"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Header
        isLoggedIn={!!user}
        onLoginClick={() => navigate('/auth')}
        onProfileClick={handleProfileClick}
        onExtraButtonClick={() => navigate('/message')}
      />
      <div className="min-h-screen flex flex-col" style={{ 
          backgroundColor: '#FFE5D9',
          paddingTop: '80px',
          paddingBottom: '30px'
      }}>
        
        <div className="w-full" style={{ marginBottom: '30px' }}>
          <div className="flex flex-col items-center" style={{ paddingTop: '92px' }}>
            <div 
              className="text-center text-lg font-semibold" 
              style={{ marginTop: '20px', padding: '5px 10px' }}
              data-user-id={userId}
            >
              {newUsername || '（無用戶名稱）'}
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-sm mx-auto px-6" id="profile-form-container">
          {/* 使用自定義表單，而不是 ProfileForm 組件 */}
          {renderCustomForm()}
          
          <div style={{ marginTop: '-8px', width: '270px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="text-black font-normal"
                style={{ 
                  backgroundColor: '#a6a6a6',
                  width: '130px',
                  height: '30px',
                  borderRadius: '15px',
                  fontSize: '14px'
                }}
              >
                登出帳號
              </button>
              
              <button
                type="button"
                onClick={handleConfirmChanges}
                disabled={loading}
                className="text-black font-normal"
                style={{ 
                  backgroundColor: loading ? '#cccccc' : '#95d2f4',
                  width: '130px',
                  height: '30px',
                  borderRadius: '15px',
                  fontSize: '14px'
                }}
              >
                {loading ? '儲存中...' : '確認修改'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 