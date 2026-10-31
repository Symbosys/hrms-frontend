import {
  ArrowRight,
  Bell,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Globe,
  HelpCircle,
  Laptop,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  ShieldAlert,
  Sun,
  Users,
  Wallet,
  X
} from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../api/apiClient';
import { useApp, UserRole } from '../context/AppContext';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const { 
    theme, setTheme, 
    language, setLanguage, 
    userRole, setUserRole, 
    activeModule, setActiveModule, activeSubModule, setActiveSubModule, setSelectedEmployeeId,
    notifications, markAllNotificationsRead, clearNotification,
    globalSearch, setGlobalSearch,
    employees, assets, claims,
    currentUser, setCurrentUser, logout, showAlert
  } = useApp();

  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const langRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const currentUserName = currentUser ? currentUser.name : (userRole === 'Super Admin' ? 'Vikram Malhotra' : userRole === 'HR Admin' ? 'Karan Johar' : userRole === 'Manager' ? 'Neha Patel' : 'Aarav Sharma');
  const currentUserRoleText = currentUser ? currentUser.role : (userRole === 'Super Admin' ? 'Chief Executive Officer' : userRole === 'HR Admin' ? 'HR Administrator' : userRole === 'Manager' ? 'Engineering Manager' : 'Senior UI Developer');
  const customAvatar = localStorage.getItem('customAvatar') || '';
  const currentUserAvatar = (currentUser && currentUser.avatar) 
    ? currentUser.avatar 
    : (customAvatar || (userRole === 'Super Admin'
      ? "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120"
      : userRole === 'HR Admin' 
      ? "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120"
      : userRole === 'Manager'
      ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"));

  const languages = [
    { code: 'en', name: 'English (US)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    setShowProfile(false);
    if (role === 'Employee') {
      if (['recruitment', 'subscription'].includes(activeModule)) {
        setActiveModule('dashboard');
        setActiveSubModule('dashboard');
      } else if (activeModule === 'attendance' && ['roster', 'reports', 'geofence'].includes(activeSubModule)) {
        setActiveSubModule('punch');
      } else if (activeModule === 'leave' && ['approvals', 'admin'].includes(activeSubModule)) {
        setActiveSubModule('apply');
      } else if (activeModule === 'payroll' && ['process', 'reports', 'revisions'].includes(activeSubModule)) {
        setActiveSubModule('payslips');
      } else if (activeModule === 'claims' && activeSubModule === 'approvals') {
        setActiveSubModule('apply-claim');
      } else if (activeModule === 'timesheets' && activeSubModule === 'projects') {
        setActiveSubModule('entry');
      } else if (activeModule === 'performance' && activeSubModule === 'bellcurve') {
        setActiveSubModule('goals');
      } else if (activeModule === 'employees' && ['master', 'exit', 'resignation', 'bulk', 'roles', 'departments'].includes(activeSubModule)) {
        setActiveSubModule('directory');
      }
    }
    const alertMsg = `Switched to ${role} workspace view.`;
    console.log(alertMsg);
  };

  const query = globalSearch.trim().toLowerCase();

  // Search Results Computation
  const matchingModules = [
    { name: 'Employee Directory', module: 'employees', sub: 'directory', icon: Users, category: 'Module Navigation' },
    { name: 'ID Card Generator', module: 'idcard', sub: 'idcard', icon: Users, category: 'Module Navigation' },
    { name: 'Payroll Processing & Payslips', module: 'payroll', sub: 'process', icon: Wallet, category: 'Module Navigation' },
    { name: 'Leave Application & Requests', module: 'leave', sub: 'apply', icon: CalendarDays, category: 'Module Navigation' },
    { name: 'Asset Management Inventory', module: 'assets', sub: 'register', icon: Laptop, category: 'Module Navigation' },
    { name: 'Document Vault', module: 'documents', sub: 'vault', icon: FileText, category: 'Module Navigation' },
    { name: 'HR Help Desk & Tickets', module: 'helpdesk', sub: 'tickets', icon: HelpCircle, category: 'Module Navigation' },
    { name: 'Subscription & Plans', module: 'subscription', sub: 'subscription', icon: Wallet, category: 'Module Navigation' },
  ].filter(m => query && m.name.toLowerCase().includes(query));

  const matchingEmployees = query
    ? (employees || []).filter(e => 
        e.name.toLowerCase().includes(query) || 
        e.id.toLowerCase().includes(query) || 
        e.role.toLowerCase().includes(query) ||
        (typeof e.department === 'string' ? e.department : ((e.department as any)?.name || '')).toLowerCase().includes(query)
      ).slice(0, 4)
    : [];

  const matchingAssets = query
    ? (assets || []).filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.serialNumber.toLowerCase().includes(query) ||
        a.id.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingClaims = query
    ? (claims || []).filter(c => 
        c.employeeName.toLowerCase().includes(query) || 
        c.type.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const totalResultsCount = matchingModules.length + matchingEmployees.length + matchingAssets.length + matchingClaims.length;

  const navigateToResult = (module: string, subModule: string, empId?: string) => {
    setActiveModule(module);
    setActiveSubModule(subModule);
    if (empId) setSelectedEmployeeId(empId);
    setShowSearchResults(false);
    setGlobalSearch('');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
      
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-1.5 sm:gap-4 flex-1 max-w-xs sm:max-w-md">
        <button 
          onClick={onToggleMobileMenu}
          className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div ref={searchRef} className="relative w-full">
          <Search className="absolute left-2.5 sm:left-3 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 dark:text-slate-200"
          />
          {globalSearch && (
            <button
              onClick={() => {
                setGlobalSearch('');
                setShowSearchResults(false);
              }}
              className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          )}

          {/* Real-time Global Search Dropdown Overlay */}
          {showSearchResults && query && (
            <div 
              className="absolute left-0 right-0 sm:right-auto mt-2 w-[calc(100vw-32px)] sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto animate-fade-in divide-y divide-slate-100 dark:divide-slate-800"
            >
              {totalResultsCount === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No matching results found for "<span className="font-semibold text-slate-700 dark:text-slate-300">{globalSearch}</span>".
                </div>
              ) : (
                <>
                  {/* Matching Modules */}
                  {matchingModules.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase px-3 py-1 block tracking-wider">
                        Navigation Modules ({matchingModules.length})
                      </span>
                      {matchingModules.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => navigateToResult(item.module, item.sub)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-primary/10 text-xs flex items-center justify-between group transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                                {item.name}
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Matching Employees */}
                  {matchingEmployees.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase px-3 py-1 block tracking-wider">
                        Employees ({matchingEmployees.length})
                      </span>
                      {matchingEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => navigateToResult('employees', 'directory', emp.id)}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-primary/10 text-xs flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={emp.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"} 
                              alt={emp.name}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-primary/20"
                            />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                                {emp.name} <span className="text-[10px] text-slate-400 font-normal">({emp.id})</span>
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {typeof emp.department === 'string' ? emp.department : ((emp.department as any)?.name || '')} • {emp.role}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching Assets */}
                  {matchingAssets.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase px-3 py-1 block tracking-wider">
                        Assets ({matchingAssets.length})
                      </span>
                      {matchingAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => navigateToResult('assets', 'register')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-primary/10 text-xs flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-amber-500">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                                {asset.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                S/N: {asset.serialNumber} • {asset.status}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching Claims */}
                  {matchingClaims.length > 0 && (
                    <div className="p-2">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase px-3 py-1 block tracking-wider">
                        Reimbursement Claims ({matchingClaims.length})
                      </span>
                      {matchingClaims.map((claim) => (
                        <button
                          key={claim.id}
                          onClick={() => navigateToResult('claims', 'my-claims')}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-primary/10 text-xs flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-emerald-500">
                              <Wallet className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                                {claim.type} Claim - ₹{claim.amount}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                By {claim.employeeName} • {claim.status}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1 sm:gap-2.5">
        
        {/* Role Quick Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300">
          <ShieldAlert className="h-3.5 w-3.5 text-primary" />
          <span>Role: {userRole}</span>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Sun className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
        </button>

        {/* Language Selector */}
        <div className="relative hidden xs:block sm:block">
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
            title="Select Language"
          >
            <Globe className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          
          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setShowLangDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300"
                >
                  <span>{lang.name}</span>
                  {language === lang.code && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Calendar Shortcut */}
        <button 
          onClick={() => { setActiveModule('attendance'); setActiveSubModule('muster'); }}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative hidden sm:block"
          title="Attendance & Holidays Calendar"
        >
          <Calendar className="h-5 w-5" />
        </button>

        {/* Message Shortcut */}
        <button 
          onClick={() => { setActiveModule('engagement'); setActiveSubModule('feed'); }}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative hidden sm:block"
          title="Team Announcements"
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-[-60px] sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                <span className="font-semibold text-slate-800 dark:text-white text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllNotificationsRead} 
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">No notifications.</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-850 flex gap-2.5 relative group ${!n.read ? 'bg-primary/5' : ''}`}>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">{n.time}</span>
                      </div>
                      <button 
                        onClick={() => clearNotification(n.id)}
                        className="text-slate-400 hover:text-red-500 self-start p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-850 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Shortcut */}
        <button 
          onClick={() => { 
            // open chat bot drawer or similar
            const chatbotEl = document.getElementById('factobot-chat-trigger');
            if (chatbotEl) chatbotEl.click();
          }}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Ask Factobot Help Desk"
        >
          <HelpCircle className="h-5 w-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* User Profile */}
        <div ref={profileRef} className="relative">
          <input 
            type="file"
            id="navbar-profile-avatar-input"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                // Convert file to Base64 Data URI
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const dataUrl = event.target?.result as string;
                  if (!dataUrl) return;
                  try {
                    // Try FormData upload first
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('image', dataUrl);
                    formData.append('updateSelf', 'true');

                    const res = await api.post('/documents/upload-avatar?updateSelf=true', formData);
                    const uploadedUrl = res.data?.data?.url || res.data?.url;
                    if (uploadedUrl) {
                      localStorage.setItem('customAvatar', uploadedUrl);
                      if (currentUser) {
                        setCurrentUser({ ...currentUser, avatar: uploadedUrl });
                      } else {
                        window.dispatchEvent(new Event('storage'));
                      }
                      showAlert("Profile picture uploaded to Cloudinary successfully!", "Success", "success");
                    }
                  } catch (apiErr: any) {
                    // If FormData fails, send JSON payload with Base64 image
                    try {
                      const res = await api.post('/documents/upload-avatar', { image: dataUrl, updateSelf: true });
                      const uploadedUrl = res.data?.data?.url || res.data?.url;
                      if (uploadedUrl) {
                        localStorage.setItem('customAvatar', uploadedUrl);
                        if (currentUser) {
                          setCurrentUser({ ...currentUser, avatar: uploadedUrl });
                        } else {
                          window.dispatchEvent(new Event('storage'));
                        }
                        showAlert("Profile picture uploaded to Cloudinary successfully!", "Success", "success");
                        return;
                      }
                    } catch (jsonErr) {
                      // Fallback to local state if backend is down
                      localStorage.setItem('customAvatar', dataUrl);
                      if (currentUser) {
                        setCurrentUser({ ...currentUser, avatar: dataUrl });
                      } else {
                        window.dispatchEvent(new Event('storage'));
                      }
                      showAlert("Profile picture updated locally!", "Success", "success");
                    }
                  }
                };
                reader.readAsDataURL(file);
              } catch (err: any) {
                console.error("Cloudinary Avatar Upload Error:", err);
              }
            }}
          />
          <div className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <button 
              type="button"
              onClick={() => {
                document.getElementById('navbar-profile-avatar-input')?.click();
              }}
              title="Click to change profile picture"
              className="relative cursor-pointer group"
            >
              <img 
                src={currentUserAvatar}
                alt={currentUserName} 
                className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all"
              />
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] text-white font-bold">Edit</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              <div className="hidden md:block">
                <p className="text-xs font-semibold leading-none text-slate-800 dark:text-white">{currentUserName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">{currentUserRoleText}</p>
              </div>
              <ChevronDown 
                className="h-4 w-4 text-slate-500 hover:text-primary transition-colors" 
              />
            </button>
          </div>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{currentUserName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{currentUserRoleText}</p>
              </div>

              {/* Interactive Role Switcher */}
              <div className="p-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase px-2 mb-1.5 block">Switch Workspace Role</span>
                {(['Super Admin', 'HR Admin', 'Manager', 'Employee'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      userRole === role
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{role} Perspective</span>
                    {userRole === role && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
              
              <button 
                onClick={() => { 
                  const targetEmp = (employees || []).find(e => 
                    (currentUser && (e.id === currentUser.id || e.email === currentUser.email)) ||
                    (userRole === 'Employee' && (e.role === 'Senior UI Developer' || e.name === 'Aarav Sharma'))
                  ) || (employees && employees[0]);
                  if (targetEmp) {
                    setSelectedEmployeeId(targetEmp.id);
                  }
                  setActiveModule('employees'); 
                  setActiveSubModule('profile'); 
                  setShowProfile(false); 
                }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
              >
                My Profile Setup
              </button>
              <button 
                onClick={() => { setActiveModule('dashboard'); setShowProfile(false); }}
                className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
              >
                Preferences
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
              <button 
                onClick={() => { logout(); setShowProfile(false); }}
                className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold transition-colors flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
