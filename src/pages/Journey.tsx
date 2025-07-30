import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { GUEST_DEFAULT_BACKGROUND, BACKGROUND_OPTIONS } from '@/constants';
import { useFirebaseAvatar } from '@/hooks/useFirebaseAvatar';
import { log } from '@/lib/logger';
import { PrayerForm } from '@/components/PrayerForm';
import { useJourneyPosts, useCreateJourneyPost, useDeleteJourneyPost } from '@/hooks/useJourneyPosts';
import { BackgroundService } from '@/services/background/BackgroundService';
import PrayerPost from '@/components/PrayerPost';
import { PrayerPostSkeletonList } from '@/components/ui/skeleton';
import type { JourneyPost, Prayer } from '@/types/prayer';

export default function Journey() {
  const { user, isLoggedIn, avatarUrl } = useFirebaseAvatar();
  const [isGuestMode, setIsGuestMode] = useState(false);
  const createJourneyPostMutation = useCreateJourneyPost();
  const deleteJourneyPostMutation = useDeleteJourneyPost();

  const { 
    data: posts = [], 
    isLoading: postsLoading, 
    error: postsError 
  } = useJourneyPosts();

  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectedBackground, setSelectedBackground] = useState(GUEST_DEFAULT_BACKGROUND);
  const [prayerText, setPrayerText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // 明確強制設置頁面背景色
  useEffect(() => {
    // 保存原始背景色，以便在組件卸載時恢復
    const originalBackgroundColor = document.body.style.backgroundColor;
    
    // 強制設置背景色為 #FFE5D9
    document.body.style.backgroundColor = '#FFE5D9';
    document.documentElement.style.backgroundColor = '#FFE5D9';
    
    return () => {
      // 組件卸載時恢復原始背景色
      document.body.style.backgroundColor = originalBackgroundColor;
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    setIsGuestMode(guestMode);
    if (!guestMode && !isLoggedIn) {
      window.location.href = '/auth';
    }
  }, [isLoggedIn]);

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

  const handlePostDeleted = useCallback((deletedPostId: string) => {
    deleteJourneyPostMutation.mutate(deletedPostId);
  }, [deleteJourneyPostMutation]);

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) return;

    let userData = {};
    if (isLoggedIn && user) {
      const userName = user.displayName || user.email?.split('@')[0] || 'User';
      userData = {
        user_name: isAnonymous ? '訪客' : userName,
        user_avatar: avatarUrl,
        user_id: user.uid,
      };
    }

    createJourneyPostMutation.mutate({
      content: prayerText,
      is_anonymous: isLoggedIn ? isAnonymous : true,
      ...userData,
      image_url: imageUrl || null,
    }, {
      onSuccess: () => {
        setPrayerText('');
        setImageUrl(undefined);
        if (isLoggedIn) {
          setIsAnonymous(false);
        }
      }
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ backgroundColor: '#FFE5D9' }}>
      {/* 明確設置背景色為 #FFE5D9，提高 z-index 確保覆蓋其他元素 */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#FFE5D9',
          zIndex: -1,
        }}
      />

      {/* 使用正確的 React 樣式方式設置全局樣式 */}
      <style>{`
        body, html, #root, .App {
          background-color: #FFE5D9 !important;
        }
      `}</style>

      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '98px',
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(8px)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(8px)' : 'none',
          zIndex: 40,
          transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
        }}
      />
      <Header currentPage="community" isLoggedIn={isLoggedIn} isGuestMode={isGuestMode} />
      <main ref={scrollContainerRef} className="h-full w-full overflow-y-auto pb-20 pt-[98px]" style={{ backgroundColor: '#FFE5D9' }}>
        <section aria-labelledby="journey-heading" className="w-full px-4" style={{ backgroundColor: '#FFE5D9' }}>
          <div className="flex flex-col max-w-[358px] mx-auto">
            <div className="bg-white w-full px-4 pt-4 pb-[12px] shadow-sm">
              <PrayerForm
                prayerText={prayerText}
                isAnonymous={isAnonymous}
                isLoggedIn={isLoggedIn || isGuestMode}
                onTextChange={setPrayerText}
                onAnonymousChange={setIsAnonymous}
                onSubmit={handlePrayerSubmit}
                isSubmitting={createJourneyPostMutation.isPending}
                placeholder="分享你的信仰旅程..."
                rows={1}
                setShowBackgroundSelector={() => {}}
                imageUrl={imageUrl}
                setImageUrl={setImageUrl}
                isAnswered={false}
              />
            </div>
            
            <div className="mt-4">
              {postsLoading && <PrayerPostSkeletonList count={3} />}
              {postsError && <div className="text-red-500">載入時發生錯誤: {postsError.message}</div>}
              {!postsLoading && !postsError && posts.length > 0 ? (
                <div className="space-y-1">
                  {posts.map((post) => (
                    <PrayerPost
                      key={post.id}
                      prayer={post} // No longer need casting
                      onUpdate={() => {}}
                      onDeleted={handlePostDeleted}
                      isLoggedIn={isLoggedIn || isGuestMode}
                      initialResponseCount={post.response_count || 0}
                    />
                  ))}
                </div>
              ) : !postsLoading && !postsError && (
                <div className="text-center py-8 text-gray-500">
                  目前還沒有任何旅程分享
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 