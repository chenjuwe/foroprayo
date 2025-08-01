import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MoreHorizontal, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserCheck, 
  Flag,
  CheckCircle
} from 'lucide-react';
import { usePrayerResponseLikes, useTogglePrayerResponseLike } from '../hooks/useSocialFeatures';
import { useDeletePrayerResponse } from '../hooks/usePrayerResponsesOptimized';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';
import { ReportDialog } from './ReportDialog';
import { useLocation } from 'react-router-dom';
import { useToggleResponseAnswered } from '../hooks/usePrayerAnswered';
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from './ui/menu';
import TwoLineEditIconSrc from '../assets/icons/TwoLineEditIcon.svg';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

// 定義 Like 對象類型
interface Like {
  id: string;
  user_id: string;
  response_id: string;
  created_at: string;
  [key: string]: unknown;
}

interface ResponseActionsProps {
  responseId: string;
  responseUserId: string;
  responseContent: string;
  responseUserName?: string;
  responseUserAvatar?: string;
  prayerId: string;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  className?: string;
}

export const ResponseActions: React.FC<ResponseActionsProps> = ({
  responseId,
  responseUserId,
  responseContent,
  responseUserName,
  responseUserAvatar,
  prayerId,
  isOwner = false,
  onEdit,
  onDelete,
  onShare,
  className = ""
}) => {
  const { currentUser } = useFirebaseAuth(); // 正確的 hook 調用
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const deleteResponseMutation = useDeletePrayerResponse();
  const toggleResponseAnsweredMutation = useToggleResponseAnswered();
  const location = useLocation();
  const isPrayersPage = location.pathname === '/prayers';

  // 愛心功能
  const { data: likes = [] } = usePrayerResponseLikes(responseId);
  const toggleLikeMutation = useTogglePrayerResponseLike();

  useEffect(() => {
    // 直接使用 currentUser，不需要在 useEffect 中調用 hook
    setCurrentUserId(currentUser?.uid || null);
  }, [currentUser]);

  // 檢查當前用戶是否已經按過愛心
  const userLike = currentUserId ? likes.find((like: Like) => like.user_id === currentUserId) : null;
  const isLiked = !!userLike;
  const likeCount = likes.length;

  const handleLike = () => {
    if (!currentUserId) {
      notify.warning('請先登入以使用愛心功能');
      return;
    }
    
    if (toggleLikeMutation.isPending) {
      return; // 正在處理中，避免重複點擊
    }
    
    log.debug('點擊回應愛心按鈕', { responseId, isLiked, likeId: userLike?.id }, 'ResponseActions');
    
    // 切換愛心狀態
    toggleLikeMutation.mutate({
      prayerId: responseId, // 使用 responseId 代替 prayerId
      isLiked,
      ...(userLike?.id ? { likeId: userLike.id } : {})
    });
    
    // 關閉菜單
    setMenuOpen(false);
  };

  const handleForward = () => {
    if (onShare) {
      onShare();
    } else {
      if (navigator.share) {
        navigator.share({
          title: '代禱回應分享',
          text: '來看看這個代禱回應',
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };

  const handleReport = () => {
    setIsReportDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      log.debug('刪除代禱回應', { responseId, prayerId }, 'ResponseActions');
      await deleteResponseMutation.mutateAsync({ id: responseId, prayerId });
      
      // 關閉對話框
      setIsDeleteDialogOpen(false);
      
      // 調用父組件的 onDelete 回調（如果有的話）
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      log.error('刪除代禱回應失敗', error, 'ResponseActions');
      notify.error('刪除回應失敗，請稍後再試');
    }
  };

  const handleMarkAsAnswered = async () => {
    try {
      log.debug('標記回應為「神已應允」', { responseId, prayerId }, 'ResponseActions');
      await toggleResponseAnsweredMutation.mutateAsync({ responseId, prayerId });
      
      // 關閉菜單
      setMenuOpen(false);
    } catch (error) {
      log.error('標記「神已應允」失敗', error, 'ResponseActions');
      notify.error('標記「神已應允」失敗，請稍後再試');
    }
  };

  return (
    <>
      <div style={{ 
        transform: `translateX(5px) translateY(${isPrayersPage ? '1px' : '1px'})` 
      }}>
        <Menu isOpen={menuOpen} onOpenChange={setMenuOpen}>
          <MenuTrigger>
            <button
              className={`cursor-pointer transition-opacity ${className}`}
              aria-label="更多選項"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <img
                src={TwoLineEditIconSrc}
                alt="編輯選項"
                width="20"
                height="20"
                style={{
                  display: 'block',
                  width: '20px',
                  height: '20px'
                }}
              />
            </button>
          </MenuTrigger>
          <MenuContent
            align="end"
            className="bg-white z-40 rounded-none shadow-around py-2 min-w-[140px]"
          >
            {isOwner && (
              <>
                {/* 新增「神已應允」選項 */}
                <MenuItem 
                  onClick={handleMarkAsAnswered}
                  className="flex items-center gap-2 px-4 py-2 w-full text-[#FF8FAB] hover:bg-[#FFE6EC] cursor-pointer"
                  disabled={toggleResponseAnsweredMutation.isPending}
                >
                  {/* 十字架SVG */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ml-[-2px]" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10.25" y="3" width="3.5" height="18" rx="1.75" fill="#FF8FAB"/>
                    <rect x="3" y="10.25" width="18" height="3.5" rx="1.75" fill="#FF8FAB"/>
                  </svg>
                  {toggleResponseAnsweredMutation.isPending ? '處理中...' : '神已應允'}
                </MenuItem>
                <MenuItem onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 w-full">
                  <Edit size={14} />
                  編輯
                </MenuItem>
                <MenuItem 
                  onClick={handleDeleteClick} 
                  className="flex items-center gap-2 px-4 py-2 w-full text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                  刪除
                </MenuItem>
                <MenuSeparator />
              </>
            )}
            {/* 新增愛心選項 */}
            <MenuItem 
              onClick={handleLike} 
              className="flex items-center gap-2 px-4 py-2 w-full"
            >
              <Heart size={14} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
              {isLiked ? '取消愛心' : '給愛心'}
              {likeCount > 0 && <span className="text-xs text-gray-500 ml-1">({likeCount})</span>}
            </MenuItem>
            <MenuItem onClick={handleForward} className="flex items-center gap-2 px-4 py-2 w-full">
              轉寄
            </MenuItem>
            <MenuSeparator />
            <MenuItem 
              onClick={handleReport} 
              className="flex items-center gap-2 px-4 py-2 w-full text-red-600 hover:text-red-700"
            >
              <Flag size={14} />
              檢舉不當發言
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這則回應嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後回應將永久消失！
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              style={{ backgroundColor: '#dc2626', color: 'white' }}
            >
              {deleteResponseMutation.isPending ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isReportDialogOpen && (
        <ReportDialog
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          reportType="response"
          targetId={responseId}
          targetContent={responseContent}
          targetUserId={responseUserId}
          {...(responseUserName && { targetUserName: responseUserName })}
          {...(responseUserAvatar && { targetUserAvatar: responseUserAvatar })}
        />
      )}
    </>
  );
}; 