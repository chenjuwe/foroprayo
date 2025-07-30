import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "./ui/card";
import { PrayerContent } from "./PrayerContent";
import { PrayerResponseList } from "./PrayerResponseList";
import { PrayerForm } from "./PrayerForm";
import { auth } from "@/integrations/firebase/client";
import { useFirebaseAvatar } from "@/hooks/useFirebaseAvatar";
import { useCreatePrayerResponse, usePrayerResponses } from "@/hooks/usePrayerResponsesOptimized";
import { toast } from "sonner";
import { log } from "@/lib/logger";
import { Trash2 } from "lucide-react";
import { superAdminService } from "@/services";
import { QUERY_KEYS } from "@/constants";
import { useQueryClient } from "@tanstack/react-query";
import type { CreateResponseRequest, Prayer, BaptismPost, JourneyPost, MiraclePost } from "@/types/prayer";
import UserInfo from "./UserInfo"; // 修正導入方式
import { LikeButton } from "./LikeButton";
import { PostActionButtons } from "./PostActionButtons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PostType = Prayer | BaptismPost | JourneyPost | MiraclePost;

interface PrayerPostProps {
  prayer: PostType;
  onUpdate: () => void;
  isLoggedIn: boolean;
  initialResponseCount: number;
  onDeleted?: (prayerId: string) => void; // 添加新的回調屬性
}

