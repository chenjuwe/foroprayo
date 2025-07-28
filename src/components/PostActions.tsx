import React, { useState } from 'react';
import { Edit, Forward, Bookmark, Trash2, Heart, Flag } from 'lucide-react';
import TwoLineEditIconSrc from '../assets/icons/TwoLineEditIcon.svg';
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from './ui/menu';
// import { useTogglePrayerBookmark, usePrayerLikes, useTogglePrayerLike, useSendFriendRequest, useToggleFollow } from '../hooks/useSocialFeatures';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

import { Button } from './ui/button';
import { ReportDialog } from './ReportDialog';
import { useDeletePrayer } from '../hooks/usePrayersOptimized';
import { useTogglePrayerAnswered } from '../hooks/usePrayerAnswered';
import { notify } from '@/lib/notifications';
import { log } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface PostActionsProps {
  prayerId: string;
  prayerUserId: string;
  prayerContent: string;
  prayerUserName?: string;
  prayerUserAvatar?: string;
  isOwner?: boolean;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  onShare?: (() => void) | undefined;
  className?: string;
}

export const PostActions: React.FC<PostActionsProps> = ({
  prayerId,
  prayerUserId,
  prayerContent,
  prayerUserName,
  prayerUserAvatar,
  isOwner = false,
  onEdit,
  onDelete,
  onShare,
  className = ""
}) => {
  // 暫時停用社交功能
  const toggleBookmarkMutation = { mutate: () => {}, isPending: false };
  const toggleLikeMutation = { mutate: () => {}, isPending: false };
  const sendFriendRequestMutation = { mutate: () => {}, isPending: false };
  const toggleFollowMutation = { mutate: () => {}, isPending: false };
  const likes: any[] = [];
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deletePrayerMutation = useDeletePrayer();
  const togglePrayerAnsweredMutation = useTogglePrayerAnswered();
  const [menuOpen, setMenuOpen] = useState(false); // 新增菜單開關狀態
  
  // 在組件頂層調用 useFirebaseAuth
  const { currentUser } = useFirebaseAuth();
  const currentUserId = currentUser?.uid || null;

  React.useEffect(() => {
    if (!currentUser) {
      setIsBookmarked(false);
      return;
    }
    
    // 檢查書籤狀態 - 使用 Firebase 查詢
    // 這裡需要實現 Firebase 版本的書籤檢查
    // 暫時設為 false，後續可以實現
    setIsBookmarked(false);
  }, [currentUser, prayerId]);

  const isLiked = currentUserId ? likes.some((like: any) => like.user_id && like.user_id === currentUserId) : false;
  const likeCount = likes.length;

  const handleBookmark = () => {
    if (!currentUserId) return;
    
    // 暫時停用書籤功能
    setIsBookmarked(!isBookmarked);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('❤️ 愛心按鈕被點擊', { currentUserId, prayerId, isLiked, isPending: toggleLikeMutation.isPending });
    
    if (!currentUserId) {
      console.log('❌ 使用者未登入，無法按愛心');
      // 可以在這裡顯示登入提示
      return;
    }
    
    if (toggleLikeMutation.isPending) {
      console.log('⏳ 愛心操作進行中，請稍候');
      return;
    }
    
    console.log('✅ 執行愛心切換', { prayerId, isLiked });
    // 暫時停用愛心功能
  };

  const handleForward = () => {
    if (onShare) {
      onShare();
    } else {
      if (navigator.share) {
        navigator.share({
          title: '代禱分享',
          text: '來看看這個代禱',
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

  const handleAddFriend = () => {
    if (!currentUserId) return;
    // 暫時停用好友請求功能
  };

  const handleFollow = () => {
    if (!currentUserId) return;
    // 暫時停用追蹤功能
  };

  const handleReport = () => {
    setIsReportDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setMenuOpen(false); // 先關閉菜單
    setTimeout(() => setIsDeleteDialogOpen(true), 50); // 再開啟刪除對話框，延遲避免動畫衝突
  };

  const handleDeleteConfirm = async () => {
    try {
      log.debug('刪除代禱', { prayerId }, 'PostActions');
      await deletePrayerMutation.mutateAsync(prayerId);
      
      // 關閉對話框
      setIsDeleteDialogOpen(false);
      
      // 調用父組件的 onDelete 回調（如果有的話）
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      log.error('刪除代禱失敗', error, 'PostActions');
      notify.error('刪除代禱失敗，請稍後再試');
    }
  };

  const handleMarkAsAnswered = async () => {
    try {
      log.debug('標記代禱為「神已應允」', { prayerId }, 'PostActions');
      await togglePrayerAnsweredMutation.mutateAsync(prayerId);
      
      // 關閉菜單
      setMenuOpen(false);
    } catch (error) {
      log.error('標記「神已應允」失敗', error, 'PostActions');
      notify.error('標記「神已應允」失敗，請稍後再試');
    }
  };

  return (
    <>
      <div style={{ transform: 'translateX(5px) translateY(1px)' }}>
        <Menu isOpen={menuOpen} onOpenChange={setMenuOpen}>
          <MenuTrigger>
            <button
              className={`p-1 transition-colors ${className}`}
              aria-label="更多選項"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setMenuOpen((v) => !v)} // 控制菜單開關
            >
              <img 
                src={TwoLineEditIconSrc} 
                alt="編輯選項" 
                width="14" 
                height="14" 
                className="text-prayfor" 
                style={{ 
                  display: 'block',
                  imageRendering: 'crisp-edges',
                  transform: 'translateZ(0)',
                  filter: 'invert(55%) sepia(88%) saturate(1488%) hue-rotate(170deg) brightness(91%) contrast(91%)'
                }}
              />
            </button>
          </MenuTrigger>
          <MenuContent isOpen={menuOpen} onClose={() => setMenuOpen(false)}
            align="end"
            className="bg-white z-40 rounded-none shadow-around py-2 min-w-[140px]"
          >
            {currentUserId && isOwner && (
              <>
                {/* 新增「神已應允」選項 */}
                <MenuItem 
                  onClick={handleMarkAsAnswered}
                  className="flex items-center gap-2 px-4 py-2 w-full text-[#FF8FAB] hover:bg-[#FFE6EC] cursor-pointer"
                  disabled={togglePrayerAnsweredMutation.isPending}
                >
                  {/* 十字架SVG */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ml-[-2px]" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10.25" y="3" width="3.5" height="18" rx="1.75" fill="#FF8FAB"/>
                    <rect x="3" y="10.25" width="18" height="3.5" rx="1.75" fill="#FF8FAB"/>
                  </svg>
                  {togglePrayerAnsweredMutation.isPending ? '處理中...' : '神已應允'}
                </MenuItem>
                <MenuItem onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 w-full">
                  <Edit size={14} />
                  編輯
                </MenuItem>
                <MenuSeparator />
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
            <MenuItem onClick={handleForward} className="flex items-center gap-2 px-4 py-2 w-full">
              <Forward size={14} />
              轉寄
            </MenuItem>
            <MenuItem onClick={handleBookmark} className="flex items-center gap-2 px-4 py-2 w-full">
              <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} />
              {isBookmarked ? '取消收藏' : '收藏'}
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
            <AlertDialogTitle className="text-[#e53935] mt-[30px]">確定要刪除這則代禱嗎？</AlertDialogTitle>
            <AlertDialogDescription style={{ marginTop: '24px', textAlign: 'center' }}>
              刪除後代禱與所有回覆將永久消失！
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              {deletePrayerMutation.isPending ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        reportType="prayer"
        targetId={prayerId}
        targetContent={prayerContent}
        targetUserId={prayerUserId}
        targetUserName={prayerUserName || ''}
        targetUserAvatar={prayerUserAvatar || ''}
      />
    </>
  );
};
