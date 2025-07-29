import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JourneyPost, CreateJourneyPostRequest } from '@/types/prayer';
import { firebaseJourneyService } from '@/services';
import { log } from '@/lib/logger';
import { notify } from '@/lib/notifications';
import {
  QUERY_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CACHE_CONFIG
} from '@/constants';

// Hook to fetch all journey posts
export const useJourneyPosts = () => {
  return useQuery<JourneyPost[], Error>({
    queryKey: QUERY_KEYS.JOURNEY_POSTS,
    queryFn: async () => {
      log.debug('Fetching journey posts', {}, 'useJourneyPosts');
      try {
        const posts = await firebaseJourneyService.getInstance().getAllPosts();
        log.info('Successfully loaded journey posts', { count: posts.length }, 'useJourneyPosts');
        return posts;
      } catch (error) {
        log.error('Failed to fetch journey posts', error, 'useJourneyPosts');
        throw error;
      }
    },
    staleTime: CACHE_CONFIG.RESOURCES.PRAYERS.STALE_TIME,
    gcTime: CACHE_CONFIG.RESOURCES.PRAYERS.GC_TIME,
  });
};

// Hook to create a new journey post
export const useCreateJourneyPost = () => {
  const queryClient = useQueryClient();

  return useMutation<JourneyPost, Error, CreateJourneyPostRequest>({
    mutationFn: async (post) => {
      log.debug('Creating journey post', { isAnonymous: post.is_anonymous }, 'useCreateJourneyPost');
      try {
        const result = await firebaseJourneyService.getInstance().createPost(post);
        return result;
      } catch (error) {
        log.error('Failed to create journey post', error, 'useCreateJourneyPost');
        throw error;
      }
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<JourneyPost[]>(QUERY_KEYS.JOURNEY_POSTS, (oldData = []) => {
        return [newPost, ...oldData];
      });
      log.info('Journey post created successfully', { id: newPost.id }, 'useCreateJourneyPost');
    },
    onError: (error) => {
      notify.error('貼文發布失敗：' + error.message, error);
    },
  });
};

// Hook to delete a journey post
export const useDeleteJourneyPost = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      log.debug('Deleting journey post', { id }, 'useDeleteJourneyPost');
      try {
        await firebaseJourneyService.getInstance().deletePost(id);
      } catch (error) {
        log.error('Failed to delete journey post', error, 'useDeleteJourneyPost');
        throw error;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<JourneyPost[]>(QUERY_KEYS.JOURNEY_POSTS, (oldData = []) => 
        oldData.filter(post => post.id !== deletedId)
      );
      notify.success(SUCCESS_MESSAGES.PRAYER_DELETED);
    },
    onError: (error) => {
      notify.error(ERROR_MESSAGES.PRAYER_DELETE_ERROR, error);
    },
  });
}; 