// 建立一個新的子元件來處理回應區塊的邏輯
// 這樣，獲取回應的 usePrayerResponses Hook 只會在需要時（即此元件被渲染時）才被調用
const ResponseSection = ({ prayerId, currentUserId, isSuperAdmin, isLoggedIn, isAnswered, onResponseAdded }: { prayerId: string; currentUserId: string | null; isSuperAdmin: boolean; isLoggedIn: boolean; isAnswered: boolean; onResponseAdded?: () => void; }) => {
  const [responseText, setResponseText] = useState('');
  const [isResponseAnonymous, setIsResponseAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined); // 添加圖片URL狀態
  
  // 使用 usePrayerResponses 鉤子獲取回應數據
  const { data: responses = [], isLoading: isResponsesLoading, refetch: refetchResponses } = usePrayerResponses(prayerId);
  
  // 添加一個狀態來控制內容顯示，避免骨架屏幕閃爍
  const [showContent, setShowContent] = useState(false);
  
  // 當數據加載完成後，延遲顯示內容
  useEffect(() => {
    if (!isResponsesLoading && responses) {
      // 立即顯示內容，不使用延遲
      setShowContent(true);
    }
  }, [isResponsesLoading, responses]);
  
  // 使用 useFirebaseAvatar 獲取當前用戶頭像
  const { avatarUrl48, refreshAvatar } = useFirebaseAvatar();
  
  // 獲取當前用戶名稱和頭像
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // 檢查是否為訪客模式
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  // 在組件載入時檢查訪客模式
  useEffect(() => {
    const checkGuestMode = () => {
      const guestMode = localStorage.getItem('guestMode') === 'true';
      setIsGuestMode(guestMode);
      
      // 如果是訪客模式，強制設置匿名
      if (guestMode) {
        setIsResponseAnonymous(true);
      }
      
      log.debug('ResponseSection 檢查訪客模式', { 
        guestMode,
        isLoggedIn,
        currentUserId
      }, 'PrayerPost.ResponseSection');
      
      return guestMode;
    };
    
    // 立即檢查訪客模式
    checkGuestMode();
    
    // 添加存儲事件監聽器，處理其他標籤頁或窗口的變更
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'guestMode') {
        checkGuestMode();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isLoggedIn, currentUserId]);
  
  // 添加對全局頭像更新事件的監聽
  useEffect(() => {
    const handleAvatarUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      log.debug('PrayerPost 檢測到頭像更新事件', customEvent.detail, 'PrayerPost.ResponseSection');
      
      if (currentUserId) {
        // 立即刷新頭像
        refreshAvatar();
        
        // 重新獲取用戶信息
        const fetchUser = async () => {
          const user = auth().currentUser;
          if (user) {
            setCurrentUserName(user.displayName || user.email?.split('@')[0] || 'User');
            // 優先使用 48x48 像素的頭像
            setAvatarUrl(avatarUrl48 || user.photoURL);
          }
        };
        
        fetchUser();
      }
    };
    
    // 添加事件監聽
    window.addEventListener('avatar-updated', handleAvatarUpdated);
    
    // 清理函數
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdated);
    };
  }, [currentUserId, avatarUrl48, refreshAvatar]);
  
  // 在組件載入時和登入狀態變化時重置用戶資訊
  useEffect(() => {
    // 如果是訪客模式，設置訪客信息
    if (isGuestMode) {
      setCurrentUserName('訪客');
      setAvatarUrl(null);
      setIsResponseAnonymous(true); // 訪客模式強制匿名
      return;
    }
    
    // 如果未登入，清除用戶名稱和頭像
    if (!isLoggedIn) {
      setCurrentUserName(null);
      setAvatarUrl(null);
      return;
    }
    
    const fetchUser = async () => {
      try {
        const user = auth().currentUser;
        if (user) {
          setCurrentUserName(user.displayName || user.email?.split('@')[0] || 'User');
          setAvatarUrl(avatarUrl48 || user.photoURL);
          
          log.debug('ResponseSection 獲取用戶信息', { 
            name: user.displayName, 
            email: user.email,
            photoURL: user.photoURL,
            avatarUrl48
          }, 'PrayerPost.ResponseSection');
        }
      } catch (error) {
        log.error('獲取用戶信息失敗', { error }, 'PrayerPost.ResponseSection');
      }
    };
    
    fetchUser();
  }, [isLoggedIn, avatarUrl48, isGuestMode]);
  
  const addPrayerResponseMutation = useCreatePrayerResponse();

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('提交回應', { responseText, currentUserId, isLoggedIn, isGuestMode, imageUrl, prayerId });
    
    // 檢查回應內容是否為空
    if (!responseText.trim()) {
      toast.error('回應內容不能為空');
      return;
    }
    
    // 檢查 prayerId 格式，確保它是有效的
    if (!prayerId || typeof prayerId !== 'string' || prayerId.trim() === '') {
      console.error('無效的代禱 ID', { prayerId });
      toast.error('無效的代禱 ID，無法提交回應');
      return;
    }

    console.log('開始提交回應');
    
    // 確保圖片 URL 格式正確
    let processedImageUrl = imageUrl;
    if (processedImageUrl && !processedImageUrl.startsWith('http')) {
      // 如果不是以 http 開頭，可能是相對路徑，確保格式正確
      processedImageUrl = processedImageUrl.startsWith('/') 
        ? processedImageUrl 
        : `/${processedImageUrl}`;
    }
    
    // 構建回應請求對象
    const responseRequest: CreateResponseRequest = {
      prayer_id: prayerId.trim(), // 確保移除空白
      content: responseText,
      // 訪客模式或未登入用戶強制匿名
      is_anonymous: isGuestMode || !isLoggedIn || isResponseAnonymous,
      image_url: processedImageUrl || null,
    };
    
    // 如果是登入用戶且非訪客模式，添加用戶信息
    if (isLoggedIn && !isGuestMode && currentUserId) {
      responseRequest.user_id = currentUserId;
      responseRequest.user_name = currentUserName || 'User';
      responseRequest.user_avatar = avatarUrl;
    } else {
      // 訪客模式或未登入用戶
      responseRequest.user_id = null;
      responseRequest.user_name = '訪客';
      responseRequest.user_avatar = null;
    }
    
    // 在請求中添加訪客模式標記，方便服務層處理
    (responseRequest as any).isGuestMode = isGuestMode;
    
    log.debug('提交回應請求', {
      ...responseRequest,
      content: responseRequest.content.substring(0, 20) + '...',
      prayerId: responseRequest.prayer_id,
      isGuestMode,
      isAnonymous: responseRequest.is_anonymous
    }, 'PrayerPost.ResponseSection');
    
    // 在訪客模式下，先顯示加載提示
    if (isGuestMode) {
      toast.loading('正在發送回應...');
    }
    
    // 使用 setTimeout 確保在訪客模式下有足夠時間處理
    setTimeout(() => {
      addPrayerResponseMutation.mutate(responseRequest, {
        onSuccess: () => {
          console.log('回應提交成功');
          setResponseText("");
          setIsResponseAnonymous(isGuestMode); // 保持訪客模式匿名狀態
          setImageUrl(undefined); // 重置圖片URL
          toast.success('回應已發布');
          
          // 重新獲取回應列表
          refetchResponses();
          
          // 調用父組件的回調函數，通知回應已添加
          if (onResponseAdded) {
            onResponseAdded();
          }
          
          log.debug('回應提交成功', { 
            prayerId, 
            isGuestMode,
            isAnonymous: responseRequest.is_anonymous
          }, 'PrayerPost.ResponseSection');
        },
        onError: (error) => {
          console.error('回應提交失敗', error);
          log.error("Failed to submit response", { 
            error, 
            isGuestMode, 
            prayerId,
            responseLength: responseText.length,
            errorMessage: error instanceof Error ? error.message : String(error)
          }, "PrayerPost.ResponseSection");
          
          // 顯示更詳細的錯誤訊息
          const errorMessage = error instanceof Error ? error.message : '未知錯誤';
          
          if (errorMessage.includes('權限不足') || errorMessage.includes('permission')) {
            toast.error('回應發布失敗：訪客模式下暫時無法發布回應，請嘗試登入後再試');
          } else {
            toast.error('回應發布失敗：' + errorMessage);
          }
        }
      });
    }, isGuestMode ? 300 : 0); // 訪客模式下延遲 300ms，確保 localStorage 已更新
  };

  return (
    <div style={{ marginTop: '16px', paddingTop: '0' }}>
      {/* 只在數據載入完成後顯示回應列表 */}
      {showContent && responses.length > 0 && (
        <PrayerResponseList
          responses={responses}
          currentUserId={currentUserId}
          isSuperAdmin={isSuperAdmin}
          prayerId={prayerId}
        />
      )}
      <PrayerForm
        prayerText={responseText}
        isAnonymous={isGuestMode ? true : isResponseAnonymous} // 訪客模式強制匿名
        isLoggedIn={isLoggedIn || isGuestMode} // 訪客模式視為登入狀態以顯示表單
        onTextChange={setResponseText}
        onAnonymousChange={(value) => {
          // 訪客模式下不允許改變匿名狀態
          if (!isGuestMode) {
            setIsResponseAnonymous(value);
          }
        }}
        onSubmit={handleResponseSubmit}
        isSubmitting={addPrayerResponseMutation.isPending}
        placeholder="寫下你的回應與代禱..."
        imageUrl={imageUrl} // 添加圖片URL屬性
        setImageUrl={setImageUrl} // 添加設置圖片URL方法
        isAnswered={isAnswered} // 傳遞神已應允狀態
        variant="response" // 添加 variant 屬性，指定為回應卡片
      />
    </div>
  );
};

