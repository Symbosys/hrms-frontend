import {
  Award,
  ListTodo,
  MessageSquare,
  Plus,
  Star,
  UserCheck
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEmployees } from '../api/hook/useEmployee';
import {
  useBellCurveDistribution,
  useCreateFeedback,
  useCreateGoal,
  useFeedbacks,
  useGoals,
  useSaveAppraisal,
  useUpdateGoalProgress
} from '../api/hook/usePerformance';
import { useApp } from '../context/AppContext';

export const Performance: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, userRole, currentUser, showConfirm, showAlert } = useApp();
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
  const isAdminOrManager = isAdmin || isManager || hasPerm(['UPDATE_KRA_GOALS', 'VIEW_BELLCURVE_ANALYTICS']);

  // Auto redirect employees away from bell curve analytics
  useEffect(() => {
    if (activeSubModule === 'bellcurve' && !isAdmin && !isManager && !hasPerm('VIEW_BELLCURVE_ANALYTICS')) {
      setActiveSubModule('goals');
    }
  }, [isAdmin, isManager, userPerms, activeSubModule, setActiveSubModule]);

  // Active filters and selectors
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('2026-Q2');

  // Fetch employees list
  const { data: dbEmployeesRes, isLoading: employeesLoading } = useEmployees();
  const employeesList = dbEmployeesRes?.data || [];

  // Automatically select first employee if none selected
  useEffect(() => {
    if (employeesList.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employeesList[0].id);
    }
  }, [employeesList, selectedEmpId]);

  // Fetch performance data
  const { data: goalsRes, isLoading: goalsLoading } = useGoals(selectedEmpId);
  const goalsList = goalsRes?.data || [];

  const { data: feedbacksRes, isLoading: feedbacksLoading } = useFeedbacks(selectedEmpId);
  const feedbacksList = feedbacksRes?.data || [];

  const { data: bellCurveRes } = useBellCurveDistribution(selectedCycle);
  const bellCurveData = bellCurveRes?.data || [];

  // Form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalWeight, setGoalWeight] = useState('30%');
  const [goalKra, setGoalKra] = useState('Development');

  const [feedbackReviewer, setFeedbackReviewer] = useState('');
  const [feedbackRelation, setFeedbackRelation] = useState<'Manager' | 'Peer' | 'Direct Report'>('Peer');
  const [feedbackRating, setFeedbackRating] = useState(4.0);
  const [feedbackText, setFeedbackText] = useState('');

  const [appraisalEmpId, setAppraisalEmpId] = useState('');
  const [appraisalRating, setAppraisalRating] = useState(3);

  // Auto-fill appraisal select
  useEffect(() => {
    if (employeesList.length > 0 && !appraisalEmpId) {
      setAppraisalEmpId(employeesList[0].id);
    }
  }, [employeesList, appraisalEmpId]);

  // Mutations
  const createGoalMut = useCreateGoal();
  const updateProgressMut = useUpdateGoalProgress();
  const createFeedbackMut = useCreateFeedback();
  const saveAppraisalMut = useSaveAppraisal();

  // Progress update buffer
  const [progressUpdates, setProgressUpdates] = useState<{ [key: string]: number }>({});

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    showConfirm({
      title: "Add Performance Goal",
      message: `Are you sure you want to add goal "${goalTitle}" (${goalWeight} weight) for the selected employee?`,
      type: "confirm",
      confirmText: "Add Goal",
      onConfirm: () => {
        createGoalMut.mutate({
          employeeId: selectedEmpId,
          title: goalTitle,
          weight: goalWeight,
          kra: goalKra,
        }, {
          onSuccess: () => {
            addAuditLog("Created Goal", "Performance", `Added new KRA goal: "${goalTitle}" for employee ID ${selectedEmpId}`);
            setGoalTitle('');
            showAlert("New performance goal successfully added.", "Goal Added", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to create goal", "Error", "danger");
          }
        });
      }
    });
  };

  const handleUpdateProgress = (goalId: string, currentProgress: number) => {
    const nextProgress = progressUpdates[goalId] !== undefined ? progressUpdates[goalId] : currentProgress;
    updateProgressMut.mutate({
      id: goalId,
      progress: nextProgress,
    }, {
      onSuccess: () => {
        showAlert("Goal progress updated successfully.", "Progress Saved", "success");
      },
      onError: (err: any) => {
        showAlert(err?.response?.data?.message || err.message || "Failed to update progress", "Error", "danger");
      }
    });
  };

  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    createFeedbackMut.mutate({
      employeeId: selectedEmpId,
      reviewer: feedbackReviewer,
      relation: feedbackRelation,
      rating: feedbackRating,
      text: feedbackText,
    }, {
      onSuccess: () => {
        addAuditLog("Created Feedback", "Performance", `Submitted ${feedbackRelation} review for employee ID ${selectedEmpId}`);
        setFeedbackReviewer('');
        setFeedbackText('');
        showAlert("Feedback review successfully submitted.", "Review Submitted", "success");
      },
      onError: (err: any) => {
        showAlert(err?.response?.data?.message || err.message || "Failed to submit feedback", "Error", "danger");
      }
    });
  };

  const handleSaveAppraisal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appraisalEmpId) return;

    showConfirm({
      title: "Save Appraisal Rating",
      message: `Save appraisal rating score of ${appraisalRating} for employee ID ${appraisalEmpId} in cycle ${selectedCycle}?`,
      type: "confirm",
      confirmText: "Save Rating",
      onConfirm: () => {
        saveAppraisalMut.mutate({
          employeeId: appraisalEmpId,
          cycle: selectedCycle,
          rating: appraisalRating,
        }, {
          onSuccess: () => {
            addAuditLog("Save Appraisal", "Performance", `Saved appraisal score for employee ID ${appraisalEmpId} in cycle ${selectedCycle}`);
            showAlert("Appraisal score saved. Bell curve updated.", "Appraisal Saved", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to save appraisal", "Error", "danger");
          }
        });
      }
    });
  };

  const selectedEmployee = employeesList.find(emp => emp.id === selectedEmpId);

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveSubModule('goals')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'goals' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          KRA & Goals
        </button>
        <button 
          onClick={() => setActiveSubModule('feedback')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'feedback' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          360° Feedback
        </button>
        {(isAdmin || isManager || hasPerm('VIEW_BELLCURVE_ANALYTICS')) && (
          <button 
            onClick={() => setActiveSubModule('bellcurve')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeSubModule === 'bellcurve' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Bell Curve Analytics
          </button>
        )}
      </div>

      {/* Global Employee Switcher (hidden in Bell Curve tab) */}
      {activeSubModule !== 'bellcurve' && (
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-100 dark:bg-violet-950/40 text-violet-650 rounded-xl">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Select Employee Performance File</h4>
              <p className="text-slate-450 mt-0.5">View and customize goals, weightage, and peer feedbacks.</p>
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

            {selectedEmployee && (
              <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl font-bold uppercase text-[10px]">
                {selectedEmployee.department?.name || 'Operations'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 1. KRA & GOAL SETTING                   */}
      {/* ======================================= */}
      {activeSubModule === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Add Goal */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" />
              <span>Add New KRA Goal</span>
            </h3>
            
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Goal Title</label>
                <input 
                  type="text" 
                  value={goalTitle} 
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Reduce bundle size by 20%" 
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Weightage</label>
                  <input 
                    type="text" 
                    value={goalWeight} 
                    onChange={(e) => setGoalWeight(e.target.value)}
                    placeholder="e.g. 30%" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Key Focus Area (KRA)</label>
                  <input 
                    type="text" 
                    value={goalKra} 
                    onChange={(e) => setGoalKra(e.target.value)}
                    placeholder="e.g. Code Quality" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={!selectedEmpId || createGoalMut.isPending}
                className="w-full py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
              >
                {createGoalMut.isPending ? "Assigning..." : "Assign Goal"}
              </button>
            </form>
          </div>

          {/* Active Goals list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center gap-1.5">
              <ListTodo className="h-4 w-4 text-violet-500" />
              <span>Active Performance KRAs ({goalsList.length})</span>
            </h3>
            
            {goalsLoading ? (
              <div className="py-8 text-center text-slate-400 font-medium">Loading goals...</div>
            ) : goalsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">No performance goals set for this employee.</div>
            ) : (
              <div className="space-y-4">
                {goalsList.map((g) => {
                  const currentVal = progressUpdates[g.id] !== undefined ? progressUpdates[g.id] : g.progress;
                  return (
                    <div key={g.id} className="p-4 border rounded-xl space-y-3 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center justify-between font-semibold">
                        <div>
                          <span className="font-bold text-slate-850 dark:text-white">{g.title}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">KRA: {g.kra} • Weight: {g.weight}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          g.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                        }`}>
                          {g.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold">
                          <span>Completion Progress:</span>
                          <span className="text-primary font-bold text-xs">{currentVal}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={currentVal}
                            onChange={(e) => setProgressUpdates({
                              ...progressUpdates,
                              [g.id]: Number(e.target.value)
                            })}
                            className="w-full accent-primary bg-slate-200 dark:bg-slate-800 h-1.5 rounded-lg appearance-none"
                          />
                          <button
                            onClick={() => handleUpdateProgress(g.id, g.progress)}
                            disabled={updateProgressMut.isPending}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-primary hover:text-white dark:bg-slate-800 dark:hover:bg-primary rounded-lg font-bold text-[9px] transition-all"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. 360 FEEDBACK                         */}
      {/* ======================================= */}
      {activeSubModule === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Submit Peer Review Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span>Submit feedback review</span>
            </h3>
            
            <form onSubmit={handleAddFeedback} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Reviewer Name</label>
                <input 
                  type="text" 
                  value={feedbackReviewer} 
                  onChange={(e) => setFeedbackReviewer(e.target.value)}
                  placeholder="e.g. John Doe" 
                  required 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Relationship</label>
                  <select 
                    value={feedbackRelation}
                    onChange={(e) => setFeedbackRelation(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  >
                    <option value="Peer">Peer</option>
                    <option value="Manager">Manager</option>
                    <option value="Direct Report">Direct Report</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Rating (1 to 5)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="1"
                    max="5"
                    value={feedbackRating} 
                    onChange={(e) => setFeedbackRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Feedback Text</label>
                <textarea 
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What are this employee's strengths and core areas of improvement?"
                  required
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                />
              </div>

              <button 
                type="submit" 
                disabled={!selectedEmpId || createFeedbackMut.isPending}
                className="w-full py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
              >
                {createFeedbackMut.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>

          {/* Feedbacks list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-blue-500" />
                <span>360-Degree Peer & Manager Feedback ({feedbacksList.length})</span>
              </span>
            </h3>

            {feedbacksLoading ? (
              <div className="py-8 text-center text-slate-400 font-medium">Loading reviews...</div>
            ) : feedbacksList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">No reviews submitted for this employee.</div>
            ) : (
              <div className="space-y-4">
                {feedbacksList.map((f) => (
                  <div key={f.id} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between font-semibold">
                      <div>
                        <span className="font-bold text-slate-850 dark:text-white text-xs">{f.reviewer}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {f.relation} Review • {new Date(f.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 text-amber-500 px-2 py-0.5 rounded-lg font-bold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        <span>{f.rating}</span>
                      </div>
                    </div>
                    <p className="text-slate-650 dark:text-slate-400 italic">"{f.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 3. BELL CURVE ANALYTICS                 */}
      {/* ======================================= */}
      {activeSubModule === 'bellcurve' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-xs">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Appraisal Bell Curve Distribution</h3>
              <p className="text-slate-400 mt-1">Normal distribution mapping of employee performance appraisal ratings.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Appraisal Cycle:</span>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="px-3.5 py-1.5 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none"
              >
                <option value="2026-Q2">2026 Q2 Review</option>
                <option value="2026-Annual">2026 Annual Appraisal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bell Curve Area Chart */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bellCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="rating" fontSize={8} />
                    <YAxis fontSize={9} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Employees" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#bellGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">Bell Curve Statistics Summary</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[11px]">
                  <div>
                    <span className="text-slate-400">Target Normal Standard</span>
                    <p className="font-semibold text-slate-800 dark:text-white">10% - 20% - 50% - 15% - 5%</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Actual Deviation</span>
                    <p className="font-semibold text-emerald-500">Normal Range matched (&lt;3% error)</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Rated Staff</span>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {employeesList.length} employees
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appraisal Assignment Form (Admins & Managers) */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2 flex items-center gap-1.5">
                <Star className="h-4 w-4 text-violet-500" />
                <span>Submit Appraisal Score</span>
              </h3>
              
              {isAdminOrManager ? (
                <form onSubmit={handleSaveAppraisal} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Select Employee</label>
                    <select
                      value={appraisalEmpId}
                      onChange={(e) => setAppraisalEmpId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
                    >
                      {employeesList.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-medium">Overall Rating (1 to 5)</label>
                    <select
                      value={appraisalRating}
                      onChange={(e) => setAppraisalRating(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
                    >
                      <option value="1">Unsatisfactory (1)</option>
                      <option value="2">Needs Improvement (2)</option>
                      <option value="3">Meets Expectations (3)</option>
                      <option value="4">Exceeds Expectations (4)</option>
                      <option value="5">Outstanding (5)</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!appraisalEmpId || saveAppraisalMut.isPending}
                    className="w-full py-2 bg-violet-600 text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:scale-100"
                  >
                    {saveAppraisalMut.isPending ? "Saving..." : "Save Score"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 text-slate-450">
                  Only Administrators and Managers are authorized to submit appraisal scores.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
