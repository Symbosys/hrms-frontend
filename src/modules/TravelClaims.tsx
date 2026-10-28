import {
  Check,
  Compass,
  FileText,
  Paperclip,
  Upload,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useEmployees } from '../api/hook/useEmployee';
import {
  useApplyClaim,
  useClaims,
  useUpdateClaimStatus
} from '../api/hook/useTravelClaims';
import { useApp } from '../context/AppContext';

export const TravelClaims: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, userRole, currentUser, showConfirm, showAlert } = useApp();
  const roleStr = (userRole || currentUser?.role || '').toLowerCase();
  const isAdmin = roleStr.includes('admin') || roleStr.includes('ceo') || roleStr.includes('super') || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HR_ADMIN' || currentUser?.role === 'Super Admin' || currentUser?.role === 'HR Admin';
  const isManager = roleStr.includes('manager') || currentUser?.role === 'MANAGER';
  const isEmployee = !isAdmin && !isManager;

  const userPerms: string[] = (currentUser?.permissions || []).map((p: any) => typeof p === 'string' ? p : p?.name || '');
  const hasPerm = (required: string | string[]) => {
    if (isAdmin) return true;
    if (Array.isArray(required)) {
      return required.some(p => userPerms.includes(p));
    }
    return userPerms.includes(required);
  };

  // Auto redirect employees away from approvals
  useEffect(() => {
    if (activeSubModule === 'approvals' && !isAdmin && !isManager && !hasPerm('UPDATE_CLAIM_APPROVAL')) {
      setActiveSubModule('apply-claim');
    }
  }, [isAdmin, isManager, userPerms, activeSubModule, setActiveSubModule]);

  // Active employee context (for simulation)
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Fetch employees list
  const { data: dbEmployeesRes, isLoading: employeesLoading } = useEmployees();
  const employeesList = dbEmployeesRes?.data || [];

  // Automatically select logged in employee as current user
  useEffect(() => {
    if (employeesList.length > 0) {
      if (isEmployee && currentUser) {
        const myEmp = employeesList.find(e => 
          (currentUser.id && e.id === currentUser.id) ||
          (currentUser.email && e.email?.toLowerCase() === currentUser.email?.toLowerCase())
        );
        if (myEmp) {
          setSelectedEmpId(myEmp.id);
          return;
        }
      }
      if (!selectedEmpId) {
        setSelectedEmpId(employeesList[0].id);
      }
    }
  }, [employeesList, selectedEmpId, isEmployee, currentUser]);

  const activeEmployee = employeesList.find(emp => emp.id === selectedEmpId);

  // Check if simulated user has approval permissions
  const isApprover = activeEmployee?.user?.role?.name === 'SUPER_ADMIN' || 
                     activeEmployee?.user?.role?.name === 'HR_ADMIN' || 
                     activeEmployee?.designation?.toUpperCase().includes('MANAGER') || 
                     activeEmployee?.designation?.toUpperCase().includes('LEAD') || 
                     activeEmployee?.designation?.toUpperCase().includes('DIRECTOR') ||
                     activeEmployee?.designation?.toUpperCase().includes('HEAD');
  void isApprover;

  // Queries
  const { data: claimsRes, isLoading: claimsLoading } = useClaims(
    activeSubModule === 'my-claims' ? { employeeId: selectedEmpId } : undefined
  );
  const claimsList = claimsRes?.data || [];

  // Mutations
  const applyClaimMut = useApplyClaim();
  const updateStatusMut = useUpdateClaimStatus();

  // Request form state
  const [claimType, setClaimType] = useState<'Travel' | 'Mileage' | 'Food' | 'Accommodation' | 'Other'>('Travel');
  const [amount, setAmount] = useState(1500);
  const [date, setDate] = useState('2026-07-01');
  const [reason, setReason] = useState('Uber Cab to Client office BKC');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Approval status filter state
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleApplyClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !activeEmployee) return;

    showConfirm({
      title: "Confirm Travel Claim",
      message: `Are you sure you want to submit a ${claimType} claim of ₹${amount} for "${reason}"?`,
      type: "confirm",
      confirmText: "Submit Claim",
      onConfirm: () => {
        applyClaimMut.mutate({
          employeeId: selectedEmpId,
          type: claimType,
          amount,
          date,
          reason,
          receiptUrl: receiptFile ? receiptFile.name : null,
        }, {
          onSuccess: () => {
            addAuditLog("Applied Claim", "Travel & Claims", `${activeEmployee.name} submitted expense claim of ₹${amount} for ${reason}`);
            showAlert(`Expense claim submitted successfully!`, "Claim Submitted", "success");
            
            setReason('');
            setAmount(1500);
            setReceiptFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setActiveSubModule('my-claims');
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to submit claim", "Claim Error", "danger");
          }
        });
      }
    });
  };

  const handleApprove = (id: string, name: string, amt: number) => {
    showConfirm({
      title: "Approve Expense Claim",
      message: `Are you sure you want to approve expense claim of ₹${amt} for ${name}?`,
      type: "confirm",
      confirmText: "Approve Claim",
      onConfirm: () => {
        updateStatusMut.mutate({ id, status: 'Approved' }, {
          onSuccess: () => {
            addAuditLog("Approved Claim", "Travel & Claims", `Approved expense claim ${id} of ₹${amt} for ${name}`);
            showAlert(`Approved claim for ₹${amt}.`, "Claim Approved", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to update claim status", "Error", "danger");
          }
        });
      }
    });
  };

  const handleReject = (id: string, name: string, amt: number) => {
    showConfirm({
      title: "Reject Expense Claim",
      message: `Are you sure you want to reject expense claim of ₹${amt} for ${name}?`,
      type: "danger",
      confirmText: "Reject Claim",
      onConfirm: () => {
        updateStatusMut.mutate({ id, status: 'Rejected' }, {
          onSuccess: () => {
            addAuditLog("Rejected Claim", "Travel & Claims", `Rejected expense claim ${id} of ₹${amt} for ${name}`);
            showAlert(`Rejected claim for ₹${amt}.`, "Claim Rejected", "info");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to update claim status", "Error", "danger");
          }
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveSubModule('apply-claim')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'apply-claim' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          New Travel Request
        </button>
        <button 
          onClick={() => setActiveSubModule('my-claims')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'my-claims' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          My Reimbursements
        </button>
        {(isAdmin || isManager || hasPerm('UPDATE_CLAIM_APPROVAL')) && (
          <button 
            onClick={() => setActiveSubModule('approvals')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeSubModule === 'approvals' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Claim Approvals
          </button>
        )}
      </div>

      {/* Global Simulated User Switcher */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Simulate as Employee</h4>
            <p className="text-slate-450 mt-0.5">Switch employees to submit claims or view approval options depending on managerial permissions.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3.5 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
          >
            {employeesLoading ? (
              <option>Loading employees...</option>
            ) : (
              employeesList.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.designation || 'Staff'})
                </option>
              ))
            )}
          </select>

          {activeEmployee && (
            <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl font-bold uppercase text-[10px]">
              {activeEmployee.department?.name || 'Operations'}
            </span>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* 1. APPLY CLAIM / TRAVEL REQUEST         */}
      {/* ======================================= */}
      {activeSubModule === 'apply-claim' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Submit Expense Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center gap-1.5">
              <Compass className="h-4.5 w-4.5 text-primary" />
              <span>Submit Expense Claim</span>
            </h3>
            
            <form onSubmit={handleApplyClaim} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Expense Category</label>
                <select 
                  value={claimType} 
                  onChange={(e) => setClaimType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Travel">Domestic Travel (Cab/Air/Train)</option>
                  <option value="Mileage">Mileage Reimbursement (Fuel)</option>
                  <option value="Food">Meals & Food hosting</option>
                  <option value="Accommodation">Hotel & Lodging</option>
                  <option value="Other">Miscellaneous Expenses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Total Amount (INR)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Expense Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Receipt Invoice Upload</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,image/*"
                />
                {!receiptFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 text-center bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 font-semibold">Upload receipt PDF / JPEG</span>
                  </div>
                ) : (
                  <div className="border rounded-lg p-3 flex items-center justify-between bg-slate-50 dark:bg-slate-950 border-primary/30">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="text-left overflow-hidden">
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {receiptFile.name}
                        </p>
                        <p className="text-[9px] text-slate-450">
                          {(receiptFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-650 dark:hover:text-slate-250"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Justification / Reason</label>
                <textarea 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the business purpose of this expense..." 
                  rows={3} 
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                />
              </div>

              <button 
                type="submit" 
                disabled={applyClaimMut.isPending}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/10 hover:scale-105 transition-all disabled:opacity-50"
              >
                {applyClaimMut.isPending ? "Submitting..." : "Submit Expense Claim"}
              </button>
            </form>
          </div>

          {/* Quick Travel policy overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Travel Policy Threshold Limits</h3>
            
            <div className="space-y-3">
              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950">
                <p className="font-bold text-slate-800 dark:text-white">Daily Lodging Threshold (Metro Cities)</p>
                <p className="text-slate-400 mt-1">Maximum allowed hotel limit: ₹4,500/night for developers and analysts. Executive limit: ₹8,000/night. Higher amounts require vice president approval.</p>
              </div>
              <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950">
                <p className="font-bold text-slate-800 dark:text-white">Mileage & Fuel Policy</p>
                <p className="text-slate-400 mt-1">₹12/km reimbursement for 4-wheelers. ₹5/km for 2-wheelers. Google Maps path screenshots must be uploaded for verification.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. MY REIMBURSEMENTS                    */}
      {/* ======================================= */}
      {activeSubModule === 'my-claims' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in text-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">My Expense Claims History</h3>
          
          {claimsLoading ? (
            <div className="py-8 text-center text-slate-400 font-medium">Loading claims...</div>
          ) : claimsList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">You haven't submitted any travel claims yet.</div>
          ) : (
            <div className="space-y-3">
              {claimsList.map((claim) => (
                <div key={claim.id} className="p-3 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-white">{claim.type} Claim</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Date: {claim.date}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Amount: <span className="font-semibold text-slate-700 dark:text-slate-305">₹{claim.amount.toLocaleString()}</span> • Purpose: "{claim.reason}"
                    </p>
                    {claim.receiptUrl && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary dark:text-blue-400 font-medium bg-primary/5 dark:bg-blue-950/20 px-2 py-0.5 rounded-md w-fit">
                        <Paperclip className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[180px]">{claim.receiptUrl}</span>
                      </div>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    claim.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                    claim.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse' :
                    'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                  }`}>
                    {claim.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* 3. CLAIM APPROVALS                      */}
      {/* ======================================= */}
      {activeSubModule === 'approvals' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in text-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center justify-between">
            <span>Team Claims Approvals</span>
            <div className="flex items-center gap-2">
              <label htmlFor="approval-status-filter" className="text-slate-500 dark:text-slate-400 font-medium text-xs">Status Filter:</label>
              <select
                id="approval-status-filter"
                value={approvalStatusFilter}
                onChange={(e) => setApprovalStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs cursor-pointer"
              >
                <option value="All">All (Approve / Reject / Pending)</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </h3>

          {claimsLoading ? (
            <div className="py-8 text-center text-slate-400 font-medium">Loading claims...</div>
          ) : (
            <div className="space-y-3">
              {claimsList.filter(c => approvalStatusFilter === 'All' ? true : c.status === approvalStatusFilter).length === 0 ? (
                <p className="text-slate-450 text-center py-6">No claims found for the selected status.</p>
              ) : (
                claimsList
                  .filter(c => approvalStatusFilter === 'All' ? true : c.status === approvalStatusFilter)
                  .map((claim) => (
                    <div key={claim.id} className="p-4 border border-slate-200/50 dark:border-slate-850 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-white">{claim.employeeName}</span>
                          <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold">{claim.type} Claim</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            claim.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                            claim.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                          Amount: <span className="font-bold text-slate-700 dark:text-slate-305">₹{claim.amount.toLocaleString()}</span> • Applied Date: {claim.date}
                        </p>
                        <p className="text-slate-450 mt-0.5">Reason: "{claim.reason}"</p>
                        {claim.receiptUrl && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary dark:text-blue-400 font-medium bg-primary/5 dark:bg-blue-950/20 px-2 py-0.5 rounded-md w-fit">
                            <Paperclip className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{claim.receiptUrl}</span>
                          </div>
                        )}
                      </div>
                      
                      {claim.status === 'Pending' ? (
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => handleApprove(claim.id, claim.employeeName || 'Employee', claim.amount)}
                            disabled={updateStatusMut.isPending}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button 
                            onClick={() => handleReject(claim.id, claim.employeeName || 'Employee', claim.amount)}
                            disabled={updateStatusMut.isPending}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="shrink-0">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 ${
                            claim.status === 'Approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-800'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                          }`}>
                            {claim.status === 'Approved' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            {claim.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

