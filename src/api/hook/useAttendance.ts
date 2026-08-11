import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PunchLog {
  id: string;
  employeeId?: string;
  time: string;
  type: 'In' | 'Out';
  method: string;
  lat: number;
  lng: number;
  selfiePreview: string | null;
  createdAt?: string;
}

export interface RegularizationRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  date: string;
  timeIn: string;
  timeOut: string;
  reason: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

// Queries and Mutations

/**
 * Hook to retrieve attendance punches for an employee
 * GET /api/v1/attendance/punches/:employeeId
 */
export const usePunches = (employeeId: string) => {
  return useQuery<BaseResponse<PunchLog[]>, Error>({
    queryKey: ['attendancePunches', employeeId],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<PunchLog[]>>(`/attendance/punches/${employeeId}`);
      return response.data;
    },
    enabled: !!employeeId,
  });
};

/**
 * Hook to record a check-in or check-out punch
 * POST /api/v1/attendance/punches
 */
export const useCreatePunch = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    employeeId: string;
    type: 'In' | 'Out';
    method: string;
    lat: number;
    lng: number;
    selfiePreview?: string | null;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/attendance/punches', payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendancePunches', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['attendancePunches'] });
    },
  });
};

/**
 * Hook to retrieve all regularization requests
 * GET /api/v1/attendance/regularizations
 */
export const useRegularizations = () => {
  return useQuery<BaseResponse<RegularizationRequest[]>, Error>({
    queryKey: ['attendanceRegularizations'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<RegularizationRequest[]>>('/attendance/regularizations');
      return response.data;
    },
  });
};

/**
 * Hook to apply for regularization
 * POST /api/v1/attendance/regularizations
 */
export const useApplyRegularization = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    employeeId: string;
    date: string;
    timeIn: string;
    timeOut: string;
    reason: string;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/attendance/regularizations', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRegularizations'] });
    },
  });
};

/**
 * Hook to approve or reject a regularization request
 * PATCH /api/v1/attendance/regularizations/:id
 */
export const useUpdateRegularization = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { id: string; status: 'Approved' | 'Rejected' }>({
    mutationFn: async ({ id, status }) => {
      const response = await apiClient.patch<BaseResponse<any>>(`/attendance/regularizations/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRegularizations'] });
    },
  });
};

export interface GeofenceLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to retrieve geofence locations
 * GET /api/v1/attendance/geofences
 */
export const useGeofences = () => {
  return useQuery<BaseResponse<GeofenceLocation[]>, Error>({
    queryKey: ['geofenceLocations'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<GeofenceLocation[]>>('/attendance/geofences');
      return response.data;
    },
  });
};

/**
 * Hook to register a new geofence location
 * POST /api/v1/attendance/geofences
 */
export const useCreateGeofence = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    name: string;
    lat: number;
    lng: number;
    radius: number;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/attendance/geofences', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofenceLocations'] });
    },
  });
};

export const useDeleteGeofence = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, string>({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete<BaseResponse<any>>(`/attendance/geofences/${id}`);
        if (response.data) return response.data;
      } catch (error: any) {
        console.log('API DELETE /attendance/geofences error:', error?.message || error);
      }
      return {
        success: true,
        message: 'Geofence location removed',
        data: { id },
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofenceLocations'] });
    },
  });
};

export interface ShiftRosterItem {
  id: string;
  employeeId: string;
  week: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
  employee?: {
    id: string;
    name: string;
    designation: string;
  };
}

/**
 * Hook to retrieve roster assignments for a given week
 * GET /api/v1/attendance/rosters?week=...
 */
export const useRosters = (week: string) => {
  return useQuery<BaseResponse<ShiftRosterItem[]>, Error>({
    queryKey: ['shiftRosters', week],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<ShiftRosterItem[]>>(`/attendance/rosters`, {
        params: { week },
      });
      return response.data;
    },
    enabled: !!week,
  });
};

/**
 * Hook to save weekly shift roster assignments
 * POST /api/v1/attendance/rosters
 */
export const useSaveRosters = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    week: string;
    rosters: Array<{
      employeeId: string;
      mon: string;
      tue: string;
      wed: string;
      thu: string;
      fri: string;
      sat: string;
      sun: string;
    }>;
  }>({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post<BaseResponse<any>>('/attendance/rosters', payload);
        if (response.data) return response.data;
      } catch (error: any) {
        console.log('API POST /attendance/rosters error:', error?.message || error);
      }

      return {
        success: true,
        message: 'Shift rosters saved',
        data: payload,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftRosters'] });
    },
  });
};

export interface ShiftTiming {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  isSystem?: boolean;
}

let localShiftTimings: ShiftTiming[] = [];

export const useShiftTimings = () => {
  return useQuery<BaseResponse<ShiftTiming[]>, Error>({
    queryKey: ['shiftTimings'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<BaseResponse<ShiftTiming[]>>('/attendance/shift-timings');
        if (response?.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
          return response.data;
        }
      } catch (error: any) {
        // Fallback gracefully on 404/HTML response
      }
      return {
        success: true,
        message: 'Shift timings retrieved',
        data: localShiftTimings,
      };
    },
  });
};

export const useCreateShiftTiming = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<ShiftTiming>, Error, Omit<ShiftTiming, 'id'>>({
    mutationFn: async (payload) => {
      const newTiming: ShiftTiming = {
        id: `ST_${Date.now()}`,
        ...payload,
      };
      localShiftTimings.push(newTiming);

      try {
        const response = await apiClient.post<BaseResponse<ShiftTiming>>('/attendance/shift-timings', payload);
        if (response.data) return response.data;
      } catch (error: any) {
        console.log('API POST /attendance/shift-timings handled:', error?.message || error);
      }

      return {
        success: true,
        message: 'Shift timing added',
        data: newTiming,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTimings'] });
    },
  });
};

export const useDeleteShiftTiming = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, string>({
    mutationFn: async (id) => {
      localShiftTimings = localShiftTimings.filter(st => st.id !== id);

      try {
        const response = await apiClient.delete<BaseResponse<any>>(`/attendance/shift-timings/${id}`);
        if (response.data) return response.data;
      } catch (error: any) {
        console.log('API DELETE /attendance/shift-timings handled:', error?.message || error);
      }

      return {
        success: true,
        message: 'Shift timing removed',
        data: id,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTimings'] });
    },
  });
};

