import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MiraclePost, CreateMiraclePostRequest } from '@/types/prayer';
import { firebaseMiracleService } from '@/services';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';
import {
  QUERY_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CACHE_CONFIG
} from '@/constants';

// Hook to fetch all miracle posts
export const useMiraclePosts = () => {
  return useQuery<MiraclePost[], Error>({
    queryKey: QUERY_KEYS.MIRACLE_POSTS,
    queryFn: async () => {
      log.debug('Fetching miracle posts', {}, 'useMiraclePosts');
      try {
        const posts = await firebaseMiracleService.getInstance().getAllPosts();
        log.info('Successfully loaded miracle posts', { count: posts.length }, 'useMiraclePosts');
        return posts;
      } catch (error) {
        log.error('Failed to fetch miracle posts', error, 'useMiraclePosts');
        throw error;
      }
    },
    staleTime: CACHE_CONFIG.RESOURCES.PRAYERS.STALE_TIME,
    gcTime: CACHE_CONFIG.RESOURCES.PRAYERS.GC_TIME,
  });
};

// Hook to create a new miracle post
export const useCreateMiraclePost = () => {
  const queryClient = useQueryClient();

  return useMutation<MiraclePost, Error, CreateMiraclePostRequest>({
    mutationFn: async (post) => {
      log.debug('Creating miracle post', { isAnonymous: post.is_anonymous }, 'useCreateMiraclePost');
      try {
        const result = await firebaseMiracleService.getInstance().createPost(post);
        return result;
      } catch (error) {
        log.error('Failed to create miracle post', error, 'useCreateMiraclePost');
        throw error;
      }
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<MiraclePost[]>(QUERY_KEYS.MIRACLE_POSTS, (oldData = []) => {
        return [newPost, ...oldData];
      });
      log.info('Miracle post created successfully', { id: newPost.id }, 'useCreateMiraclePost');
    },
    onError: (error) => {
      notify.error('貼文發布失敗：' + error.message, error);
    },
  });
};

// Hook to delete a miracle post
export const useDeleteMiraclePost = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      log.debug('Deleting miracle post', { id }, 'useDeleteMiraclePost');
      try {
        await firebaseMiracleService.getInstance().deletePost(id);
      } catch (error) {
        log.error('Failed to delete miracle post', error, 'useDeleteMiraclePost');
        throw error;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<MiraclePost[]>(QUERY_KEYS.MIRACLE_POSTS, (oldData = []) => 
        oldData.filter(post => post.id !== deletedId)
      );
      notify.success(SUCCESS_MESSAGES.PRAYER_DELETED);
    },
    onError: (error) => {
      notify.error(ERROR_MESSAGES.PRAYER_DELETE_ERROR, error);
    },
  });
}; 