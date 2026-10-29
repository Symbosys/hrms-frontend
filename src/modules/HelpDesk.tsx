import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useEmployees } from '../api/hook/useEmployee';
import {
  useTickets,
  useCreateTicket,
  useResolveTicket,
} from '../api/hook/useHelpdesk';

export const HelpDesk: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, userRole, showConfirm, showAlert } = useApp();

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

  // Queries & Mutations
  const { data: ticketsRes, isLoading: ticketsLoading } = useTickets();
  const ticketsList = ticketsRes?.data || [];

  const createTicketMut = useCreateTicket();
  const resolveTicketMut = useResolveTicket();

  // Form State
  const [tktSubject, setTktSubject] = useState('');
  const [tktCategory, setTktCategory] = useState<'IT' | 'HR' | 'Facilities' | 'Finance'>('IT');
  const [tktPriority, setTktPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [tktDesc, setTktDesc] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject.trim() || !selectedEmpId) return;

    showConfirm({
      title: "Raise Support Ticket",
      message: `Are you sure you want to raise a ${tktCategory} support ticket for "${tktSubject}"?`,
      type: "confirm",
      confirmText: "Submit Ticket",
      onConfirm: () => {
        createTicketMut.mutate({
          employeeId: selectedEmpId,
          subject: tktSubject,
          description: tktDesc,
          category: tktCategory,
          priority: tktPriority,
        }, {
          onSuccess: () => {
            addAuditLog("Logged Support Ticket", "Help Desk Center", `Raised support ticket: "${tktSubject}"`);
            showAlert(`Support ticket created successfully! IT/HR team has been notified.`, "Ticket Logged", "success");
            setTktSubject('');
            setTktDesc('');
            setActiveSubModule('tickets');
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to create support ticket", "Error", "danger");
          }
        });
      }
    });
  };

  const handleResolveTicket = (id: string, subject: string) => {
    showConfirm({
      title: "Resolve Support Ticket",
      message: `Are you sure you want to mark ticket ${id} ("${subject}") as resolved?`,
      type: "confirm",
      confirmText: "Mark Resolved",
      onConfirm: () => {
        resolveTicketMut.mutate(id, {
          onSuccess: () => {
            addAuditLog("Resolved Support Ticket", "Help Desk Center", `Resolved ticket ${id}: "${subject}"`);
            showAlert(`Ticket ${id} resolved! Notification dispatched to employee.`, "Ticket Resolved", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to resolve ticket", "Error", "danger");
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
          onClick={() => setActiveSubModule('tickets')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'tickets' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Active Support Tickets
        </button>
        <button 
          onClick={() => setActiveSubModule('raise')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'raise' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Raise Support Ticket
        </button>
      </div>

      {/* Global Simulated User Switcher */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm">Simulate as Employee</h4>
            <p className="text-slate-450 mt-0.5">Switch profiles to change who raises support tickets in the configurator.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3.5 py-2 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 font-semibold focus:outline-none"
          >
            {employeesLoading ? (
              <option>Loading employees...</option>
            ) : (
              employeesList.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} • {(emp.department?.name || (typeof emp.department === 'string' ? emp.department : '') || 'IT')} ({emp.designation || 'Staff'})
                </option>
              ))
            )}
          </select>

          {activeEmployee && (
            <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-355 rounded-xl font-bold uppercase text-[10px]">
              {activeEmployee.department?.name || 'Operations'}
            </span>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* 1. TICKETS LIST & SLA                   */}
      {/* ======================================= */}
      {activeSubModule === 'tickets' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in text-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
            <span>Help Desk Tickets Directory</span>
            <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
              {ticketsList.filter(t => t.status !== 'Resolved').length} Open
            </span>
          </h3>

          {ticketsLoading ? (
            <div className="py-8 text-center text-slate-400 font-medium">Loading ticket database...</div>
          ) : ticketsList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">No help desk tickets registered.</div>
          ) : (
            <div className="space-y-3.5">
              {ticketsList.map((t) => (
                <div key={t.id} className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-850 dark:text-white">{t.subject}</span>
                      <span className="bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-[9px] font-bold dark:text-slate-300">{t.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-slate-550 dark:text-slate-400 mt-1">
                      Raised by: <span className="font-semibold text-slate-700 dark:text-slate-300">{t.employeeName}</span> • Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{t.category}</span> • Date: {t.date}
                    </p>
                    
                    {/* SLA Tracker */}
                    {t.status !== 'Resolved' && (
                      <div className="flex items-center gap-1.5 mt-2 text-rose-500 dark:text-rose-400 font-bold text-[10px]">
                        <Clock className="h-3.5 w-3.5" />
                        <span>SLA Time Left: {t.slaHoursLeft} Hours</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      t.priority === 'High' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-350' : 
                      t.priority === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-350' : 
                      'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {t.priority}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      t.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                    }`}>
                      {t.status}
                    </span>

                    {t.status !== 'Resolved' && (userRole === 'HR Admin' || userRole === 'Super Admin') && (
                      <button 
                        onClick={() => handleResolveTicket(t.id, t.subject)}
                        disabled={resolveTicketMut.isPending}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {resolveTicketMut.isPending ? "Resolving..." : "Resolve"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* 2. RAISE SUPPORT TICKET                  */}
      {/* ======================================= */}
      {activeSubModule === 'raise' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-xs max-w-xl">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">File Support Ticket</h3>
            <p className="text-slate-400 mt-1">Submit support requests to IT Admin, Finance/Payroll, facilities management or Human Resources.</p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Issue Subject Header</label>
              <input 
                type="text" 
                value={tktSubject} 
                onChange={(e) => setTktSubject(e.target.value)}
                placeholder="e.g. Broken display port or mouse adapter" 
                required 
                className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-205"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Ticket SLA Category</label>
                <select 
                  value={tktCategory} 
                  onChange={(e) => setTktCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="IT">IT Infrastructure Support</option>
                  <option value="HR">HR Operations Queries</option>
                  <option value="Facilities">Facilities & BKC Access Cards</option>
                  <option value="Finance">Finance & Tax declaration claims</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Priority Level Severity</label>
                <select 
                  value={tktPriority} 
                  onChange={(e) => setTktPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Low">Low Priority (24 Hr SLA)</option>
                  <option value="Medium">Medium Priority (12 Hr SLA)</option>
                  <option value="High">High Priority (4 Hr SLA)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Detailed Issue Description</label>
              <textarea 
                value={tktDesc} 
                onChange={(e) => setTktDesc(e.target.value)}
                placeholder="Provide specs, serial numbers or exact error logs..." 
                rows={4} 
                required 
                className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
              />
            </div>

            <button 
              type="submit" 
              disabled={createTicketMut.isPending}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
            >
              {createTicketMut.isPending ? "Submitting..." : "Raise Support Ticket"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
