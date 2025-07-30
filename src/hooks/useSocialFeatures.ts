import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/integrations/firebase/client';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  serverTimestamp, 
  doc,
  Timestamp
} from 'firebase/firestore';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';

// 愛心功能相關 hooks

/**
 * 取得特定代禱的愛心資料
 * @param prayerId 代禱ID
 */
export function usePrayerLikes(prayerId: string | undefined) {
  return useQuery({
    queryKey: ['prayer_likes', prayerId],
    queryFn: async () => {
      if (!prayerId) return [];

      try {
        log.debug('獲取代禱愛心資料', { prayerId }, 'usePrayerLikes');
        
        const likesCollection = collection(db(), 'prayer_likes');
        const likesQuery = query(likesCollection, where('prayer_id', '==', prayerId));
        const snapshot = await getDocs(likesQuery);
        
        const likes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at instanceof Timestamp 
            ? doc.data().created_at.toDate() 
            : doc.data().created_at
        }));
        
        log.debug('成功獲取愛心資料', { prayerId, count: likes.length }, 'usePrayerLikes');
        return likes;
      } catch (error) {
        log.error('獲取愛心資料失敗', error, 'usePrayerLikes');
        throw error;
      }
    },
    enabled: !!prayerId,
    staleTime: 1000 * 60 * 5 // 5分鐘更新一次
  });
}

/**
 * 切換愛心狀態
 */
export function useTogglePrayerLike() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      prayerId, 
      isLiked, 
      likeId = '' 
    }: { 
      prayerId: string; 
      isLiked: boolean;
      likeId?: string;
    }) => {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('請先登入');
      }

      try {
        log.debug('切換愛心狀態', { prayerId, isLiked }, 'useTogglePrayerLike');
        
        if (isLiked && likeId) {
          // 取消愛心
          const likeRef = doc(db(), 'prayer_likes', likeId);
          await deleteDoc(likeRef);
          log.debug('成功取消愛心', { prayerId }, 'useTogglePrayerLike');
        } else {
          // 新增愛心
          const prayerRef = doc(db(), 'prayers', prayerId);
          const prayerSnapshot = await getDocs(query(collection(db(), 'prayers'), where('__name__', '==', prayerId)));
          
          if (prayerSnapshot.empty) {
            throw new Error('代禱不存在');
          }
          
          const prayer = prayerSnapshot.docs[0].data();
          
          // 添加愛心記錄
          await addDoc(collection(db(), 'prayer_likes'), {
            prayer_id: prayerId,
            user_id: user.uid,
            liked_user_id: prayer.user_id, // 被按愛心的人的ID
            created_at: serverTimestamp()
          });
          
          log.debug('成功新增愛心', { prayerId }, 'useTogglePrayerLike');
        }

        // 成功後返回新狀態
        return { success: true, prayerId, isLiked: !isLiked };
      } catch (error) {
        log.error('切換愛心失敗', error, 'useTogglePrayerLike');
        throw error;
      }
    },
    
    onSuccess: (result, variables) => {
      // 更新查詢緩存
      queryClient.invalidateQueries({ queryKey: ['prayer_likes', variables.prayerId] });
      
      // 通知使用者
      if (!variables.isLiked) {
        notify.success('已給予愛心！');
      }
    },
    
    onError: (error) => {
      notify.error(`操作失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  });
} 