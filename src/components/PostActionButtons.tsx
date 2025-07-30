import React from 'react';
import { PostActions } from './PostActions';
import { useLocation } from 'react-router-dom';

interface PostActionButtonsProps {
  postId: string;
  prayerUserId: string;
  prayerContent: string;
  prayerUserName?: string;
  prayerUserAvatar?: string;
  isOwner: boolean;
  onShare?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
}

export const PostActionButtons: React.FC<PostActionButtonsProps> = ({
  postId,
  prayerUserId = '',
  prayerContent,
  prayerUserName,
  prayerUserAvatar,
  isOwner,
  onShare,
  onEdit,
  onDelete
}) => {
  const location = useLocation();
  const isPrayersPage = location.pathname === '/prayers';
  
  return (
    <div className="relative" style={{ width: '40px', height: '32px' }}>
      <div className="absolute" style={{ right: '2px', top: isPrayersPage ? '-3px' : '-2px' }}>
        <PostActions 
          prayerId={postId}
          prayerUserId={prayerUserId}
          prayerContent={prayerContent}
          {...(prayerUserName ? { prayerUserName } : {})}
          {...(prayerUserAvatar ? { prayerUserAvatar } : {})}
          isOwner={isOwner}
          {...(onShare ? { onShare } : {})}
          {...(onEdit ? { onEdit } : {})}
          {...(onDelete ? { onDelete } : {})}
        />
      </div>
    </div>
  );
};
