import React, { useState, useEffect } from 'react';
import { Edit, Forward, Trash2, Flag } from 'lucide-react';
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from './ui/menu';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';

import { ReportDialog } from './ReportDialog';
import { useDeletePrayerResponse } from '../hooks/usePrayerResponsesOptimized';
import { useToggleResponseAnswered } from '../hooks/usePrayerAnswered';
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
import TwoLineEditIconSrc from '../assets/icons/TwoLineEditIcon.svg';

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

  useEffect(() => {
    // 直接使用 currentUser，不需要在 useEffect 中調用 hook
    setCurrentUserId(currentUser?.uid || null);
  }, [currentUser]);

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
      <div className="flex items-center gap-2" style={{ transform: 'translateX(5px) translateY(1px)' }}>
        <Menu isOpen={menuOpen} onOpenChange={setMenuOpen}>
          <MenuTrigger>
            <button
              className={`p-1 transition-colors ${className}`}
              aria-label="更多選項"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <img
                src={TwoLineEditIconSrc}
                alt="編輯選項"
                width="14"
                height="14"
                className="text-gray-600"
                style={{
                  display: 'block',
                  imageRendering: 'crisp-edges',
                  transform: 'translateZ(0)',
                  filter: 'invert(55%) sepia(88%) saturate(1488%) hue-rotate(170deg) brightness(91%) contrast(91%)'
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