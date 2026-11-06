import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Type definitions matching backend controller schemas and database models
export interface User {
  id: string;
  employeeId?: string | null;
  name: string;
  email: string | null;
  phone: string;
  role?: string;
  designation?: string | null;
  avatar?: string | null;
  image?: string | null;
  organizationLogo?: string | null;
  permissions?: string[];
  organizationId?: string | null;
}

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponseData {
  phone: string;
  otp?: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponseData {
  user: User;
  token: string;
  isRegistered: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface RegisterResponseData {
  user: User;
  token: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password?: string;
}

export interface LoginResponseData {
  user: User;
  token: string;
}

export interface ProfileResponseData {
  user: User;
}

/**
 * Hook to send OTP to user's phone number
 * POST /api/v1/auth/send-otp
 */
export const useSendOtp = () => {
  return useMutation<BaseResponse<SendOtpResponseData>, Error, SendOtpRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<SendOtpResponseData>>('/auth/send-otp', data);
      return response.data;
    },
  });
};

/**
 * Hook to verify OTP code and login
 * POST /api/v1/auth/verify-otp
 */
export const useVerifyOtp = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<VerifyOtpResponseData>, Error, VerifyOtpRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<VerifyOtpResponseData>>('/auth/verify-otp', data);
      return response.data;
    },
    onSuccess: (response) => {
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

/**
 * Hook to register a new user
 * POST /api/v1/auth/register
 */
export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<RegisterResponseData>, Error, RegisterRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<RegisterResponseData>>('/auth/register', data);
      return response.data;
    },
    onSuccess: (response) => {
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

/**
 * Hook to log in with email/phone and password
 * POST /api/v1/auth/login
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<LoginResponseData>, Error, LoginRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<LoginResponseData>>('/auth/login', data);
      return response.data;
    },
    onSuccess: (response) => {
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

/**
 * Hook to fetch the currently authenticated user's profile
 * GET /api/v1/auth/profile
 */
export const useProfile = () => {
  const token = localStorage.getItem('token');

  return useQuery<BaseResponse<ProfileResponseData>, Error>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<ProfileResponseData>>('/auth/profile');
      return response.data;
    },
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom helper hook to sign out/clear session data
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem('token');
    queryClient.clear();
  };
};
