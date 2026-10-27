import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Type definitions matching backend models and role/permission schemas
export interface Permission {
  id: string;
  name: string;
  action: string;
  subject: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: { permission: Permission }[] | Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreatePermissionRequest {
  name: string;
  action: string;
  subject: string;
  description?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string | null;
}

/**
 * Hook to retrieve all permissions
 * GET /api/v1/admin/permissions
 */
export const usePermissions = () => {
  return useQuery<BaseResponse<Permission[]>, Error>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<Permission[]>>('/admin/permissions');
      return response.data;
    },
  });
};

/**
 * Hook to create a new permission
 * POST /api/v1/admin/permissions
 */
export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Permission>, Error, CreatePermissionRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<Permission>>('/admin/permissions', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate permissions list to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });
};

/**
 * Hook to retrieve all roles (with associated permissions)
 * GET /api/v1/admin/roles
 */
export const useRoles = (organizationId?: string | null) => {
  return useQuery<BaseResponse<Role[]>, Error>({
    queryKey: ['roles', organizationId || 'default'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<Role[]>>('/admin/roles', {
        params: organizationId ? { organizationId } : undefined,
      });
      return response.data;
    },
  });
};

/**
 * Hook to create a new role
 * POST /api/v1/admin/roles
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Role>, Error, CreateRoleRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<Role>>('/admin/roles', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate roles list to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/**
 * Hook to update an existing role's name, description, and permissions
 * PUT /api/v1/admin/roles/:id
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Role>,
    Error,
    { id: string; data: UpdateRoleRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<BaseResponse<Role>>(`/admin/roles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate roles list to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/**
 * Hook to delete a role
 * DELETE /api/v1/admin/roles/:id
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Record<string, never>>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<BaseResponse<Record<string, never>>>(`/admin/roles/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate roles list to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/**
 * Hook to assign a role to a user
 * POST /api/v1/admin/assign-role
 */
export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<any>, Error, AssignRoleRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<any>>('/admin/assign-role', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries like roles, users, employees, and profile to ensure cache integrity
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
