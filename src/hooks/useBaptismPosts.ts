import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BaptismPost, CreateBaptismPostRequest } from '@/types/prayer';
import { firebaseBaptismService } from '@/services';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';
import {
  QUERY_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CACHE_CONFIG
} from '@/constants';

// Hook to fetch all baptism posts
export const useBaptismPosts = () => {
  return useQuery<BaptismPost[], Error>({
    queryKey: QUERY_KEYS.BAPTISM_POSTS,
    queryFn: async () => {
      log.debug('Fetching baptism posts', {}, 'useBaptismPosts');
      try {
        const posts = await firebaseBaptismService.getInstance().getAllPosts();
        log.info('Successfully loaded baptism posts', { count: posts.length }, 'useBaptismPosts');
        return posts;
      } catch (error) {
        log.error('Failed to fetch baptism posts', error, 'useBaptismPosts');
        throw error;
      }
    },
    staleTime: CACHE_CONFIG.RESOURCES.PRAYERS.STALE_TIME,
    gcTime: CACHE_CONFIG.RESOURCES.PRAYERS.GC_TIME,
  });
};

// Hook to create a new baptism post
export const useCreateBaptismPost = () => {
  const queryClient = useQueryClient();

  return useMutation<BaptismPost, Error, CreateBaptismPostRequest>({
    mutationFn: async (post) => {
      log.debug('Creating baptism post', { isAnonymous: post.is_anonymous }, 'useCreateBaptismPost');
      try {
        const result = await firebaseBaptismService.getInstance().createPost(post);
        return result;
      } catch (error) {
        log.error('Failed to create baptism post', error, 'useCreateBaptismPost');
        throw error;
      }
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<BaptismPost[]>(QUERY_KEYS.BAPTISM_POSTS, (oldData = []) => {
        return [newPost, ...oldData];
      });
      log.info('Baptism post created successfully', { id: newPost.id }, 'useCreateBaptismPost');
    },
    onError: (error) => {
      notify.error('見證發布失敗：' + error.message, error);
      log.error('Error in useCreateBaptismPost mutation', error, 'useCreateBaptismPost');
    },
  });
};

// Hook to delete a baptism post
export const useDeleteBaptismPost = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      log.debug('Deleting baptism post', { id }, 'useDeleteBaptismPost');
      try {
        await firebaseBaptismService.getInstance().deletePost(id);
      } catch (error) {
        log.error('Failed to delete baptism post', error, 'useDeleteBaptismPost');
        throw error;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<BaptismPost[]>(QUERY_KEYS.BAPTISM_POSTS, (oldData = []) => 
        oldData.filter(post => post.id !== deletedId)
      );
      notify.success(SUCCESS_MESSAGES.PRAYER_DELETED);
      log.info('Baptism post deleted successfully', { id: deletedId }, 'useDeleteBaptismPost');
    },
    onError: (error) => {
      notify.error(ERROR_MESSAGES.PRAYER_DELETE_ERROR, error);
      log.error('Error in useDeleteBaptismPost mutation', error, 'useDeleteBaptismPost');
    },
  });
}; 