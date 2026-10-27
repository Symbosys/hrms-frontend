import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Type definitions matching the backend Prisma model and controllers
export interface DepartmentManager {
  id: string;
  name: string;
  email?: string | null;
  phone?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  managerId?: string | null;
  parentId?: string | null;
  manager?: DepartmentManager | null;
  parent?: Department | null;
  children?: Department[];
  createdAt: string;
  updatedAt: string;
}

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateDepartmentRequest {
  name: string;
  code?: string;
  description?: string;
  managerId?: string | null;
  parentId?: string | null;
}

export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  description?: string;
  managerId?: string | null;
  parentId?: string | null;
}

/**
 * Hook to retrieve all departments
 * GET /api/v1/departments
 */
export const useDepartments = (organizationId?: string | null) => {
  return useQuery<BaseResponse<Department[]>, Error>({
    queryKey: ['departments', organizationId || 'default'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<Department[]>>('/departments', {
        params: organizationId ? { organizationId } : undefined,
      });
      return response.data;
    },
  });
};

/**
 * Hook to retrieve a single department by ID
 * GET /api/v1/departments/:id
 */
export const useDepartmentById = (id?: string) => {
  return useQuery<BaseResponse<Department>, Error>({
    queryKey: ['department', id],
    queryFn: async () => {
      if (!id) throw new Error('Department ID is required');
      const response = await apiClient.get<BaseResponse<Department>>(`/departments/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new department
 * POST /api/v1/departments
 */
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Department>, Error, CreateDepartmentRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<Department>>('/departments', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate departments list to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

/**
 * Hook to update an existing department
 * PUT /api/v1/departments/:id
 */
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Department>,
    Error,
    { id: string; data: UpdateDepartmentRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<BaseResponse<Department>>(`/departments/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific department details
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', variables.id] });
    },
  });
};

/**
 * Hook to delete a department
 * DELETE /api/v1/departments/:id
 */
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Record<string, never>>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<BaseResponse<Record<string, never>>>(`/departments/${id}`);
      return response.data;
    },
    onSuccess: (_, id) => {
      // Invalidate departments list and remove specific department from query cache
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', id] });
    },
  });
};
