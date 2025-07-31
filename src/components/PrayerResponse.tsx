import React, { useState, useRef, useEffect } from 'react';
import { Separator } from './ui/separator';
import UserInfo from './UserInfo'; // 修正導入方式
import { ResponseActions } from './ResponseActions';
import type { PrayerResponse as PrayerResponseType } from '@/services/prayerService';
import { log } from '@/lib/logger';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { superAdminService } from '@/services';
import { toast } from 'sonner';
import { usePrayerResponseLikes, useTogglePrayerResponseLike } from '../hooks/useSocialFeatures';
// import { supabase } from '../integrations/supabase/client';
import { getUnifiedUserName } from '@/lib/getUnifiedUserName';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { useLocation } from 'react-router-dom';

// 定義 Like 對象類型
interface Like {
  id: string;
  user_id: string;
  response_id: string;
  created_at: string;
  [key: string]: unknown;
}

interface PrayerResponseProps {
  response: PrayerResponseType;
  currentUserId: string | null;
  isSuperAdmin?: boolean;
  onShare?: () => void;
  onEdit?: (responseId: string) => void;
  onDelete?: (responseId: string) => void;
  isFirst?: boolean; // 添加是否為第一個回應的標記
}

const PrayerResponseComponent: React.FC<PrayerResponseProps> = ({
  response,
  currentUserId,
  isSuperAdmin = false,
  onShare,
  onEdit,
  onDelete,
  isFirst = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isLong, setIsLong] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient(); // 獲取 queryClient 實例
  const location = useLocation();
  const isPrayersPage = location.pathname === '/prayers';
  
  // 設定最大行數和行高
  const lineHeight = 24; // 根據實際行高進行調整，單位為像素
  const maxLines = 6; // 回應內容行數限制可以比主文章少一些
  const maxHeight = lineHeight * maxLines;

  // 使用 useEffect 檢測內容是否過長
  useEffect(() => {
    if (contentRef.current) {
      // 檢查內容高度是否超過最大高度
      const isContentLong = contentRef.current.scrollHeight > maxHeight;
      setIsLong(isContentLong);
      log.debug('Response content height check', { 
        scrollHeight: contentRef.current.scrollHeight, 
        maxHeight,
        isLong: isContentLong
      }, 'PrayerResponse');
    }
  }, [response.content, maxHeight]);

  const displayName = response.user_name || '訪客';

  // 啟用回應愛心功能
  const { data: likes = [] } = usePrayerResponseLikes(response.id);
  const toggleLikeMutation = useTogglePrayerResponseLike();
  
  // 檢查當前用戶是否已經按過愛心
  const userLike = currentUserId 
    ? likes.find((like: Like) => like.user_id === currentUserId)
    : null;
  
  const isLiked = !!userLike;
  const likeCount = likes.length;

  const handleLikeClick = () => {
    if (!currentUserId) {
      log.debug('用戶未登入，無法按愛心', {}, 'PrayerResponse');
      return;
    }
    
    if (toggleLikeMutation.isPending) {
      return; // 正在處理中，避免重複點擊
    }
    
    log.debug('點擊回應愛心按鈕', { responseId: response.id, isLiked, likeId: userLike?.id }, 'PrayerResponse');
    
    // 切換愛心狀態
    toggleLikeMutation.mutate({
      responseId: response.id, // 使用 responseId
      isLiked,
      ...(userLike?.id ? { likeId: userLike.id } : {})
    });
  };

  // 超級管理員刪除回應
  const handleSuperAdminDelete = async () => {
    if (!isSuperAdmin) return;
    
    setIsDeleting(true);
    try {
      // 修正：通過 getInstance() 獲取實例並調用方法
      await superAdminService.getInstance().deletePrayerResponse(response.id);
      toast.success('已刪除不當回應內容');
      
      // 使相關查詢失效，觸發重新獲取
      if (response.prayer_id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.PRAYER_RESPONSES(response.prayer_id)
        });
      } else {
        // 如果沒有特定的prayer_id，可能需要失效更廣泛的查詢
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.PRAYERS
        });
      }
      
      // 仍然調用 onDelete 保持向後兼容
      if (onDelete) {
        onDelete(response.id);
      }
    } catch (error) {
      console.error('超級管理員刪除回應失敗:', error);
      toast.error('刪除回應失敗');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className={`${(isFirst ? 'mt-0 pt-0 ' : '') + 'relative'} ${
      response.is_answered ? '!bg-pink-50' : ''
    }`} style={{ marginTop: 0, paddingTop: 0 }}>
      <Separator className="mb-4" />
      {/* 刪除按鈕：超級管理員可見，右上角固定位置 */}
      {isSuperAdmin && (
        <div className="absolute z-10" style={{ right: '-8px', top: '43px' }}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setIsDeleteDialogOpen(true)}
            title="超級管理員刪除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <div className="flex w-full justify-between gap-4 items-start">
        <UserInfo
          isAnonymous={response.is_anonymous || false}
          userName={displayName || ''}
          userAvatarUrl={response.user_avatar || ''} // 修正屬性名稱
          userId={response.user_id || ''}
          createdAt={response.created_at}
          // isOwner 和 currentUserId 在 UserInfo 內部已不再需要
        />
        <div className="flex items-center">
          {/* 回應愛心按鈕 */}
          <button
            onClick={handleLikeClick}
            className="flex items-center gap-1 p-2 rounded-full cursor-pointer mr-2"
            aria-label={isLiked ? "取消愛心" : "給愛心"}
            style={{ position: 'relative', top: isPrayersPage ? '-3px' : '1px', left: isPrayersPage ? '-3px' : '2px', zIndex: 10 }}
            disabled={!currentUserId || toggleLikeMutation.isPending}
          >
            {likeCount > 0 && (
              <span className="text-xs text-gray-600">{likeCount}</span>
            )}
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isLiked ? "#EA0000" : "#D0D0D0"} stroke={isLiked ? "#EA0000" : "#D0D0D0"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <div className="relative" style={{ width: '40px', height: '32px' }}>
            <div className="absolute" style={{ right: '2px', top: isPrayersPage ? '1px' : '-2px' }}>
              <ResponseActions
                responseId={response.id}
                responseUserId={response.user_id || ''}
                responseContent={response.content}
                responseUserName={displayName || ''}
                responseUserAvatar={response.user_avatar || ''}
                prayerId={response.prayer_id || ''}
                isOwner={currentUserId === response.user_id}
                onShare={onShare || (() => {})}
                onEdit={() => onEdit?.(response.id)}
                onDelete={() => onDelete?.(response.id)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="text-sm text-black font-normal leading-6 md:leading-7 mt-4 md:mt-4 mb-4 text-left">
        <div 
          ref={contentRef}
          className="whitespace-pre-wrap break-words text-left relative"
          style={{ 
            maxHeight: expanded ? 'none' : `${maxHeight}px`,
            overflow: expanded ? 'visible' : 'hidden'
          }}
        >
          {response.content}
          {/* 如果內容被截斷且未展開，添加漸變遮罩 */}
          {!expanded && isLong && (
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent"></div>
          )}
        </div>
        
        {/* 顯示圖片 - 使用與發布卡片相同的樣式 */}
        {response.image_url && (
          <div className="my-2 flex justify-center">
            <img
              src={response.image_url}
              alt="回應圖片"
              style={{ width: '100%', maxWidth: '100%', height: 'auto' }}
              loading="lazy"
              onError={(e) => {
                console.error('圖片載入失敗:', response.image_url);
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.insertAdjacentHTML(
                  'beforeend', 
                  '<div class="text-xs text-gray-500 p-2 border border-gray-200 rounded">圖片載入失敗</div>'
                );
              }}
            />
          </div>
        )}
        
        {isLong && !expanded && (
          <button
            className="text-blue-500 hover:text-blue-700 text-sm mt-2 underline"
            onClick={() => setExpanded(true)}
          >
            看更多
          </button>
        )}
        
        {isLong && expanded && (
          <button
            className="text-gray-500 hover:text-gray-700 text-sm mt-2 underline"
            onClick={() => setExpanded(false)}
          >
            收起
          </button>
        )}
      </div>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此回應？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作將永久刪除此回應內容，無法恢復。
              <div className="mt-2 p-3 bg-gray-100 rounded text-sm">
                {response.content.substring(0, 100)}{response.content.length > 100 ? '...' : ''}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuperAdminDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? '刪除中...' : '確認刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const PrayerResponse = React.memo(PrayerResponseComponent);
