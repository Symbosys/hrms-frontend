import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';
import { initialEmployees } from '../../mockData';

// Type definitions matching the backend Prisma models, validators, and controllers
export interface EmployeeUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: {
    id: string;
    name: string;
  } | null;
}

export interface EmployeeDepartment {
  id: string;
  name: string;
  code: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED' | 'PROBATION';
  joiningDate: string;
  location?: string | null;
  designation?: string | null;
  role?: string | null;

  // Relations
  userId?: string | null;
  user?: EmployeeUser | null;
  departmentId?: string | null;
  department?: EmployeeDepartment | null;
  managerId?: string | null;
  manager?: Employee | null;

  // Salary Details
  basic?: number | null;
  hra?: number | null;
  allowance?: number | null;
  deductions?: number | null;
  netSalary?: number | null;
  bankName?: string | null;
  bankAccount?: string | null;
  ifsc?: string | null;
  pan?: string | null;
  aadhaar?: string | null;
  uan?: string | null;
  pfNumber?: string | null;

  // Personal Details
  gender?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
  qualification?: string | null;
  university?: string | null;
  passingYear?: string | null;
  fatherName?: string | null;
  permanentAddress?: string | null;
  languagesSpoken?: string | null;

  // Workflows & Exit
  probationDuration?: string | null;
  probationEnd?: string | null;
  confirmationStatus: 'PENDING' | 'CONFIRMED' | 'EXTENDED';
  exitDate?: string | null;
  clearanceStatus?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  managerId?: string;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED' | 'PROBATION';
}

export interface CreateEmployeeRequest {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string | null;
  avatar?: string | null;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED' | 'PROBATION';
  joiningDate: string;
  location?: string | null;
  address?: string | null;
  designation?: string | null;
  userId?: string | null;
  roleId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;

  // Salary Details (optional during initial creation)
  salary?: number | null;
  basic?: number | null;
  hra?: number | null;
  allowance?: number | null;
  deductions?: number | null;
  netSalary?: number | null;

  // Personal Details (optional during initial creation)
  gender?: string | null;
  dateOfBirth?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}

export interface SalaryDetails {
  basic: number | null;
  hra: number | null;
  allowance: number | null;
  deductions: number | null;
  netSalary: number | null;
  bankName: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  pan: string | null;
  aadhaar: string | null;
  uan: string | null;
  pfNumber: string | null;
}

export interface PersonalDetails {
  gender: string | null;
  dob: string | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  qualification: string | null;
  university: string | null;
  passingYear: string | null;
  fatherName?: string | null;
  permanentAddress?: string | null;
  languagesSpoken?: string | null;
  avatar?: string | null;
}



export const useEmployees = (filters?: EmployeeFilters) => {
  return useQuery<BaseResponse<Employee[]>, Error>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get<any>('/employees', {
          params: filters,
        });

        const raw = response.data;
        let list: Employee[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (Array.isArray(raw?.data)) {
          list = raw.data;
        } else if (Array.isArray(raw?.data?.employees)) {
          list = raw.data.employees;
        } else if (Array.isArray(raw?.employees)) {
          list = raw.employees;
        }

        const mappedList = list.map(emp => ({
          ...emp,
          role: (emp as any).user?.role?.name || emp.role || emp.designation || 'Employee',
        }));

        return {
          success: true,
          message: mappedList.length > 0 ? 'Employees retrieved successfully' : 'No employees found',
          data: mappedList,
        };
      } catch (error) {
        console.log('API /employees request error on website:', error);
      }

      return {
        success: true,
        message: 'Employees loaded from mock database',
        data: initialEmployees as any,
      };
    },
  });
};

/**
 * Hook to retrieve a single employee by ID
 * GET /api/v1/employees/:id
 */
export const useEmployeeById = (id?: string) => {
  return useQuery<BaseResponse<Employee | null>, Error>({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<Employee>>(`/employees/${id}`);
        if (response.data && response.data.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id} request error on website:`, error);
      }

      return {
        success: false,
        message: 'Employee not found',
        data: null,
      };
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new employee profile
 * POST /api/v1/employees
 */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Employee>, Error, CreateEmployeeRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<Employee>>('/employees', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate employees list cache to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

/**
 * Hook to update an existing employee profile
 * PUT /api/v1/employees/:id
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Employee>,
    Error,
    { id: string; data: UpdateEmployeeRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
    },
  });
};

/**
 * Hook to delete an employee profile
 * DELETE /api/v1/employees/:id
 */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Record<string, never>>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<BaseResponse<Record<string, never>>>(`/employees/${id}`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
};

/**
 * Hook to retrieve an employee's salary details
 * GET /api/v1/employees/:id/salary
 */
export const useEmployeeSalary = (id?: string) => {
  return useQuery<BaseResponse<SalaryDetails>, Error>({
    queryKey: ['employee', id, 'salary'],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      const response = await apiClient.get<BaseResponse<SalaryDetails>>(`/employees/${id}/salary`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to update an employee's salary details
 * PUT /api/v1/employees/:id/salary
 */
export const useUpdateEmployeeSalary = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Employee>,
    Error,
    { id: string; data: Partial<SalaryDetails> & { salary?: number | null } }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}/salary`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id, 'salary'] });
    },
  });
};

