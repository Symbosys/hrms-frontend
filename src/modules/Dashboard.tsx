import {
  Activity,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  PlusCircle,
  ShieldAlert,
  Smile,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';
import { useDashboardData } from '../api/hook/useDashboard';
import { useApp } from '../context/AppContext';

export const Dashboard: React.FC = () => {
  const { 
    employees, leaveRequests, setLeaveRequests, claims, setClaims, 
    auditLogs, userRole, currentUser, setActiveModule, setActiveSubModule, addAuditLog 
  } = useApp();

  const { data: dashboardResponse } = useDashboardData();
  const dbDashboard = dashboardResponse?.data;

  const [activeChartTab, setActiveChartTab] = useState<'attendance' | 'departments' | 'diversity'>('attendance');

  // Dynamic Current Date String
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Dynamic User First Name
  const greetingName = currentUser?.name 
    ? currentUser.name.split(' ')[0] 
    : userRole === 'Super Admin' ? 'Vikram' : userRole === 'HR Admin' ? 'Karan' : userRole === 'Manager' ? 'Neha' : 'Aarav';

  // Dynamic KPI Calculations
  const totalEmployees = dbDashboard?.kpis?.totalEmployees ?? employees.length;
  const activeEmployees = dbDashboard?.kpis?.activeEmployees ?? employees.filter(e => e.status === 'Active').length;
  const probationEmployees = dbDashboard?.kpis?.probationEmployees ?? employees.filter(e => e.status === 'Probation').length;
  const leaveEmployees = dbDashboard?.kpis?.leaveEmployees ?? employees.filter(e => e.status === 'On Leave').length;

  // Calculate Latest Joined Employee dynamically
  const sortedByJoining = [...employees].sort((a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime());
  const latestJoined = sortedByJoining[0];

  // Dynamic Pending Approvals
  const pendingLeaves = dbDashboard?.pendingApprovals?.leaves ?? leaveRequests.filter(r => r.status === 'Pending').map(r => ({
    id: r.id,
    employeeName: r.employeeName,
    type: r.type,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    reason: r.reason
  }));

  const pendingClaims = dbDashboard?.pendingApprovals?.claims ?? claims.filter(c => c.status === 'Pending').map(c => ({
    id: c.id,
    employeeName: c.employeeName,
    type: c.type,
    amount: c.amount,
    date: c.date,
    reason: c.reason
  }));

  const pendingApprovalsCount = dbDashboard?.kpis?.pendingApprovalsCount ?? (pendingLeaves.length + pendingClaims.length);

  // Dynamic Chart Data
  const attendanceTrendData = dbDashboard?.attendanceTrend ?? [
    { name: 'Mon', Present: 98, Late: 2, Absent: 0 },
    { name: 'Tue', Present: 96, Late: 4, Absent: 0 },
    { name: 'Wed', Present: 95, Late: 3, Absent: 2 },
    { name: 'Thu', Present: 97, Late: 1, Absent: 2 },
    { name: 'Fri', Present: 92, Late: 6, Absent: 2 },
    { name: 'Sat', Present: 40, Late: 5, Absent: 55 }
  ];

  // Dynamic Department Distribution
  const deptData = dbDashboard?.departmentDistribution ?? Object.entries(
    employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Combined Live Audit Logs
  const liveAuditLogs = dbDashboard?.auditLogs && dbDashboard.auditLogs.length > 0 
    ? dbDashboard.auditLogs 
    : auditLogs;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

  const handleApproveLeave = (id: string, name: string) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    addAuditLog("Approved Leave", "Leave Management", `Approved leave request ${id} for ${name}`);
  };

  const handleRejectLeave = (id: string, name: string) => {
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    addAuditLog("Rejected Leave", "Leave Management", `Rejected leave request ${id} for ${name}`);
  };

  const handleApproveClaim = (id: string, name: string, amount: number) => {
    setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'Approved' } : c));
    addAuditLog("Approved Travel Claim", "Travel & Claims", `Approved claim ${id} of ₹${amount} for ${name}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Dynamic Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Welcome back, {greetingName}! 
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">Here is a quick snapshot of the enterprise dashboard today, {currentDateFormatted}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setActiveModule('attendance'); setActiveSubModule('punch'); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
          >
            <Clock className="h-4 w-4" />
            <span>Clock In / Out</span>
          </button>
          <button 
            onClick={() => { setActiveModule('leave'); setActiveSubModule('apply'); }}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <Calendar className="h-4 w-4" />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Employees */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Headcount</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{totalEmployees}</span>
            <span className="text-[10px] text-green-500 font-bold ml-1.5">+1 new this month</span>
          </div>
        </div>

        {/* Active Employees */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Staff</span>
            <div className="p-2 bg-green-50 dark:bg-green-950/40 text-green-500 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{activeEmployees}</span>
            <span className="text-[10px] text-slate-500 ml-1.5">{probationEmployees} on probation</span>
          </div>
        </div>

        {/* New Joinings */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">New Joinings</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-500 rounded-lg">
              <UserPlus className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{probationEmployees > 0 ? probationEmployees : 1}</span>
            <span className="text-[10px] text-slate-500 ml-1.5 truncate block">
              {latestJoined ? `Joined (${latestJoined.name})` : 'Recent recruit'}
            </span>
          </div>
        </div>

        {/* Employees on Leave */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Out of Office</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-lg">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{leaveEmployees}</span>
            <span className="text-[10px] text-amber-500 font-medium ml-1.5">Active Leave Logs</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Pending Approvals</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-lg">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{pendingApprovalsCount}</span>
            <span className="text-[10px] text-red-500 font-semibold ml-1.5">Action Items</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Analytics & Charts */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                HR Operational Analytics
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time metrics tracking headcount, attendance, and department trends</p>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/80 self-start sm:self-auto">
              {(['attendance', 'departments', 'diversity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveChartTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeChartTab === tab 
                      ? 'bg-primary text-white shadow-sm shadow-primary/30' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-68 mt-2 w-full pt-2">
            {activeChartTab === 'attendance' && (
              <div className="h-full flex flex-col justify-between">
                <div className="flex items-center justify-end gap-4 text-[11px] font-semibold mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50"></span>
                    <span className="text-slate-600 dark:text-slate-300">Present Rate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50"></span>
                    <span className="text-slate-600 dark:text-slate-300">Late Arrivals</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50"></span>
                    <span className="text-slate-600 dark:text-slate-300">Absent Rate</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: 'rgba(51, 65, 85, 0.8)',
                        borderRadius: '12px',
                        color: '#fff',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(8px)',
                        fontSize: '12px',
                        padding: '8px 12px'
                      }}
                      itemStyle={{ color: '#fff', fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="Present" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#presentGrad)" />
                    <Area type="monotone" dataKey="Late" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#lateGrad)" />
                    <Area type="monotone" dataKey="Absent" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#absentGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChartTab === 'departments' && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={deptData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(51, 65, 85, 0.8)',
                      borderRadius: '12px',
                      color: '#fff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="value" name="Headcount" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'diversity' && (
              <div className="flex flex-col md:flex-row items-center justify-around h-full p-2 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <div className="h-48 w-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Male', value: dbDashboard?.genderDiversity?.male ?? employees.filter(e => e.gender === 'Male').length },
                          { name: 'Female', value: dbDashboard?.genderDiversity?.female ?? employees.filter(e => e.gender === 'Female').length }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        <Cell fill="#3b82f6" stroke="transparent" />
                        <Cell fill="#ec4899" stroke="transparent" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          borderColor: 'rgba(51, 65, 85, 0.8)',
                          borderRadius: '12px',
                          color: '#fff',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                      
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xs font-semibold text-slate-400">Total</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white">
                      {(dbDashboard?.genderDiversity?.male ?? employees.filter(e => e.gender === 'Male').length) + 
                       (dbDashboard?.genderDiversity?.female ?? employees.filter(e => e.gender === 'Female').length)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs min-w-[200px]">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gender Inclusion Ratio</p>
                  
                  <div className="flex items-center justify-between gap-4 p-2 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/40">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 bg-blue-500 rounded-full shadow-xs shadow-blue-500/50"></span>
                      <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">Male</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {dbDashboard?.genderDiversity?.male ?? employees.filter(e => e.gender === 'Male').length} Staff
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2 bg-pink-50/50 dark:bg-pink-950/30 rounded-lg border border-pink-100 dark:border-pink-900/40">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 bg-pink-500 rounded-full shadow-xs shadow-pink-500/50"></span>
                      <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">Female</span>
                    </div>
                    <span className="text-xs font-bold text-pink-600 dark:text-pink-400">
                      {dbDashboard?.genderDiversity?.female ?? employees.filter(e => e.gender === 'Female').length} Staff
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Workflows Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-md font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Quick System Workflows
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => { setActiveModule('employees'); setActiveSubModule('master'); }}
              className="flex flex-col items-center justify-center p-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-center hover:bg-primary/5 hover:border-primary transition-all group"
            >
              <PlusCircle className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">Add Employee</span>
            </button>
            <button 
              onClick={() => { setActiveModule('payroll'); setActiveSubModule('process'); }}
              className="flex flex-col items-center justify-center p-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-center hover:bg-primary/5 hover:border-primary transition-all group"
            >
              <Wallet className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">Run Salaries</span>
            </button>
            <button 
              onClick={() => { setActiveModule('performance'); setActiveSubModule('goals'); }}
              className="flex flex-col items-center justify-center p-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-center hover:bg-primary/5 hover:border-primary transition-all group"
            >
              <Award className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">Appraisals</span>
            </button>
            <button 
              onClick={() => { setActiveModule('recruitment'); setActiveSubModule('jobs'); }}
              className="flex flex-col items-center justify-center p-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-center hover:bg-primary/5 hover:border-primary transition-all group"
            >
              <Users className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform mb-1.5" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">Create Job</span>
            </button>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Company Mood Index</span>
            <div className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-emerald-500" />
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Very Happy (84%)</span>
                <span className="text-[9px] text-slate-400 block">Based on weekly pulse check</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Approvals Workflow & Session Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Approvals Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-md font-bold text-slate-800 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span>Pending Approvals Workflow</span>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingApprovalsCount} Action Items
            </span>
          </h2>

          <div className="space-y-3">
            {pendingLeaves.length === 0 && pendingClaims.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                🎉 Excellent! All approvals are up to date.
              </div>
            )}
            
            {/* Dynamic Leaves Pending */}
            {pendingLeaves.map((req) => (
              <div key={req.id} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between gap-4 text-xs animate-fade-in">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-white">{req.employeeName}</span>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">{req.type}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {req.startDate} to {req.endDate} ({req.days} days) • Reason: "{req.reason}"
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button 
                    onClick={() => handleApproveLeave(req.id, req.employeeName)}
                    className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors" 
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleRejectLeave(req.id, req.employeeName)}
                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" 
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Dynamic Claims Pending */}
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="p-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between gap-4 text-xs animate-fade-in">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-white">{claim.employeeName}</span>
                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">{claim.type} Claim</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Amount: <span className="font-bold text-slate-800 dark:text-white">₹{claim.amount.toLocaleString()}</span> • Applied: {claim.date} • Reason: "{claim.reason}"
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button 
                    onClick={() => handleApproveClaim(claim.id, claim.employeeName, claim.amount)}
                    className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors" 
                    title="Approve"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'Rejected' } : c));
                      addAuditLog("Rejected Travel Claim", "Travel & Claims", `Rejected claim ${claim.id} of ₹${claim.amount} for ${claim.employeeName}`);
                    }}
                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors" 
                    title="Reject"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Live Audit Logs */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-md font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Session Audit Logs
          </h2>
          <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
            {liveAuditLogs.map((log) => (
              <div key={log.id} className="relative pl-5 border-l border-slate-100 dark:border-slate-800 pb-3 last:pb-0 text-xs">
                <span className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-primary border-2 border-white dark:border-slate-900 flex items-center justify-center"></span>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-bold text-slate-500 dark:text-slate-350">{log.action}</span>
                  <span>{log.timestamp}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{log.details}</p>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Logged by: {log.user}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Celebrations & Organizational Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Celebrations */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-md font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Celebrations</span>
            <Smile className="h-4 w-4 text-pink-500" />
          </h2>
          <div className="space-y-4">
            {dbDashboard && (dbDashboard.celebrations.birthdays.length > 0 || dbDashboard.celebrations.anniversaries.length > 0) ? (
              <>
                {dbDashboard.celebrations.birthdays.map((b) => (
                  <div key={b.id} className="flex items-start gap-3 animate-fade-in">
                    <div className="p-2 bg-pink-50 dark:bg-pink-950/40 text-pink-500 rounded-xl text-xs font-bold text-center w-12 shrink-0">
                      🎂 <span className="block mt-0.5 text-[9px] uppercase">Today</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{b.name}'s Birthday</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Turns a year older today! Send warm wishes.</p>
                      <button 
                        onClick={() => { setActiveModule('engagement'); setActiveSubModule('feed'); }}
                        className="text-[10px] text-primary hover:underline font-bold mt-1.5 block"
                      >
                        Write on Post Feed →
                      </button>
                    </div>
                  </div>
                ))}
                {dbDashboard.celebrations.anniversaries.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 animate-fade-in">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-xl text-xs font-bold text-center w-12 shrink-0">
                      💼 <span className="block mt-0.5 text-[9px] uppercase">Anniv</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{a.name}'s Work Anniversary</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Congratulations on another milestone year!</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-pink-50 dark:bg-pink-950/40 text-pink-500 rounded-xl text-xs font-bold text-center w-12 shrink-0">
                    🎂 <span className="block mt-0.5 text-[9px] uppercase">Today</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{employees[0]?.name || 'Aarav Sharma'}'s Birthday</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Turns a year older today! Send warm wishes.</p>
                    <button 
                      onClick={() => { setActiveModule('engagement'); setActiveSubModule('feed'); }}
                      className="text-[10px] text-primary hover:underline font-bold mt-1.5 block"
                    >
                      Write on Post Feed →
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-xl text-xs font-bold text-center w-12 shrink-0">
                    💼 <span className="block mt-0.5 text-[9px] uppercase">Jul 5</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">2-Year Work Anniversary</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{employees[1]?.name || 'Neha Patel'} completes 2 years at FactoCorp!</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Holidays */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-md font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Upcoming Holidays</span>
            <Calendar className="h-4 w-4 text-primary" />
          </h2>
          <div className="space-y-3">
            {dbDashboard && dbDashboard.upcomingHolidays.length > 0 ? (
              dbDashboard.upcomingHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between text-xs animate-fade-in">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{holiday.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{holiday.type}</p>
                  </div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border px-2.5 py-1 rounded-lg">
                    {holiday.date}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Independence Day</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">National Holiday</p>
                  </div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border px-2.5 py-1 rounded-lg">Aug 15 (Sat)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">Ganesh Chaturthi</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Regional Holiday</p>
                  </div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border px-2.5 py-1 rounded-lg">Sep 14 (Mon)</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Org Chart Structure */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-md font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Organizational Preview</span>
            <Users className="h-4 w-4 text-purple-500" />
          </h2>
          <div className="flex flex-col items-center justify-center py-2">
            <div className="bg-primary/10 border border-primary/20 p-2 rounded-lg text-center w-36 shadow-sm">
              <p className="text-[10px] font-bold text-primary leading-none">
                {employees.find(e => e.role === 'Super Admin' || e.role?.includes('CEO') || e.role?.includes('Executive'))?.name || 'Vikram Malhotra'}
              </p>
              <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">CEO / Executive</p>
            </div>
            <div className="h-4 w-0.5 bg-slate-200 dark:bg-slate-800 my-1"></div>
            <div className="flex gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 border p-1.5 rounded-lg text-center w-24">
                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-none truncate">
                  {employees.find(e => e.department === 'Engineering')?.name || 'Neha Patel'}
                </p>
                <p className="text-[7px] text-slate-400 mt-0.5">Engineering</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border p-1.5 rounded-lg text-center w-24">
                <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-none truncate">
                  {employees.find(e => e.department === 'Human Resources')?.name || 'Shalini Sen'}
                </p>
                <p className="text-[7px] text-slate-400 mt-0.5">Human Resources</p>
              </div>
            </div>
            <button 
              onClick={() => { setActiveModule('employees'); setActiveSubModule('orgchart'); }}
              className="text-[10px] text-primary hover:underline font-bold mt-4 flex items-center gap-1.5"
            >
              <span>View Full Org Structure</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
