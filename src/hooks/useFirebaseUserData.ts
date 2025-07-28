import { useState, useEffect, useCallback } from 'react';
import { useFirebaseAuthStore } from '@/stores/firebaseAuthStore';
import { FirebaseUserService, FirebaseUserData } from '@/services/auth/FirebaseUserService';
import { log } from '@/lib/logger';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useFirebaseUserData = () => {
  const user = useFirebaseAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const [localScripture, setLocalScripture] = useState<string>('');

  // 使用 React Query 來獲取和緩存用戶資料
  const { 
    data: userData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['firebaseUserData', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      
      log.debug('從 Firestore 獲取用戶資料', { userId: user.uid }, 'useFirebaseUserData');
      try {
        const data = await FirebaseUserService.getUserData(user.uid);
        log.debug('Firestore 用戶資料獲取結果', { 
          userId: user.uid,
          dataExists: !!data,
          scripture: data?.scripture || '無經文資料'
        }, 'useFirebaseUserData');
        
        // 更新本地 state
        if (data?.scripture) {
          log.debug('設置本地經文資料', { scripture: data.scripture }, 'useFirebaseUserData');
          setLocalScripture(data.scripture);
        }
        
        return data;
      } catch (err) {
        log.error('獲取用戶資料失敗', err, 'useFirebaseUserData');
        throw err;
      }
    },
    enabled: !!user,
    staleTime: 0, // 每次都重新獲取
    gcTime: 0, // 不緩存結果
    refetchOnMount: true, // 每次掛載時重新獲取
    refetchOnWindowFocus: true, // 窗口獲得焦點時重新獲取
  });

  // 確保在組件掛載時獲取資料
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user, refetch]);

  // 當 userData 變化時更新本地狀態
  useEffect(() => {
    if (userData?.scripture) {
      log.debug('userData 變化，更新本地經文資料', { 
        scripture: userData.scripture 
      }, 'useFirebaseUserData');
      setLocalScripture(userData.scripture);
    }
  }, [userData]);

  // 更新用戶資料
  const updateUserData = useCallback(async (data: Partial<FirebaseUserData>) => {
    if (!user) {
      toast.error('您必須登入才能更新資料');
      return;
    }

    try {
      log.debug('更新用戶資料', { userId: user.uid, data }, 'useFirebaseUserData');
      await FirebaseUserService.setUserData(user.uid, data);
      
      if (data.scripture !== undefined) {
        log.debug('更新本地經文資料', { scripture: data.scripture }, 'useFirebaseUserData');
        setLocalScripture(data.scripture);
      }
      
      toast.success('資料已更新');
      
      // 重新獲取資料
      await refetch();
      
      // 使相關查詢失效
      await queryClient.invalidateQueries({ queryKey: ['userData'] });
      await queryClient.invalidateQueries({ queryKey: ['firebaseUserData'] });
      
      log.debug('用戶資料已更新', { userId: user.uid }, 'useFirebaseUserData');
    } catch (err) {
      log.error('更新用戶資料失敗', err, 'useFirebaseUserData');
      toast.error('無法更新資料', { 
        description: err instanceof Error ? err.message : '請檢查您的網絡連接並重試' 
      });
    }
  }, [user, refetch, queryClient]);

  // 更新用戶經文
  const updateScripture = useCallback(async (scripture: string) => {
    if (!user) {
      toast.error('您必須登入才能更新經文');
      return;
    }

    try {
      log.debug('更新用戶經文', { userId: user.uid, scripture }, 'useFirebaseUserData');
      
      // 立即更新本地狀態，提供即時反饋
      setLocalScripture(scripture);
      
      await FirebaseUserService.updateScripture(user.uid, scripture);
      
      // 重新獲取資料
      await refetch();
      
      // 使相關查詢失效
      await queryClient.invalidateQueries({ queryKey: ['userData'] });
      await queryClient.invalidateQueries({ queryKey: ['firebaseUserData'] });
      
      log.debug('用戶經文已更新', { userId: user.uid }, 'useFirebaseUserData');
    } catch (err) {
      log.error('更新經文失敗', err, 'useFirebaseUserData');
      toast.error('無法更新經文', { 
        description: '請檢查您的網絡連接並重試' 
      });
      throw err;
    }
  }, [user, refetch, queryClient]);

  // 合併 userData 和 localScripture，確保始終有最新的經文
  const enhancedUserData = userData ? {
    ...userData,
    scripture: localScripture || userData.scripture || ''
  } : null;

  return {
    userData: enhancedUserData,
    scripture: localScripture || (userData?.scripture || ''),
    isLoading,
    error,
    updateUserData,
    updateScripture,
    refreshUserData: refetch
  };
};

export default useFirebaseUserData; 