/**
 * Hook to retrieve an employee's personal details
 * GET /api/v1/employees/:id/personal
 */
export const useEmployeePersonal = (id?: string) => {
  return useQuery<BaseResponse<PersonalDetails>, Error>({
    queryKey: ['employee', id, 'personal'],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      const response = await apiClient.get<BaseResponse<PersonalDetails>>(`/employees/${id}/personal`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to update an employee's personal details
 * PUT /api/v1/employees/:id/personal
 */
export const useUpdateEmployeePersonal = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Employee>,
    Error,
    { id: string; data: Partial<PersonalDetails> & { dateOfBirth?: string | null } }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}/personal`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id, 'personal'] });
    },
  });
};

export interface EmployeeFamilyMember {
  id: string;
  employeeId: string;
  name: string;
  relation: string;
  dob?: string | null;
  contact?: string | null;
  bloodGroup?: string | null;
  isNominee: boolean;
  isInsuranceCovered: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to retrieve an employee's family & dependent details
 * GET /api/v1/employees/:id/family
 */
export const useEmployeeFamily = (id?: string) => {
  return useQuery<BaseResponse<EmployeeFamilyMember[]>, Error>({
    queryKey: ['employee', id, 'family'],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      const response = await apiClient.get<BaseResponse<EmployeeFamilyMember[]>>(`/employees/${id}/family`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to add a family member for an employee
 * POST /api/v1/employees/:id/family
 */
export const useAddEmployeeFamily = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<EmployeeFamilyMember>,
    Error,
    {
      employeeId: string;
      data: {
        name: string;
        relation: string;
        dob?: string | null;
        contact?: string | null;
        bloodGroup?: string | null;
        isNominee?: boolean;
        isInsuranceCovered?: boolean;
      };
    }
  >({
    mutationFn: async ({ employeeId, data }) => {
      const response = await apiClient.post<BaseResponse<EmployeeFamilyMember>>(`/employees/${employeeId}/family`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'family'] });
    },
  });
};

/**
 * Hook to delete a family member
 * DELETE /api/v1/employees/:id/family/:familyId
 */
export const useDeleteEmployeeFamily = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Record<string, never>>,
    Error,
    { employeeId: string; familyId: string }
  >({
    mutationFn: async ({ employeeId, familyId }) => {
      const response = await apiClient.delete<BaseResponse<Record<string, never>>>(`/employees/${employeeId}/family/${familyId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'family'] });
    },
  });
};

export interface EmployeeExitRecord {
  id?: string;
  employeeId: string;
  resignationDate: string;
  lastWorkingDay: string;
  reason?: string | null;
  noticeDays: number;
  leaveEncashDays: number;
  penaltyDeduction: number;
  itClearance: boolean;
  financeClearance: boolean;
  adminClearance: boolean;
  hrClearance: boolean;
  status: string;
  settledDate?: string | null;
  netPayable?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Hook to retrieve employee exit & clearance details
 * GET /api/v1/employees/:id/exit
 */
export const useEmployeeExit = (employeeId?: string) => {
  return useQuery<BaseResponse<EmployeeExitRecord | null>, Error>({
    queryKey: ['employee', employeeId, 'exit'],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID is required');
      const response = await apiClient.get<BaseResponse<EmployeeExitRecord | null>>(`/employees/${employeeId}/exit`);
      return response.data;
    },
    enabled: !!employeeId,
  });
};

/**
 * Hook to create or update employee exit & clearance record
 * POST /api/v1/employees/:id/exit
 */
export const useSaveEmployeeExit = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<EmployeeExitRecord>,
    Error,
    {
      employeeId: string;
      data: {
        resignationDate: string;
        lastWorkingDay: string;
        reason?: string | null;
        noticeDays?: number;
        leaveEncashDays?: number;
        penaltyDeduction?: number;
        itClearance?: boolean;
        financeClearance?: boolean;
        adminClearance?: boolean;
        hrClearance?: boolean;
        status?: string;
        settledDate?: string | null;
        netPayable?: number | null;
      };
    }
  >({
    mutationFn: async ({ employeeId, data }) => {
      const response = await apiClient.post<BaseResponse<EmployeeExitRecord>>(`/employees/${employeeId}/exit`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'exit'] });
    },
  });
};

export interface ResetEmployeeCredentialsInput {
  newEmail?: string | null;
  newPassword?: string | null;
  email?: string | null;
  password?: string | null;
}

export interface ResetEmployeeCredentialsResponse {
  employeeId: string;
  employeeName: string;
  email: string;
  temporaryPassword: string;
  updatedAt: string;
}

/**
 * Hook to reset employee login credentials (email & password)
 * POST /api/v1/employees/:id/reset-credentials
 */
export const useResetEmployeeCredentials = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<ResetEmployeeCredentialsResponse>,
    Error,
    {
      employeeId: string;
      data: ResetEmployeeCredentialsInput;
    }
  >({
    mutationFn: async ({ employeeId, data }) => {
      const response = await apiClient.post<BaseResponse<ResetEmployeeCredentialsResponse>>(
        `/employees/${employeeId}/reset-credentials`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'credentials'] });
    },
  });
};