const PrayerPost = ({ prayer, onUpdate, isLoggedIn, initialResponseCount, onDeleted }: PrayerPostProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isResponseSectionVisible, setResponseSectionVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient(); // 獲取 queryClient 實例
  
  // 本地回應計數狀態
  const [responseCount, setResponseCount] = useState(initialResponseCount);
  
  // 處理回應添加成功的回調
  const handleResponseAdded = useCallback(() => {
    // 增加本地回應計數
    setResponseCount(prev => prev + 1);
    
    // 通知父組件更新
    onUpdate();
    
    log.debug('回應添加成功，更新計數', { 
      prayerId: prayer.id, 
      newCount: responseCount + 1 
    }, 'PrayerPost');
  }, [prayer.id, responseCount, onUpdate]);
  
  // 使用 useEffect 監聽回應數據變化
  useEffect(() => {
    const responseKey = QUERY_KEYS.PRAYER_RESPONSES(prayer.id);
    
    // 初始化時獲取當前回應數量
    const currentResponses = queryClient.getQueryData<any[]>(responseKey);
    if (currentResponses) {
      setResponseCount(currentResponses.length);
    }
    
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // 檢查是否是該代禱的回應查詢發生了變化
      if (event.query.queryKey[0] === responseKey[0] && 
          event.query.queryKey[1] === responseKey[1] && 
          event.type === 'updated') {
        // 獲取最新的回應數據
        const responses = queryClient.getQueryData<any[]>(responseKey);
        if (responses !== undefined) {
          // 更新本地回應數量
          setResponseCount(responses.length);
          
          log.debug('檢測到回應數據變化', { 
            prayerId: prayer.id, 
            newCount: responses.length 
          }, 'PrayerPost');
        }
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [prayer.id, queryClient]);
  
  // 我們不再在這裡直接呼叫 usePrayerResponses

  useEffect(() => {
    const fetchUserAndCheckAdmin = async () => {
      const user = auth().currentUser;
      const id = user?.uid || null;
      setCurrentUserId(id);
      
      if (id) {
        try {
          const isAdmin = await superAdminService.getInstance().isSuperAdmin();
          setIsSuperAdmin(isAdmin);
        } catch (error) {
          log.error('檢查超級管理員狀態失敗', { error }, 'PrayerPost');
        }
      }
    };
    
    fetchUserAndCheckAdmin();
  }, []);

  // 監聽編輯狀態變化
  useEffect(() => {
    if (isEditing) {
      setResponseSectionVisible(false);
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditEnd = () => {
    setIsEditing(false);
    onUpdate();
  };

  const handleSuperAdminDelete = async () => {
    if (!isSuperAdmin) return;
    
    setIsDeleting(true);
    try {
      // 使用超級管理員服務刪除代禱
      await superAdminService.getInstance().deletePrayer(prayer.id);
      
      // 關閉對話框
      setIsDeleteDialogOpen(false);
      
      // 通知父組件刪除成功
      if (onDeleted) {
        onDeleted(prayer.id);
      }
      
      toast.success('代禱已刪除');
    } catch (error) {
      console.error('刪除代禱失敗:', error);
      toast.error('刪除失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="rounded-none border-none prayer-card layout-stable min-h-[100px] w-[358px] flex-shrink-0 overflow-visible relative" data-testid="prayer-post">
      <CardContent className="px-[16px] pt-[16px] pb-[12px] overflow-visible">
        {/* 使用 UserInfo 組件替代 PrayerHeader */}
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex-shrink-0 min-w-fit">
            <UserInfo
              isAnonymous={prayer.is_anonymous || false}
              userName={prayer.user_name || '訪客'}
              userAvatarUrl={prayer.user_avatar_48 || prayer.user_avatar || ''} // 修正屬性名稱
              userId={prayer.user_id || ''}
              createdAt={prayer.created_at}
              // isOwner, currentUserId, showActions 在 UserInfo 內部已不再需要
            />
          </div>
          <div className="flex items-center ml-auto flex-shrink-0">
            <div style={{ transform: 'translateY(-2px)' }}>
              <LikeButton prayerId={prayer.id} currentUserId={currentUserId} />
            </div>
            <div className="relative right-[4px]">
              <PostActionButtons
                postId={prayer.id}
                prayerUserId={prayer.user_id || ''}
                prayerContent={prayer.content || ''}
                prayerUserName={prayer.user_name || '訪客'}
                prayerUserAvatar={prayer.user_avatar || ''}
                isOwner={currentUserId === prayer.user_id}
                onEdit={handleEdit}
                onDelete={() => setIsDeleteDialogOpen(true)}
              />
            </div>
          </div>
        </div>
        
        {isSuperAdmin && (
          <div className="absolute top-[35px] right-[6px] z-10" style={{ right: '6px' }}>
            <div
              className="flex items-center gap-2 px-4 py-2 w-full text-red-600 hover:text-red-700 cursor-pointer"
              style={{ borderRadius: 0 }}
              onClick={() => setIsDeleteDialogOpen(true)}
              title="超級管理員刪除"
            >
              <Trash2 size={14} style={{ marginLeft: '3px' }} />
            </div>
          </div>
        )}
        
        <PrayerContent
          prayer={prayer}
          currentUserId={currentUserId}
          onEdit={handleEdit}
          onEditEnd={handleEditEnd}
        />
        {/* 圖片顯示區塊 */}
        {prayer.image_url && (
          <div className="my-2 flex justify-center">
            <img
              src={prayer.image_url}
              alt="祈禱卡片圖片"
              style={{ width: '100%', maxWidth: '100%', height: 'auto' }}
            />
          </div>
        )}
        {/* 用戶名稱顯示區塊 */}
        {/* <div className="mt-2 text-sm font-semibold text-gray-900">
          {prayer.user_name || '訪客'}
        </div> */}
        {!isEditing && (
          <div className="mt-3 text-left">
            {/* 切換按鈕 - 減小按鈕的padding */}
            <button
              onClick={() => setResponseSectionVisible(!isResponseSectionVisible)}
              className={`text-sm focus:outline-none ${
                prayer.is_answered 
                  ? 'text-pink-400 hover:text-pink-500' 
                  : 'text-[#1694da] hover:text-[#1694da]'
              }`}
              style={{ 
                outline: 'none', 
                border: 'none', 
                padding: '0', 
                marginBottom: '0',
                height: 'auto',
                lineHeight: '1.5'
              }}
              aria-expanded={isResponseSectionVisible}
            >
              {isResponseSectionVisible
                ? `收合 ${responseCount} 則代禱回應`
                : responseCount > 0
                  ? `查看 ${responseCount} 則代禱回應`
                  : '寫下你的代禱與回應'}
            </button>

            {/* 動態載入區塊 - 精確控制上方間距 */}
            {isResponseSectionVisible && (
              <ResponseSection 
                prayerId={prayer.id}
                currentUserId={currentUserId}
                isSuperAdmin={isSuperAdmin}
                isLoggedIn={isLoggedIn}
                isAnswered={prayer.is_answered || false}
                onResponseAdded={handleResponseAdded}
              />
            )}
          </div>
        )}
      </CardContent>
      
      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#e53935] mt-[30px]">確定要刪除這則代禱嗎？</AlertDialogTitle>
            <AlertDialogDescription style={{ marginTop: '24px', textAlign: 'center' }}>
              刪除後代禱與所有回覆將永久消失！
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuperAdminDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
              disabled={isDeleting}
            >
              {isDeleting ? '刪除中...' : '確認刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PrayerPost;