import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PerformanceGoal {
  id: string;
  employeeId: string;
  title: string;
  weight: string;
  kra: string;
  progress: number;
  status: 'In Progress' | 'Completed';
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
  };
}

export interface PerformanceFeedback {
  id: string;
  employeeId: string;
  reviewer: string;
  relation: 'Manager' | 'Peer' | 'Direct Report';
  rating: number;
  text: string;
  date: string;
  createdAt: string;
}

export interface BellCurvePoint {
  rating: string;
  Employees: number;
}

export interface PerformanceRatingRecord {
  id: string;
  employeeId: string;
  month: string;
  rating: number;
  status: string;
  tasks: string;
  quality: string;
  teamwork: string;
  feedback?: string;
  givenBy?: string;
  createdAt: string;
}

// Queries and Mutations

/**
 * Hook to retrieve monthly performance ratings for an employee
 * GET /api/v1/performance/ratings
 */
export const useMonthlyRatings = (employeeId?: string) => {
  return useQuery<BaseResponse<PerformanceRatingRecord[]>, Error>({
    queryKey: ['performanceMonthlyRatings', employeeId],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<PerformanceRatingRecord[]>>('/performance/ratings', {
        params: { employeeId },
      });
      return response.data;
    },
    enabled: !!employeeId,
  });
};

/**
 * Hook to submit monthly performance rating for an employee
 * POST /api/v1/performance/ratings
 */
export const useCreateMonthlyRating = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<PerformanceRatingRecord>, Error, {
    employeeId: string;
    month: string;
    rating: number;
    status?: string;
    tasks?: string;
    quality?: string;
    teamwork?: string;
    feedback?: string;
    givenBy?: string;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<PerformanceRatingRecord>>('/performance/ratings', payload);
      return response.data;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: ['performanceMonthlyRatings'] });
      }
    },
  });
};

/**
 * Hook to retrieve performance goals / KRAs
 * GET /api/v1/performance/goals
 */
export const useGoals = (employeeId?: string) => {
  return useQuery<BaseResponse<PerformanceGoal[]>, Error>({
    queryKey: ['performanceGoals', employeeId],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<PerformanceGoal[]>>('/performance/goals', {
        params: { employeeId },
      });
      return response.data;
    },
    enabled: !!employeeId,
  });
};

/**
 * Hook to assign a new performance goal / KRA
 * POST /api/v1/performance/goals
 */
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<PerformanceGoal>, Error, { employeeId: string; title: string; weight: string; kra: string }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<PerformanceGoal>>('/performance/goals', payload);
      return response.data;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: ['performanceGoals'] });
      }
    },
  });
};

/**
 * Hook to update progress of an active goal
 * PATCH /api/v1/performance/goals/:id/progress
 */
export const useUpdateGoalProgress = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<PerformanceGoal>, Error, { id: string; progress: number; status?: 'In Progress' | 'Completed' }>({
    mutationFn: async ({ id, progress, status }) => {
      const response = await apiClient.patch<BaseResponse<PerformanceGoal>>(`/performance/goals/${id}/progress`, {
        progress,
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceGoals'] });
    },
  });
};

/**
 * Hook to delete a performance goal
 * DELETE /api/v1/performance/goals/:id
 */
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<null>, Error, string>({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<BaseResponse<null>>(`/performance/goals/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceGoals'] });
    },
  });
};

/**
 * Hook to retrieve 360 peer & manager feedback reviews
 * GET /api/v1/performance/feedbacks
 */
export const useFeedbacks = (employeeId?: string) => {
  return useQuery<BaseResponse<PerformanceFeedback[]>, Error>({
    queryKey: ['performanceFeedbacks', employeeId],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<PerformanceFeedback[]>>('/performance/feedbacks', {
        params: { employeeId },
      });
      return response.data;
    },
    enabled: !!employeeId,
  });
};

/**
 * Hook to submit feedback review
 * POST /api/v1/performance/feedbacks
 */
export const useCreateFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<PerformanceFeedback>, Error, { employeeId: string; reviewer: string; relation: string; rating: number; text: string }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<PerformanceFeedback>>('/performance/feedbacks', payload);
      return response.data;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: ['performanceFeedbacks'] });
      }
    },
  });
};

/**
 * Hook to retrieve appraisal bell curve distribution analytics
 * GET /api/v1/performance/bellcurve
 */
export const useBellCurveDistribution = (cycle?: string) => {
  return useQuery<BaseResponse<BellCurvePoint[]>, Error>({
    queryKey: ['performanceBellCurve', cycle],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<BellCurvePoint[]>>('/performance/bellcurve', {
        params: { cycle },
      });
      return response.data;
    },
  });
};

/**
 * Hook to save appraisal ratings for an employee
 * POST /api/v1/performance/appraisals
 */
export const useSaveAppraisal = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { employeeId: string; cycle: string; rating: number }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/performance/appraisals', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceBellCurve'] });
    },
  });
};
