import {
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  Filter,
  Landmark,
  Search,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useEmployees, useUpdateEmployeeSalary } from '../api/hook/useEmployee';
import {
  useApplyBulkRevision,
  useApplyLoan,
  useCalculateArrears,
  useLoans,
  usePayrollCycle,
  useSaveTaxDeclaration,
  useTaxDeclaration,
  useToggleStopPayment,
  useUpdateCycleStatus
} from '../api/hook/usePayroll';
import { useApp } from '../context/AppContext';

export const Payroll: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, userRole, currentUser, showConfirm, showAlert, companyName, setCompanyName } = useApp();
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

  // Auto redirect employees away from administrative payroll cycles
  useEffect(() => {
    if (activeSubModule === 'process' && !hasPerm('UPDATE_SALARY_PROCESSING')) {
      setActiveSubModule('payslips');
    } else if (activeSubModule === 'reports' && !hasPerm('VIEW_PAYROLL_REPORTS')) {
      setActiveSubModule('payslips');
    } else if (activeSubModule === 'revisions' && !hasPerm('UPDATE_SALARY_STRUCTURE')) {
      setActiveSubModule('payslips');
    }
  }, [activeSubModule, setActiveSubModule, userPerms, isAdmin]);


  // State Variables
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [payslipStyle, setPayslipStyle] = useState<'classic' | 'modern' | 'minimalist' | 'grid' | 'fluid'>('classic');
  
  // Date and Cycle filters
  const [reportMonth, setReportMonth] = useState('June');
  const [reportYear, setReportYear] = useState('2026');
  const [reportSearch, setReportSearch] = useState('');
  const [ecrGenerated, setEcrGenerated] = useState(false);

  // Revision & Arrear States
  const [incrementPercentage, setIncrementPercentage] = useState(0);

  // Individual Salary Revision Modal States
  const [showIndivRevModal, setShowIndivRevModal] = useState(false);
  const [revType, setRevType] = useState<'increment' | 'decrement'>('increment');
  const [revMode, setRevMode] = useState<'percent' | 'flat'>('percent');
  const [revVal, setRevVal] = useState(10);
  const [revReason, setRevReason] = useState('Annual Performance Revision & Appraisal');
  const [revEffectiveDate, setRevEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  // Bulk Revision Filter & States
  const [bulkDeptFilter, setBulkDeptFilter] = useState('ALL');
  const [bulkMode, setBulkMode] = useState<'percent' | 'flat'>('percent');
  const [bulkVal, setBulkVal] = useState(8);
  const [bulkReason, setBulkReason] = useState('Organization Wide Annual Increment');
  const [bulkEffectiveDate, setBulkEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Employee Salary Update Mutation
  const updateSalaryMutation = useUpdateEmployeeSalary();

  // Loan Request States
  const [loanEmployeeId, setLoanEmployeeId] = useState('');
  const [loanPrincipal, setLoanPrincipal] = useState(30000);
  const [loanEmi, setLoanEmi] = useState(3000);
  const [loanPurpose, setLoanPurpose] = useState('Home improvement / medical emergencies');

  // Tax declaration states
  const [sec80C, setSec80C] = useState(120000);
  const [sec80D, setSec80D] = useState(25000);
  const [declaredHra, setDeclaredHra] = useState(180000);

  // 1. Fetch live employees
  const { data: dbEmployeesRes } = useEmployees();
  const dbEmployees = dbEmployeesRes?.data || [];

  // 2. Fetch current payroll cycle
  const { data: cycleDetailsRes } = usePayrollCycle(reportMonth, Number(reportYear));
  const cycleDetails = cycleDetailsRes?.data;
  const currentCycle = cycleDetails?.cycle;
  const runs = cycleDetails?.runs || [];
  const exclusions = cycleDetails?.exclusions || [];
  const stats = cycleDetails?.stats;

  // 3. Fetch loans ledger
  const { data: loansRes, isLoading: loadingLoans } = useLoans();
  const loans = loansRes?.data || [];

  // 4. Fetch Tax Declaration for selected employee
  const activeEmployeeId = selectedEmpId || dbEmployees[0]?.id || '';
  const { data: taxDeclRes } = useTaxDeclaration(activeEmployeeId, `${reportYear}-${Number(reportYear) + 1}`);
  const taxDecl = taxDeclRes?.data;

  // Initialize selectedEmpId on employees load
  useEffect(() => {
    if (dbEmployees.length > 0) {
      if (isEmployee && currentUser) {
        const myEmp = dbEmployees.find(e => 
          (currentUser.id && e.id === currentUser.id) ||
          (currentUser.email && e.email?.toLowerCase() === currentUser.email?.toLowerCase())
        );
        if (myEmp) {
          setSelectedEmpId(myEmp.id);
          return;
        }
      }
      if (!selectedEmpId) {
        setSelectedEmpId(dbEmployees[0].id);
      }
    }
  }, [dbEmployees, selectedEmpId, isEmployee, currentUser]);

  // Sync tax declarations inputs when selection fetches new declarations
  useEffect(() => {
    if (taxDecl) {
      setSec80C(taxDecl.sec80C);
      setSec80D(taxDecl.sec80D);
      setDeclaredHra(taxDecl.declaredHra);
    }
  }, [taxDecl]);

  // Mutations
  const updateCycleStatusMutation = useUpdateCycleStatus();
  const calculateArrearsMutation = useCalculateArrears();
  const toggleStopPaymentMutation = useToggleStopPayment();
  const applyRevisionMutation = useApplyBulkRevision();
  const applyLoanMutation = useApplyLoan();
  const saveTaxDeclMutation = useSaveTaxDeclaration();

  // Helper values
  const cycleStatusLabel = currentCycle
    ? currentCycle.status === 'PENDING_ATTENDANCE_LOCK'
      ? 'Pending Attendance Lock'
      : currentCycle.status === 'PROCESSING_SALARIES'
      ? 'Processing Salaries'
      : 'Disbursed'
    : 'No active cycle';

  // Selected Employee salary details resolver
  const selectedEmployee = dbEmployees.find(e => e.id === selectedEmpId) || dbEmployees[0];
  const selectedRun = runs.find(r => r.employeeId === selectedEmpId);

  const empBasic = selectedRun ? selectedRun.basic : (selectedEmployee?.basic || 50000);
  const empHra = selectedRun ? selectedRun.hra : (selectedEmployee?.hra || Math.round(empBasic * 0.4));
  const empAllowance = selectedRun ? selectedRun.allowance : (selectedEmployee?.allowance || Math.round(empBasic * 0.3));
  const empPf = selectedRun ? selectedRun.pf : Math.min(1800, Math.round(empBasic * 0.12));
  const empPt = selectedRun ? selectedRun.pt : 200;
  const empTds = selectedRun ? selectedRun.tds : (empBasic > 30000 ? Math.round(empBasic * 0.05) : 0);
  const empDeductions = selectedRun ? selectedRun.deductions : (empPf + empPt + empTds);
  const empNetSalary = selectedRun ? selectedRun.netSalary : ((empBasic + empHra + empAllowance) - empDeductions);
  const empBonus = selectedRun ? selectedRun.bonus : 0;
  const empArrear = selectedRun ? selectedRun.arrear : 0;

  const handleAdvanceCycle = async () => {
    if (!currentCycle) return;
    try {
      if (currentCycle.status === 'PENDING_ATTENDANCE_LOCK') {
        showConfirm({
          title: "Lock Attendance Cycle",
          message: `Are you sure you want to lock attendance for ${reportMonth} ${reportYear} and trigger salary computation?`,
          type: "confirm",
          confirmText: "Lock & Compute",
          onConfirm: async () => {
            await updateCycleStatusMutation.mutateAsync({
              id: currentCycle.id,
              status: 'PROCESSING_SALARIES',
            });
            addAuditLog("Locked Attendance Cycle", "Payroll Processing", `${reportMonth} ${reportYear} attendance locked for computation.`);
            showAlert("Attendance cycle locked successfully! Salaries computed.", "Cycle Locked", "success");
          }
        });
      } else if (currentCycle.status === 'PROCESSING_SALARIES') {
        showConfirm({
          title: "Disburse Salaries",
          message: "Confirm salary disbursement for all active employees and generate bank funding sheet?",
          type: "confirm",
          confirmText: "Disburse Now",
          onConfirm: async () => {
            await updateCycleStatusMutation.mutateAsync({
              id: currentCycle.id,
              status: 'DISBURSED',
            });
            addAuditLog("Disbursed Salaries", "Payroll Processing", `Completed salary disbursement for cycle.`);
            showAlert("Salaries computed, Bank Funding sheet created, and funds disbursed!", "Salaries Disbursed", "success");
          }
        });
      }
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to update cycle status.", "Error", "danger");
    }
  };

  const handleStopPaymentToggle = async (id: string) => {
    if (!currentCycle) return;
    try {
      await toggleStopPaymentMutation.mutateAsync({
        cycleId: currentCycle.id,
        employeeId: id,
        reason: "Hold by administrative override",
      });
      const empName = dbEmployees.find(e => e.id === id)?.name;
      const isHeldCurrently = exclusions.some(ex => ex.employeeId === id);
      const action = isHeldCurrently ? "Revoked Stop Payment" : "Applied Stop Payment";
      addAuditLog(action, "Payroll Processing", `${action} for employee ${empName} (${id})`);
      showAlert(`${action} for employee ${empName}`, "Stop Payment Updated", "info");
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to toggle stop payment.", "Error", "danger");
    }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = loanEmployeeId || dbEmployees[0]?.id;
    if (!targetEmpId) {
      showAlert("No employee selected", "Selection Error", "warning");
      return;
    }
    showConfirm({
      title: "Approve Loan Request",
      message: `Approve advance cash/loan request of ₹${loanPrincipal} with EMI ₹${loanEmi}?`,
      type: "confirm",
      confirmText: "Approve Loan",
      onConfirm: async () => {
        try {
          await applyLoanMutation.mutateAsync({
            employeeId: targetEmpId,
            principal: loanPrincipal,
            emi: loanEmi,
            purpose: loanPurpose,
          });
          const empName = dbEmployees.find(e => e.id === targetEmpId)?.name;
          addAuditLog("Loan Approved", "Payroll Processing", `Approved Advance/Loan request of ₹${loanPrincipal} for ${empName}`);
          showAlert("Advance cash/loan request approved successfully.", "Loan Approved", "success");
          setLoanPurpose('');
        } catch (err: any) {
          showAlert(err.response?.data?.message || err.message || "Failed to approve loan.", "Error", "danger");
        }
      }
    });
  };

  const handleSaveTaxDeclarations = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = selectedEmpId || dbEmployees[0]?.id;
    if (!targetEmpId) return;
    try {
      await saveTaxDeclMutation.mutateAsync({
        employeeId: targetEmpId,
        financialYear: `${reportYear}-${Number(reportYear) + 1}`,
        sec80C,
        sec80D,
        declaredHra,
      });
      addAuditLog("Saved Tax Declarations", "Payroll Processing", `Saved tax declarations for employee ID: ${targetEmpId}`);
      showAlert("Declarations saved successfully!", "Declarations Saved", "success");
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to save declarations.", "Error", "danger");
    }
  };

  const handleComputeArrears = async () => {
    if (!currentCycle) return;
    try {
      await calculateArrearsMutation.mutateAsync(currentCycle.id);
      addAuditLog("Computed Arrears", "Payroll Processing", `Triggered arrears computation for cycle.`);
      showAlert("Arrears calculated successfully.", "Arrears Computed", "success");
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to calculate arrears.", "Error", "danger");
    }
  };

  const handleApplyIncrement = async () => {
    if (incrementPercentage <= 0) {
      showAlert("Please enter a positive percentage", "Invalid Input", "warning");
      return;
    }
    showConfirm({
      title: "Apply Bulk Increment",
      message: `Apply ${incrementPercentage}% increment across all active employees?`,
      type: "confirm",
      confirmText: "Apply Increment",
      onConfirm: async () => {
        try {
          await applyRevisionMutation.mutateAsync({
            incrementPercentage,
            departmentId: null,
          });
          addAuditLog("Applied Increment", "Payroll Processing", `Applied bulk increment of ${incrementPercentage}% to active staff.`);
          showAlert(`Applied ${incrementPercentage}% increment successfully!`, "Increment Applied", "success");
          setIncrementPercentage(0);
        } catch (err: any) {
          showAlert(err.response?.data?.message || err.message || "Failed to apply bulk revision.", "Error", "danger");
        }
      }
    });
  };

  const handleApplyIndividualRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const currentBasic = selectedEmployee.basic || 15000;
    const currentHra = selectedEmployee.hra || Math.round(currentBasic * 0.4);
    const currentAllowance = selectedEmployee.allowance || Math.round(currentBasic * 0.2);

    let factor = 1;
    if (revMode === 'percent') {
      const p = revVal / 100;
      factor = revType === 'increment' ? 1 + p : Math.max(0.01, 1 - p);
    }

    let newBasic = currentBasic;
    let newHra = currentHra;
    let newAllowance = currentAllowance;

    if (revMode === 'percent') {
      newBasic = Math.round(currentBasic * factor);
      newHra = Math.round(currentHra * factor);
      newAllowance = Math.round(currentAllowance * factor);
    } else {
      const delta = revType === 'increment' ? Number(revVal) : -Number(revVal);
      // Distribute delta: 50% Basic, 30% HRA, 20% Allowance
      newBasic = Math.max(0, currentBasic + Math.round(delta * 0.5));
      newHra = Math.max(0, currentHra + Math.round(delta * 0.3));
      newAllowance = Math.max(0, currentAllowance + Math.round(delta * 0.2));
    }

    const newPf = Math.round(Math.min(newBasic, 15000) * 0.12);
    const newPt = 200;
    const newTds = newBasic > 30000 ? Math.round(newBasic * 0.1) : 0;
    const newDeductions = newPf + newPt + newTds;
    const newGross = newBasic + newHra + newAllowance;
    const newNetSalary = newGross - newDeductions;

    try {
      await updateSalaryMutation.mutateAsync({
        id: selectedEmployee.id,
        data: {
          basic: newBasic,
          hra: newHra,
          allowance: newAllowance,
          deductions: newDeductions,
          netSalary: newNetSalary,
          salary: newGross,
        }
      });

      addAuditLog(
        `Individual Salary ${revType === 'increment' ? 'Increment' : 'Decrement'}`,
        "Payroll Management",
        `Revised salary for ${selectedEmployee.name} (${selectedEmployee.id}): Basic ₹${currentBasic.toLocaleString()} -> ₹${newBasic.toLocaleString()}. Effective: ${revEffectiveDate}. Reason: ${revReason}`
      );

      showAlert(`Salary ${revType === 'increment' ? 'increment' : 'decrement'} of ${revMode === 'percent' ? `${revVal}%` : `₹${revVal.toLocaleString()}`} applied successfully for ${selectedEmployee.name}!`, "Salary Revised", "success");
      setShowIndivRevModal(false);
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to update employee salary.", "Error", "danger");
    }
  };

  const handleExecuteBulkRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkVal <= 0) {
      showAlert("Please enter a valid revision value.", "Invalid Value", "warning");
      return;
    }

    try {
      setBulkSubmitting(true);
      await applyRevisionMutation.mutateAsync({
        incrementPercentage: bulkMode === 'percent' ? bulkVal : 5,
        departmentId: bulkDeptFilter === 'ALL' ? null : bulkDeptFilter,
      });

      addAuditLog(
        "Bulk Salary Revision Executed",
        "Payroll Management",
        `Applied bulk ${bulkMode === 'percent' ? `${bulkVal}%` : `₹${bulkVal}`} revision to ${bulkDeptFilter === 'ALL' ? 'all employees' : `department ${bulkDeptFilter}`}. Effective: ${bulkEffectiveDate}. Reason: ${bulkReason}`
      );

      showAlert(`Bulk salary revision of ${bulkMode === 'percent' ? `${bulkVal}%` : `₹${bulkVal.toLocaleString()}`} applied successfully across selected employees!`, "Bulk Revision Applied", "success");
    } catch (err: any) {
      showAlert(err.response?.data?.message || err.message || "Failed to execute bulk salary revision.", "Error", "danger");
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
        {(isAdmin || hasPerm('UPDATE_SALARY_PROCESSING')) && (
          <button 
            onClick={() => setActiveSubModule('process')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeSubModule === 'process' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Salary Processing Cycle
          </button>
        )}
        <button 
          onClick={() => setActiveSubModule('payslips')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'payslips' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {isEmployee ? 'My Payslips' : 'Payslips & Templates'}
        </button>
        <button 
          onClick={() => setActiveSubModule('loans')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'loans' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {isEmployee ? 'My Loans & Advances' : 'Loans & Advances Ledger'}
        </button>
        <button 
          onClick={() => setActiveSubModule('investment')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'investment' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Investment Declaration
        </button>
        {(isAdmin || isManager || hasPerm('VIEW_PAYROLL_REPORTS')) && (
          <button 
            onClick={() => setActiveSubModule('reports')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeSubModule === 'reports' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Payroll Reports & ECR
          </button>
        )}
        {(isAdmin || hasPerm('UPDATE_SALARY_STRUCTURE')) && (
          <button 
            onClick={() => setActiveSubModule('revisions')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeSubModule === 'revisions' 
                ? 'border-primary text-primary font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Salary Structure & Revisions
          </button>
        )}
      </div>

      {/* ======================================= */}
      {/* 1. SALARY PROCESSING CYCLE              */}
      {/* ======================================= */}
      {activeSubModule === 'process' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Main Processing Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Payroll Run Center</h3>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Cycle:</span>
                <span className="font-bold text-slate-800 dark:text-white">{reportMonth} {reportYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Processing Status:</span>
                <span className={`font-bold ${currentCycle?.status === 'DISBURSED' ? 'text-green-500' : 'text-amber-500'}`}>
                  {cycleStatusLabel}
                </span>
              </div>
            </div>

            {currentCycle ? (
              <button 
                onClick={handleAdvanceCycle}
                disabled={currentCycle.status === 'DISBURSED' || updateCycleStatusMutation.isPending}
                className="w-full py-2.5 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/10 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {updateCycleStatusMutation.isPending ? 'Processing...' :
                 currentCycle.status === 'PENDING_ATTENDANCE_LOCK' ? 'Lock Attendance Roster' : 
                 currentCycle.status === 'PROCESSING_SALARIES' ? 'Calculate & Disburse Salaries' : 'Payroll Cycle Closed'}
              </button>
            ) : (
              <div className="text-center text-slate-400 py-2">Loading cycle details...</div>
            )}

            <div className="border-t pt-4 space-y-3.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Quick Calculation Options</span>
              <label className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Arrear Calculation</span>
                <button 
                  onClick={handleComputeArrears}
                  disabled={!currentCycle || currentCycle.status !== 'PROCESSING_SALARIES' || calculateArrearsMutation.isPending}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 rounded-lg font-bold disabled:opacity-40"
                >
                  {calculateArrearsMutation.isPending ? 'Computing...' : 'Compute'}
                </button>
              </label>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Bulk Salary Increment (%)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={incrementPercentage === 0 ? '' : incrementPercentage} 
                    onChange={(e) => setIncrementPercentage(Number(e.target.value))}
                    className="w-16 px-2 py-1 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350" 
                  />
                  <button 
                    onClick={handleApplyIncrement}
                    disabled={applyRevisionMutation.isPending}
                    className="flex-1 py-1 bg-emerald-500 text-white rounded-lg font-bold disabled:opacity-50"
                  >
                    {applyRevisionMutation.isPending ? 'Saving...' : 'Apply Revision'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stop Payment & Exclusions list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Excluded Employees / Stop Payment Register</h3>
            
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b">
                  <tr>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Base / Net Salary</th>
                    <th className="p-3 text-center">Payroll Hold Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-650 dark:text-slate-350">
                  {dbEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">No active employees found</td>
                    </tr>
                  ) : (
                    dbEmployees.map((emp) => {
                      const isHeld = exclusions.some((ex) => ex.employeeId === emp.id);
                      const baseSalary = emp.netSalary || ((emp.basic || 15000) + (emp.hra || 6000) + (emp.allowance || 4000) - (emp.deductions || 3400));
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                          <td className="p-3 font-bold text-slate-800 dark:text-white">{emp.name}</td>
                          <td className="p-3">{emp.department?.name || 'Staff'}</td>
                          <td className="p-3">₹{baseSalary.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => handleStopPaymentToggle(emp.id)}
                              disabled={toggleStopPaymentMutation.isPending}
                              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                                isHeld 
                                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {isHeld ? 'HOLD PAYMENT ACTIVE' : 'APPROVE TO RUN'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. LOANS & ADVANCES LEDGER              */}
      {/* ======================================= */}
      {activeSubModule === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          {/* Apply loan Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Apply for Advance/Loan</h3>
            
            <form onSubmit={handleApplyLoan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Select Employee</label>
                <select 
                  value={loanEmployeeId} 
                  onChange={(e) => setLoanEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                >
                  <option value="">-- Choose Employee --</option>
                  {dbEmployees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Principal Amount Requested</label>
                <input 
                  type="number" 
                  value={loanPrincipal} 
                  onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Monthly Installment (EMI)</label>
                <input 
                  type="number" 
                  value={loanEmi} 
                  onChange={(e) => setLoanEmi(Number(e.target.value))}
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Purpose</label>
                <textarea 
                  value={loanPurpose} 
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  rows={3} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                />
              </div>

              <button 
                type="submit" 
                disabled={applyLoanMutation.isPending}
                className="w-full py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md disabled:opacity-50"
              >
                {applyLoanMutation.isPending ? 'Submitting...' : 'Submit Loan Application'}
              </button>
            </form>
          </div>

          {/* Active Ledger */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Company Loan Ledger</h3>
            
            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
              {loadingLoans ? (
                <div className="text-center text-slate-450 py-8">Loading loan accounts...</div>
              ) : loans.length === 0 ? (
                <div className="text-center text-slate-400 py-8">No records in the loans ledger.</div>
              ) : (
                loans.map((ln) => (
                  <div key={ln.id} className="p-4 border rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">{ln.employee?.name || 'Unknown'}</span>
                        <span className="bg-amber-100 text-amber-850 px-2 py-0.5 rounded-full text-[9px] font-bold">ID: {ln.id}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Approved: {new Date(ln.approvedDate).toLocaleDateString()} • Monthly Deduction: <span className="font-bold text-slate-855 dark:text-white">₹{ln.emi.toLocaleString()}</span>
                      </p>
                      <p className="text-slate-400 mt-0.5">Remaining Principal: ₹{ln.balance.toLocaleString()} / ₹{ln.principal.toLocaleString()}</p>
                      {ln.purpose && <p className="text-[10px] text-slate-400 mt-1 italic">"{ln.purpose}"</p>}
                    </div>
                    
                    <span className="bg-green-150 text-green-700 px-2.5 py-0.5 rounded-full font-bold">{ln.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 3. INVESTMENT DECLARATION               */}
      {/* ======================================= */}
      {/* ======================================= */}
      {/* 3. INVESTMENT DECLARATION               */}
      {/* ======================================= */}
      {activeSubModule === 'investment' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-xs">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2">Income Tax IT Declaration Portal</h3>
            <p className="text-slate-400 dark:text-slate-400 mt-1">Declare deductions under Section 80C, 80D, and HRA for tax exemption calculation.</p>
          </div>

          <form onSubmit={handleSaveTaxDeclarations} className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Select Employee</label>
              <select 
                value={selectedEmpId} 
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 font-semibold"
              >
                {dbEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Section 80C Deductions (PPF, ELSS, Insurance - Max ₹1,50,000)</label>
              <input 
                type="number" 
                value={sec80C} 
                onChange={(e) => setSec80C(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Section 80D Deductions (Medical Insurance premiums)</label>
              <input 
                type="number" 
                value={sec80D} 
                onChange={(e) => setSec80D(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Annual Declared House Rent (HRA Exemptions)</label>
              <input 
                type="number" 
                value={declaredHra} 
                onChange={(e) => setDeclaredHra(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <button 
              type="submit" 
              disabled={saveTaxDeclMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
            >
              {saveTaxDeclMutation.isPending ? 'Saving Declarations...' : 'Save Declarations'}
            </button>
          </form>
        </div>
      )}

      {/* ======================================= */}
      {/* 4. PAYSLIP TEMPLATE GENERATOR           */}
      {/* ======================================= */}
      {activeSubModule === 'payslips' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase">Company Name:</span>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company Name"
                  className="px-3 py-1 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase">Template Layout:</span>
                <div className="flex flex-wrap gap-1">
                  {(['classic', 'modern', 'minimalist', 'grid', 'fluid'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setPayslipStyle(style)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        payslipStyle === style 
                          ? 'bg-primary text-white' 
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {style.toUpperCase()} Style
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <select 
                value={selectedEmpId} 
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="px-3 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
              >
                {dbEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                ))}
              </select>
              <button 
                onClick={() => alert(`Downloading Payslip PDF for ${selectedEmployee?.name || 'Employee'} (${companyName})...`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg font-bold hover:scale-105 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>PDF Download</span>
              </button>
            </div>
          </div>

          {/* Payslip View wrapper */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 shadow-md max-w-3xl mx-auto space-y-6">
            
            {selectedEmployee ? (
              <>
                {/* Template layout rendering */}
                {payslipStyle === 'classic' && (
                  <div className="border border-slate-350 p-6 space-y-6 text-slate-800 dark:text-slate-100 font-serif">
                    <div className="text-center">
                      <h2 className="text-lg font-bold uppercase">{companyName}</h2>
                      <p className="text-[10px] italic">12th Floor, Trade Center, BKC, Mumbai - 400051</p>
                      <p className="font-bold border-y py-1.5 mt-3 uppercase text-xs">Salary Statement for {reportMonth} {reportYear}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px] border-b pb-4">
                      <div>
                        <p><span className="font-bold">Employee ID:</span> {selectedEmployee.id}</p>
                        <p><span className="font-bold">Employee Name:</span> {selectedEmployee.name}</p>
                        <p><span className="font-bold">Department:</span> {selectedEmployee.department?.name || 'Staff'}</p>
                        <p><span className="font-bold">Designation:</span> {selectedEmployee.designation || 'Staff'}</p>
                      </div>
                      <div>
                        <p><span className="font-bold">Bank Name:</span> {selectedEmployee.bankName || 'HDFC Bank'}</p>
                        <p><span className="font-bold">Account No:</span> {selectedEmployee.bankAccount || 'XXXXXXXX1849'}</p>
                        <p><span className="font-bold">UAN No:</span> {selectedEmployee.uan || '100293049102'}</p>
                        <p><span className="font-bold">PAN Card:</span> {selectedEmployee.pan || 'DAPXXXX42C'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-0 border">
                      <div className="border-r">
                        <div className="bg-slate-50 dark:bg-slate-950 p-2 font-bold border-b text-[10px]">Earnings</div>
                        <div className="p-3 space-y-2 text-[10px]">
                          <div className="flex justify-between"><span>Basic Salary</span><span>₹{empBasic.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>HRA</span><span>₹{empHra.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>Special Allowance</span><span>₹{empAllowance.toLocaleString()}</span></div>
                          {empArrear > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Arrears</span><span>₹{empArrear.toLocaleString()}</span></div>}
                          {empBonus > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Bonus</span><span>₹{empBonus.toLocaleString()}</span></div>}
                        </div>
                      </div>
                      <div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-2 font-bold border-b text-[10px]">Deductions</div>
                        <div className="p-3 space-y-2 text-[10px]">
                          <div className="flex justify-between"><span>Provident Fund (PF)</span><span>₹{empPf.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>Professional Tax (PT)</span><span>₹{empPt.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>Income Tax (TDS)</span><span>₹{empTds.toLocaleString()}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between border p-3 font-bold text-sm bg-slate-50 dark:bg-slate-950">
                      <span>Net Credited Amount:</span>
                      <span>₹{empNetSalary.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {payslipStyle === 'modern' && (
                  <div className="p-6 space-y-6 text-slate-800 dark:text-slate-100 font-sans border-2 border-primary/20 rounded-xl relative overflow-hidden bg-slate-50/20 dark:bg-slate-900/50">
                    <div className="absolute right-0 top-0 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase">CONFIDENTIAL</div>
                    
                    <div className="flex items-center gap-3">
                      <div className="bg-primary p-2 rounded-xl text-white">
                        <Landmark className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-md font-extrabold text-primary">{companyName}</h2>
                        <p className="text-[10px] text-slate-400 font-semibold">{reportMonth} {reportYear} Remittance Statement</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950 text-[10px]">
                      <div>
                        <p className="text-slate-400 uppercase font-bold">Employee Details</p>
                        <p className="font-bold text-slate-800 dark:text-white mt-1">{selectedEmployee.name}</p>
                        <p className="text-slate-500 mt-0.5">{selectedEmployee.designation || 'Staff'} ({selectedEmployee.id})</p>
                      </div>
                      <div>
                        <p className="text-slate-400 uppercase font-bold">Bank Deposit</p>
                        <p className="font-semibold text-slate-750 dark:text-slate-200 mt-1">{selectedEmployee.bankName || 'HDFC Bank'}</p>
                        <p className="text-slate-500 mt-0.5">Account: ending in {(selectedEmployee.bankAccount || 'XXXXXXXX1849').slice(-4)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px]">
                      <div className="space-y-2">
                        <span className="font-bold text-slate-400 block border-b pb-1">EARNINGS</span>
                        <div className="flex justify-between"><span>Basic Pay</span><span className="font-semibold">₹{empBasic.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>HRA</span><span className="font-semibold">₹{empHra.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Allowance</span><span className="font-semibold">₹{empAllowance.toLocaleString()}</span></div>
                        {empArrear > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Arrears</span><span>₹{empArrear.toLocaleString()}</span></div>}
                      </div>
                      <div className="space-y-2">
                        <span className="font-bold text-slate-400 block border-b pb-1">DEDUCTIONS</span>
                        <div className="flex justify-between"><span>PF</span><span className="font-semibold">₹{empPf.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>PT</span><span className="font-semibold">₹{empPt.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Income Tax</span><span className="font-semibold">₹{empTds.toLocaleString()}</span></div>
                      </div>
                    </div>

                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-primary">Net Take-Home</p>
                        <p className="text-[9px] text-slate-400">Directly transferred on the 1st of next month</p>
                      </div>
                      <span className="text-lg font-black text-primary">₹{empNetSalary.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {(payslipStyle === 'minimalist' || payslipStyle === 'grid' || payslipStyle === 'fluid') && (
                  <div className="p-6 border rounded-xl space-y-4 text-xs font-mono">
                    <div className="flex justify-between font-bold border-b pb-2">
                      <span>{companyName}</span>
                      <span>Payslip {reportMonth} {reportYear}</span>
                    </div>
                    <div className="space-y-1">
                      <p>Employee: {selectedEmployee.name} ({selectedEmployee.id})</p>
                      <p>Basic: ₹{empBasic.toLocaleString()}</p>
                      <p>HRA: ₹{empHra.toLocaleString()}</p>
                      <p>Allowance: ₹{empAllowance.toLocaleString()}</p>
                      {empArrear > 0 && <p className="text-green-500 font-bold">Arrears: ₹{empArrear.toLocaleString()}</p>}
                      <p>PF: ₹{empPf.toLocaleString()}</p>
                      <p>PT: ₹{empPt.toLocaleString()}</p>
                      <p>Income Tax: ₹{empTds.toLocaleString()}</p>
                      <p className="font-bold border-t pt-2 mt-2">Net Pay: ₹{empNetSalary.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-400 py-12">No employee selected to view payslip</div>
            )}

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 5. PAYROLL REPORTS & ECR                */}
      {/* ======================================= */}
      {activeSubModule === 'reports' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Top Control Bar & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Filter controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 lg:col-span-1">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs border-b pb-1.5 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Report Filters
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-slate-400 font-medium">Select Month</label>
                  <select 
                    value={reportMonth} 
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full px-2 py-1.5 mt-1 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                  >
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April</option>
                    <option value="May">May</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-medium">Select Year</label>
                  <select 
                    value={reportYear} 
                    onChange={(e) => setReportYear(e.target.value)}
                    className="w-full px-2 py-1.5 mt-1 border rounded-lg bg-slate-50 dark:bg-slate-955 text-slate-700 dark:text-slate-350"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statutory Stats EPF Wages Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between lg:col-span-1">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">EPF Wages (Statutory Capped)</span>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mt-1">
                  ₹{(stats?.totalEpfWages || dbEmployees.reduce((acc, e) => acc + Math.min(e.basic || 15000, 15000), 0)).toLocaleString()}
                </h3>
              </div>
              <span className="text-[9px] text-slate-400 mt-2">Capped at ₹15,000 per member per month</span>
            </div>

            {/* Statutory Stats PF Contribution Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between lg:col-span-1">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total PF Contribution (12%)</span>
                <h3 className="text-xl font-extrabold text-primary mt-1">
                  ₹{(stats?.totalPfContribution || Math.round(dbEmployees.reduce((acc, e) => acc + Math.min(e.basic || 15000, 15000), 0) * 0.12)).toLocaleString()}
                </h3>
              </div>
              <span className="text-[9px] text-emerald-500 font-semibold mt-2">100% compliant with EPFO rules</span>
            </div>

            {/* Action Card: ECR Generation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between lg:col-span-1">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Electronic Challan (ECR)</span>
                <p className="text-slate-500 mt-1">Generate text file formatted for EPFO unified portal upload.</p>
              </div>
              <button
                onClick={() => {
                  setEcrGenerated(true);
                  addAuditLog("Generated ECR File", "Payroll Processing", `Generated PF ECR Challan file for ${reportMonth} ${reportYear}`);
                  showAlert(`ECR file for ${reportMonth} ${reportYear} generated successfully!`, "ECR File Generated", "success");
                }}
                className="w-full py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md mt-2 flex items-center justify-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                Generate ECR text file
              </button>
            </div>

          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ECR Text Preview */}
            {ecrGenerated && (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-3 animate-fade-in">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">EPFO ECR File Preview ({reportMonth} {reportYear})</h3>
                  </div>
                  <button 
                    onClick={() => {
                      showAlert("Downloading ECR txt file...", "File Download Started", "info");
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <Download className="h-3 w-3" /> Download ECR
                  </button>
                </div>
                <div className="bg-slate-950 text-slate-350 p-4 rounded-xl font-mono text-[10px] space-y-1 overflow-x-auto max-h-48 overflow-y-auto">
                  {runs.length > 0 ? (
                    runs.map((run) => {
                      const emp = run.employee;
                      const uan = emp?.uan || "100293049102";
                      const epfWages = Math.min(run.basic, 15000);
                      const epsWages = Math.min(run.basic, 15000);
                      const edliWages = Math.min(run.basic, 15000);
                      const epfCont = Math.round(epfWages * 0.12);
                      const epsCont = Math.round(epsWages * 0.0833);
                      const diffCont = epfCont - epsCont;
                      return (
                        <div key={run.id} className="whitespace-nowrap">
                          {uan}#{emp?.name || 'Staff'}#{epfWages}#{epsWages}#{edliWages}#{epfCont}#{epsCont}#{diffCont}#0#0
                        </div>
                      );
                    })
                  ) : (
                    dbEmployees.map((emp) => {
                      const uan = emp.uan || "100293049102";
                      const basic = emp.basic || 15000;
                      const epfWages = Math.min(basic, 15000);
                      const epsWages = Math.min(basic, 15000);
                      const edliWages = Math.min(basic, 15000);
                      const epfCont = Math.round(epfWages * 0.12);
                      const epsCont = Math.round(epsWages * 0.0833);
                      const diffCont = epfCont - epsCont;
                      return (
                        <div key={emp.id} className="whitespace-nowrap">
                          {uan}#{emp.name}#{epfWages}#{epsWages}#{edliWages}#{epfCont}#{epsCont}#{diffCont}#0#0
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-[10px] text-slate-400 italic">Format: UAN#MemberName#EPFWages#EPSWages#EDLIWages#EPFCont#EPSCont#EmployerDiff#NCPDays#RefundOfAdvances</p>
              </div>
            )}

            {/* Payroll register list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Monthly Payroll Register & Statutory Deductions</h3>
                
                {/* Search / Filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search Employee..." 
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 w-full sm:w-48 text-[11px]" 
                    />
                  </div>
                  <button 
                    onClick={() => alert("Exporting report as Excel...")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border text-slate-700 dark:text-slate-350 rounded-lg font-bold"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[800px]">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b">
                    <tr>
                      <th className="p-3">UAN / Emp ID</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Basic Salary</th>
                      <th className="p-3">EPF Wages</th>
                      <th className="p-3">EPS Wages</th>
                      <th className="p-3 text-right">EE PF (12%)</th>
                      <th className="p-3 text-right">ER EPS (8.33%)</th>
                      <th className="p-3 text-right">ER EPF Diff (3.67%)</th>
                      <th className="p-3 text-right">Gross Deductions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-650 dark:text-slate-350">
                    {runs.length > 0 ? (
                      runs
                        .filter(run => (run.employee?.name || '').toLowerCase().includes(reportSearch.toLowerCase()))
                        .map((run) => {
                          const emp = run.employee;
                          const epfWages = Math.min(run.basic, 15000);
                          const epsWages = Math.min(run.basic, 15000);
                          const epfCont = Math.round(epfWages * 0.12);
                          const epsCont = Math.round(epsWages * 0.0833);
                          const diffCont = epfCont - epsCont;
                          return (
                            <tr key={run.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                              <td className="p-3">
                                <p className="font-bold text-slate-800 dark:text-white">{emp?.uan || "100293049102"}</p>
                                <span className="text-[9px] text-slate-400">{emp?.id}</span>
                              </td>
                              <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{emp?.name}</td>
                              <td className="p-3">₹{run.basic.toLocaleString()}</td>
                              <td className="p-3">₹{epfWages.toLocaleString()}</td>
                              <td className="p-3">₹{epsWages.toLocaleString()}</td>
                              <td className="p-3 text-right font-semibold text-slate-800 dark:text-white">₹{epfCont.toLocaleString()}</td>
                              <td className="p-3 text-right">₹{epsCont.toLocaleString()}</td>
                              <td className="p-3 text-right">₹{diffCont.toLocaleString()}</td>
                              <td className="p-3 text-right font-bold text-red-500">₹{run.deductions.toLocaleString()}</td>
                            </tr>
                          );
                        })
                    ) : dbEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-slate-400">No records found</td>
                      </tr>
                    ) : (
                      dbEmployees
                        .filter(emp => emp.name.toLowerCase().includes(reportSearch.toLowerCase()))
                        .map((emp) => {
                          const basic = emp.basic || 15000;
                          const epfWages = Math.min(basic, 15000);
                          const epsWages = Math.min(basic, 15000);
                          const epfCont = Math.round(epfWages * 0.12);
                          const epsCont = Math.round(epsWages * 0.0833);
                          const diffCont = epfCont - epsCont;
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                              <td className="p-3">
                                <p className="font-bold text-slate-800 dark:text-white">{emp.uan || "100293049102"}</p>
                                <span className="text-[9px] text-slate-400">{emp.id}</span>
                              </td>
                              <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{emp.name}</td>
                              <td className="p-3">₹{basic.toLocaleString()}</td>
                              <td className="p-3">₹{epfWages.toLocaleString()}</td>
                              <td className="p-3">₹{epsWages.toLocaleString()}</td>
                              <td className="p-3 text-right font-semibold text-slate-800 dark:text-white">₹{epfCont.toLocaleString()}</td>
                              <td className="p-3 text-right">₹{epsCont.toLocaleString()}</td>
                              <td className="p-3 text-right">₹{diffCont.toLocaleString()}</td>
                              <td className="p-3 text-right font-bold text-red-500">₹{(emp.deductions || 3400).toLocaleString()}</td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================= */}
      {/* 6. SALARY STRUCTURE & REVISONS PANEL    */}
      {/* ======================================= */}
      {activeSubModule === 'revisions' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Top Control Bar: Employee Selector & Quick Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary font-bold">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Employee Salary Master & Revisions</h3>
                <p className="text-slate-400 text-[11px]">Inspect CTC breakdowns, perform individual increments/decrements, or apply bulk revisions.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {isAdmin && dbEmployees.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold text-[11px]">Select Employee:</span>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs min-w-[200px]"
                  >
                    {dbEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designation || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isAdmin && selectedEmployee && (
                <button
                  type="button"
                  onClick={() => setShowIndivRevModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs shrink-0 whitespace-nowrap cursor-pointer z-10"
                >
                  <TrendingUp className="h-4 w-4 text-white shrink-0" />
                  <span className="text-white font-extrabold">Revise Salary (Increment / Decrement)</span>
                </button>
              )}
            </div>
          </div>

          {/* Section A: Individual Employee CTC Breakdown Card */}
          {selectedEmployee && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Employee Summary Banner */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg shadow-inner">
                    {selectedEmployee.name?.charAt(0) || 'E'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-850 dark:text-white text-base">{selectedEmployee.name}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {selectedEmployee.status || 'ACTIVE'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Emp ID: <span className="font-semibold text-slate-600 dark:text-slate-300">{selectedEmployee.id}</span> • Designation: <span className="font-semibold text-slate-600 dark:text-slate-300">{selectedEmployee.designation || 'Staff'}</span> • Joining: <span className="font-semibold text-slate-600 dark:text-slate-300">{selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : 'N/A'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual CTC</span>
                      <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                        ₹{((empBasic + empHra + empAllowance) * 12).toLocaleString()} / yr
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Monthly Take Home</span>
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        ₹{empNetSalary.toLocaleString()} / mo
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowIndivRevModal(true)}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-sm transition-all flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-white" />
                      <span>Adjust Structure</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Earnings & Deductions Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Monthly Earnings */}
                <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/50 dark:border-emerald-900/40 pb-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-600" /> Monthly Earnings
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">₹{(empBasic + empHra + empAllowance).toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Basic Salary (50%)</span>
                      <span className="font-bold">₹{empBasic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>House Rent Allowance (HRA)</span>
                      <span className="font-bold">₹{empHra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Special / Executive Allowance</span>
                      <span className="font-bold">₹{empAllowance.toLocaleString()}</span>
                    </div>
                    {empBonus > 0 && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span>Bonus / Incentives</span>
                        <span className="font-bold text-emerald-600">+₹{empBonus.toLocaleString()}</span>
                      </div>
                    )}
                    {empArrear > 0 && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span>Arrears Adjustment</span>
                        <span className="font-bold text-emerald-600">+₹{empArrear.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Statutory Deductions */}
                <div className="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-200/50 dark:border-rose-900/40 pb-2">
                    <span className="font-bold text-rose-900 dark:text-rose-300 text-xs flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-rose-600" /> Statutory Deductions
                    </span>
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">₹{empDeductions.toLocaleString()}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Provident Fund (EPF 12%)</span>
                      <span className="font-bold">₹{empPf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Professional Tax (PT)</span>
                      <span className="font-bold">₹{empPt.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Income Tax (TDS Estimate)</span>
                      <span className="font-bold">₹{empTds.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bank & Compliance Details */}
                <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200/50 dark:border-indigo-900/40 pb-2">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 text-xs flex items-center gap-1.5">
                      <Landmark className="h-4 w-4 text-indigo-600" /> Bank & Remittance Info
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400">Verified</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Bank Name</span>
                      <span className="font-bold">{selectedEmployee.bankName || 'HDFC Bank'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Account Number</span>
                      <span className="font-mono font-bold">{selectedEmployee.bankAccount || '•••• •••• 4912'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>IFSC Code</span>
                      <span className="font-mono font-bold uppercase">{selectedEmployee.ifsc || 'HDFC0001290'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>PAN / UAN</span>
                      <span className="font-mono font-bold uppercase">{selectedEmployee.pan || 'ABCDE1234F'}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Section B: Bulk Salary Revision Module */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-slate-150 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Bulk Salary Revision Panel</h3>
              </div>
              <span className="text-[11px] text-slate-400">Apply department-wide or organization-wide increments simultaneously</span>
            </div>

            <form onSubmit={handleExecuteBulkRevision} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Target Department</label>
                  <select
                    value={bulkDeptFilter}
                    onChange={(e) => setBulkDeptFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                  >
                    <option value="ALL">All Departments (Entire Company)</option>
                    <option value="ENGINEERING">Engineering & IT</option>
                    <option value="SALES">Sales & Marketing</option>
                    <option value="HR">Human Resources</option>
                    <option value="FINANCE">Finance & Accounts</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Revision Mode</label>
                  <div className="flex border rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-955 p-1">
                    <button
                      type="button"
                      onClick={() => setBulkMode('percent')}
                      className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
                        bulkMode === 'percent'
                          ? 'bg-primary text-white shadow'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMode('flat')}
                      className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
                        bulkMode === 'flat'
                          ? 'bg-primary text-white shadow'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Flat Amount (₹)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">
                    Increment Value ({bulkMode === 'percent' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    value={bulkVal}
                    onChange={(e) => setBulkVal(Number(e.target.value))}
                    min={0}
                    step={bulkMode === 'percent' ? 0.5 : 500}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Effective Date</label>
                  <input
                    type="date"
                    value={bulkEffectiveDate}
                    onChange={(e) => setBulkEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                  />
                </div>

              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Revision Reason / Rationale</label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Provide reason for bulk revision (e.g. Annual Appraisal 2026)"
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {/* Bulk Revision Preview Table */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block">
                  Affected Employees Preview ({dbEmployees.length} Records)
                </span>

                <div className="border rounded-2xl overflow-x-auto scrollbar-none bg-slate-50/50 dark:bg-slate-950/40">
                  <table className="w-full text-xs text-left min-w-[700px]">
                    <thead className="bg-slate-100 dark:bg-slate-950 text-slate-400 font-semibold border-b">
                      <tr>
                        <th className="p-3">Employee Name</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Current Monthly Gross</th>
                        <th className="p-3">Revised Monthly Gross</th>
                        <th className="p-3 text-right">Differential Increase (+₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-650 dark:text-slate-350">
                      {dbEmployees.slice(0, 5).map((emp) => {
                        const curBasic = emp.basic || 15000;
                        const curHra = emp.hra || Math.round(curBasic * 0.4);
                        const curAllowance = emp.allowance || Math.round(curBasic * 0.2);
                        const curGross = emp.basic ? (emp.basic + (emp.hra || Math.round(emp.basic * 0.4)) + (emp.allowance || Math.round(emp.basic * 0.2))) : (curBasic + curHra + curAllowance);

                        let newGross = curGross;
                        if (bulkMode === 'percent') {
                          newGross = Math.round(curGross * (1 + bulkVal / 100));
                        } else {
                          newGross = curGross + Number(bulkVal);
                        }
                        const diff = newGross - curGross;

                        return (
                          <tr key={emp.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-900">
                            <td className="p-3">
                              <p className="font-bold text-slate-800 dark:text-white">{emp.name}</p>
                              <span className="text-[9px] text-slate-400">{emp.id}</span>
                            </td>
                            <td className="p-3 font-medium">{emp.designation || 'Staff'}</td>
                            <td className="p-3 font-semibold">₹{curGross.toLocaleString()}</td>
                            <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">₹{newGross.toLocaleString()}</td>
                            <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                              +₹{diff.toLocaleString()} / mo
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={bulkSubmitting || applyRevisionMutation.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-extrabold shadow-md hover:scale-102 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {bulkSubmitting || applyRevisionMutation.isPending ? "Executing Revision..." : `Apply Bulk ${bulkMode === 'percent' ? `${bulkVal}%` : `₹${bulkVal}`} Revision`}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ======================================= */}
      {/* 7. INDIVIDUAL SALARY REVISION MODAL     */}
      {/* ======================================= */}
      {showIndivRevModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-150 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl font-bold">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                    Individual Salary Revision ({selectedEmployee.name})
                  </h3>
                  <p className="text-slate-400 text-[11px]">Emp ID: {selectedEmployee.id} • Adjust salary structure and effective date</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIndivRevModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyIndividualRevision} className="space-y-4">
              
              {/* Revision Type Toggle (Increment / Decrement) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRevType('increment')}
                  className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    revType === 'increment'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" /> Increment (+)
                </button>
                <button
                  type="button"
                  onClick={() => setRevType('decrement')}
                  className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    revType === 'decrement'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20'
                      : 'bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <TrendingDown className="h-4 w-4" /> Decrement (-)
                </button>
              </div>

              {/* Mode Toggle & Input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Calculation Mode</label>
                  <select
                    value={revMode}
                    onChange={(e) => setRevMode(e.target.value as 'percent' | 'flat')}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Fixed Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">
                    {revType === 'increment' ? 'Increase' : 'Decrease'} Value ({revMode === 'percent' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    value={revVal}
                    onChange={(e) => setRevVal(Number(e.target.value))}
                    min={0}
                    step={revMode === 'percent' ? 0.5 : 500}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              {(() => {
                const curBasic = selectedEmployee.basic || 15000;
                const curHra = selectedEmployee.hra || Math.round(curBasic * 0.4);
                const curAllowance = selectedEmployee.allowance || Math.round(curBasic * 0.2);
                const curGross = curBasic + curHra + curAllowance;

                let factor = 1;
                if (revMode === 'percent') {
                  const p = revVal / 100;
                  factor = revType === 'increment' ? 1 + p : Math.max(0.01, 1 - p);
                }

                let newBasic = curBasic;
                let newHra = curHra;
                let newAllowance = curAllowance;

                if (revMode === 'percent') {
                  newBasic = Math.round(curBasic * factor);
                  newHra = Math.round(curHra * factor);
                  newAllowance = Math.round(curAllowance * factor);
                } else {
                  const delta = revType === 'increment' ? Number(revVal) : -Number(revVal);
                  newBasic = Math.max(0, curBasic + Math.round(delta * 0.5));
                  newHra = Math.max(0, curHra + Math.round(delta * 0.3));
                  newAllowance = Math.max(0, curAllowance + Math.round(delta * 0.2));
                }
                const newGross = newBasic + newHra + newAllowance;
                const diffGross = newGross - curGross;

                return (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-2">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 text-xs block">
                      Live Revision Breakdown Preview
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Current Monthly Gross:</span>
                        <span className="font-bold">₹{curGross.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>New Monthly Gross:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{newGross.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Basic Salary:</span>
                        <span className="font-bold">₹{curBasic.toLocaleString()} ➔ ₹{newBasic.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Net Monthly Change:</span>
                        <span className={`font-bold ${diffGross >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {diffGross >= 0 ? '+' : ''}₹{diffGross.toLocaleString()} / mo
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Effective Date & Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Effective Date</label>
                  <input
                    type="date"
                    value={revEffectiveDate}
                    onChange={(e) => setRevEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold block">Revision Rationale / Reason</label>
                  <input
                    type="text"
                    value={revReason}
                    onChange={(e) => setRevReason(e.target.value)}
                    placeholder="Rationale (e.g. Annual Appraisal)"
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowIndivRevModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSalaryMutation.isPending}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-extrabold shadow-md hover:scale-102 transition-all disabled:opacity-50"
                >
                  {updateSalaryMutation.isPending ? "Saving..." : "Save Salary Revision"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
