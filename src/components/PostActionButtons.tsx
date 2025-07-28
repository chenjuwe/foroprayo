import React from 'react';
import { PostActions } from './PostActions';

interface PostActionButtonsProps {
  postId: string;
  prayerUserId?: string;
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
  return (
    <div className="relative" style={{ width: '40px', height: '32px' }}>
      <div className="absolute" style={{ right: '0.5px', top: '-6px', position: 'relative', left: '6px' }}>
        <PostActions 
          prayerId={postId}
          prayerUserId={prayerUserId}
          prayerContent={prayerContent}
          prayerUserName={prayerUserName}
          prayerUserAvatar={prayerUserAvatar}
          isOwner={isOwner}
          onShare={onShare}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
