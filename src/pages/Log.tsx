import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { log } from '@/lib/logger';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { formatDistanceToNow, format, differenceInHours, differenceInSeconds } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { FirebasePrayerService } from '@/services/prayer/FirebasePrayerService';
import { FirebasePrayerResponseService } from '@/services/prayer/FirebasePrayerResponseService';
import { Prayer, PrayerResponse } from '@/types/prayer';
import PrayerPost from '../components/PrayerPost';
import { PostStats } from '@/components/PostStats';
import { PostActionButtons } from '@/components/PostActionButtons';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
// 導入新的 Spinner 元件
import { Spinner } from "@/components/ui/spinner";

// 格式化日期函數
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const hoursDifference = differenceInHours(now, date);
    const secondsDifference = differenceInSeconds(now, date);

    if (secondsDifference < 60) {
      return secondsDifference < 5 ? '剛剛' : `${secondsDifference} 秒前`;
    }

    if (hoursDifference < 24) {
      const relativeTime = formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
      return relativeTime.replace('大約 ', '');
    } else {
      return format(date, "yyyy-MM-dd  HH:mm", { locale: zhTW });
    }
  } catch (error) {
    log.error('日期格式化失敗', error, 'Log');
    return '無效日期';
  }
};

// 標籤組件
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      width: '92px',
      height: '30px',
      backgroundColor: active ? '#C4C3FA' : 'transparent',
      border: '1px solid black',
      color: active ? 'black' : 'black',
    }}
    className="font-normal text-sm transition-colors hover:bg-[#E4DDFF] hover:text-black"
  >
    {children}
  </button>
);

// 代禱紀錄卡片
const PrayerCard: React.FC<{
  prayer: Prayer;
  onClick: () => void;
  currentUserId: string | null;
}> = ({ prayer, onClick, currentUserId }) => {
  const date = prayer.created_at 
    ? formatDate(prayer.created_at)
    : '未知時間';
  
  // 判斷是否為貼文擁有者
  const isOwner = currentUserId === prayer.user_id;
  
  // 處理編輯按鈕的容器點擊，阻止事件冒泡
  const handleEditContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到卡片
  };
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-none p-4 shadow-sm mb-1 cursor-pointer hover:shadow-md transition-shadow relative"
    >
      <div className="flex justify-between items-center mb-2">
        {/* 日期時間使用絕對定位向上移動1px */}
        <div className="relative" style={{ width: '40%', height: '20px' }}>
          <span 
            className="text-xs text-gray-500 absolute"
            style={{ top: '-1px', left: '0px' }}
          >
            {date}
          </span>
        </div>
        
        {/* 使用絕對定位，明確控制位置，向右移動50px靠近日期 */}
        <div className="relative" style={{ width: '200px', height: '20px' }}>
          <div className="absolute" style={{ right: '24px', top: '0px' }}>
            <PostStats
              prayerId={prayer.id}
              currentUserId={currentUserId}
              responseCount={prayer.response_count || 0}
              heartIconSize={14}
              replyIconSize={14}
              gap={12}   // 增加元素間距
            />
          </div>
        </div>
        
        {/* 添加編輯按鈕，點擊時阻止事件冒泡 */}
        <div 
          className="absolute" 
          style={{ right: '8px', top: '8px', zIndex: 10 }}
          onClick={handleEditContainerClick} // 添加點擊處理函數阻止冒泡
        >
          <PostActionButtons
            postId={prayer.id}
            prayerUserId={prayer.user_id || ''}
            prayerContent={prayer.content || ''}
            prayerUserName={prayer.user_name || '訪客'}
            prayerUserAvatar={prayer.user_avatar || ''}
            isOwner={isOwner}
          />
        </div>
      </div>
      
      <p className="text-sm text-left line-clamp-1 overflow-hidden">
        {prayer.content}
      </p>
    </div>
  );
};

// 回覆紀錄卡片
const ResponseCard: React.FC<{
  response: PrayerResponse & { prayer?: Prayer };
  onClick: () => void;
}> = ({ response, onClick }) => {
  const date = response.created_at 
    ? formatDate(response.created_at)
    : '未知時間';
  
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-none p-4 shadow-sm mb-1 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      
      {response.prayer && (
        <div className="bg-transparent border border-[#1694da] p-2 rounded-none mb-2 text-xs text-gray-700">
          <p className="text-left line-clamp-1 overflow-hidden">
            {response.prayer.is_anonymous ? '訪客' : (response.prayer.user_name || '訪客')}：{response.prayer.content}
          </p>
        </div>
      )}
      
      <p className="text-sm text-left line-clamp-1 overflow-hidden">
        {response.content}
      </p>
    </div>
  );
};

