import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { log } from '@/lib/logger';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { MessageCard } from '../components/MessageCard';
import { useSearchParams } from 'react-router-dom';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

// 臨時實現：Firebase 版本的好友請求卡片
const FirebaseFriendRequestCard = ({ request }: { request: any }) => {
  return (
    <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            {request.senderName?.charAt(0) || '?'}
          </div>
          <div>
            <div className="font-medium">{request.senderName || '未知用戶'}</div>
            <div className="text-xs text-gray-500">請求加您為好友</div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
            onClick={() => toast.success('功能開發中')}
          >
            接受
          </button>
          <button 
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
            onClick={() => toast.error('功能開發中')}
          >
            拒絕
          </button>
        </div>
      </div>
    </div>
  );
};

// 臨時實現：Firebase 版本的好友請求過濾
function useFirebasePendingFriendRequests(userId: string) {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriendRequests = async () => {
    if (!userId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 模擬從 Firebase 獲取好友請求
      // 實際應用中，這裡應該查詢 Firestore 中的好友請求集合
      // 目前 Firebase 版本沒有實現好友請求功能，所以這裡返回模擬數據
      
      // 模擬延遲
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模擬好友請求數據
      const mockRequests = [
        {
          id: '1',
          senderId: 'user1',
          senderName: '王小明',
          receiverId: userId,
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          senderId: 'user2',
          senderName: '李小花',
          receiverId: userId,
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      ];
      
      setRequests(mockRequests);
    } catch (error) {
      log.error('獲取好友請求失敗', error, 'useFirebasePendingFriendRequests');
      toast.error('獲取好友請求失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendRequests();
    
    // 設定定時刷新
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchFriendRequests();
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

  return { requests, isLoading, refetch: fetchFriendRequests };
}

export default function Message() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthLoading, isLoggedIn } = useFirebaseAvatar();
  const initFirebaseAuth = useFirebaseAuthStore(state => state.initAuth);
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  
  // 初始化 Firebase 身份驗證
  useEffect(() => {
    initFirebaseAuth();
  }, [initFirebaseAuth]);
  
  // 使用臨時實現的 Firebase 好友請求 hook
  const { 
    requests: pendingReceivedRequests, 
    isLoading: isRequestsLoading, 
    refetch: refetchFriendRequests 
  } = useFirebasePendingFriendRequests(user?.uid || '');

  // 取得網址參數 userId，若有則顯示訊息卡片
  const messageUserId = searchParams.get('userId');
  // 取得對方名稱（從好友請求或其他來源）
  const [messageUserName, setMessageUserName] = useState('好友');
  
  // 當 messageUserId 變化時，嘗試獲取用戶名稱
  useEffect(() => {
    const fetchUserName = async () => {
      if (!messageUserId) return;
      
      try {
        // 嘗試從 Firebase 獲取用戶資料
        const userDoc = await getDoc(doc(db(), 'users', messageUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setMessageUserName(userData.displayName || '好友');
        }
      } catch (error) {
        log.error('獲取用戶名稱失敗', error, 'Message');
      }
    };
    
    fetchUserName();
  }, [messageUserId]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/auth');
    }
  }, [user, isAuthLoading, navigate]);

  return (
    <>
      <Header
        isLoggedIn={!!user}
        onLoginClick={() => navigate('/auth')}
        onProfileClick={() => navigate('/setting')}
        onExtraButtonClick={() => navigate('/log')}
      />
      <div className="min-h-screen flex flex-col" style={{ 
          backgroundColor: '#FFE5D9',
          paddingTop: '80px',
          paddingBottom: '30px'
      }}>
        <div className="text-sm text-gray-600 absolute top-4 left-4">
          好友訊息頁面
        </div>
        
        <div className="w-full max-w-md mx-auto px-6" id="profile-form-container">
          {/* 好友請求訊息卡片區域 */}
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-3">好友請求</h2>
            {isRequestsLoading ? (
              <div className="text-center py-8">載入中...</div>
            ) : pendingReceivedRequests.length > 0 ? (
              pendingReceivedRequests.map(request => (
                <FirebaseFriendRequestCard key={request.id} request={request} />
              ))
            ) : (
              <div className="bg-white/60 rounded-lg p-4 text-center text-gray-500">
                目前沒有待處理的好友請求
              </div>
            )}
          </div>
          
          {/* 傳送訊息卡片區域 */}
          {messageUserId && (
            <MessageCard userId={messageUserId} username={messageUserName} />
          )}
          
          {/* Firebase 版本說明 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-700 mb-2">Firebase 版本說明</h3>
            <p className="text-sm text-blue-600">
              目前 Firebase 版本的社交功能（好友請求、訊息）尚在開發中。此頁面顯示的是模擬數據。
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 