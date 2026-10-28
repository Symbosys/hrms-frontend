import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useEmployees } from '../api/hook/useEmployee';
import {
  useTimesheets,
  useSubmitTimesheet,
  useUpdateTimesheetStatus
} from '../api/hook/useTimesheets';
import { 
  Users, 
  Clock, 
  Check, 
  X, 
  Plus, 
  Briefcase, 
  UserCheck, 
  AlertCircle, 
  Trash2, 
  Search 
} from 'lucide-react';

export interface AssignedTask {
  id: string;
  project: string;
  title: string;
  assigneeId: string;
  assigneeName: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  week: string;
  status: 'Assigned' | 'In Progress' | 'Completed';
  createdAt: string;
}

export const Timesheets: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, showConfirm, showAlert } = useApp();

  // Simulated active employee switcher
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // Fetch employees list
  const { data: dbEmployeesRes, isLoading: employeesLoading } = useEmployees();
  const employeesList = dbEmployeesRes?.data || [];

  // Automatically select first employee as current user
  
  useEffect(() => {
    if (employeesList.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employeesList[0].id);
    }
  }, [employeesList, selectedEmpId]);

  const activeEmployee = employeesList.find(emp => emp.id === selectedEmpId);

  // Check if simulated user has approval/admin permissions
  const isApprover = activeEmployee?.user?.role?.name === 'SUPER_ADMIN' || 
                     activeEmployee?.user?.role?.name === 'HR_ADMIN' || 
                     activeEmployee?.designation?.toUpperCase().includes('MANAGER') || 
                     activeEmployee?.designation?.toUpperCase().includes('LEAD') || 
                     activeEmployee?.designation?.toUpperCase().includes('DIRECTOR') ||
                     activeEmployee?.designation?.toUpperCase().includes('HEAD') ||
                     true; // Enable Task Assignment for demo admin access

  // Queries
  const { data: timesheetsRes, isLoading: timesheetsLoading } = useTimesheets(
    activeSubModule === 'projects' && !isApprover ? { employeeId: selectedEmpId } : undefined
  );
  const timesheetsList = timesheetsRes?.data || [];

  // Mutations
  const submitTimesheetMut = useSubmitTimesheet();
  const updateStatusMut = useUpdateTimesheetStatus();

  // Weekly hours state
  const [monHours, setMonHours] = useState(8);
  const [tueHours, setTueHours] = useState(8);
  const [wedHours, setWedHours] = useState(8);
  const [thuHours, setThuHours] = useState(8);
  const [friHours, setFriHours] = useState(8);

  const [project, setProject] = useState('Symbosys HRMS Redesign');
  const [task, setTask] = useState('Developing core employee directory views');

  const totalComputedHours = monHours + tueHours + wedHours + thuHours + friHours;

  // Assigned Tasks State (Persisted in localStorage)
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>(() => {
    const saved = localStorage.getItem('hrms_assigned_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        id: "TSK-101",
        project: "Symbosys HRMS Redesign",
        title: "Build Geofencing & Roster Attendance Modules",
        assigneeId: "EMP001",
        assigneeName: "Aarav Sharma",
        priority: "High",
        estimatedHours: 16,
        week: "Week 27 (Jul 1 - Jul 5)",
        status: "In Progress",
        createdAt: "2026-07-20",
      },
      {
        id: "TSK-102",
        project: "Vite Migration Upgrade",
        title: "Optimize Bundle Chunks and Dynamic Imports",
        assigneeId: "EMP002",
        assigneeName: "Neha Patel",
        priority: "Medium",
        estimatedHours: 12,
        week: "Week 27 (Jul 1 - Jul 5)",
        status: "Assigned",
        createdAt: "2026-07-21",
      },
      {
        id: "TSK-103",
        project: "Client Portal Support (SLA)",
        title: "Audit Payroll Tax Declarations API Integration",
        assigneeId: "EMP003",
        assigneeName: "Rohan Das",
        priority: "High",
        estimatedHours: 20,
        week: "Week 28 (Jul 6 - Jul 12)",
        status: "Assigned",
        createdAt: "2026-07-21",
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('hrms_assigned_tasks', JSON.stringify(assignedTasks));
  }, [assignedTasks]);

  // Task Creation Form States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskProject, setNewTaskProject] = useState('Symbosys HRMS Redesign');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskEstimatedHours, setNewTaskEstimatedHours] = useState(8);
  const [newTaskWeek] = useState('Week 27 (Jul 1 - Jul 5)');

  // Task Filters
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('ALL');

  // Automatically sync initial assignee id when employees load
  useEffect(() => {
    if (employeesList.length > 0 && !newTaskAssigneeId) {
      setNewTaskAssigneeId(employeesList[0].id);
    }
  }, [employeesList, newTaskAssigneeId]);

  // Handle Task Creation by Admin
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      showAlert("Please enter a valid task title!", "Missing Title", "warning");
      return;
    }
    const assignee = employeesList.find(e => e.id === newTaskAssigneeId) || employeesList[0];
    const created: AssignedTask = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      project: newTaskProject,
      title: newTaskTitle.trim(),
      assigneeId: assignee?.id || selectedEmpId,
      assigneeName: assignee?.name || activeEmployee?.name || "Employee",
      priority: newTaskPriority,
      estimatedHours: Number(newTaskEstimatedHours),
      week: newTaskWeek,
      status: 'Assigned',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAssignedTasks(prev => [created, ...prev]);
    addAuditLog("Assigned Task to Staff", "Timesheets Module", `Admin created task "${newTaskTitle}" and assigned to ${created.assigneeName}`);
    showAlert(`Task "${newTaskTitle}" successfully created and assigned to ${created.assigneeName}!`, "Task Assigned", "success");
    setNewTaskTitle('');
    setShowTaskModal(false);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'Assigned' | 'In Progress' | 'Completed') => {
    setAssignedTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    showConfirm({
      title: "Remove Assigned Task",
      message: "Are you sure you want to remove this assigned task?",
      type: "danger",
      confirmText: "Remove Task",
      onConfirm: () => {
        setAssignedTasks(prev => prev.filter(t => t.id !== taskId));
        showAlert("Assigned task removed.", "Removed", "info");
      }
    });
  };

  const handleSubmitTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !activeEmployee) return;

    showConfirm({
      title: "Confirm Timesheet Submission",
      message: `Are you sure you want to submit a timesheet of ${totalComputedHours} hours for project "${project}"?`,
      type: "confirm",
      confirmText: "Submit Timesheet",
      onConfirm: () => {
        submitTimesheetMut.mutate({
          employeeId: selectedEmpId,
          project,
          task,
          monHours,
          tueHours,
          wedHours,
          thuHours,
          friHours,
          week: "Week 27 (Jul 1 - Jul 5)",
        }, {
          onSuccess: () => {
            addAuditLog("Timesheet Submitted", "Timesheets Module", `${activeEmployee.name} submitted timesheet of ${totalComputedHours} hours for project ${project}`);
            showAlert(`Timesheet of ${totalComputedHours} hours submitted successfully!`, "Timesheet Submitted", "success");
            setActiveSubModule('projects');
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to submit timesheet", "Error", "danger");
          }
        });
      }
    });
  };

  const handleApprove = (id: string, employeeName: string, hours: number) => {
    showConfirm({
      title: "Approve Timesheet",
      message: `Are you sure you want to approve timesheet of ${hours} hours for ${employeeName}?`,
      type: "confirm",
      confirmText: "Approve Timesheet",
      onConfirm: () => {
        updateStatusMut.mutate({ id, status: 'Approved' }, {
          onSuccess: () => {
            addAuditLog("Approved Timesheet", "Timesheets Module", `Approved timesheet ${id} of ${hours} hours for ${employeeName}`);
            showAlert(`Approved timesheet successfully.`, "Approved", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to update timesheet", "Error", "danger");
          }
        });
      }
    });
  };

  const handleReject = (id: string, employeeName: string, hours: number) => {
    showConfirm({
      title: "Reject Timesheet",
      message: `Are you sure you want to reject timesheet of ${hours} hours for ${employeeName}?`,
      type: "danger",
      confirmText: "Reject Timesheet",
      onConfirm: () => {
        updateStatusMut.mutate({ id, status: 'Rejected' }, {
          onSuccess: () => {
            addAuditLog("Rejected Timesheet", "Timesheets Module", `Rejected timesheet ${id} of ${hours} hours for ${employeeName}`);
            showAlert(`Rejected timesheet successfully.`, "Rejected", "info");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to update timesheet", "Error", "danger");
          }
        });
      }
    });
  };

  const filteredTasks = assignedTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          t.project.toLowerCase().includes(taskSearch.toLowerCase()) ||
                          t.assigneeName.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskFilterStatus === 'ALL' || t.status === taskFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const myAssignedTasks = assignedTasks.filter(t => t.assigneeId === selectedEmpId || t.assigneeName === activeEmployee?.name);

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveSubModule('entry')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'entry' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Submit Hours
        </button>
        <button 
          onClick={() => setActiveSubModule('projects')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'projects' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Timesheet Logs & Tasks
        </button>
      </div>

      {/* Global Simulated User Switcher */}
      <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Simulate as Employee</h4>
            <p className="text-slate-450 mt-0.5">Switch active user view to assign tasks, submit timesheets, or manage approvals.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3.5 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
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
            <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold uppercase text-[10px]">
              {activeEmployee.department?.name || 'Operations'}
            </span>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* 1. SUBMIT HOURS GRID                     */}
      {/* ======================================= */}
      {activeSubModule === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Submit Grid */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-primary" />
                <span>Weekly Timesheet Form</span>
              </span>
              <span className="text-slate-400 font-normal text-xs">
                Log work for <span className="font-bold text-slate-700 dark:text-slate-300">{activeEmployee?.name}</span>
              </span>
            </h3>

            {/* Quick Assigned Tasks Selector for Active Employee */}
            {myAssignedTasks.length > 0 && (
              <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Tasks Assigned to You ({myAssignedTasks.length})</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Click a task to auto-fill form</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {myAssignedTasks.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setProject(t.project);
                        setTask(t.title);
                      }}
                      className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-400 text-[11px] flex items-center gap-1.5 transition-all text-left shadow-xs cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300">[{t.project}]</span>
                      <span className="truncate max-w-[200px]">{t.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmitTimesheet} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Select Billing Project</label>
                  <select 
                    value={project} 
                    onChange={(e) => setProject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 focus:outline-none font-semibold text-xs"
                  >
                    <option value="Symbosys HRMS Redesign">Symbosys HRMS Redesign</option>
                    <option value="Vite Migration Upgrade">Vite Migration Upgrade</option>
                    <option value="Client Portal Support (SLA)">Client Portal Support (SLA)</option>
                    <option value="Mobile App Native Build">Mobile App Native Build</option>
                    <option value="Internal Operations & Infra">Internal Operations & Infra</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Activity Task Description</label>
                  <input 
                    type="text" 
                    value={task} 
                    onChange={(e) => setTask(e.target.value)}
                    placeholder="Enter activity description..."
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 font-semibold text-xs"
                  />
                </div>
              </div>

              {/* Day Inputs */}
              <div className="grid grid-cols-5 gap-3 pt-2">
                <div className="space-y-1 text-center">
                  <label className="text-slate-400 font-semibold block">Mon</label>
                  <input 
                    type="number" 
                    value={monHours} 
                    onChange={(e) => setMonHours(Number(e.target.value))}
                    max={24} min={0} 
                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-center bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white font-bold"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-slate-400 font-semibold block">Tue</label>
                  <input 
                    type="number" 
                    value={tueHours} 
                    onChange={(e) => setTueHours(Number(e.target.value))}
                    max={24} min={0} 
                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-center bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white font-bold"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-slate-400 font-semibold block">Wed</label>
                  <input 
                    type="number" 
                    value={wedHours} 
                    onChange={(e) => setWedHours(Number(e.target.value))}
                    max={24} min={0} 
                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-center bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white font-bold"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-slate-400 font-semibold block">Thu</label>
                  <input 
                    type="number" 
                    value={thuHours} 
                    onChange={(e) => setThuHours(Number(e.target.value))}
                    max={24} min={0} 
                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-center bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white font-bold"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-slate-400 font-semibold block">Fri</label>
                  <input 
                    type="number" 
                    value={friHours} 
                    onChange={(e) => setFriHours(Number(e.target.value))}
                    max={24} min={0} 
                    className="w-full px-2 py-1.5 border rounded-lg focus:outline-none text-center bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-4 items-center">
                <span className="text-slate-400 font-bold">Total Computed Hours: <span className="text-primary text-sm font-black">{totalComputedHours} Hours</span></span>
                <button 
                  type="submit" 
                  disabled={submitTimesheetMut.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md shadow-primary/10 disabled:opacity-50 cursor-pointer"
                >
                  {submitTimesheetMut.isPending ? "Submitting..." : "Submit Hours to Manager"}
                </button>
              </div>
            </form>
          </div>

          {/* Allocation details info card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Resource Utilization KPI</h3>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-medium">Billable Target:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">40 Hours / Week</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450 font-medium">Logged Hours:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalComputedHours} Hours</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (totalComputedHours / 40) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-450 font-medium">Utilization Rating:</span>
                <span className="font-bold text-emerald-500">100% Billable</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-955/40 border border-amber-200/50 dark:border-amber-900/30 rounded-xl space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>Timesheet Deadline</span>
              </span>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Please submit your weekly timesheet logs before Friday 6:00 PM for approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. TIMESHEET LOGS & ADMIN TASK ASSIGNMENT */}
      {/* ======================================= */}
      {activeSubModule === 'projects' && (
        <div className="space-y-6 animate-fade-in text-xs">

          {/* ADMIN TASK CREATION & ASSIGNMENT BOARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            
            {/* Header & Create Task Trigger */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Admin Task Creation & Assignment Board</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {assignedTasks.length} Total Tasks
                  </span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Create new project tasks and assign them directly to team members.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search task or staff..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 text-xs w-40 md:w-52"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={taskFilterStatus}
                  onChange={(e) => setTaskFilterStatus(e.target.value)}
                  className="px-3 py-1.5 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none text-xs"
                >
                  <option value="ALL">All Status</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>

                {/* Create Task Button */}
                <button
                  type="button"
                  onClick={() => setShowTaskModal(true)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4 text-white" />
                  <span>Create & Assign Task</span>
                </button>
              </div>
            </div>

            {/* CREATE TASK FORM MODAL / PANEL */}
            {showTaskModal && (
              <div className="p-5 bg-slate-50/90 dark:bg-slate-955 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-600 text-white font-bold">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-sm">Create New Task & Assign Employee</h4>
                      <p className="text-slate-400 text-xs">Fill details to assign a project work item to employee dashboard.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTaskModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Project */}
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold">Project Name</label>
                      <select
                        value={newTaskProject}
                        onChange={(e) => setNewTaskProject(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none text-xs"
                      >
                        <option value="Symbosys HRMS Redesign">Symbosys HRMS Redesign</option>
                        <option value="Vite Migration Upgrade">Vite Migration Upgrade</option>
                        <option value="Client Portal Support (SLA)">Client Portal Support (SLA)</option>
                        <option value="Mobile App Native Build">Mobile App Native Build</option>
                        <option value="Internal Operations & Infra">Internal Operations & Infra</option>
                      </select>
                    </div>

                    {/* Task Title */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-slate-500 font-bold">Task Title / Activity Summary</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Implement Geofence Map and Roster CRUD logic"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Assignee Employee */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-slate-500 font-bold">Assign Employee</label>
                      <select
                        value={newTaskAssigneeId}
                        onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none text-xs"
                      >
                        {employeesList.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.id} • {emp.designation || 'Staff'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold">Priority</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none text-xs"
                      >
                        <option value="High">High Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="Low">Low Priority</option>
                      </select>
                    </div>

                    {/* Estimated Hours */}
                    <div className="space-y-1">
                      <label className="text-slate-500 font-bold">Estimated Hours</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newTaskEstimatedHours}
                        onChange={(e) => setNewTaskEstimatedHours(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Confirm & Assign Task</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ASSIGNED TASKS GRID */}
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider mb-3">
                Assigned Team Tasks ({filteredTasks.length})
              </h4>

              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-2xl border-slate-250 dark:border-slate-800 text-slate-400 font-semibold">
                  No assigned tasks found matching your current filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.map((taskItem) => (
                    <div 
                      key={taskItem.id} 
                      className="p-4 border border-slate-150 dark:border-slate-800 rounded-2xl bg-slate-50/60 dark:bg-slate-955 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                          {taskItem.project}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                            taskItem.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' :
                            taskItem.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                          }`}>
                            {taskItem.priority}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(taskItem.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-extrabold text-slate-850 dark:text-white text-xs leading-snug">
                          {taskItem.title}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          ID: {taskItem.id} • Target: {taskItem.estimatedHours} Hours
                        </span>
                      </div>

                      {/* Assignee employee card */}
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px] shrink-0">
                            {taskItem.assigneeName?.charAt(0) || 'E'}
                          </div>
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block font-medium">Assigned To:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block truncate">{taskItem.assigneeName}</span>
                          </div>
                        </div>

                        {/* Status Select */}
                        <select
                          value={taskItem.status}
                          onChange={(e) => handleUpdateTaskStatus(taskItem.id, e.target.value as any)}
                          className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer transition-all ${
                            taskItem.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' :
                            taskItem.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                          }`}
                        >
                          <option value="Assigned">Assigned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Manager approval board (Visible to approvers) */}
          {isApprover && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center justify-between">
                <span>Pending Team Timesheets</span>
                <span className="bg-amber-100 text-amber-850 px-2.5 py-0.5 rounded-full font-bold text-xs">
                  {timesheetsLoading ? "..." : timesheetsList.filter(ts => ts.status === 'Pending').length} Pending
                </span>
              </h3>

              {timesheetsLoading ? (
                <div className="py-8 text-center text-slate-400 font-medium">Loading pending logs...</div>
              ) : (
                <div className="space-y-3">
                  {timesheetsList.filter(ts => ts.status === 'Pending').length === 0 ? (
                    <p className="text-slate-450 text-center py-4">No timesheets are currently awaiting review.</p>
                  ) : (
                    timesheetsList.filter(ts => ts.status === 'Pending').map((ts) => (
                      <div key={ts.id} className="p-4 border border-slate-200/50 dark:border-slate-850 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-955 gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-white">{ts.employeeName}</span>
                            <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-[9px] font-bold">{ts.project}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Logged: <span className="font-bold text-slate-700 dark:text-slate-300">{ts.hours} Hours</span> • Week: {ts.week}
                          </p>
                          <p className="text-slate-450 mt-0.5">Task Description: "{ts.task}"</p>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApprove(ts.id, ts.employeeName, ts.hours)}
                            disabled={updateStatusMut.isPending}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button 
                            onClick={() => handleReject(ts.id, ts.employeeName, ts.hours)}
                            disabled={updateStatusMut.isPending}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Logs listing */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">
              {isApprover ? "Global Timesheet History" : "My Submitted Hours History"}
            </h3>
            
            {timesheetsLoading ? (
              <div className="py-8 text-center text-slate-400 font-medium">Loading history logs...</div>
            ) : timesheetsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">No hours have been logged yet.</div>
            ) : (
              <div className="space-y-3.5">
                {timesheetsList.map((ts) => (
                  <div key={ts.id} className="p-3 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-955">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-850 dark:text-white">{ts.project}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{ts.week}</span>
                        {isApprover && (
                          <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-650 px-1.5 py-0.2 rounded font-bold uppercase">{ts.employeeName}</span>
                        )}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Logged Total: <span className="font-bold text-slate-700 dark:text-slate-300">{ts.hours} Hours</span> (M: {ts.monHours}h, T: {ts.tueHours}h, W: {ts.wedHours}h, T: {ts.thuHours}h, F: {ts.friHours}h)
                      </p>
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      ts.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                      ts.status === 'Pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}>
                      {ts.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
