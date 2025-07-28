import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { FirebaseProfileAvatar } from '../components/profile/FirebaseProfileAvatar';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ProfileStats } from '../components/profile/ProfileStats'; // 導入ProfileStats組件
import { AddFriendButton, AddFriendButtonWithMessage } from '../components/profile/AddFriendButton'; // 導入加好友與傳送訊息按鈕
import { log } from '@/lib/logger';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { auth, db } from '@/integrations/firebase/client';
import { updateProfile } from 'firebase/auth';
import { debounce } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CameraIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useFirebaseUserData from '@/hooks/useFirebaseUserData';
import { doc, getDoc } from 'firebase/firestore';

// Define the type for the public profile data
interface PublicProfile {
  user_name: string | null;
  avatar_url: string | null;
  scripture: string | null;
}

// Function to fetch public user profile using Firebase
const fetchPublicProfile = async (userId: string): Promise<PublicProfile | null> => {
  try {
    const userDocRef = doc(db(), 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) {
      log.warn('User profile not found in Firestore', { userId }, 'ProfilePage');
      return null;
    }
    
    const userData = userDocSnap.data();
    
    return {
      user_name: userData.displayName || null,
      avatar_url: userData.photoURL || null,
      scripture: userData.scripture || null
    };
  } catch (error) {
    log.error('Failed to fetch public user profile from Firebase', error, 'ProfilePage');
    throw new Error('無法獲取用戶公開資料');
  }
};

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, isAuthLoading, isLoggedIn } = useFirebaseAvatar();
  const initFirebaseAuth = useFirebaseAuthStore(state => state.initAuth);
  const { userData, scripture: firestoreScripture, updateScripture, refreshUserData } = useFirebaseUserData();

  // 初始化 Firebase 身份驗證
  useEffect(() => {
    initFirebaseAuth();
  }, [initFirebaseAuth]);

  // 從URL獲取userId參數
  const urlUserId = searchParams.get('userId');
  
  // 是否正在查看其他用戶的資料
  const isViewingOtherUser = !!urlUserId && urlUserId !== user?.uid;

  // Fetch public profile data if viewing other user
  const { 
    data: viewedUser, 
    isLoading: isViewingUserLoading, 
    error: viewingUserError 
  } = useQuery({
    queryKey: ['publicProfile', urlUserId],
    queryFn: () => fetchPublicProfile(urlUserId!),
    enabled: isViewingOtherUser,
  });
  
  const [newUsername, setNewUsername] = useState('');
  const [scripture, setScripture] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScriptureEditing, setIsScriptureEditing] = useState(false);

  const [tempDisplayName, setTempDisplayName] = useState('');
  
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
    if (!isAuthLoading && !user && !isViewingOtherUser) {
      navigate('/auth');
    }
  }, [user, isAuthLoading, navigate, isViewingOtherUser]);

  const isFirstMount = useRef(true);
  
  useEffect(() => {
    const refreshUserData = async () => {
      if (user && !isViewingOtherUser) {
        try {
          // 刷新 Firebase 用戶資料
          await user.reload();
          
          const currentName = user.displayName || user.email?.split('@')[0] || 'User';
          setTempDisplayName(currentName);
          
          // 從 Firestore 獲取經文
          log.debug('從 useFirebaseUserData 獲取經文資料', { 
            userId: user.uid,
            scripture: firestoreScripture || '無經文資料'
          }, 'Profile');
          
          // 使用 firestoreScripture 而不是 userData?.scripture
          if (firestoreScripture) {
            setScripture(firestoreScripture);
            log.debug('已設置經文資料', { scripture: firestoreScripture }, 'Profile');
          }
          
          queryClient.invalidateQueries({ queryKey: ['avatar', user.uid] });
          queryClient.invalidateQueries({ queryKey: ['prayers'] });
        } catch (err) {
          log.error('刷新用戶資料失敗', err, 'Profile');
        }
      }
    };
    
    if (user && isFirstMount.current && !isViewingOtherUser) {
      refreshUserData();
    }
  }, [user, queryClient, isViewingOtherUser, userData, firestoreScripture]);
  
  useEffect(() => {
    if (isFirstMount.current && user && !isViewingOtherUser) {
      const currentName = user.displayName || user.email?.split('@')[0] || 'User';
      setNewUsername('');
      usernameInputRef.current = '';
      setTempDisplayName(currentName);
      
      // 從 Firestore 獲取經文
      log.debug('初始化時從 useFirebaseUserData 獲取經文資料', { 
        userId: user.uid,
        scripture: firestoreScripture || '無經文資料'
      }, 'Profile');
      
      // 使用 firestoreScripture 而不是 userData?.scripture
      setScripture(firestoreScripture);
      
      isFirstMount.current = false;
    }
  }, [user, isViewingOtherUser, firestoreScripture]);

  // 當 firestoreScripture 變化時更新 scripture
  useEffect(() => {
    if (firestoreScripture && !isViewingOtherUser) {
      log.debug('firestoreScripture 變化，更新 scripture', { 
        scripture: firestoreScripture
      }, 'Profile');
      setScripture(firestoreScripture);
    }
  }, [firestoreScripture, isViewingOtherUser]);

  // 獲取要顯示的用戶名稱
  const currentDisplayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayName = newUsername || tempDisplayName || currentDisplayName;

  const debouncedSaveUsername = React.useCallback(
    debounce(async (username: string) => {
      if (!user || !username.trim()) return;
      
      const currentDisplayName = user.displayName || '';
      if (username.trim() === currentDisplayName) return;
      
      try {
        // 更新 Firebase 用戶顯示名稱
        await updateProfile(user, {
          displayName: username
        });
        
        // 刷新用戶資料
        await user.reload();
        
        await queryClient.invalidateQueries({ queryKey: ['prayers'] });
        
        toast.success('用戶名稱已更新');
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '請稍後再試';
        toast.error('用戶名稱更新失敗', { description: errorMessage });
        log.error('用戶名稱更新失敗', error, 'Profile');
      }
    }, 1000),
    [user, queryClient]
  );

  const handleUsernameChange = (value: string) => {
    usernameInputRef.current = value;
    setNewUsername(value);
    
    if (value.trim()) {
      setTempDisplayName(value);
    } else {
      setTempDisplayName(currentDisplayName);
    }
    
    if (value.trim()) {
      debouncedSaveUsername(value);
    }
  };

  const handleScriptureChange = (value: string) => {
    setScripture(value);
  };
  
  const handleScriptureEditingChange = (isEditing: boolean) => {
    setIsScriptureEditing(isEditing);
  };

  const handleConfirmChanges = async () => {
    // 先確認是否已在載入狀態，如果是則不執行
    if (loading) return;
    
    setLoading(true);
    let timeoutId: number | undefined;
    
    try {
      // 設置一個超時計時器，在10秒後自動重置loading狀態
      timeoutId = window.setTimeout(() => {
        setLoading(false);
        toast.error('更新經文超時，請重試', { 
          description: '請檢查網路連接或稍後再試' 
        });
      }, 10000);

      // 更新經文到 Firestore
      if (user) {
        log.debug('正在保存經文到 Firestore', { 
          userId: user.uid,
          scripture: scripture
        }, 'Profile');
        
        await updateScripture(scripture);
        
        log.debug('經文已成功保存到 Firestore', { 
          userId: user.uid
        }, 'Profile');
        
        toast.success('經文已更新');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '發生未知錯誤';
      toast.error('更新過程中發生錯誤', { description: errorMessage });
      log.error('更新經文過程中發生錯誤', error, 'Profile');
    } finally {
      // 確保無論成功或失敗都清除計時器和重置loading狀態
      clearTimeout(timeoutId);
      setLoading(false);
      // 更新完成後，設置編輯狀態為 false
      setIsScriptureEditing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await auth().signOut();
      
      // 清理快取
      queryClient.clear();
      
      navigate('/auth');
      toast.success('您已成功登出');
    } catch (error: any) {
      toast.error('登出時發生錯誤', {
        description: error.message
      });
      log.error('登出失敗', error, 'Profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/auth');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handlePublishClick = () => {
    navigate('/prayers');
  };



  if (isAuthLoading || (isViewingOtherUser && isViewingUserLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>載入中...</div>
      </div>
    );
  }

  // 如果用戶未登入，顯示登入提示
  if (!user && !isViewingOtherUser) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFE5D9' }}>
        <Header 
          isLoggedIn={false}
          onLoginClick={handleLoginClick}
          onProfileClick={() => navigate('/setting')}
          onPublishClick={handlePublishClick}
        />
        <div className="pt-24 pb-12 px-4 max-w-md mx-auto flex flex-col items-center">
          <div className="text-center">
            <p className="text-lg mb-4">請先登入以查看個人資料</p>
            <button
              onClick={handleLoginClick}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              前往登入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle case where other user's profile is not found
  if (isViewingOtherUser && (viewingUserError || !viewedUser)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
         <Header 
          isLoggedIn={isLoggedIn ?? false}
          onLoginClick={handleLoginClick}
          onProfileClick={() => navigate('/profile')}
          onPublishClick={handlePublishClick}
        />
        <div className="text-center">
            <p className="text-lg">無法找到該用戶的資料。</p>
            {viewingUserError && <p className="text-red-500 text-sm mt-2">{viewingUserError.message}</p>}
        </div>
      </div>
    );
  }

  if (isViewingOtherUser && viewedUser) {
    //
    // 他人用戶頁面
    //
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFE5D9' }}>
        <Header 
          isLoggedIn={isLoggedIn ?? false}
          onLoginClick={handleLoginClick}
          onProfileClick={() => navigate('/profile')}
          onPublishClick={handlePublishClick}
        />
        <div className="pt-24 pb-12 px-4 max-w-md mx-auto flex flex-col items-center">
          {/* 使用 ProfileAvatar 來顯示頭像 */}
          <div className="flex justify-center">
            <div className="w-32 h-32 flex justify-center items-center mt-4">
              <div className="relative w-24 h-24">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={viewedUser.avatar_url || undefined} alt={viewedUser.user_name || 'User Avatar'} />
                  <AvatarFallback>
                    {viewedUser.user_name ? viewedUser.user_name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
          {/* 使用 ProfileForm 顯示用戶名稱和經文 */}
          <ProfileForm 
            email="" // not showing email for other users
            newUsername={viewedUser.user_name || ''}
            scripture={viewedUser.scripture || ''}
            onUsernameChange={() => {}} // no-op
            onScriptureChange={() => {}} // no-op
            disabled={true} // disable editing
          />
          {/* 添加好友或傳送訊息按鈕 */}
          {isLoggedIn && urlUserId && (
            <div className="w-full mt-4 flex justify-center" style={{ marginTop: '60px' }}>
              <AddFriendButtonWithMessage userId={urlUserId} />
            </div>
          )}
          {/* 添加用戶統計信息 */}
          <ProfileStats userId={urlUserId || ''} />
        </div>
      </div>
    );
  }

  // Render current user's profile
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFE5D9' }}>
      <Header 
        isLoggedIn={!!user}
        onLoginClick={handleLoginClick}
        onProfileClick={() => navigate('/setting')}
        onPublishClick={handlePublishClick}
      />
      <div className="pt-24 pb-12 px-4 max-w-md mx-auto flex flex-col items-center">

        {user ? (
          <FirebaseProfileAvatar 
            userId={user.uid}
          />
        ) : (
          <div className="w-32 h-32 flex justify-center items-center mt-4">
            <div className="relative w-24 h-24">
              <Avatar className="w-24 h-24">
                <AvatarFallback 
                  className="text-3xl"
                  style={{ backgroundColor: '#95d2f4', color: '#000000' }}
                >
                  G
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        )}
        <ProfileForm 
          email={user?.email || ''}
          newUsername={displayName}
          scripture={scripture}
          onUsernameChange={handleUsernameChange}
          onScriptureChange={handleScriptureChange}
          onConfirmChanges={handleConfirmChanges}
          loading={loading}
          isScriptureEditing={isScriptureEditing}
          onScriptureEditingChange={handleScriptureEditingChange}
        />
        

        
        {/* 添加用戶統計信息 */}
        <ProfileStats userId={user?.uid || ''} />
      </div>
    </div>
  );
} 