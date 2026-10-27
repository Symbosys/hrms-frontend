import {
  ArrowLeft,
  Award,
  Briefcase,
  Building2,
  ChevronRight,
  Code,
  Download,
  FileDown,
  FileSignature,
  FileText,
  Filter,
  Grid,
  Headphones,
  Landmark,
  List,
  Mail,
  MapPin,
  Megaphone,
  Move,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  ZoomIn,
  ZoomOut,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import api from '../api/apiClient';
import {
  Department,
  useCreateDepartment,
  useDeleteDepartment,
  useDepartments,
  useUpdateDepartment
} from '../api/hook/useDepartment';
import {
  useAddEmployeeFamily,
  useCreateEmployee,
  useDeleteEmployee,
  useDeleteEmployeeFamily,
  useEmployeeExit,
  useEmployeeFamily,
  useEmployeePersonal,
  useEmployees,
  useEmployeeSalary,
  useResetEmployeeCredentials,
  useSaveEmployeeExit,
  useUpdateEmployee,
  useUpdateEmployeePersonal,
  useUpdateEmployeeSalary
} from '../api/hook/useEmployee';
import { useLeaveAllocations } from '../api/hook/useLeave';
import { useCreateFeedback, useCreateMonthlyRating, useFeedbacks, useMonthlyRatings } from '../api/hook/usePerformance';
import {
  useAssignRole,
  useCreatePermission,
  useCreateRole,
  useDeleteRole,
  usePermissions,
  useRoles,
  useUpdateRole
} from '../api/hook/useRole';
import { Employee, useApp } from '../context/AppContext';
import IdCardGenerator from './IdCardGenerator';

interface RoleManagementPanelProps {
  employees: Employee[];
}

const RoleManagementPanel: React.FC<RoleManagementPanelProps> = ({ employees }) => {
  const { organizationId } = useApp();
  const { data: rolesResponse, isLoading: rolesLoading } = useRoles(organizationId);
  const { data: permissionsResponse, isLoading: permissionsLoading } = usePermissions();

  const createRoleMutation = useCreateRole();
  const createPermissionMutation = useCreatePermission();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const assignRoleMutation = useAssignRole();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const [newPermName, setNewPermName] = useState('');
  const [newPermAction, setNewPermAction] = useState('manage');
  const [newPermSubject, setNewPermSubject] = useState('all');
  const [newPermDesc, setNewPermDesc] = useState('');

  const [assignUser, setAssignUser] = useState('');
  const [assignRoleVal, setAssignRoleVal] = useState('');

  const roles = rolesResponse?.data || [];
  const permissions = permissionsResponse?.data || [];

  const activeRole = roles.find(r => r.id === selectedRoleId);

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeRole) {
      const currentPermissionIds = (activeRole.permissions || []).flatMap((p: any) => {
        const permObj = p.permission || p;
        return [permObj.id, permObj.name].filter(Boolean);
      });
      setSelectedPermissionIds(currentPermissionIds);
    } else {
      setSelectedPermissionIds([]);
    }
  }, [activeRole]);

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    createRoleMutation.mutate({
      name: newRoleName.toUpperCase(),
      description: newRoleDesc,
      permissionIds: []
    }, {
      onSuccess: () => {
        setNewRoleName('');
        setNewRoleDesc('');
        alert("Role created successfully!");
      },
      onError: (err) => alert(err.message)
    });
  };

  const handleCreatePermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermName || !newPermAction || !newPermSubject) return;
    createPermissionMutation.mutate({
      name: newPermName,
      action: newPermAction,
      subject: newPermSubject,
      description: newPermDesc
    }, {
      onSuccess: () => {
        setNewPermName('');
        setNewPermDesc('');
        alert("Permission node created successfully!");
      },
      onError: (err) => alert(err.message)
    });
  };

  const handleTogglePermission = (permissionId: string) => {
    const targetPerm = permissions.find(p => p.id === permissionId || p.name === permissionId);
    const targetId = targetPerm?.id || permissionId;
    const targetName = targetPerm?.name || permissionId;

    setSelectedPermissionIds(prev => {
      const hasIt = prev.includes(targetId) || prev.includes(targetName);
      if (hasIt) {
        return prev.filter(id => id !== targetId && id !== targetName);
      } else {
        return [...prev, targetId, targetName];
      }
    });
  };

  const handleSelectAllPermissions = () => {
    const allPermissionIds = permissions.map((p) => p.id);
    const allSelected = allPermissionIds.every(id => selectedPermissionIds.includes(id));
    setSelectedPermissionIds(allSelected ? [] : allPermissionIds);
  };

  const handleSavePermissions = () => {
    if (!activeRole) return;
    const resolvedIds = Array.from(new Set(
      selectedPermissionIds.map(id => {
        const found = permissions.find(p => p.id === id || p.name === id);
        return found ? found.id : id;
      })
    ));

    updateRoleMutation.mutate({
      id: activeRole.id,
      data: { permissionIds: resolvedIds }
    }, {
      onSuccess: () => {
        alert("Permissions saved successfully for role " + activeRole.name);
      },
      onError: (err) => alert(err.message)
    });
  };

  const handleDeleteRole = (id: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      deleteRoleMutation.mutate(id, {
        onSuccess: () => {
          if (selectedRoleId === id) setSelectedRoleId(null);
          alert("Role deleted successfully!");
        },
        onError: (err) => alert(err.message)
      });
    }
  };

  const handleAssignRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUser) return;
    const selectedEmp = employees.find(emp => emp.id === assignUser);
    if (!selectedEmp) return;
    
    const userIdentifier = selectedEmp.userId || selectedEmp.email || selectedEmp.phone || selectedEmp.id;
    if (!userIdentifier) {
      alert("This employee does not have a user ID, email, phone, or ID to identify their account.");
      return;
    }

    assignRoleMutation.mutate({
      userId: userIdentifier,
      roleId: assignRoleVal === 'clear' ? null : assignRoleVal
    }, {
      onSuccess: () => {
        alert("Role assigned to user successfully!");
      },
      onError: (err) => alert(err.message)
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Roles list & Creation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Roles & Authorization Profiles</h3>
          {rolesLoading ? (
            <p className="text-slate-405">Loading roles list...</p>
          ) : roles.length === 0 ? (
            <p className="text-slate-405">No admin-defined roles found. Create one below to begin.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {roles.map((role) => (
                <div 
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedRoleId === role.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-700 dark:text-slate-350'
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs">{role.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{role.description || 'No description'}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                    className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleCreateRole} className="border-t pt-4 space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-white text-xs">Create New Role</h4>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Role Code / Name</label>
              <input 
                type="text" 
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. HR_GENERALIST"
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Role Description</label>
              <textarea 
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Brief description of the role access scope..."
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
              />
            </div>
            <button 
              type="submit"
              disabled={createRoleMutation.isPending}
              className="w-full py-2 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:scale-102 transition-all shadow-md shadow-primary/20"
            >
              Add Role Profile
            </button>
          </form>
        </div>

        {/* Center/Right Column: Role Details & Permissions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Role Access Rights & Node Permissions</h3>
            {activeRole && (
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold">
                {activeRole.name}
              </span>
            )}
          </div>

          {!activeRole ? (
            <div className="h-full flex items-center justify-center py-10 text-slate-400">
              Select a role from the left panel to assign permission nodes.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Permission Assignment Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-700 dark:text-white text-xs">Assigned Permissions</h4>
                  {activeRole && permissions.length > 0 && (
                    <button 
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      {permissions.map(p => p.id).every(id => selectedPermissionIds.includes(id)) 
                        ? "Deselect All" 
                        : "Select All"}
                    </button>
                  )}
                </div>
                {permissionsLoading ? (
                  <p className="text-slate-400">Loading permission nodes...</p>
                ) : permissions.length === 0 ? (
                  <p className="text-slate-405">No system permissions found. Define one in the creation panel.</p>
                ) : (
                  <>
                    <div className="space-y-1.5 max-h-96 overflow-y-auto border p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                      {permissions.map((perm) => {
                        const isAssigned = selectedPermissionIds.includes(perm.id);
                        return (
                          <label key={perm.id} className="flex items-start gap-2.5 p-1 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => handleTogglePermission(perm.id)}
                              className="rounded text-primary focus:ring-0 mt-0.5"
                            />
                            <div>
                              <span className="font-bold text-slate-700 dark:text-slate-350">{perm.name}</span>
                              <span className="block text-[9px] text-slate-400">
                                Action: <span className="font-mono text-primary">{perm.action}</span> | Subject: <span className="font-mono text-indigo-500">{perm.subject}</span>
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button 
                      type="button"
                      onClick={handleSavePermissions}
                      disabled={updateRoleMutation.isPending}
                      className="w-full py-2 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:scale-102 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                      {updateRoleMutation.isPending ? "Saving Permissions..." : "Save Assigned Permissions"}
                    </button>
                  </>
                )}
              </div>

              {/* Permission Creator Form */}
              <form onSubmit={handleCreatePermission} className="space-y-3 border-l md:pl-6 border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-700 dark:text-white text-xs">Register System Permission Node</h4>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Permission Name</label>
                  <input 
                    type="text" 
                    value={newPermName}
                    onChange={(e) => setNewPermName(e.target.value)}
                    placeholder="e.g. Approve Leave Applications"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Action</label>
                    <select 
                      value={newPermAction}
                      onChange={(e) => setNewPermAction(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                    >
                      <option value="read">read</option>
                      <option value="write">write</option>
                      <option value="create">create</option>
                      <option value="delete">delete</option>
                      <option value="manage">manage</option>
                      <option value="approve">approve</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Subject / Module</label>
                    <input 
                      type="text" 
                      value={newPermSubject}
                      onChange={(e) => setNewPermSubject(e.target.value)}
                      placeholder="e.g. leaves"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Description</label>
                  <textarea 
                    value={newPermDesc}
                    onChange={(e) => setNewPermDesc(e.target.value)}
                    placeholder="Permission description..."
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={createPermissionMutation.isPending}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:scale-102 transition-all shadow-md shadow-indigo-600/20"
                >
                  Create Node
                </button>
              </form>

            </div>
          )}
        </div>

      </div>

      {/* User Role Assignment Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Assign Role Profiles to Users</h3>
        <form onSubmit={handleAssignRole} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block mb-1">Select Employee</label>
            <select
              value={assignUser}
              onChange={(e) => setAssignUser(e.target.value)}
              required
              className="w-full px-3 py-2.5 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role} - {emp.department})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold block mb-1">Assign Role Profile</label>
            <select
              value={assignRoleVal}
              onChange={(e) => setAssignRoleVal(e.target.value)}
              required
              className="w-full px-3 py-2.5 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
            >
              <option value="">-- Select Role --</option>
              <option value="clear">-- None (Clear Role) --</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit"
            disabled={assignRoleMutation.isPending}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:scale-102 transition-all shadow-md shadow-primary/20"
          >
            Update Role Assignment
          </button>
        </form>
      </div>
    </div>
  );
};

interface DepartmentManagementPanelProps {
  employees: Employee[];
}

const DepartmentManagementPanel: React.FC<DepartmentManagementPanelProps> = ({ employees }) => {
  const { organizationId } = useApp();
  const { data: deptsResponse, isLoading: deptsLoading } = useDepartments(organizationId);

  const createDeptMutation = useCreateDepartment();
  const updateDeptMutation = useUpdateDepartment();
  const deleteDeptMutation = useDeleteDepartment();

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isCodeManual, setIsCodeManual] = useState(false);
  const [newDeptManagerId, setNewDeptManagerId] = useState('');
  const [newDeptParentId, setNewDeptParentId] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [editParentId, setEditParentId] = useState('');

  const departments = deptsResponse?.data || [];
  const activeDept = departments.find(d => d.id === selectedDeptId);

  const generateDeptCode = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const words = trimmed.split(/\s+/);
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase().slice(0, 5);
    }
    return trimmed.slice(0, 3).toUpperCase();
  };

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    const finalCode = (newDeptCode || generateDeptCode(newDeptName)).toUpperCase();
    createDeptMutation.mutate({
      name: newDeptName.trim(),
      code: finalCode,
      description: newDeptDesc.trim() || undefined,
      managerId: newDeptManagerId || null,
      parentId: newDeptParentId || null
    }, {
      onSuccess: () => {
        setNewDeptName('');
        setNewDeptCode('');
        setNewDeptDesc('');
        setIsCodeManual(false);
        setNewDeptManagerId('');
        setNewDeptParentId('');
        alert("Department created successfully!");
      },
      onError: (err: any) => {
        const errorMsg = err.response?.data?.message || err.message || "Conflict: Department with this name or code already exists in this organization.";
        alert(errorMsg);
      }
    });
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId || !editName || !editCode) return;
    updateDeptMutation.mutate({
      id: selectedDeptId,
      data: {
        name: editName,
        code: editCode.toUpperCase(),
        description: editDesc,
        managerId: editManagerId || null,
        parentId: editParentId || null
      }
    }, {
      onSuccess: () => {
        setEditMode(false);
        alert("Department updated successfully!");
      },
      onError: (err) => alert(err.message)
    });
  };

  const handleDeleteDepartment = (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      deleteDeptMutation.mutate(id, {
        onSuccess: () => {
          if (selectedDeptId === id) setSelectedDeptId(null);
          alert("Department deleted successfully!");
        },
        onError: (err) => alert(err.message)
      });
    }
  };

  const startEdit = (dept: Department) => {
    setSelectedDeptId(dept.id);
    setEditName(dept.name);
    setEditCode(dept.code);
    setEditDesc(dept.description || '');
    setEditManagerId(dept.managerId || '');
    setEditParentId(dept.parentId || '');
    setEditMode(true);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Departments list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Departments Registry</h3>
          {deptsLoading ? (
            <p className="text-slate-400">Loading departments list...</p>
          ) : departments.length === 0 ? (
            <p className="text-slate-400">No departments found. Create one below to begin.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {departments.map((dept) => (
                <div 
                  key={dept.id}
                  onClick={() => { setSelectedDeptId(dept.id); setEditMode(false); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedDeptId === dept.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-700 dark:text-slate-350'
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs">{dept.name} ({dept.code})</p>
                    {dept.description && <p className="text-[10px] text-slate-400 mt-0.5">{dept.description}</p>}
                    {dept.manager && <p className="text-[10px] text-indigo-500 mt-0.5">Head: {dept.manager.name}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEdit(dept); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(dept.id); }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center & Right Column: Details / Forms */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
          {editMode ? (
            <form onSubmit={handleUpdateDepartment} className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Edit Department</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Department Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Department Code</label>
                  <input 
                    type="text" 
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Description</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Head of Department (Manager)</label>
                  <select 
                    value={editManagerId}
                    onChange={(e) => setEditManagerId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                  >
                    <option value="">-- Select Manager --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Parent Department</label>
                  <select 
                    value={editParentId}
                    onChange={(e) => setEditParentId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                  >
                    <option value="">-- None --</option>
                    {departments.filter(d => d.id !== selectedDeptId).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updateDeptMutation.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form to create a department */}
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Add New Department</h3>
                
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Department Name</label>
                  <input 
                    type="text" 
                    value={newDeptName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewDeptName(val);
                      if (!isCodeManual) {
                        setNewDeptCode(generateDeptCode(val));
                      }
                    }}
                    placeholder="e.g. Quality Assurance"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 font-semibold">Department Code</label>
                    <span className="text-[10px] text-primary font-medium">Auto-generated (Editable)</span>
                  </div>
                  <input 
                    type="text" 
                    value={newDeptCode}
                    onChange={(e) => {
                      setNewDeptCode(e.target.value.toUpperCase());
                      setIsCodeManual(true);
                    }}
                    placeholder="e.g. QA"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Description</label>
                  <textarea 
                    value={newDeptDesc}
                    onChange={(e) => setNewDeptDesc(e.target.value)}
                    placeholder="Brief scope/objective of the department..."
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Head / Manager</label>
                    <select 
                      value={newDeptManagerId}
                      onChange={(e) => setNewDeptManagerId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                    >
                      <option value="">-- Choose Head --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Parent Dept</label>
                    <select 
                      value={newDeptParentId}
                      onChange={(e) => setNewDeptParentId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300"
                    >
                      <option value="">-- None --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={createDeptMutation.isPending}
                  className="w-full py-2 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-1.5 hover:scale-102 transition-all shadow-md shadow-primary/20"
                >
                  Create Department
                </button>
              </form>

              {/* Detail view of active/selected department */}
              <div className="space-y-4 border-l md:pl-6 border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Department Overview</h3>
                {activeDept ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Department Name</p>
                      <p className="font-bold text-slate-800 dark:text-white text-sm mt-0.5">{activeDept.name}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Code</p>
                      <p className="font-mono font-bold text-indigo-500 mt-0.5">{activeDept.code}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Scope Description</p>
                      <p className="text-slate-650 dark:text-slate-350 mt-0.5">{activeDept.description || 'No description provided'}</p>
                    </div>
                    {activeDept.manager && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Head of Department (HoD)</p>
                        <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{activeDept.manager.name}</p>
                      </div>
                    )}
                    {activeDept.parent && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Reporting Department (Parent)</p>
                        <p className="font-semibold text-slate-850 dark:text-white mt-0.5">{activeDept.parent.name}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Select a department from the registry list to see details.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const EmployeeManagement: React.FC = () => {
  const { 
    employees: contextEmployees, setEmployees, activeSubModule, setActiveSubModule, 
    addAuditLog, selectedEmployeeId, setSelectedEmployeeId,
    userRole, currentUser, organizationId
  } = useApp();

  const isAdmin = userRole === 'Super Admin' || userRole === 'HR Admin' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'Super Admin';
  const { data: rolesResponse } = useRoles(organizationId);
  const orgRoles = rolesResponse?.data || [];

  const { data: deptsResponse } = useDepartments(organizationId);
  const dbDepartments = deptsResponse?.data || [];
  const dbDeptNames = dbDepartments.map(d => d.name);
  
  // Department options derived strictly from created departments in DB (or employees matching created DB depts)
  const departmentOptions = dbDeptNames.length > 0 
    ? dbDeptNames 
    : Array.from(new Set(contextEmployees.map(e => typeof e.department === 'string' ? e.department : ((e.department as any)?.name || '')).filter(Boolean)));

  // TanStack Query Hooks for Employee Modules
  const { data: employeesResponse, isLoading: employeesLoading } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const updateSalaryMutation = useUpdateEmployeeSalary();
  const updatePersonalMutation = useUpdateEmployeePersonal();
  const resetCredentialsMutation = useResetEmployeeCredentials();

  // Reset Employee Login Credentials Modal State
  const [showResetCredModal, setShowResetCredModal] = useState(false);
  const [targetEmployeeForReset, setTargetEmployeeForReset] = useState<{ id: string; name: string; email: string } | null>(null);
  const [resetNewEmail, setResetNewEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetCredResult, setResetCredResult] = useState<{ email: string; temporaryPassword: string; employeeName: string } | null>(null);
  const [copiedCred, setCopiedCred] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleOpenResetCredModal = (emp: { id: string; name: string; email: string }) => {
    setTargetEmployeeForReset(emp);
    setResetNewEmail(emp.email || '');
    setResetNewPassword('');
    setShowResetPassword(false);
    setResetCredResult(null);
    setCopiedCred(false);
    setResetError(null);
    setShowResetCredModal(true);
  };

  const handleGenerateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pass = "Emp@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += "!26";
    setResetNewPassword(pass);
    setShowResetPassword(true);
  };

  const handleExecuteResetCredentials = () => {
    if (!targetEmployeeForReset) return;
    setResetError(null);
    resetCredentialsMutation.mutate(
      {
        employeeId: targetEmployeeForReset.id,
        data: {
          newEmail: resetNewEmail.trim() || undefined,
          newPassword: resetNewPassword.trim() || undefined,
        },
      },
      {
        onSuccess: (res) => {
          if (res?.data) {
            setResetCredResult({
              email: res.data.email,
              temporaryPassword: res.data.temporaryPassword,
              employeeName: res.data.employeeName,
            });
          }
        },
        onError: (err: any) => {
          setResetError(err.response?.data?.message || err.message || "Failed to reset credentials");
        },
      }
    );
  };

  const handleCopyCredentials = () => {
    if (!resetCredResult) return;
    const text = `Employee Login Credentials:\nName: ${resetCredResult.employeeName}\nLogin Email: ${resetCredResult.email}\nTemporary Password: ${resetCredResult.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopiedCred(true);
    setTimeout(() => setCopiedCred(false), 2500);
  };

  // Dynamic Role & Department Override State with LocalStorage Persistence
  const [empOverridesMap, setEmpOverridesMap] = useState<Record<string, { role?: string; department?: string; basic?: number; netSalary?: number; status?: Employee['status']; clearanceStatus?: Employee['clearanceStatus'] }>>(() => {
    try {
      const saved = localStorage.getItem('hrms_emp_overrides_map');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hrms_emp_overrides_map', JSON.stringify(empOverridesMap));
    } catch (e) {
      console.error(e);
    }
  }, [empOverridesMap]);

  const [selectedExitEmpId, setSelectedExitEmpId] = useState('');
  const [resignationSearchTerm, setResignationSearchTerm] = useState('');
  const [resignationDeptFilter, setResignationDeptFilter] = useState('All');
  const [selectedResignedEmpId, setSelectedResignedEmpId] = useState<string | null>(null);

  // Dynamic Performance Ratings State per Employee (Super Admin)
  const [empRatingsMap, setEmpRatingsMap] = useState<Record<string, Array<{
    month: string;
    rating: number;
    status: string;
    tasks: string;
    quality: string;
    teamwork: string;
    feedback: string;
    givenBy?: string;
  }>>>(() => {
    try {
      const saved = localStorage.getItem('hrms_emp_performance_ratings');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hrms_emp_performance_ratings', JSON.stringify(empRatingsMap));
    } catch (e) {
      console.error(e);
    }
  }, [empRatingsMap]);

  // Add Performance Rating Modal State
  const [showAddRatingModal, setShowAddRatingModal] = useState(false);
  const [ratingMonth, setRatingMonth] = useState('July 2026');
  const [ratingScore, setRatingScore] = useState<number>(4.5);
  const [ratingStatus, setRatingStatus] = useState('EXCEEDS EXPECTATIONS');
  const [ratingTasks, setRatingTasks] = useState('95%');
  const [ratingQuality, setRatingQuality] = useState('4.5/5');
  const [ratingTeamwork, setRatingTeamwork] = useState('4.5/5');
  const [ratingFeedback, setRatingFeedback] = useState('');

  const dbEmployees = (employeesResponse?.data || []).filter(emp => {
    const roleName = ((emp as any).user?.role?.name || emp.role || '').toUpperCase();
    return roleName !== 'SUPER_ADMIN' && roleName !== 'SUPER ADMIN';
  });

  const employees = dbEmployees.map(emp => {
    const override = empOverridesMap[emp.id] || empOverridesMap[(emp as any).employeeId] || empOverridesMap[emp.name];
    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      avatar: emp.avatar || (emp.gender === 'Female' 
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"),
      status: override?.status || (emp.status === 'ACTIVE' ? 'Active' :
              emp.status === 'ON_LEAVE' ? 'On Leave' :
              emp.status === 'PROBATION' ? 'Probation' :
              emp.status === 'RESIGNED' ? 'Resigned' : 'Terminated'),
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      location: emp.location || '',
      role: override?.role || emp.designation || emp.role || (emp as any).user?.role?.name || '',
      department: (typeof emp.department === 'string' ? emp.department : (emp.department?.name || dbDepartments.find(d => d.id === emp.departmentId)?.name)) || override?.department || '',
      departmentId: emp.departmentId || (dbDepartments.find(d => d.name === (override?.department || (typeof emp.department === 'string' ? emp.department : emp.department?.name)))?.id) || null,
      manager: emp.manager?.name || '',
      basic: override?.basic ?? emp.basic ?? 0,
      hra: emp.hra ?? 0,
      allowance: emp.allowance ?? 0,
      deductions: emp.deductions ?? 0,
      netSalary: override?.netSalary ?? emp.netSalary ?? 0,
      bankName: emp.bankName || '',
      bankAccount: emp.bankAccount || '',
      ifsc: emp.ifsc || '',
      pan: emp.pan || '',
      aadhaar: emp.aadhaar || '',
      uan: emp.uan || '',
      pfNumber: emp.pfNumber || '',
      gender: emp.gender || 'Male',
      dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
      bloodGroup: emp.bloodGroup || 'O+',
      maritalStatus: emp.maritalStatus || 'Single',
      qualification: emp.qualification || '',
      university: emp.university || '',
      passingYear: emp.passingYear || '',
      fatherName: emp.fatherName || '',
      permanentAddress: emp.permanentAddress || '',
      languagesSpoken: emp.languagesSpoken || '',
      pastCompanies: (emp as any).pastCompanies || [],
      promotions: (emp as any).promotions || [],
      transfers: (emp as any).transfers || [],
      probationDuration: emp.probationDuration || '',
      probationEnd: emp.probationEnd ? new Date(emp.probationEnd).toISOString().split('T')[0] : '',
      confirmationStatus: emp.confirmationStatus === 'CONFIRMED' ? 'Confirmed' :
                          emp.confirmationStatus === 'EXTENDED' ? 'Extended' : 'Pending',
      assets: (emp as any).assets || [],
      clearanceStatus: (override?.clearanceStatus || (emp.clearanceStatus === 'APPROVED' ? 'Approved' : 'Pending')) as any,
      exitDate: emp.exitDate ? new Date(emp.exitDate).toISOString().split('T')[0] : undefined,
      userId: emp.userId
    } as Employee;
  });

  // Helper selectors
  const activeEmployee = employees.find(e => e.id === selectedEmployeeId) || employees[0];

  // Org Chart 360 Zoom & Pan State
  const [orgChartScale, setOrgChartScale] = useState<number>(1);
  const [orgChartPosition, setOrgChartPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingOrgChart, setIsDraggingOrgChart] = useState<boolean>(false);
  const [dragStartOrgChart, setDragStartOrgChart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedOrgDeptFilter, setSelectedOrgDeptFilter] = useState<string>('All');
  void selectedOrgDeptFilter;
  void setSelectedOrgDeptFilter;

  const { data: salaryResponse } = useEmployeeSalary(activeEmployee?.id);
  const { data: personalResponse } = useEmployeePersonal(activeEmployee?.id);
  const { data: feedbackResponse } = useFeedbacks(activeEmployee?.id);
  const createFeedbackMutation = useCreateFeedback();
  const { data: monthlyRatingsResponse } = useMonthlyRatings(activeEmployee?.id);
  const createMonthlyRatingMutation = useCreateMonthlyRating();
  const { data: familyResponse } = useEmployeeFamily(activeEmployee?.id);
  const addFamilyMutation = useAddEmployeeFamily();
  const deleteFamilyMutation = useDeleteEmployeeFamily();
  const saveExitMutation = useSaveEmployeeExit();
  const { data: _exitResponse } = useEmployeeExit(selectedExitEmpId || activeEmployee?.id);
  void _exitResponse;
  const { data: leaveAllocResponse } = useLeaveAllocations({ employeeId: activeEmployee?.id });

  const salaryDetails = salaryResponse?.data || activeEmployee;
  const personalDetails = personalResponse?.data || activeEmployee;

  // Personal Details Edit State
  const [editPersonalMode, setEditPersonalMode] = useState(false);
  const [pGender, setPGender] = useState('');
  const [pDob, setPDob] = useState('');
  const [pBloodGroup, setPBloodGroup] = useState('');
  const [pMaritalStatus, setPMaritalStatus] = useState('');
  const [pQualification, setPQualification] = useState('');
  const [pUniversity, setPUniversity] = useState('');
  const [pPassingYear, setPPassingYear] = useState('');
  const [pAvatar, setPAvatar] = useState('');

  // Salary Details Edit State
  const [editSalaryMode, setEditSalaryMode] = useState(false);
  const [sBasic, setSBasic] = useState<number>(0);
  const [sHra, setSHra] = useState<number>(0);
  const [sAllowance, setSAllowance] = useState<number>(0);
  const [sDeductions, setSDeductions] = useState<number>(0);
  const [sBankName, setSBankName] = useState('');
  const [sBankAccount, setSBankAccount] = useState('');
  const [sIfsc, setSIfsc] = useState('');
  const [sPan, setSPan] = useState('');
  const [sAadhaar, setSAadhaar] = useState('');
  const [sUan, setSUan] = useState('');
  const [sPfNumber, setSPfNumber] = useState('');

  // Documents Upload Refs & State
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{ [empId: string]: { name: string; size: string; date: string }[] }>({
    'EMP001': [
      { name: "Experience_Letter.pdf", size: "340 KB", date: "2026-05-10" },
      { name: "Educational_Degree.pdf", size: "1.2 MB", date: "2026-05-11" }
    ]
  });

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;
      const newDoc = {
        name: file.name,
        size: sizeStr,
        date: new Date().toISOString().split('T')[0]
      };
      setUploadedDocs(prev => ({
        ...prev,
        [activeEmployee.id]: [newDoc, ...(prev[activeEmployee.id] || [])]
      }));
      addAuditLog("Uploaded Document", "Employee Center", `Uploaded document "${file.name}" for employee ${activeEmployee.name}`);
      alert(`Document "${file.name}" uploaded successfully!`);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addAuditLog("Bulk Import File Selected", "Employee Center", `Selected bulk import file: ${file.name}`);
      alert(`File "${file.name}" selected successfully! Click 'Process Upload' to sync records.`);
    }
  };

  // Component state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');  
  const [statusFilter, setStatusFilter] = useState('All');
  const [profileTab, setProfileTab] = useState<'overview' | 'documents' | 'attendance' | 'payroll' | 'leave' | 'performance' | 'assets' | 'family' | 'revision' | 'timeline' | 'notes'>('overview');

  // Dynamic Muster Roll Calendar Month & Year State
  const [musterMonth, setMusterMonth] = useState('July');
  const [musterYear, setMusterYear] = useState('2026');

  // Dynamic Family & Dependent Management State
  const [familyMembersMap, setFamilyMembersMap] = useState<Record<string, Array<{
    id: string;
    name: string;
    relation: string;
    dob: string;
    contact?: string;
    bloodGroup?: string;
    isNominee: boolean;
    isInsuranceCovered: boolean;
  }>>>({
    'EMP001': [
      { id: 'FAM-101', name: 'Sunita Sharma', relation: 'Wife', dob: '1996-04-12', contact: '+91 98111 22233', bloodGroup: 'B+', isNominee: true, isInsuranceCovered: true },
      { id: 'FAM-102', name: 'Kabir Sharma', relation: 'Son', dob: '2022-09-05', bloodGroup: 'O+', isNominee: false, isInsuranceCovered: true }
    ],
    'EMP002': [
      { id: 'FAM-103', name: 'Ramesh Sen', relation: 'Father', dob: '1965-08-20', contact: '+91 98222 33344', bloodGroup: 'A+', isNominee: true, isInsuranceCovered: true }
    ]
  });
  // Dynamic Family Member Modal & Handlers
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('Spouse');
  const [famDob, setFamDob] = useState('');
  const [famContact, setFamContact] = useState('');
  const [famBloodGroup, setFamBloodGroup] = useState('O+');
  const [famIsNominee, setFamIsNominee] = useState(true);
  const [famIsInsurance, setFamIsInsurance] = useState(true);

  const handleAddFamilyMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!famName || !activeEmployee?.id) return;
    
    addFamilyMutation.mutate({
      employeeId: activeEmployee.id,
      data: {
        name: famName,
        relation: famRelation,
        dob: famDob || null,
        contact: famContact || null,
        bloodGroup: famBloodGroup || null,
        isNominee: famIsNominee,
        isInsuranceCovered: famIsInsurance
      }
    }, {
      onSuccess: () => {
        addAuditLog("Added Family Member", "Employee Center", `Added dependent "${famName}" (${famRelation}) for employee ${activeEmployee.name}`);
        setFamName('');
        setFamContact('');
        setFamDob('');
        setShowAddFamilyModal(false);
        alert("Family member added successfully!");
      },
      onError: (err) => {
        alert("Failed to add family member: " + err.message);
      }
    });
  };

  const handleDeleteFamilyMember = (memberId: string, memberName: string) => {
    if (!activeEmployee?.id) return;
    if (confirm(`Are you sure you want to remove dependent "${memberName}"?`)) {
      deleteFamilyMutation.mutate({
        employeeId: activeEmployee.id,
        familyId: memberId
      }, {
        onSuccess: () => {
          addAuditLog("Removed Family Member", "Employee Center", `Removed dependent "${memberName}" for employee ${activeEmployee.name}`);
          alert("Family member removed successfully!");
        },
        onError: (err) => {
          alert("Failed to delete family member: " + err.message);
        }
      });
    }
  };



  // Promote / Transfer Modal State
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoNewRole, setPromoNewRole] = useState('');
  const [promoNewDept, setPromoNewDept] = useState('');
  const [promoEffectiveDate, setPromoEffectiveDate] = useState('');
  const [promoNewBasic, setPromoNewBasic] = useState('');
  const [promoReason, setPromoReason] = useState('');

  const handleOpenPromoteModal = () => {
    if (!activeEmployee) return;
    setPromoNewRole(activeEmployee.role || '');
    setPromoNewDept(activeEmployee.department || (departmentOptions[0] || ''));
    setPromoEffectiveDate(new Date().toISOString().split('T')[0]);
    setPromoNewBasic(activeEmployee.basic ? activeEmployee.basic.toString() : '45000');
    setPromoReason('');
    setShowPromoteModal(true);
  };

  const handleApplyPromotionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;

    const oldRole = activeEmployee.role;
    const oldDept = activeEmployee.department;
    const newRole = promoNewRole || oldRole;
    const newDept = promoNewDept || oldDept;

    if (newRole && newRole !== oldRole) {
      activeEmployee.promotions = [
        {
          date: promoEffectiveDate,
          oldRole: oldRole,
          newRole: newRole,
          salaryIncrement: promoNewBasic ? `Revised Basic: ₹${promoNewBasic}` : '15% CTC Hike'
        },
        ...(activeEmployee.promotions || [])
      ];
      activeEmployee.role = newRole;
    }

    if (newDept && newDept !== oldDept) {
      activeEmployee.transfers = [
        {
          date: promoEffectiveDate,
          oldDept: oldDept,
          newDept: newDept,
          location: activeEmployee.location || 'Mumbai'
        },
        ...(activeEmployee.transfers || [])
      ];
      activeEmployee.department = newDept;
    }

    const updatedBasic = promoNewBasic ? Number(promoNewBasic) : activeEmployee.basic;
    const updatedNet = promoNewBasic ? Number(promoNewBasic) * 1.35 : activeEmployee.netSalary;

    const matchedDept = dbDepartments.find(
      d => d.name.toLowerCase() === newDept.toLowerCase() || d.id === newDept || d.code.toLowerCase() === newDept.toLowerCase()
    );

    setEmpOverridesMap(prev => ({
      ...prev,
      [activeEmployee.id]: { role: newRole, department: newDept, basic: updatedBasic, netSalary: updatedNet },
      [((activeEmployee as any).employeeId || '')]: { role: newRole, department: newDept, basic: updatedBasic, netSalary: updatedNet },
      [activeEmployee.name]: { role: newRole, department: newDept, basic: updatedBasic, netSalary: updatedNet }
    }));

    if (setEmployees) {
      setEmployees(prev => prev.map(emp => emp.id === activeEmployee.id ? {
        ...emp,
        role: newRole,
        designation: newRole,
        department: newDept,
        departmentId: matchedDept ? matchedDept.id : emp.departmentId,
        basic: updatedBasic,
        netSalary: updatedNet,
        promotions: activeEmployee.promotions,
        transfers: activeEmployee.transfers
      } : emp));
    }

    if (updateEmployeeMutation && updateEmployeeMutation.mutate) {
      updateEmployeeMutation.mutate({
        id: activeEmployee.id,
        data: {
          designation: newRole,
          role: newRole,
          departmentId: matchedDept ? matchedDept.id : undefined,
          department: newDept,
          basic: updatedBasic,
          netSalary: updatedNet
        }
      }, {
        onError: (err) => console.error("Error updating employee promotion/transfer:", err)
      });
    }

    if (updateSalaryMutation && updateSalaryMutation.mutate) {
      updateSalaryMutation.mutate({
        id: activeEmployee.id,
        data: { basic: updatedBasic, netSalary: updatedNet }
      }, { onError: () => {} });
    }

    addAuditLog(
      "Role Upgrade / Promotion",
      "Employee Center",
      `Upgraded Role/Transfer for employee ${activeEmployee.name} to Role: "${newRole}", Dept: "${newDept}".`
    );

    setShowPromoteModal(false);
    alert(`Employee ${activeEmployee.name} role upgraded successfully to "${newRole}" in "${newDept}" department!`);
  };

  const handleAddRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmployee) return;

    const newRatingObj = {
      month: ratingMonth,
      rating: Number(ratingScore),
      status: ratingStatus,
      tasks: ratingTasks,
      quality: ratingQuality,
      teamwork: ratingTeamwork,
      feedback: ratingFeedback || 'Evaluated and submitted by Super Admin.',
      givenBy: 'Super Admin'
    };

    setEmpRatingsMap(prev => {
      const existing = prev[activeEmployee.id] || [
        { month: "July 2026", rating: 4.6, status: "EXCEEDS EXPECTATIONS", tasks: "98%", quality: "4.7/5", teamwork: "4.6/5", feedback: "Outstanding project execution and leadership in team delivery.", givenBy: "Super Admin" },
        { month: "June 2026", rating: 4.5, status: "EXCEEDS EXPECTATIONS", tasks: "95%", quality: "4.5/5", teamwork: "4.5/5", feedback: "Consistently delivered code reviews on time with zero high bugs.", givenBy: "Super Admin" },
        { month: "May 2026", rating: 4.2, status: "MEETS EXPECTATIONS", tasks: "91%", quality: "4.2/5", teamwork: "4.3/5", feedback: "Great effort on API optimization and database indexing.", givenBy: "Super Admin" }
      ];
      return {
        ...prev,
        [activeEmployee.id]: [newRatingObj, ...existing]
      };
    });

    if (createMonthlyRatingMutation && createMonthlyRatingMutation.mutate) {
      createMonthlyRatingMutation.mutate({
        employeeId: activeEmployee.id,
        month: ratingMonth,
        rating: Number(ratingScore),
        status: ratingStatus,
        tasks: ratingTasks,
        quality: ratingQuality,
        teamwork: ratingTeamwork,
        feedback: ratingFeedback || 'Evaluated and submitted by Super Admin.',
        givenBy: 'Super Admin'
      });
    }

    if (createFeedbackMutation && createFeedbackMutation.mutate) {
      createFeedbackMutation.mutate({
        employeeId: activeEmployee.id,
        reviewer: 'Super Admin',
        relation: 'Manager',
        rating: Number(ratingScore),
        text: `${ratingMonth}: ${ratingFeedback || 'Performance rating submitted by Super Admin.'}`
      });
    }

    addAuditLog(
      "Performance Rating Submitted",
      "Employee Center",
      `Super Admin submitted rating ${ratingScore}/5.0 for ${activeEmployee.name} for period ${ratingMonth}.`
    );

    setShowAddRatingModal(false);
    setRatingFeedback('');
    alert(`Performance rating of ${ratingScore}/5.0 submitted successfully by Super Admin for ${activeEmployee.name}!`);
  };
  
  // Master Onboarding Stepper State
  const [stepperStep, setStepperStep] = useState(1);
  const [newEmp, setNewEmp] = useState<Partial<Employee> & {
    spouseName?: string;
    spouseRelation?: string;
    spouseDob?: string;
    spouseContact?: string;
    dependentName?: string;
    dependentRelation?: string;
    dependentDob?: string;
    casualLeave?: number;
    sickLeave?: number;
    earnedLeave?: number;
    maternityPaternityLeave?: number;
    leavePolicy?: string;
    password?: string;
    fatherName?: string;
    permanentAddress?: string;
    languagesSpoken?: string;
    roleId?: string;
  }>({
    id: `EMP${String(Date.now()).slice(-3)}${Math.floor(10 + Math.random() * 90)}`,
    name: '', email: '', password: '', role: '', roleId: '', department: 'Engineering', status: 'Probation',
    joiningDate: new Date().toISOString().split('T')[0], location: 'Mumbai',
    manager: 'Neha Patel', basic: 30000, hra: 12000, allowance: 8000, deductions: 2000, netSalary: 38000,
    bankName: '', bankAccount: '', ifsc: '', pan: '', aadhaar: '', uan: '', pfNumber: '',
    gender: 'Male', dob: '', bloodGroup: 'O+', maritalStatus: 'Single',
    qualification: '', university: '', passingYear: '', pastCompanies: [],
    promotions: [], transfers: [], probationDuration: '6 Months', probationEnd: '',
    confirmationStatus: 'Pending', assets: ['AST-100 (ID Card)'],
    spouseName: '', spouseRelation: 'Spouse', spouseDob: '', spouseContact: '',
    dependentName: '', dependentRelation: 'Child', dependentDob: '',
    casualLeave: 12, sickLeave: 12, earnedLeave: 15, maternityPaternityLeave: 10,
    leavePolicy: 'Standard Corporate Leave Policy 2026',
    fatherName: '', permanentAddress: '', languagesSpoken: ''
  });

  // Exit & Clearance Workflow State
  const [exitResignationDate, setExitResignationDate] = useState('2026-07-01');
  const [exitLastWorkingDay, setExitLastWorkingDay] = useState('2026-07-31');
  const [resignationReason, setResignationReason] = useState('Career Advancement & Personal Reasons');
  const [exitNoticeDays, setExitNoticeDays] = useState<number>(30);
  const [exitLeaveEncashDays, setExitLeaveEncashDays] = useState<number>(12);
  const [exitPenaltyDeduction, setExitPenaltyDeduction] = useState<number>(0);

  const [itClearance, setItClearance] = useState(false);
  const [financeClearance, setFinanceClearance] = useState(false);
  const [adminClearance, setAdminClearance] = useState(false);
  const [hrClearance, setHrClearance] = useState(false);
  
  const [showFFLetterModal, setShowFFLetterModal] = useState(false);

  // Dynamic Exit Registry Map with local persistence
  const [exitRegistryMap, setExitRegistryMap] = useState<Record<string, {
    resignationDate: string;
    lastWorkingDay: string;
    reason: string;
    noticeDays: number;
    leaveEncashDays: number;
    penaltyDeduction: number;
    itClearance: boolean;
    financeClearance: boolean;
    adminClearance: boolean;
    hrClearance: boolean;
    status: 'Pending Clearance' | 'Clearance Approved' | 'Settled';
    settledDate?: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('hrms_emp_exit_registry');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hrms_emp_exit_registry', JSON.stringify(exitRegistryMap));
    } catch (e) {
      console.error(e);
    }
  }, [exitRegistryMap]);

  // Bulk Actions State
  const [bulkMailSubject, setBulkMailSubject] = useState('');
  const [bulkMailBody, setBulkMailBody] = useState('');
  const [selectedBulkEmpIds, setSelectedBulkEmpIds] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Active employees for standard directory (EXCLUDE Resigned, Terminated & Super Admin accounts)
  const activeEmployees = employees.filter(emp => 
    emp.status !== 'Resigned' && 
    emp.status !== 'Terminated' &&
    emp.role.toUpperCase() !== 'SUPER_ADMIN' &&
    emp.role.toUpperCase() !== 'SUPER ADMIN'
  );
  
  // Resigned employees for dedicated Resignation archive
  const resignedEmployees = employees.filter(emp => emp.status === 'Resigned' || emp.status === 'Terminated');

  // Directory filter uses activeEmployees so resigned employees never show in active directory
  const filteredEmployees = activeEmployees.filter(emp => {
    // If not admin, restrict directory to only view self profile
    if (!isAdmin) {
      const isSelf = (emp.userId && currentUser?.id && emp.userId === currentUser.id) ||
                     (emp.email && currentUser?.email && emp.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                     (emp.id && currentUser?.id && emp.id === currentUser.id) ||
                     (emp.name && currentUser?.name && emp.name.toLowerCase() === currentUser.name.toLowerCase());
      if (!isSelf) return false;
    }

    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const filteredResignedEmployees = resignedEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(resignationSearchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(resignationSearchTerm.toLowerCase()) || 
                          emp.id.toLowerCase().includes(resignationSearchTerm.toLowerCase());
    const matchesDept = resignationDeptFilter === 'All' || emp.department === resignationDeptFilter;
    return matchesSearch && matchesDept;
  });

  const handleDeleteEmployee = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this employee?")) {
      deleteEmployeeMutation.mutate(id, {
        onSuccess: () => {
          setSelectedEmployeeId('');
          setActiveSubModule('directory');
          alert("Employee profile deleted successfully!");
        },
        onError: (err) => {
          alert("Failed to delete employee: " + err.message);
        }
      });
    }
  };

  const handleUpdatePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    updatePersonalMutation.mutate({
      id: activeEmployee.id,
      data: {
        gender: pGender,
        dob: pDob || null,
        bloodGroup: pBloodGroup || null,
        maritalStatus: pMaritalStatus || null,
        qualification: pQualification || null,
        university: pUniversity || null,
        passingYear: pPassingYear || null,
        avatar: pAvatar || null
      } as any
    }, {
      onSuccess: () => {
        setEditPersonalMode(false);
        alert("Personal Details updated successfully in database!");
      },
      onError: (err) => {
        alert("Failed to update personal details: " + err.message);
      }
    });
  };

  const handleUpdateSalary = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalaryMutation.mutate({
      id: activeEmployee.id,
      data: {
        basic: sBasic,
        hra: sHra,
        allowance: sAllowance,
        deductions: sDeductions,
        bankName: sBankName || null,
        bankAccount: sBankAccount || null,
        ifsc: sIfsc || null,
        pan: sPan || null,
        aadhaar: sAadhaar || null,
        uan: sUan || null,
        pfNumber: sPfNumber || null
      }
    }, {
      onSuccess: () => {
        setEditSalaryMode(false);
        alert("Salary Details updated successfully in database!");
      },
      onError: (err) => {
        alert("Failed to update salary details: " + err.message);
      }
    });
  };

  const handleCreateEmployee = () => {
    if (!newEmp.role || !newEmp.role.trim()) {
      alert("Job Designation Role (Title) is required. Please enter a job title (e.g. Senior Frontend Developer).");
      return;
    }
    if (!newEmp.roleId) {
      alert("Organization Role (Permissions) is required. Please select a role from the dropdown.");
      return;
    }

    const matchedDept = dbDepartments.find(
      d => d.name === newEmp.department || d.id === newEmp.department || (d.code && d.code === newEmp.department)
    );

    const finalEmp = {
      employeeId: newEmp.id!,
      name: newEmp.name!,
      email: newEmp.email || `${newEmp.name?.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone: newEmp.phone || null,
      password: newEmp.password || null,
      avatar: newEmp.avatar || (newEmp.gender === 'Female' 
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120"),
      status: (newEmp.status === 'On Leave' ? 'ON_LEAVE' : newEmp.status?.toUpperCase() || 'PROBATION') as any,
      joiningDate: newEmp.joiningDate || new Date().toISOString().split('T')[0],
      location: newEmp.location || null,
      designation: newEmp.role || null,
      roleId: newEmp.roleId || null,
      department: newEmp.department || null,
      departmentId: matchedDept?.id || null,
      basic: newEmp.basic || null,
      hra: newEmp.hra || null,
      allowance: newEmp.allowance || null,
      deductions: newEmp.deductions || null,
      netSalary: newEmp.netSalary || null,
      bankName: newEmp.bankName || null,
      bankAccount: newEmp.bankAccount || null,
      ifsc: newEmp.ifsc || null,
      pan: newEmp.pan || null,
      aadhaar: newEmp.aadhaar || null,
      uan: newEmp.uan || null,
      pfNumber: newEmp.pfNumber || null,
      gender: newEmp.gender || null,
      dob: newEmp.dob || null,
      bloodGroup: newEmp.bloodGroup || null,
      maritalStatus: newEmp.maritalStatus || null,
      qualification: newEmp.qualification || null,
      university: newEmp.university || null,
      passingYear: newEmp.passingYear || null,
      fatherName: newEmp.fatherName || null,
      permanentAddress: newEmp.permanentAddress || null,
      languagesSpoken: newEmp.languagesSpoken || null,
      probationDuration: newEmp.probationDuration || null,
      probationEnd: newEmp.probationEnd || null,
      confirmationStatus: (newEmp.confirmationStatus?.toUpperCase() || 'PENDING') as any,
    };

    createEmployeeMutation.mutate(finalEmp, {
      onSuccess: (res: any) => {
        addAuditLog("Onboarded Employee", "Employee Center", `Successfully registered employee ${finalEmp.name} (${finalEmp.employeeId})`);
        
        // Dynamically capture family & dependent entries entered during Step 2 Onboarding
        const familyList: Array<{
          id: string;
          name: string;
          relation: string;
          dob: string;
          contact?: string;
          bloodGroup?: string;
          isNominee: boolean;
          isInsuranceCovered: boolean;
        }> = [];

        if (newEmp.spouseName) {
          familyList.push({
            id: `FAM-${Date.now()}-1`,
            name: newEmp.spouseName,
            relation: newEmp.spouseRelation || 'Spouse',
            dob: newEmp.spouseDob || new Date().toISOString().split('T')[0],
            contact: newEmp.spouseContact || '',
            bloodGroup: 'O+',
            isNominee: true,
            isInsuranceCovered: true
          });
        }

        if (newEmp.dependentName) {
          familyList.push({
            id: `FAM-${Date.now()}-2`,
            name: newEmp.dependentName,
            relation: newEmp.dependentRelation || 'Child',
            dob: newEmp.dependentDob || new Date().toISOString().split('T')[0],
            contact: '',
            bloodGroup: 'O+',
            isNominee: false,
            isInsuranceCovered: true
          });
        }

        if (familyList.length > 0) {
          const dbId = res?.data?.id;
          const empId = finalEmp.employeeId;
          const empName = finalEmp.name;

          if (addFamilyMutation && addFamilyMutation.mutate && dbId) {
            familyList.forEach(fam => {
              addFamilyMutation.mutate({
                employeeId: dbId,
                data: {
                  name: fam.name,
                  relation: fam.relation,
                  dob: fam.dob || null,
                  contact: fam.contact || null,
                  bloodGroup: fam.bloodGroup || null,
                  isNominee: fam.isNominee,
                  isInsuranceCovered: fam.isInsuranceCovered
                }
              });
            });
          }

          setFamilyMembersMap(prev => {
            const nextMap = { ...prev };
            if (empId) nextMap[empId] = familyList;
            if (dbId) nextMap[dbId] = familyList;
            if (empName) nextMap[empName] = familyList;
            return nextMap;
          });
        }

        // Reset Stepper
        setStepperStep(1);
        setNewEmp({
          id: `EMP${String(Date.now()).slice(-3)}${Math.floor(10 + Math.random() * 90)}`,
          name: '', email: '', password: '', role: '', department: 'Engineering', status: 'Probation',
          joiningDate: new Date().toISOString().split('T')[0], location: 'Mumbai',
          manager: 'Neha Patel', basic: 30000, hra: 12000, allowance: 8000, deductions: 2000, netSalary: 38000,
          bankName: '', bankAccount: '', ifsc: '', pan: '', aadhaar: '', uan: '', pfNumber: '',
          gender: 'Male', dob: '', bloodGroup: 'O+', maritalStatus: 'Single',
          qualification: '', university: '', passingYear: '', pastCompanies: [],
          promotions: [], transfers: [], probationDuration: '6 Months', probationEnd: '',
          confirmationStatus: 'Pending', assets: ['AST-100 (ID Card)'],
          spouseName: '', spouseRelation: 'Spouse', spouseDob: '', spouseContact: '',
          dependentName: '', dependentRelation: 'Child', dependentDob: '',
          fatherName: '', permanentAddress: '', languagesSpoken: ''
        });
        
        setActiveSubModule('directory');
        alert("Employee onboarded successfully to database!");
      },
      onError: (err) => {
        alert("Error onboarding employee: " + err.message);
      }
    });
  };

  const handleSendBulkMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBulkEmpIds.length === 0) {
      alert("Please select employees first!");
      return;
    }
    addAuditLog("Sent Bulk Email", "Employee Center", `Sent communication email to ${selectedBulkEmpIds.length} employees. Subject: "${bulkMailSubject}"`);
    setBulkMailSubject('');
    setBulkMailBody('');
    setSelectedBulkEmpIds([]);
    alert("Emails queued and dispatched successfully!");
  };

  const handleToggleSelectBulk = (id: string) => {
    setSelectedBulkEmpIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const calculateFullFinal = (emp: Employee, customParams?: {
    noticeDays?: number;
    leaveEncashDays?: number;
    penaltyDeduction?: number;
  }) => {
    const basic = emp.basic || 30000;
    const hra = emp.hra || 12000;
    const allowance = emp.allowance || 8000;
    const standardDeductions = emp.deductions || 2000;

    const record = exitRegistryMap[emp.id];
    const nDays = customParams?.noticeDays ?? record?.noticeDays ?? exitNoticeDays;
    const lDays = customParams?.leaveEncashDays ?? record?.leaveEncashDays ?? exitLeaveEncashDays;
    const pDeduction = customParams?.penaltyDeduction ?? record?.penaltyDeduction ?? exitPenaltyDeduction;

    const monthlyGross = basic + hra + allowance;
    const noticePay = Math.round((monthlyGross / 30) * nDays);
    const leaveEncashment = Math.round((basic / 30) * lDays);
    
    // Gratuity calculation if employee joined > 4.5 years ago
    const joinYear = emp.joiningDate ? new Date(emp.joiningDate).getFullYear() : 2024;
    const currentYear = 2026;
    const yearsWorked = Math.max(0, currentYear - joinYear);
    const gratuity = yearsWorked >= 5 ? Math.round((basic / 26) * 15 * yearsWorked) : 0;

    const totalEarnings = noticePay + leaveEncashment + gratuity;
    const totalDeductions = standardDeductions + pDeduction;
    const netPayable = Math.max(0, totalEarnings - totalDeductions);

    return {
      basic,
      hra,
      allowance,
      monthlyGross,
      noticePay,
      leaveEncashment,
      gratuity,
      yearsWorked,
      standardDeductions,
      penaltyDeduction: pDeduction,
      totalEarnings,
      totalDeductions,
      netPayable,
      noticeDays: nDays,
      leaveDays: lDays
    };
  };

  const handleProcessClearance = () => {
    if (!selectedExitEmpId) {
      alert("Please select an employee first!");
      return;
    }
    const targetEmp = employees.find(e => e.id === selectedExitEmpId);
    if (!targetEmp) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // Update exit registry map
    setExitRegistryMap(prev => ({
      ...prev,
      [selectedExitEmpId]: {
        resignationDate: exitResignationDate,
        lastWorkingDay: exitLastWorkingDay,
        reason: resignationReason,
        noticeDays: exitNoticeDays,
        leaveEncashDays: exitLeaveEncashDays,
        penaltyDeduction: exitPenaltyDeduction,
        itClearance: true,
        financeClearance: true,
        adminClearance: true,
        hrClearance: true,
        status: 'Clearance Approved',
        settledDate: todayStr
      }
    }));

    // Update employee status & clearance status in overrides & DB
    setEmpOverridesMap(prev => ({
      ...prev,
      [selectedExitEmpId]: {
        ...(prev[selectedExitEmpId] || {}),
        status: 'Resigned',
        clearanceStatus: 'Approved'
      }
    }));

    // Save exit record to backend API
    const ffCalc = calculateFullFinal(targetEmp);
    saveExitMutation.mutate({
      employeeId: selectedExitEmpId,
      data: {
        resignationDate: exitResignationDate,
        lastWorkingDay: exitLastWorkingDay,
        reason: resignationReason,
        noticeDays: exitNoticeDays,
        leaveEncashDays: exitLeaveEncashDays,
        penaltyDeduction: exitPenaltyDeduction,
        itClearance: true,
        financeClearance: true,
        adminClearance: true,
        hrClearance: true,
        status: 'CLEARANCE_APPROVED',
        settledDate: todayStr,
        netPayable: ffCalc.netPayable
      }
    }, {
      onError: (err) => {
        console.warn("Backend exit save warning:", err.message);
      }
    });

    if (updatePersonalMutation && updatePersonalMutation.mutate) {
      updatePersonalMutation.mutate({
        id: targetEmp.id,
        data: { clearanceStatus: 'Approved' } as any
      }, { onError: () => {} });
    }

    addAuditLog(
      "Full & Final Settlement Approved",
      "Employee Center",
      `Approved F&F settlement and clearance for employee ${targetEmp.name} (${targetEmp.id}). Net Settlement: ₹${ffCalc.netPayable.toLocaleString()}`
    );

    alert(`Success! Clearance checklist approved & F&F settlement finalized for ${targetEmp.name}.`);
  };


  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveSubModule('directory')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'directory' || activeSubModule === 'profile'
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Employee Directory
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveSubModule('master')}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
              activeSubModule === 'master' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Employee Onboarding Master
          </button>
        )}
        <button 
          onClick={() => setActiveSubModule('idcard')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubModule === 'idcard' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span>ID Card Generator</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-full">
            New
          </span>
        </button>
        <button 
          onClick={() => setActiveSubModule('orgchart')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'orgchart' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Organization Chart
        </button>
        {isAdmin && (
          <>
            <button 
              onClick={() => setActiveSubModule('exit')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
                activeSubModule === 'exit' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Exit Management & F&F
            </button>
            <button 
              onClick={() => setActiveSubModule('resignation')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                activeSubModule === 'resignation' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span>Resignation Archive</span>
              {resignedEmployees.length > 0 && (
                <span className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded-full">
                  {resignedEmployees.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveSubModule('bulk')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
                activeSubModule === 'bulk' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Bulk Actions & Mailing
            </button>
            <button 
              onClick={() => setActiveSubModule('roles')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
                activeSubModule === 'roles' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Role & Permissions
            </button>
            <button 
              onClick={() => setActiveSubModule('departments')}
              className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
                activeSubModule === 'departments' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Departments
            </button>
          </>
        )}
      </div>

      {/* ======================================= */}
      {/* 1. EMPLOYEE DIRECTORY                   */}
      {/* ======================================= */}
      {activeSubModule === 'directory' && (
        <div className="space-y-4 animate-fade-in">
          {employeesLoading && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500 font-medium">
              Syncing with backend database...
            </div>
          )}
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, role or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg px-2 bg-slate-50 dark:bg-slate-950">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select 
                  value={deptFilter} 
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-transparent border-0 text-xs py-1.5 focus:outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="All">All Departments</option>
                  {departmentOptions.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg px-2 bg-slate-50 dark:bg-slate-950">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-0 text-xs py-1.5 focus:outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Probation">Probation</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shrink-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-primary' : 'bg-transparent text-slate-400'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 ${viewMode === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-primary' : 'bg-transparent text-slate-400'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button 
                onClick={() => {
                  alert("Exporting current directory view to Excel...");
                  addAuditLog("Exported Directory", "Employee Center", "Exported filtered employee directory database");
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:scale-105 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredEmployees.map((emp) => (
                <div 
                  key={emp.id} 
                  onClick={() => { setSelectedEmployeeId(emp.id); setActiveSubModule('profile'); }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm interactive-card cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    <img src={emp.avatar} alt={emp.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/10 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">{emp.id}</span>
                      <h3 className="font-bold text-slate-850 dark:text-white text-sm hover:text-primary transition-colors">{emp.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{emp.role}</p>
                      <span className="text-[10px] text-slate-400 font-semibold">{emp.department}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-4 flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                      emp.status === 'On Leave' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      emp.status === 'Probation' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' :
                      'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                    }`}>
                      {emp.status}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenResetCredModal({ id: emp.id, name: emp.name, email: emp.email });
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-2 py-0.5 rounded-lg transition-colors"
                        title="Reset Login Credentials"
                      >
                        <Key className="h-3 w-3" />
                        Reset Login
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800 uppercase">
                  <tr>
                    <th className="p-4">ID / Employee</th>
                    <th className="p-4">Department & Role</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Joining Date</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                  {filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      onClick={() => { setSelectedEmployeeId(emp.id); setActiveSubModule('profile'); }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                    >
                      <td className="p-4 flex items-center gap-3">
                        <img src={emp.avatar} alt={emp.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white leading-none">{emp.name}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{emp.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{emp.role}</p>
                        <p className="text-[10px] text-slate-400">{emp.department}</p>
                      </td>
                      <td className="p-4">{emp.location}</td>
                      <td className="p-4">{emp.joiningDate}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          emp.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                          emp.status === 'On Leave' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          emp.status === 'Probation' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' :
                          'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenResetCredModal({ id: emp.id, name: emp.name, email: emp.email });
                              }}
                              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-2.5 py-1 rounded-lg transition-colors"
                              title="Reset Login Credentials"
                            >
                              <Key className="h-3 w-3" />
                              Reset Login
                            </button>
                          )}
                          <ChevronRight className="h-4 w-4 text-slate-400 inline" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* 2. DETAIL PROFILE PAGE                  */}
      {/* ======================================= */}
      {activeSubModule === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          {/* Back button and profile header */}
          <button 
            onClick={() => setActiveSubModule('directory')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </button>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
              <img src={activeEmployee.avatar} alt={activeEmployee.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/20 shrink-0" />
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-none">{activeEmployee.name}</h2>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{activeEmployee.id}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">{activeEmployee.role} • {activeEmployee.department}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{activeEmployee.location}</span>
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />Manager: {activeEmployee.manager}</span>
                  <span className="flex items-center gap-1"><Landmark className="h-3.5 w-3.5" />Joined: {activeEmployee.joiningDate}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDeleteEmployee(activeEmployee.id)}
                  disabled={deleteEmployeeMutation.isPending}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold hover:scale-105 transition-all shadow-md shadow-red-500/10 disabled:opacity-50"
                >
                  Delete Profile
                </button>
                <button 
                  onClick={() => {
                    alert("Triggering warning letter generation for " + activeEmployee.name);
                  }}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-xs font-semibold transition-colors"
                >
                  Issue Letter
                </button>
                <button 
                  onClick={handleOpenPromoteModal}
                  className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:scale-105 transition-all shadow-md shadow-primary/10"
                >
                  Promote / Transfer
                </button>
                <button 
                  onClick={() => handleOpenResetCredModal({ id: activeEmployee.id, name: activeEmployee.name, email: activeEmployee.email })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:scale-105 transition-all shadow-md shadow-emerald-600/10"
                  title="Reset Employee Login Credentials"
                >
                  <Key className="h-3.5 w-3.5" />
                  Reset Login
                </button>
              </div>

              {/* Dynamic Employee Status Dropdown Button below Promote / Transfer */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Status:</span>
                <select
                  value={activeEmployee.status}
                  onChange={(e) => {
                    const newStatusVal = e.target.value as Employee['status'];
                    setEmpOverridesMap(prev => ({
                      ...prev,
                      [activeEmployee.id]: {
                        ...(prev[activeEmployee.id] || {}),
                        status: newStatusVal
                      }
                    }));
                    if (updatePersonalMutation && updatePersonalMutation.mutate) {
                      const apiStatusMap: Record<string, string> = {
                        'Active': 'ACTIVE',
                        'On Leave': 'ON_LEAVE',
                        'Terminated': 'TERMINATED',
                        'Resigned': 'RESIGNED',
                        'Probation': 'PROBATION'
                      };
                      updatePersonalMutation.mutate({
                        id: activeEmployee.id,
                        data: { status: apiStatusMap[newStatusVal] || 'ACTIVE' } as any
                      }, { onError: () => {} });
                    }
                    addAuditLog("Employee Status Updated", "Employee Center", `Updated status for ${activeEmployee.name} to ${newStatusVal}`);
                    alert(`Employee ${activeEmployee.name} status updated to "${newStatusVal}" successfully!`);
                  }}
                  className="bg-transparent border-0 text-xs font-bold focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Probation">Probation</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Profile Tab selectors */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto gap-2">
            {(['overview', 'documents', 'attendance', 'payroll', 'leave', 'performance', 'assets', 'family', 'revision', 'timeline', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setProfileTab(tab)}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  profileTab === tab 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'family' ? 'Family & Dependents' : tab === 'revision' ? 'Revision History' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Profile Tab Contents */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-64">
            
            {profileTab === 'overview' && (
              <div className="space-y-6 text-xs">
                
                {/* Highlighted Current Job Role & Department Banner */}
                <div className="p-4 bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 dark:from-primary/20 dark:via-blue-500/20 dark:to-indigo-500/20 rounded-2xl border border-primary/20 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary text-white rounded-xl shadow-md">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Current Designation Role</span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        {activeEmployee.role}
                        <span className="px-2.5 py-0.5 bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-light rounded-full text-[10px] font-bold">
                          Active Role
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 border-l dark:border-slate-800 pl-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        {activeEmployee.department}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Joining Date</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{activeEmployee.joiningDate || '2024-01-15'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Work Location</span>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{activeEmployee.location || 'Mumbai'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                {/* Personal details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Personal Details</h3>
                    <button 
                      onClick={() => {
                        setPGender(personalDetails.gender || 'Male');
                        setPDob(personalDetails.dob ? new Date(personalDetails.dob).toISOString().split('T')[0] : '');
                        setPBloodGroup(personalDetails.bloodGroup || 'O+');
                        setPMaritalStatus(personalDetails.maritalStatus || 'Single');
                        setPQualification(personalDetails.qualification || '');
                        setPUniversity(personalDetails.university || '');
                        setPPassingYear(personalDetails.passingYear || '');
                        setPAvatar((personalDetails as any).avatar || activeEmployee.avatar || '');
                        setEditPersonalMode(!editPersonalMode);
                      }}
                      className="text-xs text-primary hover:underline font-bold"
                    >
                      {editPersonalMode ? 'Cancel' : 'Edit Details'}
                    </button>
                  </div>
                  {editPersonalMode ? (
                    <form onSubmit={handleUpdatePersonal} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <label className="text-slate-400 font-medium block text-xs">Profile Photo / Avatar</label>
                          <div className="flex items-center gap-3">
                            {pAvatar ? (
                              <img src={pAvatar} alt="Preview" className="w-10 h-10 rounded-full object-cover border" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                Photo
                              </div>
                            )}
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                  const dataUrl = event.target?.result as string;
                                  if (dataUrl) {
                                    setPAvatar(dataUrl);
                                    try {
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      formData.append('image', dataUrl);
                                      const res = await api.post('/documents/upload-avatar', formData);
                                      const uploadedUrl = res.data?.data?.url || res.data?.url;
                                      if (uploadedUrl) setPAvatar(uploadedUrl);
                                    } catch (_) {}
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-medium">Gender</label>
                          <select 
                            value={pGender} 
                            onChange={(e) => setPGender(e.target.value)}
                            className="w-full px-2 py-1.5 border rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-medium">Date of Birth</label>
                          <input 
                            type="date" 
                            value={pDob} 
                            onChange={(e) => setPDob(e.target.value)}
                            className="w-full px-2 py-1.5 border rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-medium">Blood Group</label>
                          <select 
                            value={pBloodGroup} 
                            onChange={(e) => setPBloodGroup(e.target.value)}
                            className="w-full px-2 py-1.5 border rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                          >
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-medium">Marital Status</label>
                          <select 
                            value={pMaritalStatus} 
                            onChange={(e) => setPMaritalStatus(e.target.value)}
                            className="w-full px-2 py-1.5 border rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                          </select>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={updatePersonalMutation.isPending}
                        className="w-full py-2 bg-primary text-white rounded font-bold hover:opacity-90"
                      >
                        Save Personal Details
                      </button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="col-span-2 flex items-center gap-3 pb-2 border-b dark:border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Profile Photo</span>
                        {(personalDetails.avatar || activeEmployee.avatar) ? (
                          <img src={personalDetails.avatar || activeEmployee.avatar} alt={activeEmployee.name} className="w-10 h-10 rounded-full object-cover border" />
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">Not Uploaded</span>
                        )}
                      </div>
                      <div><span className="text-slate-400 block text-[10px]">Gender</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.gender || 'Male'}</p></div>
                      <div><span className="text-slate-400 block text-[10px]">Date of Birth</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.dob || '1995-08-15'}</p></div>
                      <div><span className="text-slate-400 block text-[10px]">Blood Group</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.bloodGroup || 'O+'}</p></div>
                      <div><span className="text-slate-400 block text-[10px]">Marital Status</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.maritalStatus || 'Single'}</p></div>
                      <div><span className="text-slate-400 block text-[10px]">Contact Email</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150 truncate">{activeEmployee.email}</p></div>
                      <div><span className="text-slate-400 block text-[10px]">Contact Phone</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{activeEmployee.phone || '+91 98765 43210'}</p></div>
                      <div><span className="text-slate-400 block text-[10px]">Nationality</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">Indian</p></div>
                      <div><span className="text-slate-400 block text-[10px]">Father's / Guardian Name</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.fatherName || activeEmployee.fatherName || (activeEmployee as any).spouseName || 'Rajendra Sharma'}</p></div>
                      <div className="col-span-2 border-t pt-2 dark:border-slate-800"><span className="text-slate-400 block text-[10px]">Permanent Address</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.permanentAddress || activeEmployee.permanentAddress || (activeEmployee.location ? `${activeEmployee.location}, India` : 'Andheri East, Mumbai, Maharashtra 400069')}</p></div>
                      <div className="col-span-2"><span className="text-slate-400 block text-[10px]">Emergency Contact</span><p className="font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400 font-mono">{(familyMembersMap[activeEmployee.id]?.[0]?.contact) || (activeEmployee as any).spouseContact || '+91 98000 11223'} (Family Emergency Contact)</p></div>
                      <div className="col-span-2"><span className="text-slate-400 block text-[10px]">Languages Spoken</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.languagesSpoken || activeEmployee.languagesSpoken || 'English, Hindi, Marathi'}</p></div>
                    </div>
                  )}
                </div>
                
                {/* Qualifications & Past Work */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Academic & Career Background</h3>
                  </div>
                  {editPersonalMode ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Highest Degree</label>
                        <input 
                          type="text" 
                          value={pQualification} 
                          onChange={(e) => setPQualification(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">University</label>
                        <input 
                          type="text" 
                          value={pUniversity} 
                          onChange={(e) => setPUniversity(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Passing Year</label>
                        <input 
                          type="text" 
                          value={pPassingYear} 
                          onChange={(e) => setPPassingYear(e.target.value)}
                          className="w-full px-2 py-1.5 border rounded bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3.5 mb-4">
                        <div><span className="text-slate-400 block">Highest Degree</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.qualification}</p></div>
                        <div><span className="text-slate-400 block">University</span><p className="font-semibold mt-0.5 text-slate-800 dark:text-slate-150">{personalDetails.university}</p></div>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">Past Companies</span>
                        {activeEmployee.pastCompanies.length === 0 ? (
                          <p className="text-slate-450 italic">No past companies listed (Fresher)</p>
                        ) : (
                          activeEmployee.pastCompanies.map((c: { company: string; role: string; duration: string; ctc: string }, i: number) => (
                            <div key={i} className="mb-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                              <p className="font-bold text-slate-800 dark:text-white">{c.company}</p>
                              <p className="text-[10px] text-slate-400">{c.role} • {c.duration} • CTC: ₹{c.ctc}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

            {profileTab === 'documents' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Identity Documents & Verification</h3>
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={documentFileInputRef} 
                      className="hidden" 
                      onChange={handleDocumentFileChange}
                    />
                    <button 
                      onClick={() => documentFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl hover:scale-105 transition-all font-semibold shadow-sm"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload File
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSignature className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-bold text-slate-850 dark:text-white">Aadhaar Card</p>
                        <p className="text-[10px] text-slate-400">{activeEmployee.aadhaar}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 px-2 py-0.5 rounded-full text-[9px] font-bold">VERIFIED</span>
                  </div>
                  <div className="p-3 border rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-bold text-slate-850 dark:text-white">PAN Card</p>
                        <p className="text-[10px] text-slate-400">{activeEmployee.pan}</p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 px-2 py-0.5 rounded-full text-[9px] font-bold">VERIFIED</span>
                  </div>

                  {/* Uploaded Documents */}
                  {(uploadedDocs[activeEmployee.id] || []).map((doc, idx) => (
                    <div key={idx} className="p-3 border rounded-xl flex items-center justify-between animate-fade-in col-span-1">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-bold text-slate-850 dark:text-white">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">Size: {doc.size} • Uploaded: {doc.date}</p>
                        </div>
                      </div>
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full text-[9px] font-bold">UPLOADED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileTab === 'attendance' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Attendance Summary & Muster Roll Calendar</h3>
                  <span className="text-[10px] text-slate-400 font-medium">Monthly Cycle: July 2026</span>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-center border">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total Days</p>
                    <p className="text-xl font-bold mt-1 text-slate-800 dark:text-white">30</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl text-center border">
                    <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-bold">Present</p>
                    <p className="text-xl font-bold mt-1 text-green-700 dark:text-green-400">22</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl text-center border">
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">Leaves</p>
                    <p className="text-xl font-bold mt-1 text-amber-700 dark:text-amber-400">2</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl text-center border">
                    <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold">Absent</p>
                    <p className="text-xl font-bold mt-1 text-red-700 dark:text-red-400">0</p>
                  </div>
                </div>

                {/* Shift Schedule Banner */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2">Assigned Shift Schedule</h4>
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">General Day Shift (G-01)</p>
                      <p className="text-[10px] text-slate-400">09:30 AM to 06:30 PM • 9 Hours (1 Hr break included)</p>
                    </div>
                    <span className="bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full font-bold text-[10px] text-slate-700 dark:text-slate-300">ROSTERED</span>
                  </div>
                </div>

                {/* Muster Roll Calendar Grid */}
                <div className="border rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs">
                        Muster Roll Calendar - {musterMonth} {musterYear}
                      </h4>
                      <p className="text-[10px] text-slate-400">Daily attendance logs for {activeEmployee.name}</p>
                    </div>

                    {/* Month & Year Selectors */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select 
                        value={musterMonth}
                        onChange={(e) => setMusterMonth(e.target.value)}
                        className="px-3 py-1.5 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer shadow-2xs"
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>

                      <select 
                        value={musterYear}
                        onChange={(e) => setMusterYear(e.target.value)}
                        className="px-3 py-1.5 border rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer shadow-2xs"
                      >
                        {['2024', '2025', '2026', '2027', '2028'].map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>

                      <button 
                        onClick={() => alert(`Downloading Muster Roll report for ${activeEmployee.name} (${musterMonth} ${musterYear})...`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl font-semibold hover:scale-105 transition-all text-xs shadow-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Download Report
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Calendar Grid Logic */}
                  {(() => {
                    const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    const monthIdx = monthsList.indexOf(musterMonth);
                    const yearNum = parseInt(musterYear, 10);
                    
                    // Days in month calculation
                    const totalDays = new Date(yearNum, monthIdx + 1, 0).getDate();
                    
                    // First day of the month (0 = Sun, 1 = Mon...)
                    const firstDay = new Date(yearNum, monthIdx, 1).getDay();
                    // Offset for Monday-start grid (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
                    const offsetCount = (firstDay + 6) % 7;

                    return (
                      <div className="grid grid-cols-7 gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
                          <div key={w} className="text-center font-bold text-slate-400 py-1 text-[11px]">{w}</div>
                        ))}
                        
                        {/* Render blank offset spaces */}
                        {Array.from({ length: offsetCount }).map((_, idx) => (
                          <div key={`offset-${idx}`} className="py-2 border border-transparent"></div>
                        ))}

                        {/* Render Days */}
                        {Array.from({ length: totalDays }, (_, i) => {
                          const dayNum = i + 1;
                          const currentDayOfWeek = new Date(yearNum, monthIdx, dayNum).getDay();
                          
                          let status: 'Present' | 'Late' | 'Absent' | 'Holiday' | 'WeekOff' = 'Present';
                          
                          if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
                            status = 'WeekOff';
                          } else if (dayNum === 10) {
                            status = 'Absent';
                          } else if (dayNum === 14 || dayNum === 22) {
                            status = 'Late';
                          } else if (dayNum === 15) {
                            status = 'Holiday';
                          }

                          return (
                            <div 
                              key={dayNum} 
                              className={`border rounded-xl p-2 text-center flex flex-col justify-between h-14 cursor-pointer hover:border-primary transition-all shadow-2xs ${
                                status === 'Present' ? 'bg-green-50/70 dark:bg-green-950/20 border-green-200 dark:border-green-900/40' :
                                status === 'Late' ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40' :
                                status === 'Absent' ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 animate-pulse' :
                                status === 'Holiday' ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40' :
                                'bg-slate-100/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                              }`}
                              onClick={() => {
                                alert(`Date: ${musterMonth} ${dayNum}, ${musterYear}\nEmployee: ${activeEmployee.name}\nStatus: ${status}`);
                              }}
                            >
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{dayNum}</span>
                              <span className={`text-[8px] font-extrabold block uppercase tracking-wider ${
                                status === 'Present' ? 'text-green-600 dark:text-green-400' :
                                status === 'Late' ? 'text-amber-600 dark:text-amber-400' :
                                status === 'Absent' ? 'text-red-600 dark:text-red-400' :
                                status === 'Holiday' ? 'text-blue-600 dark:text-blue-400' :
                                'text-slate-400'
                              }`}>
                                {status === 'Present' ? 'PRESENT' :
                                 status === 'Late' ? 'LATE' :
                                 status === 'Absent' ? 'ABSENT' :
                                 status === 'Holiday' ? 'HOLIDAY' : 'WEEK OFF'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  
                  {/* Legend Footer */}
                  <div className="flex gap-4 items-center mt-3 pt-3 border-t justify-center text-[10px] font-medium text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>Present</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>Late</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>Absent</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>Holiday</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>Week Off</span>
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'payroll' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Salary Master Structure & CTC</h3>
                  <button 
                    onClick={() => {
                      setSBasic(salaryDetails.basic || 0);
                      setSHra(salaryDetails.hra || 0);
                      setSAllowance(salaryDetails.allowance || 0);
                      setSDeductions(salaryDetails.deductions || 0);
                      setSBankName(salaryDetails.bankName || '');
                      setSBankAccount(salaryDetails.bankAccount || '');
                      setSIfsc(salaryDetails.ifsc || '');
                      setSPan(salaryDetails.pan || '');
                      setSAadhaar(salaryDetails.aadhaar || '');
                      setSUan(salaryDetails.uan || '');
                      setSPfNumber(salaryDetails.pfNumber || '');
                      setEditSalaryMode(!editSalaryMode);
                    }}
                    className="text-xs text-primary hover:underline font-bold"
                  >
                    {editSalaryMode ? 'Cancel' : 'Edit Structure'}
                  </button>
                </div>
                {editSalaryMode ? (
                  <form onSubmit={handleUpdateSalary} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-950 space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2">Edit Monthly Earnings</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span>Basic Salary</span>
                            <input 
                              type="number" 
                              value={sBasic} 
                              onChange={(e) => setSBasic(Number(e.target.value))}
                              className="w-32 px-2 py-1 border rounded bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>HRA</span>
                            <input 
                              type="number" 
                              value={sHra} 
                              onChange={(e) => setSHra(Number(e.target.value))}
                              className="w-32 px-2 py-1 border rounded bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Special Allowance</span>
                            <input 
                              type="number" 
                              value={sAllowance} 
                              onChange={(e) => setSAllowance(Number(e.target.value))}
                              className="w-32 px-2 py-1 border rounded bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-950 space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2">Edit Monthly Deductions & Bank</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span>Total Deductions</span>
                            <input 
                              type="number" 
                              value={sDeductions} 
                              onChange={(e) => setSDeductions(Number(e.target.value))}
                              className="w-32 px-2 py-1 border rounded bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Bank Name</span>
                            <input 
                              type="text" 
                              value={sBankName} 
                              onChange={(e) => setSBankName(e.target.value)}
                              className="w-32 px-2 py-1 border rounded bg-white dark:bg-slate-900"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Bank Account No</span>
                            <input 
                              type="text" 
                              value={sBankAccount} 
                              onChange={(e) => setSBankAccount(e.target.value)}
                              className="w-32 px-2 py-1 border rounded bg-white dark:bg-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-xl bg-slate-50 dark:bg-slate-950">
                      <div className="space-y-1">
                        <span className="text-slate-400">IFSC Code</span>
                        <input 
                          type="text" 
                          value={sIfsc} 
                          onChange={(e) => setSIfsc(e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400">PAN</span>
                        <input 
                          type="text" 
                          value={sPan} 
                          onChange={(e) => setSPan(e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400">Aadhaar</span>
                        <input 
                          type="text" 
                          value={sAadhaar} 
                          onChange={(e) => setSAadhaar(e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400">UAN</span>
                        <input 
                          type="text" 
                          value={sUan} 
                          onChange={(e) => setSUan(e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-slate-400">PF Number</span>
                        <input 
                          type="text" 
                          value={sPfNumber} 
                          onChange={(e) => setSPfNumber(e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={updateSalaryMutation.isPending}
                      className="w-full py-2.5 bg-primary text-white rounded-xl font-bold hover:opacity-90"
                    >
                      Save Salary Structure Changes
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Earnings table */}
                      <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-2.5">Monthly Earnings</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between"><span>Basic Salary</span><span className="font-bold text-slate-800 dark:text-white">₹{(salaryDetails.basic ?? 0).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>HRA</span><span className="font-bold text-slate-800 dark:text-white">₹{(salaryDetails.hra ?? 0).toLocaleString()}</span></div>
                          <div className="flex justify-between"><span>Special Allowance</span><span className="font-bold text-slate-800 dark:text-white">₹{(salaryDetails.allowance ?? 0).toLocaleString()}</span></div>
                          <div className="border-t pt-2 flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            <span>Gross Salary</span>
                            <span>₹{((salaryDetails.basic ?? 0) + (salaryDetails.hra ?? 0) + (salaryDetails.allowance ?? 0)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Deductions and Bank */}
                      <div className="space-y-4">
                        <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-950">
                          <h4 className="font-bold text-slate-800 dark:text-white mb-2.5">Monthly Deductions</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between"><span>Provident Fund (PF)</span><span className="font-bold text-slate-800 dark:text-white">₹3,200</span></div>
                            <div className="flex justify-between"><span>Professional Tax (PT)</span><span className="font-bold text-slate-800 dark:text-white">₹200</span></div>
                            <div className="flex justify-between"><span>Income Tax (TDS mock)</span><span className="font-bold text-slate-800 dark:text-white">₹{((salaryDetails.deductions ?? 0) - 3400).toLocaleString()}</span></div>
                            <div className="border-t pt-2 flex justify-between font-bold text-rose-600 dark:text-rose-400 text-sm">
                              <span>Total Deductions</span>
                              <span>₹{(salaryDetails.deductions ?? 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 border rounded-xl flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white">Net Credited</p>
                            <p className="text-[10px] text-slate-400">Direct Bank Deposit</p>
                          </div>
                          <span className="text-lg font-extrabold text-primary">₹{(salaryDetails.netSalary ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border rounded-xl p-4">
                      <h4 className="font-bold text-slate-800 dark:text-white mb-2">PF & Bank Remittance Codes</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px]">
                        <div><span className="text-slate-400">Bank</span><p className="font-semibold text-slate-800 dark:text-white">{salaryDetails.bankName}</p></div>
                        <div><span className="text-slate-400">Account No</span><p className="font-semibold text-slate-800 dark:text-white">{salaryDetails.bankAccount}</p></div>
                        <div><span className="text-slate-400">Universal Account No (UAN)</span><p className="font-semibold text-slate-800 dark:text-white">{salaryDetails.uan}</p></div>
                        <div><span className="text-slate-400">PF Member ID</span><p className="font-semibold text-slate-800 dark:text-white">{salaryDetails.pfNumber}</p></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {profileTab === 'leave' && (() => {
              const empSeed = (activeEmployee.id || activeEmployee.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              
              const allocList = leaveAllocResponse?.data || [];
              
              const clAlloc = allocList.find(a => a.leaveType?.code === 'CL' || a.leaveType?.name.toLowerCase().includes('casual')) || {
                allocated: (activeEmployee as any).casualLeave || 12,
                used: (empSeed % 4) + 1,
                pending: 0
              };
              
              const slAlloc = allocList.find(a => a.leaveType?.code === 'SL' || a.leaveType?.name.toLowerCase().includes('sick')) || {
                allocated: (activeEmployee as any).sickLeave || 12,
                used: (empSeed % 3) + 1,
                pending: 0
              };

              const elAlloc = allocList.find(a => a.leaveType?.code === 'EL' || a.leaveType?.name.toLowerCase().includes('earned') || a.leaveType?.name.toLowerCase().includes('privilege')) || {
                allocated: (activeEmployee as any).earnedLeave || 15,
                used: (empSeed % 5) + 2,
                pending: 0
              };

              const plAlloc = allocList.find(a => a.leaveType?.code === 'PL' || a.leaveType?.name.toLowerCase().includes('parental') || a.leaveType?.name.toLowerCase().includes('maternity')) || {
                allocated: (activeEmployee as any).maternityPaternityLeave || 10,
                used: 0,
                pending: 0
              };

              const leaves = [
                { title: 'Casual Leave (CL)', allocated: clAlloc.allocated, used: clAlloc.used, pending: clAlloc.pending, icon: '🏖️' },
                { title: 'Sick Leave (SL)', allocated: slAlloc.allocated, used: slAlloc.used, pending: slAlloc.pending, icon: '🏥' },
                { title: 'Earned Leave (EL)', allocated: elAlloc.allocated, used: elAlloc.used, pending: elAlloc.pending, icon: '🌟' },
                { title: 'Parental / Special Leave', allocated: plAlloc.allocated, used: plAlloc.used, pending: plAlloc.pending, icon: '👨‍👩‍👧' }
              ];

              const totalAllocated = leaves.reduce((sum, l) => sum + l.allocated, 0);
              const totalUsed = leaves.reduce((sum, l) => sum + l.used, 0);
              const totalRemaining = totalAllocated - totalUsed;

              return (
                <div className="space-y-5 text-xs">
                  {/* Summary Banner */}
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-primary/10 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-primary/20 rounded-2xl border border-blue-500/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md font-bold text-base">
                        🌴
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Annual Leave Entitlement & Balance</span>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          {totalRemaining} / {totalAllocated} Days Available
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                            {totalRemaining > 10 ? 'Healthy Balance' : 'Low Quotas'}
                          </span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Total Days Used</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{totalUsed} Days</p>
                      </div>
                      <div className="text-right border-l pl-4 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Allocated Quota</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{totalAllocated} Days</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Category Wise Leave Breakup</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {leaves.map((leave, idx) => {
                      const remaining = leave.allocated - leave.used;
                      const usagePercent = Math.min(100, Math.round((leave.used / (leave.allocated || 1)) * 100));

                      return (
                        <div key={idx} className="p-4 border rounded-2xl bg-slate-50 dark:bg-slate-950/80 space-y-3 hover:border-primary/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{leave.icon}</span>
                              <span className="font-bold text-slate-800 dark:text-white">{leave.title}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border px-2.5 py-1 rounded-lg">
                              {remaining} Days Left
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Used: <strong className="text-slate-800 dark:text-slate-200">{leave.used} days</strong></span>
                              <span className="text-slate-500">Total Quota: <strong className="text-slate-800 dark:text-slate-200">{leave.allocated} days</strong></span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {profileTab === 'performance' && (() => {
              const apiMonthlyRatings = (monthlyRatingsResponse?.data || []).map(r => ({
                month: r.month,
                rating: r.rating,
                status: r.status,
                tasks: r.tasks,
                quality: r.quality,
                teamwork: r.teamwork,
                feedback: r.feedback || '',
                givenBy: r.givenBy || 'Super Admin'
              }));

              const apiFeedbacks = (feedbackResponse?.data || []).map(f => ({
                month: f.date || 'July 2026',
                rating: f.rating,
                status: f.rating >= 4.8 ? 'OUTSTANDING' : f.rating >= 4.2 ? 'EXCEEDS EXPECTATIONS' : 'MEETS EXPECTATIONS',
                tasks: '95%',
                quality: `${f.rating}/5`,
                teamwork: '4.5/5',
                feedback: f.text,
                givenBy: f.reviewer || 'Super Admin'
              }));

              const storedRatings = empRatingsMap[activeEmployee.id] || empRatingsMap[(activeEmployee as any).employeeId] || [];

              const empSeed = (activeEmployee.id || activeEmployee.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
              const defaultRatings = [
                { month: "July 2026", rating: Number((4.4 + (empSeed * 0.1)).toFixed(1)), status: "EXCEEDS EXPECTATIONS", tasks: "98%", quality: "4.7/5", teamwork: "4.6/5", feedback: `Outstanding performance in ${activeEmployee.department} team execution.`, givenBy: "Super Admin" },
                { month: "June 2026", rating: Number((4.3 + (empSeed * 0.1)).toFixed(1)), status: "EXCEEDS EXPECTATIONS", tasks: "95%", quality: "4.5/5", teamwork: "4.5/5", feedback: "Consistently delivered milestones on schedule with zero critical bugs.", givenBy: "Super Admin" },
                { month: "May 2026", rating: Number((4.1 + (empSeed * 0.1)).toFixed(1)), status: "MEETS EXPECTATIONS", tasks: "91%", quality: "4.2/5", teamwork: "4.3/5", feedback: "Great effort on API optimization and unit test coverage.", givenBy: "Super Admin" },
                { month: "April 2026", rating: Number((4.6 + (empSeed * 0.05)).toFixed(1)), status: "OUTSTANDING", tasks: "99%", quality: "4.9/5", teamwork: "4.8/5", feedback: "Recognized for initiative, mentoring, and technical excellence.", givenBy: "Super Admin" }
              ];

              const currentRatings = storedRatings.length > 0 ? storedRatings : (apiMonthlyRatings.length > 0 ? apiMonthlyRatings : (apiFeedbacks.length > 0 ? apiFeedbacks : defaultRatings));
              const avgScore = (currentRatings.reduce((acc, curr) => acc + curr.rating, 0) / currentRatings.length).toFixed(1);

              return (
                <div className="space-y-5 text-xs">
                  
                  {/* Header & Overall Rating Banner */}
                  <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-primary/20 rounded-2xl border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">Average Monthly Performance Rating</span>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          {avgScore} / 5.0
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-[10px] font-bold">
                            {Number(avgScore) >= 4.5 ? '★ Star Performer' : Number(avgScore) >= 4.0 ? 'Exceeds Expectations' : 'Meets Expectations'}
                          </span>
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Total Months Evaluated</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">{currentRatings.length} Months</p>
                      </div>
                      <div className="text-right border-l pl-4 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Evaluated By</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">Super Admin / {activeEmployee.manager}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-500" />
                      Monthly Wise Performance Rating Breakdown
                    </h3>
                    <button 
                      onClick={() => setShowAddRatingModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      + Give Performance Rating (Super Admin)
                    </button>
                  </div>

                  {/* Monthly Performance Cards */}
                  <div className="space-y-3">
                    {currentRatings.map((m, idx) => (
                      <div key={idx} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/70 dark:bg-slate-950/70 hover:border-primary/40 transition-all space-y-3">
                        
                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-sm text-slate-800 dark:text-white">{m.month}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              m.rating >= 4.5 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                                : m.rating >= 4.0 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}>
                              {m.status}
                            </span>
                            {m.givenBy && (
                              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-semibold">
                                Given by {m.givenBy}
                              </span>
                            )}
                          </div>

                          {/* Stars & Rating Score */}
                          <div className="flex items-center gap-2">
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-sm">
                                  {star <= Math.floor(m.rating) ? '★' : star - 0.5 <= m.rating ? '★' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="font-extrabold text-sm text-slate-800 dark:text-white">{m.rating} / 5.0</span>
                          </div>
                        </div>

                        {/* KPI Sub-Metrics */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[9px]">Tasks Completed</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{m.tasks}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Quality Rating</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{m.quality}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">Teamwork & Ownership</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{m.teamwork}</span>
                          </div>
                        </div>

                        {/* Manager / Admin Feedback */}
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                          <span className="font-bold text-slate-400">Feedback & Review:</span>
                          <span className="italic">"{m.feedback}"</span>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              );
            })()}

            {profileTab === 'assets' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b pb-2">Assigned Hardware & IT Assets</h3>
                <div className="space-y-2">
                  {activeEmployee.assets.map((ast: string, idx: number) => (
                    <div key={idx} className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <QrCode className="h-5 w-5 text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-white">{ast}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Verified Auto-Sync • Active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profileTab === 'timeline' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b pb-2">Lifecycle History & Transfers</h3>
                <div className="space-y-4 relative pl-5 border-l">
                  <div className="relative pb-2">
                    <span className="absolute -left-6.5 top-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-white dark:border-slate-900"></span>
                    <p className="font-bold text-slate-850 dark:text-white">Joined Company</p>
                    <p className="text-[10px] text-slate-400">{activeEmployee.joiningDate}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Hired as {activeEmployee.role} in {activeEmployee.department} team located in {activeEmployee.location}.</p>
                  </div>
                  {activeEmployee.promotions.map((p: { date: string; oldRole: string; newRole: string; salaryIncrement: string }, idx: number) => (
                    <div key={idx} className="relative pb-2">
                      <span className="absolute -left-6.5 top-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900"></span>
                      <p className="font-bold text-green-600 dark:text-green-400">Promotion / Salary Revision</p>
                      <p className="text-[10px] text-slate-400">{p.date}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Promoted from {p.oldRole} to {p.newRole} with an increment of {p.salaryIncrement}.</p>
                    </div>
                  ))}
                  {activeEmployee.transfers.map((t: { date: string; oldDept: string; newDept: string; location: string }, idx: number) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-6.5 top-0.5 h-3.5 w-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900"></span>
                      <p className="font-bold text-blue-600 dark:text-blue-400">Departmental Transfer</p>
                      <p className="text-[10px] text-slate-400">{t.date}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Transferred from {t.oldDept} to {t.newDept} in {t.location} office.</p>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {profileTab === 'family' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Family Members & Dependent Details</h3>
                    <p className="text-[10px] text-slate-400">Registered dependents, nominees and insurance covered family members for {activeEmployee.name}</p>
                  </div>
                  <button 
                    onClick={() => setShowAddFamilyModal(true)}
                    className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:scale-105 transition-all shadow-sm flex items-center gap-1"
                  >
                    <span>+ Add Dependent</span>
                  </button>
                </div>

                {/* Add Family Member Modal Overlay */}
                {showAddFamilyModal && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-xl animate-fade-in text-xs">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">Add Family Member / Dependent</h4>
                        <button 
                          onClick={() => setShowAddFamilyModal(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
                        >
                          ×
                        </button>
                      </div>

                      <form onSubmit={handleAddFamilyMemberSubmit} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-medium">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={famName}
                            onChange={(e) => setFamName(e.target.value)}
                            placeholder="Enter dependent full name"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-slate-500 font-medium">Relationship</label>
                            <select 
                              value={famRelation}
                              onChange={(e) => setFamRelation(e.target.value)}
                              className="w-full p-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                            >
                              <option value="Spouse">Spouse (Wife/Husband)</option>
                              <option value="Son">Son</option>
                              <option value="Daughter">Daughter</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Brother">Brother</option>
                              <option value="Sister">Sister</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-500 font-medium">Date of Birth</label>
                            <input 
                              type="date" 
                              value={famDob}
                              onChange={(e) => setFamDob(e.target.value)}
                              className="w-full p-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-slate-500 font-medium">Emergency Contact</label>
                            <input 
                              type="tel" 
                              value={famContact}
                              onChange={(e) => setFamContact(e.target.value)}
                              placeholder="+91 98000 00000"
                              className="w-full p-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-500 font-medium">Blood Group</label>
                            <select 
                              value={famBloodGroup}
                              onChange={(e) => setFamBloodGroup(e.target.value)}
                              className="w-full p-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                            >
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={famIsNominee}
                              onChange={(e) => setFamIsNominee(e.target.checked)}
                              className="rounded accent-primary"
                            />
                            <span className="text-slate-600 dark:text-slate-300">Primary Nominee</span>
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={famIsInsurance}
                              onChange={(e) => setFamIsInsurance(e.target.checked)}
                              className="rounded accent-primary"
                            />
                            <span className="text-slate-600 dark:text-slate-300">Insurance Covered</span>
                          </label>
                        </div>

                        <div className="flex justify-end gap-2 border-t pt-3">
                          <button 
                            type="button" 
                            onClick={() => setShowAddFamilyModal(false)}
                            className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            disabled={addFamilyMutation.isPending}
                            className="px-3.5 py-1.5 bg-primary text-white rounded-lg font-semibold hover:scale-105 transition-all shadow-sm disabled:opacity-50"
                          >
                            {addFamilyMutation.isPending ? 'Saving...' : 'Save Dependent'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Dynamic Family Members Grid fetched from API */}
                {(() => {
                  const dbFamilyList = (familyResponse?.data || []).map(f => ({
                    id: f.id,
                    name: f.name,
                    relation: f.relation,
                    dob: f.dob ? new Date(f.dob).toISOString().split('T')[0] : '',
                    contact: f.contact || '',
                    bloodGroup: f.bloodGroup || '',
                    isNominee: f.isNominee,
                    isInsuranceCovered: f.isInsuranceCovered
                  }));

                  const storedFamilyList = familyMembersMap[activeEmployee.id] || familyMembersMap[(activeEmployee as any).employeeId] || familyMembersMap[activeEmployee.name] || [];
                  const activeEmpFamilyList = dbFamilyList.length > 0 ? dbFamilyList : storedFamilyList;

                  return activeEmpFamilyList.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                      <p className="text-slate-400 font-medium">No family members or dependents registered yet for {activeEmployee.name}.</p>
                      <button 
                        onClick={() => setShowAddFamilyModal(true)}
                        className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:scale-105 transition-all shadow-sm inline-block"
                      >
                        + Add First Dependent
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeEmpFamilyList.map((fam) => (
                        <div key={fam.id} className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2 relative group hover:border-primary/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-white">{fam.relation} ({fam.name})</span>
                            <div className="flex items-center gap-1.5">
                              {fam.isNominee && (
                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                  PRIMARY NOMINEE
                                </span>
                              )}
                              {fam.isInsuranceCovered && (
                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                  INSURANCE COVERED
                                </span>
                              )}
                              <button 
                                onClick={() => handleDeleteFamilyMember(fam.id, fam.name)}
                                className="text-red-500 hover:text-red-700 p-1 opacity-70 group-hover:opacity-100 transition-opacity"
                                title="Delete Dependent"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-slate-600 dark:text-slate-300">Full Name: <span className="font-semibold">{fam.name}</span></p>
                          <p className="text-slate-600 dark:text-slate-300">Relationship: <span className="font-semibold">{fam.relation}</span></p>
                          {fam.dob && <p className="text-slate-600 dark:text-slate-300">Date of Birth: <span className="font-semibold">{fam.dob}</span></p>}
                          {fam.contact && <p className="text-slate-600 dark:text-slate-300">Emergency Contact: <span className="font-semibold">{fam.contact}</span></p>}
                          {fam.bloodGroup && <p className="text-slate-600 dark:text-slate-300">Blood Group: <span className="font-semibold">{fam.bloodGroup}</span></p>}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {profileTab === 'revision' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Employee Revision History & Audit Logs</h3>
                  <span className="text-[10px] text-slate-400 font-medium">Auto-Logged Revision Audit Registry</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">Annual CTC Increment & Role Revision</span>
                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 px-2 py-0.5 rounded-full text-[9px] font-bold">PROMOTION</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">CTC Revised from ₹6,50,000 to ₹7,70,000 (+18.4%) • Role updated to Senior Engineer</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Approved by: HR Director (Shalini Sen) on 2026-04-01</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-900 border px-2.5 py-1 rounded-lg">2026-04-01</span>
                  </div>

                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">Probation Confirmation Revision</span>
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[9px] font-bold">CONFIRMED</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Employee Status revised from 'Probation' to 'Active Full-Time Employee'</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Logged by: Manager (Neha Patel) on 2022-09-15</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-900 border px-2.5 py-1 rounded-lg">2022-09-15</span>
                  </div>

                  <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-white">Initial Master Onboarding Entry</span>
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full text-[9px] font-bold">ONBOARDING</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">System Master Profile created with ID EMP001 and assigned to Engineering Department</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Logged by: System Admin on 2022-03-15</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-900 border px-2.5 py-1 rounded-lg">2022-03-15</span>
                  </div>
                </div>
              </div>
            )}

            {profileTab === 'notes' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b pb-2">Internal HR & Performance Notes</h3>
                <textarea 
                  placeholder="Type an internal note regarding performance, disciplinary actions or awards..." 
                  className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                  rows={4}
                />
                <button 
                  onClick={() => alert("Note saved successfully!")}
                  className="px-3.5 py-1.5 bg-primary text-white rounded-lg font-semibold hover:scale-105 transition-all shadow-sm"
                >
                  Save Internal Note
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 3. ONBOARDING STEPPER MASTER            */}
      {/* ======================================= */}
      {activeSubModule === 'master' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-xs">
          <div>
            <h2 className="text-md font-bold text-slate-800 dark:text-white">Employee Onboarding Master Setup</h2>
            <p className="text-slate-400 mt-1">Create a new employee master registry record through a step-by-step confirmation wizard.</p>
          </div>

          {/* Stepper Steps UI */}
          <div className="flex items-center justify-between border-b pb-4 overflow-x-auto">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold border ${
                  stepperStep === step 
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                    : stepperStep > step 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  {step}
                </div>
                <span className={`font-semibold whitespace-nowrap ${stepperStep === step ? 'text-primary' : 'text-slate-400'}`}>
                  {step === 1 ? 'Personal Details' : step === 2 ? 'Family & Dependents' : step === 3 ? 'Remittance & Work' : step === 4 ? 'Leave Allocation' : 'Confirmation'}
                </span>
                {step < 5 && <ChevronRight className="h-4 w-4 text-slate-400 mx-2 hidden md:block" />}
              </div>
            ))}
          </div>

          {/* Step 1 Content */}
          {stepperStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Step 1: Personal Details & Academics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3 space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <label className="text-slate-400 font-medium block text-xs">Profile Photo / Avatar</label>
                  <div className="flex items-center gap-3">
                    {newEmp.avatar ? (
                      <img src={newEmp.avatar} alt="Preview" className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                        Photo
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const dataUrl = event.target?.result as string;
                          if (dataUrl) {
                            setNewEmp(prev => ({ ...prev, avatar: dataUrl }));
                            try {
                              const formData = new FormData();
                              formData.append('file', file);
                              formData.append('image', dataUrl);
                              const res = await api.post('/documents/upload-avatar', formData);
                              const uploadedUrl = res.data?.data?.url || res.data?.url;
                              if (uploadedUrl) setNewEmp(prev => ({ ...prev, avatar: uploadedUrl }));
                            } catch (_) {}
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Full Name</label>
                  <input 
                    type="text" 
                    value={newEmp.name} 
                    onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                    placeholder="Enter full name" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Work Email Address</label>
                  <input 
                    type="email" 
                    value={newEmp.email || ''} 
                    onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                    placeholder="e.g. employee@company.com" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Account Password</label>
                  <input 
                    type="password" 
                    value={newEmp.password || ''} 
                    onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Phone Number</label>
                  <input 
                    type="tel" 
                    value={newEmp.phone || ''} 
                    onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                    placeholder="Enter phone number" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Job Designation Role</label>
                  <input 
                    type="text" 
                    value={newEmp.role} 
                    onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    placeholder="e.g. Frontend Developer" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Organization Role (Permissions)</label>
                  <select 
                    value={newEmp.roleId || ''} 
                    onChange={(e) => setNewEmp({ ...newEmp, roleId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    <option value="">-- Select Organization Role --</option>
                    {orgRoles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.description ? `(${r.description})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Gender</label>
                  <select 
                    value={newEmp.gender} 
                    onChange={(e) => setNewEmp({ ...newEmp, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Blood Group</label>
                  <select 
                    value={newEmp.bloodGroup || 'O+'} 
                    onChange={(e) => setNewEmp({ ...newEmp, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Department</label>
                  <select 
                    value={newEmp.department} 
                    onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  >
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Date of Birth</label>
                  <input 
                    type="date" 
                    value={newEmp.dob} 
                    onChange={(e) => setNewEmp({ ...newEmp, dob: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Employee Status</label>
                  <select 
                    value={newEmp.status} 
                    onChange={(e) => setNewEmp({ ...newEmp, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    <option value="Active">ACTIVE</option>
                    <option value="On Leave">ON_LEAVE</option>
                    <option value="Terminated">TERMINATED</option>
                    <option value="Resigned">RESIGNED</option>
                    <option value="Probation">PROBATION</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Father's / Guardian Name</label>
                  <input 
                    type="text" 
                    value={newEmp.fatherName || ''} 
                    onChange={(e) => setNewEmp({ ...newEmp, fatherName: e.target.value })}
                    placeholder="e.g. Rajendra Sharma" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Permanent Address</label>
                  <input 
                    type="text" 
                    value={newEmp.permanentAddress || ''} 
                    onChange={(e) => setNewEmp({ ...newEmp, permanentAddress: e.target.value })}
                    placeholder="Enter permanent address" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Languages Spoken</label>
                  <input 
                    type="text" 
                    value={newEmp.languagesSpoken || ''} 
                    onChange={(e) => setNewEmp({ ...newEmp, languagesSpoken: e.target.value })}
                    placeholder="e.g. English, Hindi, Marathi" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Highest Academic Degree</label>
                  <input 
                    type="text" 
                    value={newEmp.qualification} 
                    onChange={(e) => setNewEmp({ ...newEmp, qualification: e.target.value })}
                    placeholder="e.g. MBA in HR" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 Content: Family & Dependents */}
          {stepperStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Step 2: Family Members & Dependent Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Spouse / Primary Nominee Section */}
                <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-white">Primary Nominee / Spouse Details</h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">Nominee Full Name</label>
                      <input 
                        type="text" 
                        value={newEmp.spouseName || ''} 
                        onChange={(e) => setNewEmp({ ...newEmp, spouseName: e.target.value })}
                        placeholder="e.g. Sunita Sharma" 
                        className="w-full px-3 py-1.5 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Relationship</label>
                        <select 
                          value={newEmp.spouseRelation || 'Spouse'} 
                          onChange={(e) => setNewEmp({ ...newEmp, spouseRelation: e.target.value })}
                          className="w-full px-2 py-1.5 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        >
                          <option value="Spouse">Spouse (Wife/Husband)</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Nominee DOB</label>
                        <input 
                          type="date" 
                          value={newEmp.spouseDob || ''} 
                          onChange={(e) => setNewEmp({ ...newEmp, spouseDob: e.target.value })}
                          className="w-full px-2 py-1.5 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">Emergency Contact Number</label>
                      <input 
                        type="tel" 
                        value={newEmp.spouseContact || ''} 
                        onChange={(e) => setNewEmp({ ...newEmp, spouseContact: e.target.value })}
                        placeholder="+91 98000 00000" 
                        className="w-full px-3 py-1.5 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Dependent / Child Section */}
                <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 space-y-3">
                  <h4 className="font-bold text-slate-800 dark:text-white">Secondary Dependent / Child Details</h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-medium">Dependent Full Name</label>
                      <input 
                        type="text" 
                        value={newEmp.dependentName || ''} 
                        onChange={(e) => setNewEmp({ ...newEmp, dependentName: e.target.value })}
                        placeholder="e.g. Kabir Sharma" 
                        className="w-full px-3 py-1.5 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Relationship</label>
                        <select 
                          value={newEmp.dependentRelation || 'Child'} 
                          onChange={(e) => setNewEmp({ ...newEmp, dependentRelation: e.target.value })}
                          className="w-full px-2 py-1.5 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        >
                          <option value="Child">Child (Son/Daughter)</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 font-medium">Dependent DOB</label>
                        <input 
                          type="date" 
                          value={newEmp.dependentDob || ''} 
                          onChange={(e) => setNewEmp({ ...newEmp, dependentDob: e.target.value })}
                          className="w-full px-2 py-1.5 border rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        />
                      </div>
                    </div>
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                      ✓ Dependents entered during onboarding will automatically be registered under Company Health Insurance coverage.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Step 3 Content */}
          {stepperStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Step 3: Remittance Details & Banking</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Bank Name</label>
                  <input 
                    type="text" 
                    value={newEmp.bankName} 
                    onChange={(e) => setNewEmp({ ...newEmp, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Bank Account Number</label>
                  <input 
                    type="text" 
                    value={newEmp.bankAccount} 
                    onChange={(e) => setNewEmp({ ...newEmp, bankAccount: e.target.value })}
                    placeholder="Enter account number" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">IFSC Code</label>
                  <input 
                    type="text" 
                    value={newEmp.ifsc} 
                    onChange={(e) => setNewEmp({ ...newEmp, ifsc: e.target.value })}
                    placeholder="e.g. HDFC0000240" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">PAN Card Number</label>
                  <input 
                    type="text" 
                    value={newEmp.pan} 
                    onChange={(e) => setNewEmp({ ...newEmp, pan: e.target.value })}
                    placeholder="10-digit alphanumeric" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Aadhaar Card Number</label>
                  <input 
                    type="text" 
                    value={newEmp.aadhaar} 
                    onChange={(e) => setNewEmp({ ...newEmp, aadhaar: e.target.value })}
                    placeholder="12-digit number" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Basic Salary (Monthly)</label>
                  <input 
                    type="number" 
                    value={newEmp.basic} 
                    onChange={(e) => {
                      const b = Number(e.target.value);
                      const h = Math.round(b * 0.4);
                      const a = Math.round(b * 0.3);
                      const d = Math.round(b * 0.15);
                      setNewEmp({ ...newEmp, basic: b, hra: h, allowance: a, deductions: d, netSalary: b + h + a - d });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 Content: Leave Allocation & Policy Assignment */}
          {stepperStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Step 4: Leave Allocation & Policy Assignment</h3>
                  <p className="text-slate-400 text-[11px]">Configure initial leave balances, entitlements, and leave policies for the employee.</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                  Annual Allocation
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-slate-400 font-medium">Assigned Leave Policy</label>
                  <select
                    value={newEmp.leavePolicy || 'Standard Corporate Leave Policy 2026'}
                    onChange={(e) => setNewEmp({ ...newEmp, leavePolicy: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="Standard Corporate Leave Policy 2026">Standard Corporate Leave Policy 2026 (12 CL, 12 SL, 15 EL)</option>
                    <option value="Executive Leave Policy 2026">Executive Leave Policy 2026 (15 CL, 15 SL, 20 EL)</option>
                    <option value="Probationer Leave Policy 2026">Probationer Leave Policy 2026 (6 CL, 6 SL, 0 EL)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Casual Leave (CL) Days / Year</label>
                  <input 
                    type="number" 
                    value={newEmp.casualLeave ?? 12} 
                    onChange={(e) => setNewEmp({ ...newEmp, casualLeave: Number(e.target.value) })}
                    placeholder="12" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Sick Leave (SL) Days / Year</label>
                  <input 
                    type="number" 
                    value={newEmp.sickLeave ?? 12} 
                    onChange={(e) => setNewEmp({ ...newEmp, sickLeave: Number(e.target.value) })}
                    placeholder="12" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Earned / Privilege Leave (EL) Days / Year</label>
                  <input 
                    type="number" 
                    value={newEmp.earnedLeave ?? 15} 
                    onChange={(e) => setNewEmp({ ...newEmp, earnedLeave: Number(e.target.value) })}
                    placeholder="15" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Parental / Special Leave Days / Year</label>
                  <input 
                    type="number" 
                    value={newEmp.maternityPaternityLeave ?? 10} 
                    onChange={(e) => setNewEmp({ ...newEmp, maternityPaternityLeave: Number(e.target.value) })}
                    placeholder="10" 
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-[11px] font-medium flex items-center justify-between">
                <span>✓ Total Annual Leave Allocation: <strong>{(newEmp.casualLeave || 12) + (newEmp.sickLeave || 12) + (newEmp.earnedLeave || 15) + (newEmp.maternityPaternityLeave || 10)} Days</strong></span>
                <span>Carry Forward Limit: Max 30 Days</span>
              </div>
            </div>
          )}

          {/* Step 5 Content: Confirmation & Master Entry */}
          {stepperStep === 5 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Step 5: Confirm Master Record Information</h3>
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl space-y-3.5">
                <p className="font-bold text-slate-800 dark:text-white">Verify all fields match legal physical documents:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><span className="text-slate-400">Name</span><p className="font-semibold text-slate-800 dark:text-white">{newEmp.name || "N/A"}</p></div>
                  <div><span className="text-slate-400">Email Address</span><p className="font-semibold text-slate-800 dark:text-white truncate">{newEmp.email || "N/A"}</p></div>
                  <div><span className="text-slate-400">Account Password</span><p className="font-semibold text-slate-800 dark:text-white font-mono">{newEmp.password ? '••••••••' : "Auto-generated"}</p></div>
                  <div><span className="text-slate-400">Role</span><p className="font-semibold text-slate-800 dark:text-white">{newEmp.role || "N/A"}</p></div>
                  <div><span className="text-slate-400">Department</span><p className="font-semibold text-slate-800 dark:text-white">{newEmp.department}</p></div>
                  <div><span className="text-slate-400">Employee Status</span><p className="font-semibold text-primary font-bold">{newEmp.status?.toUpperCase()}</p></div>
                  <div><span className="text-slate-400">Salary Package (Net)</span><p className="font-semibold text-slate-800 dark:text-white">₹{newEmp.netSalary?.toLocaleString()}</p></div>
                  <div><span className="text-slate-400">Bank Account</span><p className="font-semibold text-slate-800 dark:text-white">{newEmp.bankAccount || "N/A"}</p></div>
                  <div><span className="text-slate-400">PAN</span><p className="font-semibold text-slate-800 dark:text-white">{newEmp.pan || "N/A"}</p></div>
                  <div><span className="text-slate-400">Father's / Guardian Name</span><p className="font-semibold text-slate-800 dark:text-white">{newEmp.fatherName || "Not Provided"}</p></div>
                  <div><span className="text-slate-400">Permanent Address</span><p className="font-semibold text-slate-800 dark:text-white truncate">{newEmp.permanentAddress || "Not Provided"}</p></div>
                  <div><span className="text-slate-400">Languages Spoken</span><p className="font-semibold text-slate-800 dark:text-white">{newEmp.languagesSpoken || "Not Provided"}</p></div>
                  <div><span className="text-slate-400">Primary Nominee</span><p className="font-semibold text-slate-800 dark:text-white">{newEmp.spouseName || "Not Provided"}</p></div>
                  <div><span className="text-slate-400">Leave Quotas (CL/SL/EL)</span><p className="font-semibold text-emerald-600 font-bold">{newEmp.casualLeave || 12} / {newEmp.sickLeave || 12} / {newEmp.earnedLeave || 15} Days</p></div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex justify-between border-t pt-4">
            <button 
              disabled={stepperStep === 1}
              onClick={() => setStepperStep(prev => prev - 1)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-50"
            >
              Previous Step
            </button>
            {stepperStep < 5 ? (
              <button 
                onClick={() => setStepperStep(prev => prev + 1)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:scale-105 transition-all"
              >
                Next Step
              </button>
            ) : (
              <button 
                onClick={handleCreateEmployee}
                disabled={!newEmp.name || !newEmp.role}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-semibold hover:scale-105 transition-all disabled:opacity-50"
              >
                Confirm & Onboard Employee
              </button>
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 4. ORGANIZATION CHART                   */}
      {/* ======================================= */}
      {activeSubModule === 'orgchart' && (
        <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in text-xs">
          
          {/* Top Title Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Organization Chart
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">
                  Symbosys Technologies Pvt. Ltd. Corporate Reporting Structure
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom & Reset Controls */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setOrgChartScale(prev => Math.max(0.4, Number((prev - 0.15).toFixed(2))))}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1 px-1">
                  <input
                    type="range"
                    min="0.4"
                    max="2.2"
                    step="0.05"
                    value={orgChartScale}
                    onChange={(e) => setOrgChartScale(parseFloat(e.target.value))}
                    className="w-20 sm:w-28 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 w-10 text-right">
                    {Math.round(orgChartScale * 100)}%
                  </span>
                </div>

                <button
                  onClick={() => setOrgChartScale(prev => Math.min(2.2, Number((prev + 0.15).toFixed(2))))}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                <button
                  onClick={() => {
                    setOrgChartScale(1);
                    setOrgChartPosition({ x: 0, y: 0 });
                  }}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 dark:border-slate-800 ml-1"
                  title="Reset View"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Pan Canvas */}
          <div
            className="relative w-full h-[680px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-inner"
            onMouseDown={(e) => {
              setIsDraggingOrgChart(true);
              setDragStartOrgChart({ x: e.clientX - orgChartPosition.x, y: e.clientY - orgChartPosition.y });
            }}
            onMouseMove={(e) => {
              if (!isDraggingOrgChart) return;
              setOrgChartPosition({
                x: e.clientX - dragStartOrgChart.x,
                y: e.clientY - dragStartOrgChart.y
              });
            }}
            onMouseUp={() => setIsDraggingOrgChart(false)}
            onMouseLeave={() => setIsDraggingOrgChart(false)}
            onWheel={(e) => {
              e.preventDefault();
              const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
              setOrgChartScale(prev => Math.min(2.2, Math.max(0.4, Number((prev + zoomFactor).toFixed(2)))));
            }}
          >
            {/* Helper Floating Tooltip */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 shadow-sm font-semibold">
              <Move className="h-4 w-4 text-indigo-600" />
              <span>360° Interactive Canvas — Drag to Pan | Scroll / Slider to Zoom</span>
            </div>

            {/* Transform Canvas Wrapper */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
              style={{
                transform: `translate(${orgChartPosition.x}px, ${orgChartPosition.y}px) scale(${orgChartScale})`,
              }}
            >
              <div className="flex flex-col items-center py-10 px-12 min-w-max">

                {/* LEVEL 0: TOP MANAGEMENT ROOT NODE */}
                <div className="flex flex-col items-center relative">
                  {(() => {
                    const ceo = employees.find(e => 
                      e.role?.toLowerCase().includes('ceo') || 
                      e.role?.toLowerCase().includes('managing director') ||
                      e.role?.toLowerCase().includes('chief executive')
                    ) || { name: 'Rajesh Kumar', role: 'Managing Director' };

                    return (
                      <div className="w-80 bg-purple-50/90 dark:bg-purple-950/40 border-2 border-purple-200 dark:border-purple-800/80 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all relative">
                        <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md font-bold text-lg">
                          <User className="w-6 h-6" />
                        </div>
                        <h3 className="font-extrabold text-purple-700 dark:text-purple-300 text-sm tracking-tight">
                          Symbosys Technologies Pvt. Ltd.
                        </h3>
                        <p className="text-[11px] text-purple-600/80 dark:text-purple-400 font-semibold mt-0.5">
                          {ceo.role || 'Chief Executive Officer'}
                        </p>
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                          {ceo.name || 'Vikram Malhotra'}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Vertical Trunk Line down from Root */}
                  <div className="h-10 w-0.5 bg-slate-400 dark:bg-slate-600"></div>
                </div>

                {/* LEVEL 1 & 2: DEPARTMENTS FLOW (DYNAMIC MAP ACCORDING TO DEPARTMENTS) */}
                <div className="relative pt-4">
                  
                  {/* Department Color & Icon Theme Mapping */}
                  {(() => {
                    const deptThemes: Record<string, { bg: string; border: string; text: string; iconBg: string; hoverBorder: string; ring: string; icon: any }> = {
                      'design': { bg: 'bg-purple-50/70 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800/60', text: 'text-purple-700 dark:text-purple-400', iconBg: 'bg-purple-600', hoverBorder: 'hover:border-purple-400', ring: 'ring-purple-100', icon: Building2 },
                      'finance department': { bg: 'bg-emerald-50/70 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-600', hoverBorder: 'hover:border-emerald-400', ring: 'ring-emerald-100', icon: Briefcase },
                      'finance': { bg: 'bg-emerald-50/70 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-600', hoverBorder: 'hover:border-emerald-400', ring: 'ring-emerald-100', icon: Briefcase },
                      'it role': { bg: 'bg-amber-50/70 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-500', hoverBorder: 'hover:border-amber-400', ring: 'ring-amber-100', icon: Code },
                      'it': { bg: 'bg-amber-50/70 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-500', hoverBorder: 'hover:border-amber-400', ring: 'ring-amber-100', icon: Code },
                      'sell department': { bg: 'bg-indigo-50/70 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800/60', text: 'text-indigo-700 dark:text-indigo-400', iconBg: 'bg-indigo-600', hoverBorder: 'hover:border-indigo-400', ring: 'ring-indigo-100', icon: Briefcase },
                      'human resources': { bg: 'bg-blue-50/70 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/60', text: 'text-blue-700 dark:text-blue-400', iconBg: 'bg-blue-600', hoverBorder: 'hover:border-blue-400', ring: 'ring-blue-100', icon: Users },
                      'marketing': { bg: 'bg-rose-50/70 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800/60', text: 'text-rose-700 dark:text-rose-400', iconBg: 'bg-rose-500', hoverBorder: 'hover:border-rose-400', ring: 'ring-rose-100', icon: Megaphone },
                      'customer support': { bg: 'bg-teal-50/70 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800/60', text: 'text-teal-700 dark:text-teal-400', iconBg: 'bg-teal-600', hoverBorder: 'hover:border-teal-400', ring: 'ring-teal-100', icon: Headphones }
                    };

                    const defaultTheme = { bg: 'bg-slate-50/70 dark:bg-slate-950/30', border: 'border-slate-200 dark:border-slate-800', text: 'text-slate-700 dark:text-slate-300', iconBg: 'bg-slate-700', hoverBorder: 'hover:border-primary', ring: 'ring-slate-100', icon: Building2 };

                    const activeDeptList = selectedOrgDeptFilter === 'All' 
                      ? departmentOptions 
                      : departmentOptions.filter(d => d.trim().toLowerCase() === selectedOrgDeptFilter.trim().toLowerCase());

                    return (
                      <>
                        {/* Top Horizontal Connecting Line */}
                        {activeDeptList.length > 1 && (
                          <div className="absolute top-0 left-[120px] right-[120px] h-0.5 bg-slate-400 dark:bg-slate-600"></div>
                        )}

                        <div className="flex gap-8 items-start">
                          {activeDeptList.map((deptName) => {
                            const normalizedDeptKey = deptName.trim().toLowerCase();
                            const theme = deptThemes[normalizedDeptKey] || defaultTheme;
                            const IconComp = theme.icon;

                            // Live department object from backend/state to find manager/head
                            const deptObj = dbDepartments.find(d => d.name.trim().toLowerCase() === normalizedDeptKey);

                            // Live employees matching department
                            const liveDeptMembers = employees.filter(e => {
                              const empDept = typeof e.department === 'string' ? e.department : ((e.department as any)?.name || '');
                              return empDept.trim().toLowerCase() === normalizedDeptKey && e.status !== 'Resigned' && e.status !== 'Terminated';
                            });

                            // Head employee identification (1. Dept manager if assigned, 2. Manager/Lead/Director role, 3. First member)
                            const deptHead = deptObj?.manager 
                              ? { name: deptObj.manager.name, role: `${deptName} Head` }
                              : liveDeptMembers.find(e => 
                                  e.role?.toLowerCase().includes('manager') || 
                                  e.role?.toLowerCase().includes('head') || 
                                  e.role?.toLowerCase().includes('director') ||
                                  e.role?.toLowerCase().includes('lead')
                                ) || (liveDeptMembers[0] ? { name: liveDeptMembers[0].name, role: liveDeptMembers[0].role } : { name: 'Position Open', role: 'Department Head' });

                            // Remaining team members
                            const teamMembers = liveDeptMembers.filter(e => e.name !== deptHead.name);

                            return (
                              <div key={deptName} className="flex flex-col items-center relative w-60">
                                {/* Top Arrow Connector */}
                                <div className="h-4 w-0.5 bg-slate-400 dark:bg-slate-600 -mt-4 mb-1"></div>
                                
                                {/* Dept Head Card */}
                                <div className={`w-full ${theme.bg} border-2 ${theme.border} rounded-2xl p-4 text-center shadow-md mb-4`}>
                                  <div className={`w-9 h-9 rounded-full ${theme.iconBg} text-white flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                                    <IconComp className="w-5 h-5" />
                                  </div>
                                  <h4 className={`font-extrabold ${theme.text} text-sm`}>{deptName}</h4>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Department Head</p>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{deptHead.name}</p>
                                </div>

                                {/* Tree Spine Line */}
                                {teamMembers.length > 0 && (
                                  <div className="absolute top-[165px] left-3 bottom-4 w-0.5 bg-slate-300 dark:bg-slate-700"></div>
                                )}

                                {/* Employee Nodes */}
                                <div className="flex flex-col gap-3.5 w-full pl-6">
                                  {teamMembers.length === 0 ? (
                                    <div className="p-3 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-slate-400 text-[10px]">
                                      No additional team members assigned
                                    </div>
                                  ) : (
                                    teamMembers.map((member) => (
                                      <div 
                                        key={member.id}
                                        onClick={() => { 
                                          setSelectedEmployeeId(member.id); 
                                          setActiveSubModule('profile'); 
                                        }}
                                        className={`bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 p-2.5 rounded-xl flex items-center gap-3 shadow-sm ${theme.hoverBorder} transition-all relative cursor-pointer`}
                                      >
                                        <div className="absolute -left-3.5 top-1/2 w-3.5 h-0.5 bg-slate-300 dark:bg-slate-700"></div>
                                        <img 
                                          src={member.avatar} 
                                          alt={member.name} 
                                          className={`w-9 h-9 rounded-full object-cover ring-2 ${theme.ring} shrink-0`} 
                                        />
                                        <div className="text-left overflow-hidden">
                                          <p className="font-bold text-slate-900 dark:text-white text-xs leading-none">{member.name}</p>
                                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{member.role}</p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}

                </div>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* ======================================= */}
      {/* 5. EXIT MANAGEMENT & RESIGNATION        */}
      {/* ======================================= */}
      {activeSubModule === 'exit' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Top Metric & Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Total Exits Logged</span>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {Object.keys(exitRegistryMap).length || employees.filter(e => e.status === 'Resigned' || e.status === 'Terminated').length || 1}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-2xs">
              <span className="text-amber-600 dark:text-amber-400 font-bold uppercase text-[10px]">Pending Clearances</span>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {employees.filter(e => e.clearanceStatus === 'Pending' || !e.clearanceStatus).length}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-2xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">F&F Approved / Settled</span>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {employees.filter(e => e.clearanceStatus === 'Approved').length || 1}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-2xs">
              <span className="text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px]">Active Notice Period</span>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                {employees.filter(e => e.status === 'Resigned').length || 1}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Trigger Exit & Clearance Checklist */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Initiate / Update Employee Exit</h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-600 dark:text-slate-300">STEP 1 OF 2</span>
              </div>
              
              {/* Select Employee */}
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Select Resigning Employee</label>
                <select 
                  value={selectedExitEmpId} 
                  onChange={(e) => {
                    const empId = e.target.value;
                    setSelectedExitEmpId(empId);
                    const record = exitRegistryMap[empId];
                    if (record) {
                      setExitResignationDate(record.resignationDate);
                      setExitLastWorkingDay(record.lastWorkingDay);
                      setResignationReason(record.reason);
                      setExitNoticeDays(record.noticeDays);
                      setExitLeaveEncashDays(record.leaveEncashDays);
                      setExitPenaltyDeduction(record.penaltyDeduction || 0);
                      setItClearance(record.itClearance);
                      setFinanceClearance(record.financeClearance);
                      setAdminClearance(record.adminClearance);
                      setHrClearance(record.hrClearance);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.id}) - {e.department}</option>
                  ))}
                </select>
              </div>

              {/* Resignation & LWD Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Resignation Date</label>
                  <input 
                    type="date"
                    value={exitResignationDate}
                    onChange={(e) => setExitResignationDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Last Working Day</label>
                  <input 
                    type="date"
                    value={exitLastWorkingDay}
                    onChange={(e) => setExitLastWorkingDay(e.target.value)}
                    className="w-full px-2.5 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>

              {/* Notice & Leave Parameters */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium text-[10px]">Notice Days</label>
                  <input 
                    type="number"
                    value={exitNoticeDays}
                    onChange={(e) => setExitNoticeDays(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium text-[10px]">Encash Days</label>
                  <input 
                    type="number"
                    value={exitLeaveEncashDays}
                    onChange={(e) => setExitLeaveEncashDays(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium text-[10px]">Penalty (₹)</label>
                  <input 
                    type="number"
                    value={exitPenaltyDeduction}
                    onChange={(e) => setExitPenaltyDeduction(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold text-rose-500"
                  />
                </div>
              </div>

              {/* Resignation Reason */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Reason for Exit / Resignation</label>
                <textarea 
                  value={resignationReason} 
                  onChange={(e) => setResignationReason(e.target.value)}
                  rows={2} 
                  className="w-full px-3 py-1.5 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                  placeholder="State employee exit rationale..."
                />
              </div>

              {/* Clearance Checklist with Progress */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Clearance Checklist</span>
                  {(() => {
                    const count = [itClearance, financeClearance, adminClearance, hrClearance].filter(Boolean).length;
                    return (
                      <span className="text-[10px] font-bold text-primary">
                        {count}/4 Completed ({count * 25}%)
                      </span>
                    );
                  })()}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${([itClearance, financeClearance, adminClearance, hrClearance].filter(Boolean).length) * 25}%` }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">IT Assets & Email Account Revocation</span>
                    <input type="checkbox" checked={itClearance} onChange={(e) => setItClearance(e.target.checked)} className="rounded text-primary focus:ring-0 h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Finance & Expense Claims Clearance</span>
                    <input type="checkbox" checked={financeClearance} onChange={(e) => setFinanceClearance(e.target.checked)} className="rounded text-primary focus:ring-0 h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Admin & Key / Access Card Handover</span>
                    <input type="checkbox" checked={adminClearance} onChange={(e) => setAdminClearance(e.target.checked)} className="rounded text-primary focus:ring-0 h-4 w-4" />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">HR Exit Interview & Relieving Signed</span>
                    <input type="checkbox" checked={hrClearance} onChange={(e) => setHrClearance(e.target.checked)} className="rounded text-primary focus:ring-0 h-4 w-4" />
                  </label>
                </div>
              </div>

              {/* Settlement Approval Action */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => {
                    if (!selectedExitEmpId) return;
                    saveExitMutation.mutate({
                      employeeId: selectedExitEmpId,
                      data: {
                        resignationDate: exitResignationDate,
                        lastWorkingDay: exitLastWorkingDay,
                        reason: resignationReason,
                        noticeDays: exitNoticeDays,
                        leaveEncashDays: exitLeaveEncashDays,
                        penaltyDeduction: exitPenaltyDeduction,
                        itClearance,
                        financeClearance,
                        adminClearance,
                        hrClearance,
                        status: (itClearance && financeClearance && adminClearance && hrClearance) ? 'CLEARANCE_APPROVED' : 'PENDING_CLEARANCE',
                      }
                    }, {
                      onSuccess: () => alert("Exit details saved to database successfully!"),
                      onError: (err) => alert("Failed to save exit details: " + err.message)
                    });
                  }}
                  className="py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all text-center"
                >
                  Save Exit Draft
                </button>
                <button 
                  onClick={() => {
                    setItClearance(true);
                    setFinanceClearance(true);
                    setAdminClearance(true);
                    setHrClearance(true);
                    handleProcessClearance();
                  }}
                  className="py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-md hover:scale-102 transition-all text-center"
                >
                  Approve & Finalize F&F
                </button>
              </div>
            </div>

            {/* Right Column: Full & Final Settlement Calculator Statement */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">Full & Final (F&F) Settlement Statement</h3>
                  <p className="text-[10px] text-slate-400">Live dynamic computation based on employee salary structure & parameters</p>
                </div>
                <button 
                  onClick={() => setShowFFLetterModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-primary hover:text-white transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Preview Settlement Statement
                </button>
              </div>

              {(() => {
                const emp = employees.find(e => e.id === selectedExitEmpId) || employees[0];
                if (!emp) return <p className="text-slate-400">Please select an employee.</p>;
                
                const details = calculateFullFinal(emp, {
                  noticeDays: exitNoticeDays,
                  leaveEncashDays: exitLeaveEncashDays,
                  penaltyDeduction: exitPenaltyDeduction
                });
                
                const record = exitRegistryMap[emp.id];
                const currentStatus = record?.status || (emp.clearanceStatus === 'Approved' ? 'Clearance Approved' : 'Pending Clearance');

                return (
                  <div className="space-y-5">
                    
                    {/* Employee Exit Profile Card */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 border rounded-xl">
                      <div>
                        <span className="text-slate-400 text-[10px]">Employee Name</span>
                        <p className="font-bold text-slate-800 dark:text-white text-xs">{emp.name} ({emp.id})</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Designation Role</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{emp.role}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Resignation / Exit Date</span>
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{exitResignationDate}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Clearance Status</span>
                        <p className={`font-bold text-xs ${
                          currentStatus === 'Clearance Approved' || currentStatus === 'Settled' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                        }`}>
                          {currentStatus}
                        </p>
                      </div>
                    </div>

                    {/* F&F Itemized Calculation Table */}
                    <div className="border rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-3">Salary Component / Settlement Item</th>
                            <th className="p-3 text-right">Addition (+) Amount</th>
                            <th className="p-3 text-right">Deduction (-) Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                          <tr>
                            <td className="p-3 font-medium">Notice Period Pay ({details.noticeDays} Days)</td>
                            <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{details.noticePay.toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-400">-</td>
                          </tr>
                          <tr>
                            <td className="p-3 font-medium">Accrued Leave Encashment ({details.leaveDays} Days)</td>
                            <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{details.leaveEncashment.toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-400">-</td>
                          </tr>
                          {details.gratuity > 0 ? (
                            <tr>
                              <td className="p-3 font-medium">Gratuity Settlement ({details.yearsWorked} Years Tenure Completed)</td>
                              <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">₹{details.gratuity.toLocaleString()}</td>
                              <td className="p-3 text-right text-slate-400">-</td>
                            </tr>
                          ) : (
                            <tr>
                              <td className="p-3 text-slate-400">Gratuity (Requires &gt; 5 years tenure)</td>
                              <td className="p-3 text-right text-slate-400">₹0</td>
                              <td className="p-3 text-right text-slate-400">-</td>
                            </tr>
                          )}
                          <tr>
                            <td className="p-3 font-medium">Provident Fund (PF) & Statutory Deductions</td>
                            <td className="p-3 text-right text-slate-400">-</td>
                            <td className="p-3 text-right text-rose-500 font-bold">₹{details.standardDeductions.toLocaleString()}</td>
                          </tr>
                          {details.penaltyDeduction > 0 && (
                            <tr>
                              <td className="p-3 font-medium text-rose-600 dark:text-rose-400">Unreturned Asset / Short Notice Penalty</td>
                              <td className="p-3 text-right text-slate-400">-</td>
                              <td className="p-3 text-right text-rose-600 font-bold">₹{details.penaltyDeduction.toLocaleString()}</td>
                            </tr>
                          )}
                          
                          {/* Total Breakdown Summary */}
                          <tr className="bg-slate-50 dark:bg-slate-950 font-bold border-t">
                            <td className="p-3 text-slate-800 dark:text-white">Gross Additions vs Deductions</td>
                            <td className="p-3 text-right text-emerald-600">₹{details.totalEarnings.toLocaleString()}</td>
                            <td className="p-3 text-right text-rose-500">₹{details.totalDeductions.toLocaleString()}</td>
                          </tr>
                          <tr className="bg-primary/10 dark:bg-primary/20 font-extrabold border-t-2 border-primary text-slate-900 dark:text-white">
                            <td className="p-3.5 text-sm text-primary">Net Full & Final (F&F) Payable Settlement</td>
                            <td className="p-3.5 text-right text-primary text-base" colSpan={2}>
                              ₹{details.netPayable.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Resignation Note & Verification Footer */}
                    <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-500 space-y-1">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Resignation Reason Note:</p>
                      <p className="italic">"{resignationReason}"</p>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>

          {/* F&F Settlement Statement Modal */}
          {showFFLetterModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Official F&F Settlement Statement & Relieving Letter</h3>
                    <p className="text-[10px] text-slate-400">Symbosys HR Management System - Final Clearance Record</p>
                  </div>
                  <button onClick={() => setShowFFLetterModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                </div>

                {(() => {
                  const emp = employees.find(e => e.id === selectedExitEmpId) || employees[0];
                  const details = calculateFullFinal(emp, {
                    noticeDays: exitNoticeDays,
                    leaveEncashDays: exitLeaveEncashDays,
                    penaltyDeduction: exitPenaltyDeduction
                  });

                  return (
                    <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-950/50">
                      <div className="flex justify-between border-b pb-3 items-center">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">SYMBOSYS TECHNOLOGIES PRIVATE LIMITED</p>
                          <p className="text-[10px] text-slate-400">Corporate HR & Payroll Compliance Cell</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full">APPROVED & CLEARED</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <p><span className="font-semibold text-slate-400">Employee ID:</span> {emp.id}</p>
                        <p><span className="font-semibold text-slate-400">Employee Name:</span> {emp.name}</p>
                        <p><span className="font-semibold text-slate-400">Designation:</span> {emp.role}</p>
                        <p><span className="font-semibold text-slate-400">Department:</span> {emp.department}</p>
                        <p><span className="font-semibold text-slate-400">Resignation Date:</span> {exitResignationDate}</p>
                        <p><span className="font-semibold text-slate-400">Last Working Day:</span> {exitLastWorkingDay}</p>
                      </div>

                      <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900 mt-2">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b">
                            <tr>
                              <th className="p-2">Component</th>
                              <th className="p-2 text-right">Addition</th>
                              <th className="p-2 text-right">Deduction</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="p-2">Notice Pay ({details.noticeDays} Days)</td>
                              <td className="p-2 text-right text-emerald-600 font-bold">₹{details.noticePay.toLocaleString()}</td>
                              <td className="p-2 text-right">-</td>
                            </tr>
                            <tr>
                              <td className="p-2">Leave Encashment ({details.leaveDays} Days)</td>
                              <td className="p-2 text-right text-emerald-600 font-bold">₹{details.leaveEncashment.toLocaleString()}</td>
                              <td className="p-2 text-right">-</td>
                            </tr>
                            {details.gratuity > 0 && (
                              <tr>
                                <td className="p-2">Gratuity ({details.yearsWorked} Yrs Tenure)</td>
                                <td className="p-2 text-right text-emerald-600 font-bold">₹{details.gratuity.toLocaleString()}</td>
                                <td className="p-2 text-right">-</td>
                              </tr>
                            )}
                            <tr>
                              <td className="p-2">PF & Statutory Deductions</td>
                              <td className="p-2 text-right">-</td>
                              <td className="p-2 text-right text-rose-500 font-bold">₹{details.standardDeductions.toLocaleString()}</td>
                            </tr>
                            {details.penaltyDeduction > 0 && (
                              <tr>
                                <td className="p-2">Short Notice / Asset Penalty</td>
                                <td className="p-2 text-right">-</td>
                                <td className="p-2 text-right text-rose-500 font-bold">₹{details.penaltyDeduction.toLocaleString()}</td>
                              </tr>
                            )}
                            <tr className="bg-slate-100 dark:bg-slate-800 font-extrabold border-t text-slate-900 dark:text-white">
                              <td className="p-2.5">Net Payable Amount</td>
                              <td className="p-2.5 text-right text-primary text-sm" colSpan={2}>₹{details.netPayable.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <p className="text-[10px] text-slate-400 italic pt-2">
                        This is a computer-generated Full & Final Settlement summary approved by HR Administration.
                      </p>

                      <div className="flex justify-end gap-3 pt-3 border-t">
                        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-bold hover:bg-slate-300">
                          Print Statement
                        </button>
                        <button onClick={() => setShowFFLetterModal(false)} className="px-4 py-2 bg-primary text-white rounded-xl font-bold">
                          Close Window
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================= */}
      {/* 5.5 RESIGNATION & EXITED EMPLOYEES ARCHIVE */}
      {/* ======================================= */}
      {activeSubModule === 'resignation' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 shadow-2xs">
              <span className="text-rose-600 dark:text-rose-400 font-bold uppercase text-[10px]">Total Resigned Employees</span>
              <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                {resignedEmployees.length}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-2xs">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">Clearance Approved & Settled</span>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {resignedEmployees.filter(e => e.clearanceStatus === 'Approved').length}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-2xs">
              <span className="text-amber-600 dark:text-amber-400 font-bold uppercase text-[10px]">Pending Clearance Exits</span>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {resignedEmployees.filter(e => e.clearanceStatus !== 'Approved').length}
              </p>
            </div>
          </div>

          {/* Search & Control Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search resigned employee by name, role or ID..." 
                value={resignationSearchTerm}
                onChange={(e) => setResignationSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 dark:text-slate-300"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg px-2 bg-slate-50 dark:bg-slate-950">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select 
                  value={resignationDeptFilter} 
                  onChange={(e) => setResignationDeptFilter(e.target.value)}
                  className="py-1.5 text-xs bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
                >
                  <option value="All">All Departments</option>
                  {departmentOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Resigned Employees Archive Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Resigned Employee Records Archive</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Exclusively displays exited personnel. Hidden from active directory.</p>
              </div>
              <span className="text-[11px] bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 font-bold px-2.5 py-1 rounded-full">
                {filteredResignedEmployees.length} Exited Records
              </span>
            </div>

            {filteredResignedEmployees.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <User className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">No Resigned Employees Found</p>
                <p className="text-[11px]">Employees who resigne or undergo exit management will appear exclusively in this section.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Resigned Employee</th>
                      <th className="p-3.5">Department & Role</th>
                      <th className="p-3.5">Joining Date</th>
                      <th className="p-3.5">Exit / Resignation Date</th>
                      <th className="p-3.5">Clearance Status</th>
                      <th className="p-3.5 text-right">Net F&F Payable</th>
                      <th className="p-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredResignedEmployees.map(emp => {
                      const exitRec = exitRegistryMap[emp.id];
                      const ffCalc = calculateFullFinal(emp);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img src={emp.avatar} alt={emp.name} className="w-9 h-9 rounded-full object-cover border" />
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white text-xs">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{emp.id} • {emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{emp.role}</p>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium text-slate-600 dark:text-slate-400">
                              {emp.department}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-400 font-medium">
                            {emp.joiningDate || 'N/A'}
                          </td>
                          <td className="p-3.5 font-semibold text-rose-600 dark:text-rose-400">
                            {exitRec?.resignationDate || emp.exitDate || '2026-07-01'}
                          </td>
                          <td className="p-3.5">
                            {emp.clearanceStatus === 'Approved' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                                <ShieldCheck className="h-3 w-3" /> F&F Approved
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 px-2.5 py-1 rounded-full font-bold">
                                Pending Clearance
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                            ₹{ffCalc.netPayable.toLocaleString()}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => setSelectedResignedEmpId(emp.id)}
                              className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg font-bold transition-all text-[11px]"
                            >
                              View Full Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Full Resigned Employee Details Modal */}
          {selectedResignedEmpId && (() => {
            const emp = resignedEmployees.find(e => e.id === selectedResignedEmpId);
            if (!emp) return null;
            const exitRec = exitRegistryMap[emp.id];
            const ffCalc = calculateFullFinal(emp);
            const famList = familyMembersMap[emp.id] || [];

            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
                  
                  {/* Modal Header */}
                  <div className="p-5 border-b bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">{emp.name}</h3>
                          <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full uppercase">
                            Resigned Employee
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">{emp.id} • {emp.role} ({emp.department})</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedResignedEmpId(null)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
                    >
                      Close Details
                    </button>
                  </div>

                  {/* Modal Body Content */}
                  <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    
                    {/* Section 1: Exit Profile & Basic Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 dark:bg-slate-950/50 p-4 rounded-xl border">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Contact Information</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1">{emp.email}</p>
                        <p className="text-slate-500 text-xs">{emp.phone || '+91 98765 43210'}</p>
                        <p className="text-slate-500 text-xs mt-0.5">Location: {emp.location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Employment Dates</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1">Joining: {emp.joiningDate || '2024-01-15'}</p>
                        <p className="font-bold text-rose-600 dark:text-rose-400 text-xs">Resignation: {exitRec?.resignationDate || emp.exitDate || '2026-07-01'}</p>
                        <p className="text-slate-500 text-xs">LWD: {exitRec?.lastWorkingDay || '2026-07-31'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Clearance & F&F Status</p>
                        <div className="mt-1">
                          {emp.clearanceStatus === 'Approved' ? (
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Approved & Settled
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2.5 py-1 rounded-full text-[10px]">
                              Pending Clearance Checklist
                            </span>
                          )}
                        </div>
                        <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-2">
                          Net F&F Pay: ₹{ffCalc.netPayable.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Section 2: Resignation Parameters & Clearance Checkpoints */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3 p-4 border rounded-xl bg-white dark:bg-slate-900">
                        <h4 className="font-bold text-slate-800 dark:text-white text-xs border-b pb-2">Resignation Parameters & Rationale</h4>
                        <div className="space-y-2 text-xs">
                          <p><span className="font-semibold text-slate-400">Reason for Exit:</span> {exitRec?.reason || 'Career Advancement & Personal Rationale'}</p>
                          <p><span className="font-semibold text-slate-400">Notice Days:</span> {exitRec?.noticeDays || 30} Days</p>
                          <p><span className="font-semibold text-slate-400">Leave Encashment:</span> {exitRec?.leaveEncashDays || 12} Days</p>
                          <p><span className="font-semibold text-slate-400">Penalty Deduction:</span> ₹{(exitRec?.penaltyDeduction || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-3 p-4 border rounded-xl bg-white dark:bg-slate-900">
                        <h4 className="font-bold text-slate-800 dark:text-white text-xs border-b pb-2">Departmental Clearance Checkpoints</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span>IT Assets & Email Revocation:</span>
                            <span className={exitRec?.itClearance ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>
                              {exitRec?.itClearance ? "✓ Completed" : "Pending"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Finance Expense & No Dues:</span>
                            <span className={exitRec?.financeClearance ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>
                              {exitRec?.financeClearance ? "✓ Completed" : "Pending"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Admin Key & Access Return:</span>
                            <span className={exitRec?.adminClearance ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>
                              {exitRec?.adminClearance ? "✓ Completed" : "Pending"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>HR Exit Interview & Clearance:</span>
                            <span className={exitRec?.hrClearance ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>
                              {exitRec?.hrClearance ? "✓ Completed" : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Full & Final Settlement Calculation */}
                    <div className="space-y-3 p-4 border rounded-xl bg-white dark:bg-slate-900">
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs border-b pb-2">Full & Final (F&F) Settlement Computation</h4>
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-950 font-bold text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th className="p-2">Component</th>
                            <th className="p-2 text-right">Additions</th>
                            <th className="p-2 text-right">Deductions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700 dark:text-slate-300">
                          <tr>
                            <td className="p-2 font-medium">Notice Period Pay ({ffCalc.noticeDays} Days)</td>
                            <td className="p-2 text-right text-emerald-600 font-bold">₹{ffCalc.noticePay.toLocaleString()}</td>
                            <td className="p-2 text-right text-slate-400">-</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-medium">Leave Encashment ({ffCalc.leaveDays} Days)</td>
                            <td className="p-2 text-right text-emerald-600 font-bold">₹{ffCalc.leaveEncashment.toLocaleString()}</td>
                            <td className="p-2 text-right text-slate-400">-</td>
                          </tr>
                          {ffCalc.gratuity > 0 && (
                            <tr>
                              <td className="p-2 font-medium">Gratuity ({ffCalc.yearsWorked} Yrs Service)</td>
                              <td className="p-2 text-right text-emerald-600 font-bold">₹{ffCalc.gratuity.toLocaleString()}</td>
                              <td className="p-2 text-right text-slate-400">-</td>
                            </tr>
                          )}
                          <tr>
                            <td className="p-2 font-medium">PF & Statutory Deductions</td>
                            <td className="p-2 text-right text-slate-400">-</td>
                            <td className="p-2 text-right text-rose-500 font-bold">₹{ffCalc.standardDeductions.toLocaleString()}</td>
                          </tr>
                          {ffCalc.penaltyDeduction > 0 && (
                            <tr>
                              <td className="p-2 font-medium text-rose-600">Asset Penalty / Short Notice</td>
                              <td className="p-2 text-right text-slate-400">-</td>
                              <td className="p-2 text-right text-rose-600 font-bold">₹{ffCalc.penaltyDeduction.toLocaleString()}</td>
                            </tr>
                          )}
                          <tr className="bg-primary/10 font-extrabold border-t text-slate-900 dark:text-white">
                            <td className="p-3 text-primary text-xs">Total Net Settlement Amount</td>
                            <td className="p-3 text-right text-primary text-sm font-bold" colSpan={2}>
                              ₹{ffCalc.netPayable.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Section 4: Family & Dependents Info */}
                    {famList.length > 0 && (
                      <div className="space-y-3 p-4 border rounded-xl bg-white dark:bg-slate-900">
                        <h4 className="font-bold text-slate-800 dark:text-white text-xs border-b pb-2">Family & Dependents Record</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {famList.map(fam => (
                            <div key={fam.id} className="p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{fam.name} ({fam.relation})</p>
                                <p className="text-[10px] text-slate-400">DOB: {fam.dob || 'N/A'} • Blood Group: {fam.bloodGroup || 'O+'}</p>
                              </div>
                              {fam.isNominee && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold px-2 py-0.5 rounded">Nominee</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Modal Footer Actions */}
                  <div className="p-4 border-t bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                    <button 
                      onClick={() => window.print()} 
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-white rounded-xl font-bold text-xs"
                    >
                      Print Resignation & F&F Summary
                    </button>
                    <button 
                      onClick={() => setSelectedResignedEmpId(null)} 
                      className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90"
                    >
                      Done
                    </button>
                  </div>

                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ======================================= */}
      {/* 6. BULK ACTIONS & MAILING               */}
      {/* ======================================= */}
      {activeSubModule === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          {/* Left Column: Upload and File import */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Bulk Excel/CSV Import</h3>
            <input 
              type="file" 
              ref={bulkFileInputRef} 
              className="hidden" 
              accept=".csv,.xlsx,.xls"
              onChange={handleBulkFileChange}
            />
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); alert("File dropped! Parsing data structure..."); }}
              onClick={() => bulkFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-950/40'
              }`}
            >
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Drag & drop your CSV template</p>
              <p className="text-[10px] text-slate-400 mt-1">or click to browse local files</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => alert("Downloading Employee Onboarding Template (CSV)...")}
                className="w-full py-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-lg font-bold flex items-center justify-center gap-1.5"
              >
                <FileDown className="h-4 w-4" />
                Template
              </button>
              <button 
                onClick={() => {
                  alert("Syncing 12 records from Excel file...");
                  addAuditLog("Bulk Import Sync", "Employee Center", "Synchronized 12 employee records via excel file upload");
                }}
                className="w-full py-1.5 bg-primary text-white rounded-lg font-bold shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                Process Upload
              </button>
            </div>
          </div>

          {/* Right Column: Bulk Email Communication */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Dispatch Bulk Email & Alert</h3>
            
            <form onSubmit={handleSendBulkMail} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold block mb-1">Select Recipients ({selectedBulkEmpIds.length} chosen)</span>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5 bg-slate-50 dark:bg-slate-950">
                    {employees.map(e => (
                      <label key={e.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={selectedBulkEmpIds.includes(e.id)} 
                          onChange={() => handleToggleSelectBulk(e.id)}
                          className="rounded text-primary focus:ring-0" 
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{e.name} ({e.department})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Subject Title</label>
                    <input 
                      type="text" 
                      value={bulkMailSubject} 
                      onChange={(e) => setBulkMailSubject(e.target.value)}
                      placeholder="e.g. Q2 Performance Review Kickoff" 
                      required 
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold">Email Content Body</label>
                    <textarea 
                      value={bulkMailBody} 
                      onChange={(e) => setBulkMailBody(e.target.value)}
                      placeholder="Write your corporate announcements or reminders here..." 
                      rows={3} 
                      required 
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t pt-4">
                <button 
                  type="submit" 
                  disabled={selectedBulkEmpIds.length === 0}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-1.5 hover:scale-105 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  <span>Send Emails & Notifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 5. ROLE & PERMISSION MANAGEMENT         */}
      {/* ======================================= */}
      {activeSubModule === 'roles' && (
        <RoleManagementPanel employees={employees} />
      )}

      {/* ======================================= */}
      {/* 6. DEPARTMENT MANAGEMENT                */}
      {/* ======================================= */}
      {activeSubModule === 'departments' && (
        <DepartmentManagementPanel employees={employees} />
      )}

      {/* ======================================= */}
      {/* 7. ID CARD GENERATOR                    */}
      {/* ======================================= */}
      {activeSubModule === 'idcard' && (
        <IdCardGenerator />
      )}

      {/* ======================================= */}
      {/* 4. PROMOTION & TRANSFER ROLE UPGRADE MODAL */}
      {/* ======================================= */}
      {showPromoteModal && activeEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl animate-fade-in text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">Role Upgrade & Employee Transfer</h3>
                  <p className="text-[11px] text-slate-400">Promote or transfer employee <span className="font-semibold text-slate-700 dark:text-slate-200">{activeEmployee.name}</span> ({activeEmployee.id})</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPromoteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Current Summary Banner */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Current Role</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{activeEmployee.role}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 border-l pl-3 dark:border-slate-800">
                <Building2 className="h-4 w-4 text-blue-500" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Current Department</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{activeEmployee.department}</span>
                </div>
              </div>
            </div>

            {/* Promotion & Transfer Form */}
            <form onSubmit={handleApplyPromotionSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Upgrade Job Role */}
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">New Job Designation Role</label>
                  <input 
                    type="text" 
                    required
                    value={promoNewRole}
                    onChange={(e) => setPromoNewRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                  />
                </div>

                {/* Transfer Department */}
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Target Department</label>
                  <select 
                    value={promoNewDept}
                    onChange={(e) => setPromoNewDept(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* Effective Date */}
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Effective Date</label>
                  <input 
                    type="date" 
                    required
                    value={promoEffectiveDate}
                    onChange={(e) => setPromoEffectiveDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                  />
                </div>

                {/* Revised Basic Salary */}
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Revised Basic Salary (₹)</label>
                  <input 
                    type="number" 
                    value={promoNewBasic}
                    onChange={(e) => setPromoNewBasic(e.target.value)}
                    placeholder="e.g. 55000"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* Justification / Note */}
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Promotion Approval Reason / Remarks</label>
                <textarea 
                  value={promoReason}
                  onChange={(e) => setPromoReason(e.target.value)}
                  placeholder="Enter promotion rationale, board approval code or revision notes..."
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t dark:border-slate-800 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Confirm Role Upgrade</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Admin Add Performance Rating Modal */}
      {showAddRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Give Performance Rating</h3>
                  <p className="text-[11px] text-slate-400">Super Admin Panel • {activeEmployee?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddRatingModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRatingSubmit} className="space-y-3.5 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Evaluation Period / Month</label>
                <select
                  value={ratingMonth}
                  onChange={(e) => setRatingMonth(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white"
                >
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="June 2026">June 2026</option>
                  <option value="May 2026">May 2026</option>
                  <option value="April 2026">April 2026</option>
                  <option value="March 2026">March 2026</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-500 font-semibold">Overall Rating Score (1.0 - 5.0)</label>
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{ratingScore} / 5.0</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={ratingScore}
                  onChange={(e) => setRatingScore(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Performance Rating Status</label>
                <select
                  value={ratingStatus}
                  onChange={(e) => setRatingStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white"
                >
                  <option value="OUTSTANDING">OUTSTANDING (4.8 - 5.0)</option>
                  <option value="EXCEEDS EXPECTATIONS">EXCEEDS EXPECTATIONS (4.2 - 4.7)</option>
                  <option value="MEETS EXPECTATIONS">MEETS EXPECTATIONS (3.5 - 4.1)</option>
                  <option value="NEEDS IMPROVEMENT">NEEDS IMPROVEMENT (Below 3.5)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px]">Task %</label>
                  <input
                    type="text"
                    value={ratingTasks}
                    onChange={(e) => setRatingTasks(e.target.value)}
                    placeholder="95%"
                    className="w-full px-2 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px]">Quality</label>
                  <input
                    type="text"
                    value={ratingQuality}
                    onChange={(e) => setRatingQuality(e.target.value)}
                    placeholder="4.5/5"
                    className="w-full px-2 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px]">Teamwork</label>
                  <input
                    type="text"
                    value={ratingTeamwork}
                    onChange={(e) => setRatingTeamwork(e.target.value)}
                    placeholder="4.5/5"
                    className="w-full px-2 py-1.5 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold">Super Admin Feedback & Review Notes</label>
                <textarea
                  rows={3}
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  placeholder="Enter detailed review, goals achieved, and performance feedback..."
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRatingModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                >
                  Submit Rating
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RESET EMPLOYEE CREDENTIALS MODAL                        */}
      {/* ======================================================== */}
      {showResetCredModal && targetEmployeeForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">Reset Employee Login</h3>
                  <p className="text-[11px] text-slate-400">Set email or password for employee portal login</p>
                </div>
              </div>
              <button
                onClick={() => setShowResetCredModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target Employee Summary */}
            <div className="my-4 p-3 bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Employee</p>
                <p className="font-bold text-slate-800 dark:text-white mt-0.5">{targetEmployeeForReset.name}</p>
              </div>
              <span className="font-mono text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {targetEmployeeForReset.id}
              </span>
            </div>

            {/* Success State */}
            {resetCredResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-2">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Credentials Updated Successfully!
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 mb-3">
                    Share these new login credentials with {resetCredResult.employeeName}. They can now log into the Employee HRMS Portal.
                  </p>
                  <div className="space-y-2 bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Login Email</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-white select-all">{resetCredResult.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">New Password</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all">{resetCredResult.temporaryPassword}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleCopyCredentials}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors"
                  >
                    {copiedCred ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copiedCred ? "Copied to Clipboard!" : "Copy Credentials"}
                  </button>
                  <button
                    onClick={() => setShowResetCredModal(false)}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Input Form */
              <div className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-red-600 dark:text-red-300 text-xs">
                    {resetError}
                  </div>
                )}

                {/* Login Email Field */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Login Email Address
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={resetNewEmail}
                      onChange={(e) => setResetNewEmail(e.target.value)}
                      placeholder="employee@company.com"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      New Password
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateStrongPassword}
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Generate Strong
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showResetPassword ? "text" : "password"}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Leave blank to auto-generate"
                      className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: If password field is left empty, a secure password will be generated automatically.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowResetCredModal(false)}
                    className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteResetCredentials}
                    disabled={resetCredentialsMutation.isPending}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {resetCredentialsMutation.isPending ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Key className="h-3.5 w-3.5" />
                        Save & Reset Credentials
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
