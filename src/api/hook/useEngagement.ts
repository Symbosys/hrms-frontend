import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PostComment {
  id: string;
  user: string;
  text: string;
  date: string;
}

export interface PostReaction {
  type: string;
  count: number;
}

export interface EngagementPost {
  id: string;
  author: string;
  authorRole: string;
  authorAvatar?: string;
  content: string;
  image?: string;
  likes: number;
  likedByMe: boolean;
  reactions: PostReaction[];
  comments: PostComment[];
  date: string;
}

export interface MoodDistribution {
  thrilled: number;
  content: number;
  neutral: number;
  stressed: number;
}

export interface CorporateSurvey {
  id: string;
  title: string;
  question: string;
  status: 'ACTIVE' | 'CLOSED';
  closesAt: string;
  responded: boolean;
}

// Queries and Mutations

/**
 * Hook to retrieve all announcement feed posts
 * GET /api/v1/engagement/posts
 */
export const usePosts = (employeeId?: string) => {
  return useQuery<BaseResponse<EngagementPost[]>, Error>({
    queryKey: ['engagementPosts', employeeId],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<EngagementPost[]>>('/engagement/posts', {
        params: { employeeId },
      });
      return response.data;
    },
    enabled: !!employeeId,
  });
};

/**
 * Hook to publish a new announcement feed post
 * POST /api/v1/engagement/posts
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { authorName: string; authorRole: string; authorAvatar?: string | null; content: string; image?: string | null }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/engagement/posts', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementPosts'] });
    },
  });
};

/**
 * Hook to submit comment on a post
 * POST /api/v1/engagement/posts/comment
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { postId: string; userName: string; text: string }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/engagement/posts/comment', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementPosts'] });
    },
  });
};

/**
 * Hook to toggle like status on a post
 * POST /api/v1/engagement/posts/like
 */
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { postId: string; employeeId: string }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/engagement/posts/like', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementPosts'] });
    },
  });
};

/**
 * Hook to react with emojis on a post
 * POST /api/v1/engagement/posts/react
 */
export const useAddReaction = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { postId: string; employeeId: string; type: string }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/engagement/posts/react', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementPosts'] });
    },
  });
};

/**
 * Hook to fetch corporate mood gauge distribution analytics
 * GET /api/v1/engagement/mood
 */
export const useMoodDistribution = () => {
  return useQuery<BaseResponse<MoodDistribution>, Error>({
    queryKey: ['engagementMood'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<MoodDistribution>>('/engagement/mood');
      return response.data;
    },
  });
};

/**
 * Hook to submit a weekly anonymous mood check-in
 * POST /api/v1/engagement/mood
 */
export const useSubmitMood = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { employeeId: string; mood: string; weekKey: string }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/engagement/mood', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementMood'] });
    },
  });
};

/**
 * Hook to retrieve corporate pulse surveys
 * GET /api/v1/engagement/surveys
 */
export const useSurveys = (employeeId?: string) => {
  return useQuery<BaseResponse<CorporateSurvey[]>, Error>({
    queryKey: ['engagementSurveys', employeeId],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<CorporateSurvey[]>>('/engagement/surveys', {
        params: { employeeId },
      });
      return response.data;
    },
    enabled: !!employeeId,
  });
};

/**
 * Hook to submit a survey response rating
 * POST /api/v1/engagement/surveys/respond
 */
export const useSubmitSurveyResponse = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { surveyId: string; employeeId: string; rating: number }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/engagement/surveys/respond', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementSurveys'] });
    },
  });
};
export const useCreateSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { title: string; question: string; closesAt: Date }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/engagement/surveys', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementSurveys'] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, string>({
    mutationFn: async (postId) => {
      try {
        const response = await apiClient.delete<BaseResponse<any>>(`/engagement/posts/${postId}`);
        return response.data;
      } catch (err: any) {
        // Fallback to POST /posts/delete if DELETE method is unrouted or blocked
        const response = await apiClient.post<BaseResponse<any>>('/engagement/posts/delete', { postId });
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementPosts'] });
    },
  });
};

export const useDeleteSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, string>({
    mutationFn: async (surveyId) => {
      try {
        const response = await apiClient.delete<BaseResponse<any>>(`/engagement/surveys/${surveyId}`);
        return response.data;
      } catch (err: any) {
        // Fallback to POST /surveys/delete if DELETE method is unrouted or blocked
        const response = await apiClient.post<BaseResponse<any>>('/engagement/surveys/delete', { surveyId });
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementSurveys'] });
    },
  });
};
