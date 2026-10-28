import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Chatbot } from './components/Chatbot';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AppProvider, useApp } from './context/AppContext';

// Modules imports
import { Assets } from './modules/Assets';
import { Attendance } from './modules/Attendance';
import { Dashboard } from './modules/Dashboard';
import { Documents } from './modules/Documents';
import { EmployeeManagement } from './modules/EmployeeManagement';
import { Engagement } from './modules/Engagement';
import { HelpDesk } from './modules/HelpDesk';
import { IdCardGenerator } from './modules/IdCardGenerator';
import { Leave } from './modules/Leave';
import { Letters } from './modules/Letters';
import { Login } from './modules/Login';
import { Payroll } from './modules/Payroll';
import { Performance } from './modules/Performance';
import { Recruitment } from './modules/Recruitment';
import { Subscription } from './modules/Subscription';
import { Timesheets } from './modules/Timesheets';
import { TravelClaims } from './modules/TravelClaims';

const MainLayout: React.FC = () => {
  const { activeModule, theme, isAuthenticated, currentUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  const roleStr = (currentUser?.role || '').toLowerCase();
  const isAdmin = roleStr.includes('admin') || roleStr.includes('ceo') || roleStr.includes('super') || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HR_ADMIN' || currentUser?.role === 'Super Admin' || currentUser?.role === 'HR Admin';
  const userPerms: string[] = (currentUser?.permissions || []).map((p: any) => typeof p === 'string' ? p : p?.name || '');
  const modUpper = activeModule.toUpperCase();
  const hasAccess = activeModule === 'dashboard' || activeModule === 'idcard' || (activeModule === 'subscription' ? isAdmin : (isAdmin || userPerms.includes(`VIEW_${modUpper}`) || userPerms.some((p: string) => p.includes(modUpper))));

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {!hasAccess ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-md mx-auto my-12 animate-fade-in">
              <div className="bg-red-500/10 p-4 rounded-full text-red-500 mb-4">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">You do not have the required permissions to view the {activeModule.toUpperCase()} module.</p>
            </div>
          ) : (
            <>
              {activeModule === 'dashboard' && <Dashboard />}
              {activeModule === 'employees' && <EmployeeManagement />}
              {activeModule === 'idcard' && <IdCardGenerator />}
              {activeModule === 'attendance' && <Attendance />}
              {activeModule === 'leave' && <Leave />}
              {activeModule === 'payroll' && <Payroll />}
              {activeModule === 'performance' && <Performance />}
              {activeModule === 'engagement' && <Engagement />}
              {activeModule === 'claims' && <TravelClaims />}
              {activeModule === 'timesheets' && <Timesheets />}
              {activeModule === 'recruitment' && <Recruitment />}
              {activeModule === 'documents' && <Documents />}
              {activeModule === 'assets' && <Assets />}
              {activeModule === 'letters' && <Letters />}
              {activeModule === 'helpdesk' && <HelpDesk />}
              {activeModule === 'subscription' && <Subscription />}
            </>
          )}
        </main>
      </div>
      <Chatbot />
    </div>
  );
};

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
