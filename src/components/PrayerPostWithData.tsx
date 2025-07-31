import React, { useState, useRef, useEffect } from 'react';
import { PrayerForm } from './PrayerForm';
import { usePrayerResponses, useCreatePrayerResponse } from '../hooks/usePrayerResponsesOptimized';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

import { notify } from '@/lib/notifications';
import { log } from '@/lib/logger';
import type { Prayer } from '@/services/prayerService';
import GuestAvatar from './ui/guest-avatar';
import { VALIDATION_CONFIG } from '@/constants';

interface PrayerPostWithDataProps {
  prayer: Prayer;
  onAddFriend?: () => void;
  onFollow?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

export const PrayerPostWithData: React.FC<PrayerPostWithDataProps> = ({
  prayer,
  onAddFriend,
  onFollow,
  onShare,
  onBookmark
}) => {
  const [showResponseForm, setShowResponseForm] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { data: responses } = usePrayerResponses(prayer.id);
  const createResponseMutation = useCreatePrayerResponse();
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isLong, setIsLong] = useState(false);
  
  // 使用 Firebase 認證上下文
  const { currentUser } = useFirebaseAuth();
  
  // 設定最大行數和行高
  const lineHeight = 24; // 根據實際行高進行調整，單位為像素
  const maxLines = 9;
  const maxHeight = lineHeight * maxLines;

  // 獲取當前用戶ID
  useEffect(() => {
    setCurrentUserId(currentUser?.uid || null);
  }, [currentUser]);

  // 簡化的內容高度檢測 - 優化性能
  useEffect(() => {
    if (contentRef.current) {
      const isContentLong = contentRef.current.scrollHeight > maxHeight;
      setIsLong(isContentLong);
    }
  }, [prayer.content, maxHeight]);

  const handleResponseSubmit = async (response: string, isAnonymous: boolean) => {
    try {
      if (!currentUserId) {
        notify.warning('請先登入才能發表回應');
        return;
      }
      
      await createResponseMutation.mutateAsync({
        prayer_id: prayer.id,
        content: response,
        is_anonymous: isAnonymous
      });
      setShowResponseForm(false);
      setTimeout(() => setShowResponseForm(true), 1000);
    } catch (error) {
      log.error('Failed to submit response', error, 'PrayerPostWithData');
      notify.apiError(error, '發表回應失敗');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const userName = prayer.is_anonymous ? '匿名發布' : prayer.user_id || '用戶';

  return (
    <article className="bg-white w-full p-4 md:p-6 shadow-sm rounded-lg">
      <div className="flex w-full justify-between gap-4">
        <div className="flex gap-3 md:gap-4 font-normal flex-1 min-w-0">
          {prayer.is_anonymous ? (
            <GuestAvatar size="lg" className="w-10 md:w-12 h-10 md:h-12 shrink-0" />
          ) : (
            <img
              src={prayer.user_avatar || '/placeholder.svg'}
              alt={`${userName}的頭像`}
              className="aspect-[1] object-contain w-10 md:w-12 h-10 md:h-12 shrink-0 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="text-base md:text-lg text-[rgba(51,44,43,1)] font-medium">
                {userName}
              </div>
              {!prayer.is_anonymous && (
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <button
                    onClick={onAddFriend}
                    className="border px-2 md:px-3 py-1 rounded-full border-[rgba(239,136,129,1)] border-solid hover:bg-[rgba(239,136,129,0.1)] transition-colors whitespace-nowrap"
                    aria-label={`加${userName}為好友`}
                  >
                    加好友
                  </button>
                  <button
                    onClick={onFollow}
                    className="border px-2 md:px-3 py-1 rounded-full border-[rgba(205,129,179,1)] border-solid hover:bg-[rgba(205,129,179,0.1)] transition-colors whitespace-nowrap"
                    aria-label={`追蹤${userName}`}
                  >
                    追蹤
                  </button>
                </div>
              )}
            </div>
            <time
              dateTime={prayer.created_at}
              className="text-xs md:text-sm text-[rgba(51,44,43,1)] mt-1 block"
            >
              {formatTimestamp(prayer.created_at)}
            </time>
          </div>
        </div>
        <div className="flex items-start gap-3 md:gap-4 flex-shrink-0">
          <button
            onClick={onShare}
            className="hover:opacity-70 transition-opacity p-1"
            aria-label="分享這篇代禱"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets/91b03d941ecd427585d85ffc540669a5/23e47c95e7a443a942a6875f1c271194951ebbad?placeholderIfAbsent=true"
              alt="分享"
              className="aspect-[1.17] object-contain w-4 md:w-5"
            />
          </button>
          <button
            onClick={onBookmark}
            className="hover:opacity-70 transition-opacity p-1"
            aria-label="收藏這篇代禱"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets/91b03d941ecd427585d85ffc540669a5/1469d24dd47d1069c030eb162c8f1b24786595fe?placeholderIfAbsent=true"
              alt="收藏"
              className="aspect-[1.05] object-contain w-4 md:w-5"
            />
          </button>
        </div>
      </div>
      
      <div className="text-black text-sm md:text-base font-normal leading-6 md:leading-7 mt-3 md:mt-3">
        <div 
          ref={contentRef}
          className="whitespace-pre-wrap break-words text-left relative"
          style={{ 
            maxHeight: expanded ? 'none' : `${maxHeight}px`,
            overflow: expanded ? 'visible' : 'hidden'
          }}
        >
          {prayer.content}
          {/* 如果內容被截斷且未展開，添加漸變遮罩 */}
          {!expanded && isLong && (
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent"></div>
          )}
        </div>
        
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

      {/* 顯示現有回應 */}
      {responses && responses.length > 0 && (
        <div className="mt-4 md:mt-6 space-y-3">
          {responses.map((response) => (
            <div key={response.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium text-gray-700">
                  {response.is_anonymous ? '匿名回應' : '用戶回應'}
                </div>
                <time className="text-xs text-gray-500">
                  {formatTimestamp(response.created_at)}
                </time>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {response.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 回應表單 */}
      {showResponseForm && (
        <div className="w-full mt-4 md:mt-6 pt-4 border-t border-gray-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formElement = e.currentTarget as HTMLFormElement;
              const textareaElement = formElement.querySelector('textarea');
              if (textareaElement && textareaElement.value.trim()) {
                handleResponseSubmit(textareaElement.value.trim(), false);
              }
            }}
          >
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="寫下你的回應代禱"
              maxLength={VALIDATION_CONFIG.RESPONSE_CONTENT.MAX_LENGTH}
              rows={3}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            {/* 字數顯示 */}
            <div className="text-right mt-1">
              <span className="text-xs text-gray-500" id="response-length-indicator"></span>
            </div>
            <button type="submit" className="mt-2 px-4 py-1 bg-blue-500 text-white rounded">送出回應</button>
          </form>
        </div>
      )}
    </article>
  );
};
