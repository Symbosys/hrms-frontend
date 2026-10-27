import {
    Award,
    Briefcase,
    CalendarDays,
    ChevronDown, ChevronRight,
    ClipboardList,
    Clock,
    CreditCard,
    FileText,
    Heart,
    HelpCircle,
    Landmark,
    Laptop,
    LayoutDashboard,
    MailOpen,
    Plane,
    Users,
    Wallet,
    X
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  subItems?: { id: string; label: string }[];
}

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, setMobileOpen }) => {
  const { activeModule, setActiveModule, activeSubModule, setActiveSubModule, userRole, currentUser } = useApp();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isAdmin = userRole === 'Super Admin' || userRole === 'HR Admin' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'Super Admin';

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'employees', 
      label: 'Employee Center', 
      icon: Users,
      subItems: isAdmin ? [
        { id: 'directory', label: 'Employee Directory' },
        { id: 'master', label: 'Employee Master' },
        { id: 'idcard', label: 'ID Card Generator' },
        { id: 'orgchart', label: 'Organization Chart' },
        { id: 'exit', label: 'Exit & Settlement' },
        { id: 'resignation', label: 'Resignation Archive' },
        { id: 'bulk', label: 'Bulk Imports & Exports' },
        { id: 'roles', label: 'Role & Permissions' },
        { id: 'departments', label: 'Departments' }
      ] : [
        { id: 'directory', label: 'Employee Directory' },
        { id: 'idcard', label: 'ID Card Generator' },
        { id: 'orgchart', label: 'Organization Chart' },
      ]
    },
    { 
      id: 'attendance', 
      label: 'Attendance', 
      icon: Clock,
      subItems: [
        { id: 'punch', label: 'GPS / Selfie Punch' },
        { id: 'roster', label: 'Shift & Roster' },
        { id: 'regularize', label: 'Regularization' },
        { id: 'muster', label: 'Muster Roll / Calendar' },
        { id: 'reports', label: 'Attendance Reports' },
        { id: 'geofence', label: 'Geofencing Config' }
      ]
    },
    { 
      id: 'leave', 
      label: 'Leave Management', 
      icon: CalendarDays,
      subItems: [
        { id: 'apply', label: 'Apply Leave' },
        { id: 'approvals', label: 'Leave Approvals' },
        { id: 'calendar', label: 'Leave Calendar' },
        { id: 'policies', label: 'Leave Policies' },
        { id: 'admin', label: 'Leave Configurations' }
      ]
    },
    { 
      id: 'payroll', 
      label: 'Payroll Processing', 
      icon: Wallet,
      subItems: [
        { id: 'process', label: 'Salary Processing' },
        { id: 'revisions', label: 'Salary Structure & Revisions' },
        { id: 'loans', label: 'Loans & Advances' },
        { id: 'investment', label: 'Investment Declarations' },
        { id: 'payslips', label: 'Payslip Templates' },
        { id: 'reports', label: 'Payroll Reports & ECR' }
      ]
    },
    { 
      id: 'performance', 
      label: 'Performance (PMS)', 
      icon: Award,
      subItems: [
        { id: 'goals', label: 'KRA & Goal Setting' },
        { id: 'feedback', label: '360° Feedback' },
        { id: 'bellcurve', label: 'Bell Curve Analytics' }
      ]
    },
    { 
      id: 'engagement', 
      label: 'Engagement & Surveys', 
      icon: Heart,
      subItems: [
        { id: 'feed', label: 'Social Feed & Posts' },
        { id: 'mood', label: 'Mood Analysis' },
        { id: 'surveys', label: 'Surveys & Feedback' }
      ]
    },
    { 
      id: 'claims', 
      label: 'Travel & Claims', 
      icon: Plane,
      subItems: [
        { id: 'apply-claim', label: 'New Travel Request' },
        { id: 'my-claims', label: 'Expense Reimbursements' },
        { id: 'approvals', label: 'Claim Approvals' }
      ]
    },
    {
      id: 'timesheets',
      label: 'Timesheets',
      icon: ClipboardList,
      subItems: [
        { id: 'entry', label: 'Timesheet Entry' },
        { id: 'projects', label: 'Clients & Projects' }
      ]
    },
    { 
      id: 'recruitment', 
      label: 'Recruitment & ATS', 
      icon: Briefcase,
      subItems: [
        { id: 'jobs', label: 'Job Requisitions' },
        { id: 'candidates', label: 'Candidate Pipeline' },
        { id: 'onboarding', label: 'Pre-Onboarding Checklist' }
      ]
    },
    { id: 'documents', label: 'Document Vault', icon: FileText },
    { id: 'assets', label: 'Asset Management', icon: Laptop },
    { id: 'letters', label: 'Letter Generator', icon: MailOpen },
    { id: 'helpdesk', label: 'HR Help Desk', icon: HelpCircle },
    { id: 'subscription', label: 'Subscription & Plans', icon: CreditCard }
  ];

  const handleModuleClick = (item: MenuItem) => {
    setActiveModule(item.id);
    if (item.subItems) {
      setOpenDropdown(openDropdown === item.id ? null : item.id);
      setActiveSubModule(item.subItems[0].id);
    } else {
      setOpenDropdown(null);
      if (setMobileOpen) setMobileOpen(false);
    }
  };

  const handleSubItemClick = (moduleId: string, subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveModule(moduleId);
    setActiveSubModule(subId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <aside 
        className={`bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col h-screen select-none border-r border-slate-800 shrink-0
          fixed inset-y-0 left-0 z-50 md:static ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800 bg-slate-950">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg text-white font-bold flex items-center justify-center shadow-lg shadow-primary/20">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white tracking-wide text-lg leading-none">Symbosys HRMS</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Enterprise Suite</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="bg-primary p-2 rounded-lg text-white mx-auto">
              <Landmark className="h-5 w-5" />
            </div>
          )}

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors hidden md:block"
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronRight className="h-5 w-5 rotate-180" />}
            </button>
            <button 
              onClick={() => setMobileOpen?.(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors md:hidden"
              title="Close Navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1.5 px-3">
          {(() => {
            const { currentUser } = useApp();
            const userPerms = currentUser?.permissions || [];
            const isSuperAdmin = currentUser?.role === 'Super Admin';

            const getSubItemPermission = (moduleId: string, subId: string): string => {
              if (moduleId === 'employees') {
                if (subId === 'directory') return 'VIEW_EMPLOYEE_DIRECTORY';
                if (subId === 'master') return 'VIEW_EMPLOYEE_MASTER';
                if (subId === 'orgchart') return 'VIEW_ORGANIZATION_CHART';
                if (subId === 'exit') return 'VIEW_EXIT_SETTLEMENT';
                if (subId === 'resignation') return 'VIEW_EXIT_SETTLEMENT';
                if (subId === 'bulk') return 'MANAGE_BULK_IMPORTS';
                if (subId === 'roles') return 'VIEW_ROLES_PERMISSIONS';
                if (subId === 'departments') return 'VIEW_DEPARTMENTS';
              }
              if (moduleId === 'attendance') {
                if (subId === 'punch') return 'VIEW_GPS_SELFIE_PUNCH';
                if (subId === 'roster') return 'VIEW_SHIFT_ROSTER';
                if (subId === 'regularize') return 'VIEW_ATTENDANCE_REGULARIZATION';
                if (subId === 'muster') return 'VIEW_MUSTER_ROLL';
                if (subId === 'reports') return 'VIEW_ATTENDANCE_REPORTS';
                if (subId === 'geofence') return 'UPDATE_SHIFT_ROSTER';
              }
              if (moduleId === 'leave') {
                if (subId === 'apply') return 'CREATE_LEAVE_APPLICATION';
                if (subId === 'approvals') return 'UPDATE_LEAVE_APPROVAL';
                if (subId === 'calendar') return 'VIEW_LEAVE_CALENDAR';
                if (subId === 'policies') return 'VIEW_LEAVE_POLICIES';
              }
              if (moduleId === 'payroll') {
                if (subId === 'process') return 'UPDATE_SALARY_PROCESSING';
                if (subId === 'revisions') return 'UPDATE_SALARY_STRUCTURE';
                if (subId === 'loans') return 'VIEW_LOANS_ADVANCES';
                if (subId === 'investment') return 'VIEW_INVESTMENT_DECLARATIONS';
                if (subId === 'payslips') return 'VIEW_PAYSLIP_TEMPLATES';
                if (subId === 'reports') return 'VIEW_PAYROLL_REPORTS';
              }
              if (moduleId === 'performance') {
                if (subId === 'goals') return 'VIEW_KRA_GOALS';
                if (subId === 'feedback') return 'VIEW_FEEDBACK_360';
                if (subId === 'bellcurve') return 'VIEW_BELLCURVE_ANALYTICS';
              }
              if (moduleId === 'engagement') {
                if (subId === 'feed') return 'VIEW_SOCIAL_FEED';
                if (subId === 'mood') return 'VIEW_MOOD_ANALYSIS';
                if (subId === 'surveys') return 'VIEW_SURVEYS';
              }
              if (moduleId === 'claims') {
                if (subId === 'apply-claim') return 'CREATE_TRAVEL_REQUEST';
                if (subId === 'my-claims') return 'VIEW_EXPENSE_REIMBURSEMENT';
                if (subId === 'approvals') return 'UPDATE_CLAIM_APPROVAL';
              }
              if (moduleId === 'timesheets') {
                if (subId === 'entry') return 'VIEW_TIMESHEET_ENTRY';
                if (subId === 'projects') return 'VIEW_CLIENTS_PROJECTS';
              }
              if (moduleId === 'recruitment') {
                if (subId === 'jobs') return 'VIEW_JOB_REQUISITIONS';
                if (subId === 'candidates') return 'VIEW_CANDIDATE_PIPELINE';
                if (subId === 'onboarding') return 'VIEW_PRE_ONBOARDING';
              }
              if (moduleId === 'documents') {
                if (subId === 'vault') return 'VIEW_DOCUMENT_VAULT';
              }
              if (moduleId === 'assets') {
                if (subId === 'register') return 'VIEW_ASSET_MANAGEMENT';
              }
              if (moduleId === 'letters') {
                if (subId === 'generate') return 'VIEW_LETTER_GENERATOR';
              }
              if (moduleId === 'helpdesk') {
                if (subId === 'tickets') return 'VIEW_HR_HELPDESK_TICKETS';
              }
              return `VIEW_${moduleId.toUpperCase()}`;
            };

            const visibleMenuItems = menuItems
              .filter(item => {
                if (item.id === 'dashboard') return true;
                if (isSuperAdmin) return true;
                const requiredPermission = `VIEW_${item.id.toUpperCase()}`;
                return userPerms.includes(requiredPermission);
              })
              .map(item => {
                if (!item.subItems) return item;
                return {
                  ...item,
                  subItems: item.subItems.filter(sub => {
                    if (isSuperAdmin) return true;
                    const reqPerm = getSubItemPermission(item.id, sub.id);
                    return userPerms.includes(reqPerm);
                  })
                };
              })
              .filter(item => item.id === 'dashboard' || !item.subItems || item.subItems.length > 0);

            return visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeModule === item.id;
            const isDropdownOpen = openDropdown === item.id || (isSelected && openDropdown === null);

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => handleModuleClick(item)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isSelected 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && item.subItems && (
                    <div>
                      {isDropdownOpen ? (
                        <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-white" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white" />
                      )}
                    </div>
                  )}
                </button>

                {/* Sub-menu Items */}
                {!isCollapsed && item.subItems && isDropdownOpen && (
                  <div className="pl-9 space-y-1 border-l border-slate-800 ml-5 mt-1 animate-fade-in">
                    {item.subItems.map((sub) => {
                      const isSubSelected = isSelected && activeSubModule === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={(e) => handleSubItemClick(item.id, sub.id, e)}
                          className={`w-full text-left py-1.5 px-2 rounded-md text-xs font-normal transition-colors ${
                            isSubSelected
                              ? 'text-primary font-semibold bg-primary/10'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          });
        })()}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          {!isCollapsed ? (
            <div className="flex flex-col text-xs text-slate-500">
              <span className="font-semibold text-slate-400">FactoCorp HRMS v4.2</span>
              <span>Server: Cloud Secure</span>
              <span className="mt-1 flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase">
                <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping"></span>
                Live Sync Active
              </span>
            </div>
          ) : (
            <div className="h-2 w-2 bg-green-500 rounded-full mx-auto animate-pulse" title="System Online"></div>
          )}
        </div>
      </aside>
    </>
  );
};