export default function Log() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthLoading, isLoggedIn } = useFirebaseAvatar();
  const initFirebaseAuth = useFirebaseAuthStore(state => state.initAuth);
  
  const [activeTab, setActiveTab] = useState<'prayers' | 'responses' | 'answered'>('prayers');
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [responses, setResponses] = useState<(PrayerResponse & { prayer?: Prayer })[]>([]);
  const [answeredPrayers, setAnsweredPrayers] = useState<Prayer[]>([]);
  const [answeredResponses, setAnsweredResponses] = useState<(PrayerResponse & { prayer?: Prayer })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedPrayerId, setExpandedPrayerId] = useState<string | null>(null);
  
  // 初始化 Firebase 身份驗證
  useEffect(() => {
    initFirebaseAuth();
  }, [initFirebaseAuth]);
  
  // 當使用者變更時獲取數據
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user && user.uid) {
      loadData();
    }
  }, [user, isAuthLoading, activeTab]);
  
  // 使用 Firebase 服務實例
  const prayerService = new FirebasePrayerService();
  const responseService = new FirebasePrayerResponseService();
  
  // 獲取我的代禱
  const fetchMyPrayers = async (pageNum = 1) => {
    if (!user || !user.uid) return [];
    
    const limit = 10;
    const offset = (pageNum - 1) * limit;
    
    try {
      return await prayerService.getMyPrayers({
        userId: user.uid,
        limit,
        offset
      });
    } catch (error) {
      log.error('獲取代禱數據失敗', error, 'Log');
      return [];
    }
  };
  
  // 獲取我的回應
  const fetchMyResponses = async (pageNum = 1) => {
    if (!user || !user.uid) return [];
    
    try {
      // 獲取用戶的所有回應
      const responses = await responseService.getUserResponses(user.uid);
      
      // 手動分頁
      const limit = 10;
      const offset = (pageNum - 1) * limit;
      const pagedResponses = responses.slice(offset, offset + limit);
      
      // 為每個回應獲取原始代禱
      const responsesWithPrayers = await Promise.all(
        pagedResponses.map(async (response) => {
          try {
            const prayer = await prayerService.getPrayerById(response.prayer_id);
            return { ...response, prayer };
          } catch (error) {
            return response;
          }
        })
      );
      
      return responsesWithPrayers;
    } catch (error) {
      log.error('獲取回應數據失敗', error, 'Log');
      return [];
    }
  };

  // 獲取「神已應允」的代禱
  const fetchAnsweredPrayers = async (pageNum = 1) => {
    if (!user || !user.uid) return [];
    
    try {
      // 獲取用戶的所有代禱
      const allPrayers = await prayerService.getPrayersByUserId(user.uid);
      
      // 過濾出已標記為「神已應允」的代禱
      const answeredPrayers = allPrayers.filter(prayer => prayer.is_answered);
      
      // 手動分頁
      const limit = 10;
      const offset = (pageNum - 1) * limit;
      return answeredPrayers.slice(offset, offset + limit);
    } catch (error) {
      log.error('獲取「神已應允」代禱失敗', error, 'Log');
      return [];
    }
  };

  // 獲取「神已應允」的回應
  const fetchAnsweredResponses = async (pageNum = 1) => {
    if (!user || !user.uid) return [];
    
    try {
      // 目前 Firebase 版本沒有直接支援獲取已標記為「神已應允」的回應
      // 這裡返回空數組，後續可以實現此功能
      return [];
    } catch (error) {
      log.error('獲取「神已應允」回應失敗', error, 'Log');
      return [];
    }
  };
  
  // 使用 React Query 的查詢
  const prayersQuery = useQuery({
    queryKey: ['my-prayers-firebase', user?.uid, page],
    queryFn: () => fetchMyPrayers(page),
    enabled: !!user?.uid && activeTab === 'prayers',
    staleTime: 60000 // 1分鐘
  });
  
  const responsesQuery = useQuery({
    queryKey: ['my-responses-firebase', user?.uid, page],
    queryFn: () => fetchMyResponses(page),
    enabled: !!user?.uid && activeTab === 'responses',
    staleTime: 60000 // 1分鐘
  });

  // 「神已應允」查詢
  const answeredPrayersQuery = useQuery({
    queryKey: ['answered-prayers-firebase', user?.uid, page],
    queryFn: () => fetchAnsweredPrayers(page),
    enabled: !!user?.uid && activeTab === 'answered',
    staleTime: 60000 // 1分鐘
  });

  const answeredResponsesQuery = useQuery({
    queryKey: ['answered-responses-firebase', user?.uid, page],
    queryFn: () => fetchAnsweredResponses(page),
    enabled: !!user?.uid && activeTab === 'answered',
    staleTime: 60000 // 1分鐘
  });
  
  // 使用 useEffect 處理查詢結果
  useEffect(() => {
    if (prayersQuery.data && activeTab === 'prayers') {
      if (page === 1) {
        setPrayers(prayersQuery.data);
      } else {
        setPrayers(prev => [...prev, ...prayersQuery.data]);
      }
      setHasMore(prayersQuery.data.length === 10);
      setIsLoading(prayersQuery.isLoading);
    }
  }, [prayersQuery.data, prayersQuery.isLoading, activeTab, page]);
  
  useEffect(() => {
    if (responsesQuery.data && activeTab === 'responses') {
      if (page === 1) {
        setResponses(responsesQuery.data);
      } else {
        setResponses(prev => [...prev, ...responsesQuery.data]);
      }
      setHasMore(responsesQuery.data.length === 10);
      setIsLoading(responsesQuery.isLoading);
    }
  }, [responsesQuery.data, responsesQuery.isLoading, activeTab, page]);

  // 處理「神已應允」數據
  useEffect(() => {
    if (answeredPrayersQuery.data && activeTab === 'answered') {
      if (page === 1) {
        setAnsweredPrayers(answeredPrayersQuery.data);
      } else {
        setAnsweredPrayers(prev => [...prev, ...answeredPrayersQuery.data]);
      }
      setHasMore(answeredPrayersQuery.data.length === 10);
      setIsLoading(answeredPrayersQuery.isLoading);
    }
  }, [answeredPrayersQuery.data, answeredPrayersQuery.isLoading, activeTab, page]);

  useEffect(() => {
    if (answeredResponsesQuery.data && activeTab === 'answered') {
      if (page === 1) {
        setAnsweredResponses(answeredResponsesQuery.data);
      } else {
        setAnsweredResponses(prev => [...prev, ...answeredResponsesQuery.data]);
      }
      setHasMore(answeredResponsesQuery.data.length === 10);
      setIsLoading(answeredResponsesQuery.isLoading);
    }
  }, [answeredResponsesQuery.data, answeredResponsesQuery.isLoading, activeTab, page]);
  
  // 處理查詢錯誤
  useEffect(() => {
    if (prayersQuery.error && activeTab === 'prayers') {
      log.error('獲取代禱數據失敗', prayersQuery.error, 'Log');
      toast.error('獲取代禱數據失敗，請重試');
    }
    
    if (responsesQuery.error && activeTab === 'responses') {
      log.error('獲取回應數據失敗', responsesQuery.error, 'Log');
      toast.error('獲取回應數據失敗，請重試');
    }
  }, [prayersQuery.error, responsesQuery.error, activeTab]);
  
  // 添加滾動事件監聽，用於毛玻璃效果
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
  
  // 加載更多數據
  const loadMoreData = () => {
    if (isLoading || !hasMore) return;
    setPage(prev => prev + 1);
  };
  
  // 添加 loadData 函數，用於切換標籤時重新加載數據
  const loadData = () => {
    setPage(1);
    if (activeTab === 'prayers') {
      prayersQuery.refetch();
    } else if (activeTab === 'responses') {
      responsesQuery.refetch();
    } else if (activeTab === 'answered') {
      answeredPrayersQuery.refetch();
      answeredResponsesQuery.refetch();
    }
  };
  
  // 修改卡片點擊行為
  const handlePrayerClick = (prayerId: string) => {
    setExpandedPrayerId(prev => (prev === prayerId ? null : prayerId));
  };
  const handleResponseClick = (prayerId: string | undefined) => {
    if (!prayerId) return;
    setExpandedPrayerId(prev => (prev === prayerId ? null : prayerId));
  };
  
  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* 固定背景層 */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#FFE5D9',
          zIndex: -1
        }} 
      />

      {/* 玻璃遮罩層 */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '138px', // 增加高度以包含標籤欄
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(8px)' : 'none',
          zIndex: 40,
          transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
        }}
      />
      
      {/* Header 層 (固定) */}
      <Header
        isLoggedIn={!!user}
        onLoginClick={() => navigate('/auth')}
        onProfileClick={() => navigate('/setting')}
        onExtraButtonClick={() => navigate('/profile')}
      />
      
      {/* 標籤欄 (固定) */}
      <div 
        className="fixed left-0 right-0 flex justify-center space-x-4 z-40"
        style={{ top: '98px' }}
      >
        <TabButton
          active={activeTab === 'prayers'}
          onClick={() => setActiveTab('prayers')}
        >
          我的代禱
        </TabButton>
        <TabButton
          active={activeTab === 'responses'}
          onClick={() => setActiveTab('responses')}
        >
          我的回應
        </TabButton>
        <TabButton
          active={activeTab === 'answered'}
          onClick={() => setActiveTab('answered')}
        >
          神已應允
        </TabButton>
      </div>
      
      {/* 可滾動的內容層 */}
      <main 
        ref={scrollContainerRef}
        className="h-full w-full overflow-y-auto pb-20"
        style={{ paddingTop: '138px' }} // 增加上邊距以避免內容被固定元素遮擋
      >
        <div className="flex flex-col max-w-[358px] mx-auto px-4">
          {/* 移除原來的標籤切換區塊 */}
          
          {/* 代禱列表 */}
          {activeTab === 'prayers' && (
            <div className="space-y-1">
              {isLoading && page === 1 && (
                <div className="flex justify-center py-8">
                  <Spinner size="medium" variant="default" />
                </div>
              )}
              
              {!isLoading && prayers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  您還沒有發布過代禱
                </div>
              )}
              
              {prayers.map((prayer) => (
                <React.Fragment key={prayer.id}>
                  {expandedPrayerId === prayer.id ? (
                    <div className="mb-2">
                      <PrayerPost
                        prayer={prayer}
                        onUpdate={() => {}}
                        isLoggedIn={!!user}
                        initialResponseCount={prayer.response_count || 0}
                      />
                    </div>
                  ) : (
                    <PrayerCard
                      prayer={prayer}
                      onClick={() => handlePrayerClick(prayer.id)}
                      currentUserId={user?.uid || null}
                    />
                  )}
                </React.Fragment>
              ))}
              
              {isLoading && page > 1 && (
                <div className="flex justify-center py-4">
                  <Spinner size="medium" variant="default" />
                </div>
              )}
              
              {!isLoading && hasMore && prayers.length > 0 && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreData}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    載入更多
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* 回應列表 */}
          {activeTab === 'responses' && (
            <div className="space-y-1">
              {isLoading && page === 1 && (
                <div className="flex justify-center py-8">
                  <Spinner size="medium" variant="default" />
                </div>
              )}
              
              {!isLoading && responses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  您還沒有回應過代禱
                </div>
              )}
              
              {responses.map((response) => (
                <React.Fragment key={response.id}>
                  {expandedPrayerId === response.prayer_id && response.prayer ? (
                    <div className="mb-2">
                      <PrayerPost
                        prayer={response.prayer}
                        onUpdate={() => {}}
                        isLoggedIn={!!user}
                        initialResponseCount={response.prayer.response_count || 0}
                      />
                    </div>
                  ) : (
                    <ResponseCard
                      response={response}
                      onClick={() => handleResponseClick(response.prayer_id)}
                    />
                  )}
                </React.Fragment>
              ))}
              
              {isLoading && page > 1 && (
                <div className="flex justify-center py-4">
                  <Spinner size="medium" variant="default" />
                </div>
              )}
              
              {!isLoading && hasMore && responses.length > 0 && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreData}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    載入更多
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* 「神已應允」列表 */}
          {activeTab === 'answered' && (
            <div className="space-y-1">
              {isLoading && page === 1 && (
                <div className="flex justify-center py-8">
                  <Spinner size="medium" variant="default" />
                </div>
              )}
              
              {!isLoading && answeredPrayers.length === 0 && answeredResponses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  您還沒有標記為「神已應允」的內容
                </div>
              )}
              
              {/* 顯示「神已應允」的代禱 */}
              {answeredPrayers.map((prayer) => (
                <React.Fragment key={`prayer-${prayer.id}`}>
                  {expandedPrayerId === prayer.id ? (
                    <div className="mb-2">
                      <PrayerPost
                        prayer={prayer}
                        onUpdate={() => {}}
                        isLoggedIn={!!user}
                        initialResponseCount={prayer.response_count || 0}
                      />
                    </div>
                  ) : (
                    <PrayerCard
                      prayer={prayer}
                      onClick={() => handlePrayerClick(prayer.id)}
                      currentUserId={user?.uid || null}
                    />
                  )}
                </React.Fragment>
              ))}
              
              {/* 顯示「神已應允」的回應 */}
              {answeredResponses.map((response) => (
                <React.Fragment key={`response-${response.id}`}>
                  {expandedPrayerId === response.prayer_id && response.prayer ? (
                    <div className="mb-2">
                      <PrayerPost
                        prayer={response.prayer}
                        onUpdate={() => {}}
                        isLoggedIn={!!user}
                        initialResponseCount={response.prayer.response_count || 0}
                      />
                    </div>
                  ) : (
                    <ResponseCard
                      response={response}
                      onClick={() => handleResponseClick(response.prayer_id)}
                    />
                  )}
                </React.Fragment>
              ))}
              
              {isLoading && page > 1 && (
                <div className="flex justify-center py-4">
                  <Spinner size="medium" variant="default" />
                </div>
              )}
              
              {!isLoading && hasMore && (answeredPrayers.length > 0 || answeredResponses.length > 0) && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreData}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    載入更多
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 