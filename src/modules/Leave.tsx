import {
  Check,
  Clock, Edit,
  Plus, ShieldAlert, Trash2,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useEmployees } from '../api/hook/useEmployee';
import {
  HalfDaySession,
  LeaveStatus,
  LeaveType,
  useAllocateLeave,
  useCancelLeaveRequest,
  useCreateLeaveType,
  useDeleteLeaveType,
  useLeaveAllocations,
  useLeaveRequests,
  useLeaveTypes,
  useProcessLeaveRequest,
  useSubmitLeaveRequest,
  useUpdateLeaveType
} from '../api/hook/useLeave';
import { useApp } from '../context/AppContext';


export const Leave: React.FC = () => {
  const { 
    activeSubModule, setActiveSubModule, addAuditLog, userRole, currentUser, showConfirm, showAlert 
  } = useApp();

  const roleStr = (userRole || currentUser?.role || '').toLowerCase();
  const isAdmin = roleStr.includes('admin') || roleStr.includes('ceo') || roleStr.includes('super') || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HR_ADMIN' || currentUser?.role === 'Super Admin' || currentUser?.role === 'HR Admin';
  const isManager = roleStr.includes('manager') || currentUser?.role === 'MANAGER';
  const isEmployee = !isAdmin && !isManager;
  void isEmployee;

  const userPerms: string[] = (currentUser?.permissions || []).map((p: any) => typeof p === 'string' ? p : p?.name || '');
  const hasPerm = (required: string | string[]) => {
    if (isAdmin) return true;
    if (Array.isArray(required)) {
      return required.some(p => userPerms.includes(p));
    }
    return userPerms.includes(required);
  };

  // Auto redirect employees away from approvals or admin configuration
  useEffect(() => {
    if (activeSubModule === 'approvals' && !hasPerm('UPDATE_LEAVE_APPROVAL')) {
      setActiveSubModule('apply');
    } else if (activeSubModule === 'admin' && !hasPerm(['UPDATE_LEAVE_POLICIES', 'UPDATE_LEAVE'])) {
      setActiveSubModule('apply');
    }
  }, [activeSubModule, setActiveSubModule, userPerms, isAdmin]);

  // Leave Form States
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [halfDay, setHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<HalfDaySession>('FIRST_HALF');
  const [reason, setReason] = useState('');

  // Admin Create/Update Type States
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeDesc, setTypeDesc] = useState('');
  const [typeDefaultDays, setTypeDefaultDays] = useState(12);
  const [typeCarryForward, setTypeCarryForward] = useState(false);
  const [typeMaxCarry, setTypeMaxCarry] = useState(0);

  // Quick Add Leave Type States
  const [showQuickAddType, setShowQuickAddType] = useState(false);
  const [quickTypeName, setQuickTypeName] = useState('');
  const [quickTypeCode, setQuickTypeCode] = useState('');
  const [quickTypeDays, setQuickTypeDays] = useState(10);


  // Leave Allocation States
  const [showAllocateForm, setShowAllocateForm] = useState(false);
  const [allocateTypeId, setAllocateTypeId] = useState('');
  const [allocateDays, setAllocateDays] = useState(12);
  const [allocateCarried, setAllocateCarried] = useState(0);
  const [allocateYear, setAllocateYear] = useState(new Date().getFullYear());

  // Employee Selection State for Admin/Manager
  const [selectedEmployeeIdState, setSelectedEmployeeIdState] = useState('');

  // Queries & Mutations
  const { data: dbEmployeesRes, isLoading: loadingEmployees } = useEmployees();
  const dbEmployees = dbEmployeesRes?.data || [];

  const { data: leaveTypesRes, isLoading: loadingTypes } = useLeaveTypes();
  const leaveTypes = leaveTypesRes?.data || [];

  const { data: requestsRes, isLoading: loadingRequests } = useLeaveRequests();
  const allRequests = requestsRes?.data || [];

  const createRequestMutation = useSubmitLeaveRequest();
  const processRequestMutation = useProcessLeaveRequest();
  const cancelRequestMutation = useCancelLeaveRequest();
  const createTypeMutation = useCreateLeaveType();
  const updateTypeMutation = useUpdateLeaveType();
  const deleteTypeMutation = useDeleteLeaveType();
  const allocateMutation = useAllocateLeave();

  // Setup activeUser based on selections
  useEffect(() => {
    if (currentUser) {
      const matched = dbEmployees.find(e => e.email?.toLowerCase() === currentUser?.email?.toLowerCase());
      if (matched) {
        setSelectedEmployeeIdState(matched.id);
      } else if (dbEmployees.length > 0) {
        setSelectedEmployeeIdState(dbEmployees[0].id);
      }
    } else if (dbEmployees.length > 0 && !selectedEmployeeIdState) {
      setSelectedEmployeeIdState(dbEmployees[0].id);
    }
  }, [dbEmployees, currentUser]);

  const activeUser = dbEmployees.find(e => e.id === selectedEmployeeIdState) || dbEmployees.find(e => e.email?.toLowerCase() === currentUser?.email?.toLowerCase()) || currentUser || dbEmployees[0];

  const { data: allocationsRes, isLoading: loadingAllocations } = useLeaveAllocations({
    employeeId: activeUser?.id,
  });
  const allocations = allocationsRes?.data || [];

  // Set default selected leave type
  useEffect(() => {
    if (leaveTypes.length > 0 && !selectedLeaveTypeId) {
      const active = leaveTypes.find(t => t.isActive);
      if (active) setSelectedLeaveTypeId(active.id);
    }
  }, [leaveTypes, selectedLeaveTypeId]);

  useEffect(() => {
    if (leaveTypes.length > 0 && !allocateTypeId) {
      const active = leaveTypes.find(t => t.isActive);
      if (active) setAllocateTypeId(active.id);
    }
  }, [leaveTypes, allocateTypeId]);

  // Adjust end date if half-day is toggled
  useEffect(() => {
    if (halfDay) {
      setEndDate(startDate);
    }
  }, [halfDay, startDate]);

  // Calculated Days preview
  const calculatedDays = halfDay ? 0.5 : (() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  })();

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveTypeId) {
      showAlert("Please select a leave type category.", "Missing Category", "warning");
      return;
    }
    if (!activeUser) {
      showAlert("No active employee profile selected.", "No Profile", "warning");
      return;
    }

    try {
      const payload = {
        employeeId: activeUser.id,
        leaveTypeId: selectedLeaveTypeId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        halfDay,
        halfDaySession: halfDay ? halfDaySession : null,
        reason,
      };

      const res = await createRequestMutation.mutateAsync(payload);
      addAuditLog("Applied Leave", "Leave Management", `${activeUser.name} applied for leave request: ${res.data.id}`);
      showAlert(`Leave request submitted successfully!`, "Application Submitted", "success");
      
      // Reset form
      setReason('');
      setHalfDay(false);
      setActiveSubModule('apply');
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to submit leave request.", "Submission Error", "danger");
    }
  };

  const handleApprove = async (id: string, name: string) => {
    showConfirm({
      title: "Approve Leave Request",
      message: `Are you sure you want to approve the leave request for ${name}?`,
      type: "confirm",
      confirmText: "Approve Leave",
      onConfirm: async () => {
        try {
          await processRequestMutation.mutateAsync({
            id,
            data: { status: 'APPROVED' },
          });
          addAuditLog("Approved Leave Request", "Leave Management", `Approved leave request ${id} for ${name}`);
          showAlert(`Leave request approved successfully!`, "Approved", "success");
        } catch (err: any) {
          showAlert(err.response?.data?.message || err.message || "Failed to approve request.", "Error", "danger");
        }
      }
    });
  };

  const handleReject = async (id: string, name: string) => {
    showConfirm({
      title: "Reject Leave Request",
      message: `Are you sure you want to reject the leave request for ${name}?`,
      type: "danger",
      confirmText: "Reject Leave",
      onConfirm: async () => {
        try {
          await processRequestMutation.mutateAsync({
            id,
            data: { status: 'REJECTED', rejectionReason: "Rejected by Administrator" },
          });
          addAuditLog("Rejected Leave Request", "Leave Management", `Rejected leave request ${id} for ${name}`);
          showAlert(`Leave request rejected.`, "Rejected", "info");
        } catch (err: any) {
          showAlert(err.response?.data?.message || err.message || "Failed to reject request.", "Error", "danger");
        }
      }
    });
  };

  const handleCancel = async (id: string) => {
    showConfirm({
      title: "Cancel Leave Request",
      message: "Are you sure you want to cancel this leave request?",
      type: "danger",
      confirmText: "Cancel Request",
      onConfirm: async () => {
        try {
          await cancelRequestMutation.mutateAsync(id);
          addAuditLog("Cancelled Leave Request", "Leave Management", `Cancelled leave request ${id}`);
          showAlert("Leave request cancelled successfully.", "Cancelled", "success");
        } catch (err: any) {
          showAlert(err.response?.data?.message || err.message || "Failed to cancel request.", "Error", "danger");
        }
      }
    });
  };

  const handleQuickAddTypeSave = async () => {
    if (!quickTypeName || !quickTypeCode) {
      showAlert("Name and Code are required", "Missing Input", "warning");
      return;
    }
    try {
      const res = await createTypeMutation.mutateAsync({
        name: quickTypeName,
        code: quickTypeCode.toUpperCase(),
        defaultDays: quickTypeDays,
        carryForward: false,
        maxCarryForward: 0,
      });
      addAuditLog("Created Leave Type", "Leave Management", `Quick-created new leave category: ${quickTypeName} (${quickTypeCode})`);
      if (res?.data?.id) {
        setSelectedLeaveTypeId(res.data.id);
      }
      setQuickTypeName('');
      setQuickTypeCode('');
      setQuickTypeDays(10);
      setShowQuickAddType(false);
      showAlert(`New leave category "${quickTypeName}" created successfully!`, "Category Created", "success");
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err.message || "Failed to create leave category", "Error", "danger");
    }
  };

  const handleSaveLeaveType = async (e: React.FormEvent) => {

    e.preventDefault();
    try {
      if (editingType) {
        await updateTypeMutation.mutateAsync({
          id: editingType.id,
          data: {
            name: typeName,
            code: typeCode.toUpperCase(),
            description: typeDesc,
            defaultDays: typeDefaultDays,
            carryForward: typeCarryForward,
            maxCarryForward: typeMaxCarry,
          }
        });
        addAuditLog("Updated Leave Type", "Leave Management", `Updated leave type configuration ${typeName} (${typeCode})`);
        showAlert("Leave type updated successfully!", "Updated", "success");
        setEditingType(null);
      } else {
        await createTypeMutation.mutateAsync({
          name: typeName,
          code: typeCode.toUpperCase(),
          description: typeDesc,
          defaultDays: typeDefaultDays,
          carryForward: typeCarryForward,
          maxCarryForward: typeMaxCarry,
        });
        addAuditLog("Created Leave Type", "Leave Management", `Created leave type configuration ${typeName} (${typeCode})`);
        showAlert("Leave type created successfully!", "Created", "success");
      }
      setTypeName('');
      setTypeCode('');
      setTypeDesc('');
      setTypeDefaultDays(12);
      setTypeCarryForward(false);
      setTypeMaxCarry(0);
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to save leave type.", "Error", "danger");
    }
  };

  const startEditingType = (type: LeaveType) => {
    setEditingType(type);
    setTypeName(type.name);
    setTypeCode(type.code);
    setTypeDesc(type.description || '');
    setTypeDefaultDays(type.defaultDays);
    setTypeCarryForward(type.carryForward);
    setTypeMaxCarry(type.maxCarryForward || 0);
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setTypeName('');
    setTypeCode('');
    setTypeDesc('');
    setTypeDefaultDays(12);
    setTypeCarryForward(false);
    setTypeMaxCarry(0);
  };

  const handleDeleteType = async (id: string, name: string) => {
    showConfirm({
      title: "Deactivate Leave Category",
      message: `Are you sure you want to delete/deactivate "${name}" leave type?`,
      type: "danger",
      confirmText: "Deactivate",
      onConfirm: async () => {
        try {
          await deleteTypeMutation.mutateAsync(id);
          addAuditLog("Deactivated Leave Type", "Leave Management", `Deactivated leave type ${name}`);
          showAlert("Leave type deactivated/deleted successfully!", "Deactivated", "success");
        } catch (err: any) {
          showAlert(err.response?.data?.message || err.message || "Failed to delete leave type.", "Error", "danger");
        }
      }
    });
  };

  const handleAllocateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateTypeId) {
      showAlert("Please select a leave category to allocate.", "Missing Category", "warning");
      return;
    }
    if (!activeUser) {
      showAlert("No active employee resolved for allocation.", "Missing Profile", "warning");
      return;
    }
    try {
      await allocateMutation.mutateAsync({
        employeeId: activeUser.id,
        leaveTypeId: allocateTypeId,
        allocated: allocateDays,
        carriedForward: allocateCarried,
        year: allocateYear,
      });
      addAuditLog("Allocated Leave", "Leave Management", `Allocated ${allocateDays} days of ${leaveTypes.find(t => t.id === allocateTypeId)?.name} for ${activeUser.name}`);
      showAlert("Leave allocation updated successfully!", "Allocation Updated", "success");
      setShowAllocateForm(false);
      
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to allocate leaves.", "Error", "danger");
    }
  };

  const renderStatusBadge = (status: LeaveStatus) => {
    const base = "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase transition-all ";
    switch (status) {
      case 'APPROVED':
        return <span className={base + "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"}>Approved</span>;
      case 'PENDING':
        return <span className={base + "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse"}>Pending</span>;
      case 'REJECTED':
        return <span className={base + "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"}>Rejected</span>;
      case 'CANCELLED':
        return <span className={base + "bg-slate-150 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}>Cancelled</span>;
      default:
        return <span className={base + "bg-slate-100 text-slate-800"}>{status}</span>;
    }
  };

  if (loadingEmployees || loadingTypes || loadingRequests) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Clock className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-450 animate-pulse">
          Loading Leave Portal data...
        </p>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="p-6 text-center text-slate-400">
        No active employee profile resolved. Please check your account details.
      </div>
    );
  }

  // Filter pending requests for approval console based on roles and hierarchy
  const pendingRequests = allRequests.filter(req => {
    if (req.status !== 'PENDING') return false;
    if (userRole === 'Super Admin' || userRole === 'HR Admin') {
      return true;
    }
    if (userRole === 'Manager') {
      const applicant = dbEmployees.find(e => e.id === req.employeeId);
      return applicant?.managerId === activeUser?.id;
    }
    return false;
  });

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
        <button 
          onClick={() => setActiveSubModule('apply')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'apply' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Apply / Balance
        </button>
        {(isAdmin || isManager || hasPerm('UPDATE_LEAVE_APPROVAL')) && (
          <button 
            onClick={() => setActiveSubModule('approvals')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeSubModule === 'approvals' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Leave Approvals console
          </button>
        )}
        <button 
          onClick={() => setActiveSubModule('calendar')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'calendar' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Leave Calendar
        </button>
        <button 
          onClick={() => setActiveSubModule('policies')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'policies' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Leave Policies
        </button>
        {(isAdmin || hasPerm(['UPDATE_LEAVE_POLICIES', 'UPDATE_LEAVE'])) && (
          <button 
            onClick={() => setActiveSubModule('admin')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeSubModule === 'admin' 
                ? 'border-primary text-primary font-bold' 
                : 'border-transparent text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300'
            }`}
          >
            Leave Configurations
          </button>
        )}
      </div>

      {/* ======================================= */}
      {/* 1. APPLY LEAVE & BALANCE                */}
      {/* ======================================= */}
      {activeSubModule === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Apply Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            {isAdmin && dbEmployees.length > 0 && (
              <div className="space-y-1 pb-3 border-b border-slate-200 dark:border-slate-800">
                <label className="text-slate-400 font-semibold block mb-1">View/Manage leaves for:</label>
                <select
                  value={selectedEmployeeIdState}
                  onChange={(e) => setSelectedEmployeeIdState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none font-bold"
                >
                  {dbEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} • {(emp.department?.name || (typeof emp.department === 'string' ? emp.department : '') || 'IT')} ({emp.designation || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              Apply for Leave {isAdmin && `(${activeUser.name})`}
            </h3>
            
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-medium">Leave Type Category</label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowQuickAddType(!showQuickAddType)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" /> Quick Add
                    </button>
                  )}
                </div>
                {loadingTypes ? (
                  <div className="h-9 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ) : (
                  <select 
                    value={selectedLeaveTypeId} 
                    onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    {leaveTypes.filter(t => t.isActive).length === 0 ? (
                      <option value="">No Active Leave Categories Available</option>
                    ) : (
                      <>
                        <option value="" disabled>Select Leave Type Category</option>
                        {leaveTypes.filter(t => t.isActive).map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({type.code})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                )}

                {showQuickAddType && isAdmin && (
                  <div className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-lg space-y-2 mt-2 animate-fade-in">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] block">Quick Add Leave Category</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text"
                        placeholder="Name (e.g. Paternity)"
                        value={quickTypeName}
                        onChange={(e) => setQuickTypeName(e.target.value)}
                        className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded text-[11px] bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:outline-none"
                      />
                      <input 
                        type="text"
                        placeholder="Code (e.g. PT)"
                        value={quickTypeCode}
                        onChange={(e) => setQuickTypeCode(e.target.value)}
                        className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded text-[11px] bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 uppercase focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="number"
                        placeholder="Days (e.g. 10)"
                        value={quickTypeDays === 0 ? '' : quickTypeDays}
                        onChange={(e) => setQuickTypeDays(Number(e.target.value))}
                        className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded text-[11px] bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={createTypeMutation.isPending}
                          onClick={handleQuickAddTypeSave}
                          className="flex-1 bg-primary text-white text-[11px] rounded font-bold hover:bg-primary/95 transition-all"
                        >
                          {createTypeMutation.isPending ? "..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuickAddType(false);
                            setQuickTypeName('');
                            setQuickTypeCode('');
                            setQuickTypeDays(10);
                          }}
                          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-[11px] rounded hover:bg-slate-300 transition-all text-slate-700 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="halfDayToggle"
                  checked={halfDay}
                  onChange={(e) => setHalfDay(e.target.checked)}
                  className="rounded text-primary border-slate-350"
                />
                <label htmlFor="halfDayToggle" className="text-slate-500 font-semibold cursor-pointer">
                  Request for Half Day
                </label>
              </div>

              {halfDay && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-slate-400 font-medium">Session Session</label>
                  <select
                    value={halfDaySession}
                    onChange={(e) => setHalfDaySession(e.target.value as HalfDaySession)}
                    className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-955 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="FIRST_HALF">First Half Session</option>
                    <option value="SECOND_HALF">Second Half Session</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    disabled={halfDay}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Total Days Preview</label>
                <div className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-100 dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-200">
                  {calculatedDays} Days
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Reason for Leave</label>
                <textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide brief explanation..." 
                  rows={3} 
                  required 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>

              <button 
                type="submit" 
                disabled={createRequestMutation.isPending}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/10 hover:scale-105 transition-all disabled:opacity-50"
              >
                {createRequestMutation.isPending ? "Submitting..." : "Apply Leave Request"}
              </button>
            </form>
          </div>

          {/* Leave Balances & History */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between items-center">
              <span>Accrued Leave Balances</span>
              {isAdmin && (
                <button 
                  onClick={() => setShowAllocateForm(!showAllocateForm)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> {showAllocateForm ? "Hide Allocate Panel" : "Allocate Leaves"}
                </button>
              )}
            </h3>
            
            {showAllocateForm && isAdmin && (
              <form onSubmit={handleAllocateLeave} className="p-4 border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-xl space-y-3.5 animate-fade-in">
                <span className="font-bold text-slate-800 dark:text-white text-xs block">Allocate / Adjust Leave Balance</span>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Leave Type</label>
                    <select
                      value={allocateTypeId}
                      onChange={(e) => setAllocateTypeId(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
                    >
                      {leaveTypes.filter(t => t.isActive).length === 0 ? (
                        <option value="">No Active Categories</option>
                      ) : (
                        <>
                          <option value="" disabled>Select Category</option>
                          {leaveTypes.filter(t => t.isActive).map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                          ))}
                        </>
                      )}
                    </select>

                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Allocated Days</label>
                    <input
                      type="number"
                      value={allocateDays}
                      onChange={(e) => setAllocateDays(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Carried Forward</label>
                    <input
                      type="number"
                      value={allocateCarried}
                      onChange={(e) => setAllocateCarried(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-755 dark:text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Year</label>
                    <input
                      type="number"
                      value={allocateYear}
                      onChange={(e) => setAllocateYear(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-755 dark:text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAllocateForm(false)}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={allocateMutation.isPending}
                    className="px-3 py-1.5 bg-primary text-white rounded-lg font-bold shadow-md shadow-primary/10 transition-all hover:scale-102"
                  >
                    {allocateMutation.isPending ? "Saving..." : "Save Allocation"}
                  </button>
                </div>
              </form>
            )}

            {loadingAllocations ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 animate-pulse h-24" />
                ))}
              </div>
            ) : allocations.length === 0 ? (
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-center text-slate-400">
                No leave allocations configured for this year. Leave requests will auto-provision standard default balances.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {allocations.map((alloc) => {
                  const total = alloc.allocated + alloc.carriedForward;
                  const available = total - (alloc.used + alloc.pending);
                  return (
                    <div key={alloc.id} className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                      <span className="text-slate-400 dark:text-slate-400 font-bold uppercase block text-[10px]">{alloc.leaveType?.name}</span>
                      <p className="text-lg font-black mt-1 text-slate-800 dark:text-white">
                        {available} / {total} Days Available
                      </p>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-800 pt-1">
                        <span>Used: {alloc.used}d</span>
                        <span>Pending: {alloc.pending}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 space-y-3">
              <span className="font-bold text-slate-800 dark:text-white text-xs block">Leave Request Log ({activeUser.name})</span>
              {loadingRequests ? (
                <div className="space-y-2">
                  {[1, 2].map(n => (
                    <div key={n} className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : allRequests.filter(r => r.employeeId === activeUser.id).length === 0 ? (
                <p className="text-slate-400 text-center py-6">No leave requests submitted for this employee.</p>
              ) : (
                allRequests.filter(r => r.employeeId === activeUser.id).map((req) => {
                  const startStr = new Date(req.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                  const endStr = new Date(req.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                  const appliedStr = new Date(req.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  return (
                    <div key={req.id} className="p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-white">{req.leaveType?.name || 'Leave'}</span>
                          <span className="text-[10px] text-slate-400">Applied: {appliedStr}</span>
                          {req.halfDay && (
                            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.2 rounded text-[8px] font-bold">
                              Half-day ({req.halfDaySession === 'FIRST_HALF' ? '1st Half' : '2nd Half'})
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                          {startStr} to {endStr} ({req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}) • Reason: "{req.reason}"
                        </p>
                        {req.rejectionReason && (
                          <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 font-semibold">
                            Rejection Note: "{req.rejectionReason}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5">
                        {renderStatusBadge(req.status)}
                        {['PENDING', 'APPROVED'].includes(req.status) && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-red-500"
                            title="Cancel request"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}      {/* ======================================= */}
      {/* 2. LEAVE APPROVALS CONSOLE              */}
      {/* ======================================= */}
      {activeSubModule === 'approvals' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in text-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
            <span>Pending Team Leave Requests</span>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
              {pendingRequests.length} Pending
            </span>
          </h3>

          <div className="space-y-3">
            {loadingRequests ? (
              <div className="space-y-2">
                {[1, 2].map(n => (
                  <div key={n} className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-slate-400 text-center py-6">All leave applications have been processed.</p>
            ) : (
              pendingRequests.map((req) => {
                const startStr = new Date(req.startDate).toLocaleDateString();
                const endStr = new Date(req.endDate).toLocaleDateString();
                const appliedStr = new Date(req.appliedDate).toLocaleDateString();
                return (
                  <div key={req.id} className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">{req.employee?.name || 'Unknown'}</span>
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                          {req.leaveType?.name}
                        </span>
                        {req.halfDay && (
                          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 px-2 py-0.2 rounded text-[8px] font-bold">
                            Half-day
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Duration: <span className="font-semibold text-slate-700 dark:text-slate-300">{startStr} to {endStr}</span> ({req.totalDays} days) • Applied: {appliedStr}
                      </p>
                      <p className="text-slate-400 dark:text-slate-400 mt-0.5">Reason: "{req.reason}"</p>
                    </div>
                    
                    {userRole === 'Employee' ? (
                      <span className="text-slate-400 font-bold uppercase text-[9px] flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5 text-slate-400" /> Awaiting Manager Actions
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprove(req.id, req.employee?.name || 'Employee')}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(req.id, req.employee?.name || 'Employee')}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 3. LEAVE CALENDAR                       */}
      {/* ======================================= */}
      {activeSubModule === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in text-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Calendar Leave View</h3>
          
          <div className="bg-slate-50 dark:bg-slate-950 p-4 border rounded-xl space-y-3.5">
            <span className="font-bold text-slate-700 dark:text-slate-350 block">Approved Leave Tracks</span>
            <div className="space-y-2">
              {loadingRequests ? (
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              ) : allRequests.filter(r => r.status === 'APPROVED').length === 0 ? (
                <p className="text-slate-400 italic text-[10px]">No active approved leave records in the system.</p>
              ) : (
                allRequests.filter(r => r.status === 'APPROVED').map(req => {
                  const startStr = new Date(req.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  const endStr = new Date(req.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  return (
                    <div key={req.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-slate-900 border rounded-lg shadow-sm">
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {req.employee?.name || 'Employee'} — <span className="text-slate-500">{req.leaveType?.name}</span>
                      </span>
                      <span className="text-[10px] text-slate-450 font-medium">
                        {startStr} - {endStr} ({req.totalDays} Days) • Approved
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 4. LEAVE POLICIES                       */}
      {/* ======================================= */}
      {activeSubModule === 'policies' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in text-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Corporate Leave Rules & Policies</h3>
          
          <div className="space-y-4">
            {loadingTypes ? (
              <div className="space-y-2">
                {[1, 2].map(n => (
                  <div key={n} className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : leaveTypes.length === 0 ? (
              <p className="text-slate-400 text-center">No leave policies defined. Configure leave types to automatically populate policies.</p>
            ) : (
              leaveTypes.map((type) => (
                <div key={type.id} className="p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                    <span>{type.name} ({type.code}) Policy</span>
                    <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-bold">
                      Default: {type.defaultDays} Days/Year
                    </span>
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    {type.description || `Standard corporate allowance for ${type.name}.`}
                  </p>
                  <div className="flex gap-4 text-[9px] text-slate-400 dark:text-slate-400 pt-1">
                    <span>Carry Forward: {type.carryForward ? `Yes (Max: ${type.maxCarryForward ?? 0} days)` : "No"}</span>
                    <span>Status: {type.isActive ? "Active Policy" : "Deactivated"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
        {/* ======================================= */}
      {/* 5. LEAVE CONFIGURATIONS (ADMIN ONLY)     */}
      {/* ======================================= */}
      {activeSubModule === 'admin' && (isAdmin || hasPerm(['UPDATE_LEAVE_POLICIES', 'UPDATE_LEAVE'])) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Create/Edit Configuration Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">
              {editingType ? `Edit Leave Type: ${editingType.name}` : "Add New Leave Type"}
            </h3>
            
            <form onSubmit={handleSaveLeaveType} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Leave Type Name</label>
                <input 
                  type="text" 
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Maternity Leave"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Short Code</label>
                <input 
                  type="text" 
                  value={typeCode}
                  onChange={(e) => setTypeCode(e.target.value)}
                  placeholder="e.g. MTL"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 uppercase font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Description / Rules</label>
                <textarea 
                  value={typeDesc}
                  onChange={(e) => setTypeDesc(e.target.value)}
                  placeholder="Describe rules, rollovers, or criteria..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Default Days Allotted</label>
                <input 
                  type="number" 
                  value={typeDefaultDays}
                  onChange={(e) => setTypeDefaultDays(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="carryForwardToggle"
                  checked={typeCarryForward}
                  onChange={(e) => setTypeCarryForward(e.target.checked)}
                  className="rounded text-primary border-slate-350"
                />
                <label htmlFor="carryForwardToggle" className="text-slate-500 dark:text-slate-400 font-semibold cursor-pointer">
                  Carry Forward Unused Leaves
                </label>
              </div>

              {typeCarryForward && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-slate-400 font-medium">Max Carry Forward (Days)</label>
                  <input 
                    type="number" 
                    value={typeMaxCarry}
                    onChange={(e) => setTypeMaxCarry(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-semibold"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 hover:scale-105 transition-all disabled:opacity-50"
                >
                  {createTypeMutation.isPending || updateTypeMutation.isPending 
                    ? "Saving..." 
                    : editingType ? "Update Configuration" : "Save Configuration"}
                </button>
                {editingType && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="py-2.5 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all hover:scale-105"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Configuration List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Active Configurations</h3>
            
            <div className="space-y-3">
              {leaveTypes.map((type) => (
                <div key={type.id} className="p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950 gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span>{type.name}</span>
                      <span className="px-2 py-0.2 bg-slate-200 dark:bg-slate-800 rounded text-[9px] text-slate-700 dark:text-slate-300 font-bold">{type.code}</span>
                      {!type.isActive && <span className="px-2 py-0.2 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 rounded text-[9px] font-bold">Inactive</span>}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Default days: {type.defaultDays} • Carry-forward: {type.carryForward ? `Yes (Max: ${type.maxCarryForward ?? 0}d)` : "No"}
                    </p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => startEditingType(type)}
                      className="p-2 text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      title="Edit Configuration"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteType(type.id, type.name)}
                      disabled={deleteTypeMutation.isPending}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Deactivate or Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

