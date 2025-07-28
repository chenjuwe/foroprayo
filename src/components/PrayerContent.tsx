import React, { useState } from 'react';
import { EditPrayerForm } from './EditPrayerForm';
import { useUpdatePrayer } from '../hooks/usePrayersOptimized';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';
import type { Prayer } from '@/services/prayerService';
import { ExpandableText } from './ui/ExpandableText';

interface PrayerContentProps {
  prayer: Prayer;
  currentUserId: string | null;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onEditEnd?: () => void;
}

const PrayerContentComponent: React.FC<PrayerContentProps> = ({
  prayer,
  currentUserId,
  onShare,
  onEdit,
  onDelete,
  onEditEnd
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const updatePrayerMutation = useUpdatePrayer();

  // 判斷是否為貼文擁有者
  const isOwner = currentUserId === prayer.user_id;

  const handleEdit = () => {
    log.debug('Starting edit mode for prayer', { prayerId: prayer.id }, 'PrayerContent');
    setIsEditing(true);
    if (onEdit) {
      onEdit();
    }
  };

  const handleSaveEdit = async (content: string) => {
    log.debug('Attempting to save prayer edit', { 
      prayerId: prayer.id, 
      contentLength: content.length,
      isOwner,
      currentUserId,
      prayerUserId: prayer.user_id
    }, 'PrayerContent');
    
    if (!currentUserId) {
      log.warn('No current user ID available', null, 'PrayerContent');
      notify.warning('請先登入才能編輯代禱');
      return;
    }

    if (!content.trim()) {
      log.warn('Content is empty', null, 'PrayerContent');
      notify.warning('代禱內容不能為空');
      return;
    }

    if (!isOwner) {
      log.warn('User is not the owner of this prayer', {
        currentUserId,
        prayerUserId: prayer.user_id
      }, 'PrayerContent');
      notify.warning('您只能編輯自己的代禱');
      return;
    }

    try {
      log.debug('Calling updatePrayerMutation', { prayerId: prayer.id }, 'PrayerContent');
      
      // 先設置編輯狀態為 false，避免重複提交
      setIsEditing(false);
      
      // 執行更新操作
      await updatePrayerMutation.mutateAsync({
        id: prayer.id,
        content: content.trim()
      });
      
      log.info('Prayer update completed successfully', { prayerId: prayer.id }, 'PrayerContent');
      
      // 確保 onEditEnd 回調在狀態更新後執行
      if (onEditEnd) {
        onEditEnd();
      }
      
    } catch (error) {
      log.error('Failed to save prayer edit', error, 'PrayerContent');
      notify.apiError(error, '保存代禱編輯失敗');
      // 如果更新失敗，恢復編輯狀態
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    log.debug('Canceling prayer edit', { prayerId: prayer.id }, 'PrayerContent');
    setIsEditing(false);
    if (onEditEnd) {
      onEditEnd();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <EditPrayerForm
          initialContent={prayer.content}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          isLoading={updatePrayerMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 text-left">
      <ExpandableText maxLines={9} lineHeight={24}>
        {prayer.content}
      </ExpandableText>
    </div>
  );
};

export const PrayerContent = React.memo(PrayerContentComponent);
