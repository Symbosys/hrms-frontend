import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Download,
  Eye,
  FileText,
  Folder,
  Upload,
  Users,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useEmployees } from '../api/hook/useEmployee';
import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
  VaultDoc
} from '../api/hook/useDocuments';

export const Documents: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, showConfirm, showAlert } = useApp();

  // Active document preview modal state
  const [viewingDoc, setViewingDoc] = useState<VaultDoc | null>(null);

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

  // Active folder sidebar state
  const [activeFolder, setActiveFolder] = useState<'All' | 'Identity' | 'Contract' | 'Academic' | 'Tax'>('All');

  // Queries & Mutations
  const { data: docsRes, isLoading: docsLoading } = useDocuments(
    selectedEmpId ? { employeeId: selectedEmpId, category: activeFolder } : undefined
  );
  const docsList = docsRes?.data || [];

  // Query for ALL documents of this employee to check for expiring warnings
  const { data: allDocsRes } = useDocuments(
    selectedEmpId ? { employeeId: selectedEmpId, category: 'All' } : undefined
  );
  const allDocs = allDocsRes?.data || [];

  const uploadDocMut = useUploadDocument();
  const deleteDocMut = useDeleteDocument();

  // Upload Form State
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'Identity' | 'Contract' | 'Academic' | 'Tax'>('Identity');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    if (!docName.trim()) {
      setDocName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
      e.dataTransfer.clearData();
    }
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !selectedEmpId) return;

    showConfirm({
      title: "Confirm Document Upload",
      message: `Are you sure you want to upload "${docName}" under ${docCategory} folder for the selected employee?`,
      type: "confirm",
      confirmText: "Upload Now",
      onConfirm: () => {
        uploadDocMut.mutate({
          employeeId: selectedEmpId,
          name: docName,
          category: docCategory,
          expiresOn: expiryDate || null,
        }, {
          onSuccess: () => {
            addAuditLog("Uploaded Document", "Document Vault", `Uploaded new document: ${docName} for employee ID ${selectedEmpId}`);
            showAlert(`Document "${docName}" successfully uploaded to the vault!`, "Upload Successful", "success");
            setDocName('');
            setExpiryDate('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setActiveSubModule('vault');
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to upload document", "Upload Error", "danger");
          }
        });
      }
    });
  };

  const handleDeleteDoc = (id: string, name: string) => {
    showConfirm({
      title: "Delete Document",
      message: `Are you sure you want to permanently remove "${name}" from the secure vault?`,
      type: "danger",
      confirmText: "Delete Document",
      cancelText: "Cancel",
      onConfirm: () => {
        deleteDocMut.mutate(id, {
          onSuccess: () => {
            addAuditLog("Deleted Document", "Document Vault", `Deleted document ${name} from vault`);
            showAlert(`Document "${name}" deleted successfully.`, "Deleted", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to delete document", "Error", "danger");
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
          onClick={() => setActiveSubModule('vault')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'vault' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Secure Document Vault
        </button>
        <button 
          onClick={() => setActiveSubModule('upload')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'upload' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Upload New Document
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
            <p className="text-slate-450 mt-0.5">Switch profiles to display or upload documents associated with individual vault lockers.</p>
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
      {/* 1. SECURE DOCUMENT VAULT                 */}
      {/* ======================================= */}
      {activeSubModule === 'vault' && (
        <div className="space-y-6 animate-fade-in text-xs">
          
          {/* Expiration alert banner */}
          {allDocs.some(d => d.status === 'Expiring Soon') && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300">Document Expiration Action Required</p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">One or more identity cards (e.g. Passport scan) are set to expire within 30 days. Please upload updated versions.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar folders */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2 lg:col-span-1 h-fit">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-2 px-2">Folders / Vault Areas</span>
              {(['All', 'Identity', 'Contract', 'Academic', 'Tax'] as const).map((folder) => (
                <button
                  key={folder}
                  onClick={() => setActiveFolder(folder)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-semibold transition-colors ${
                    activeFolder === folder 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {folder === 'All' ? 'All Documents' : folder}
                  </span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full">
                    {folder === 'All' ? allDocs.length : allDocs.filter(d => d.category === folder).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Document list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Document Directory List</h3>
              
              {docsLoading ? (
                <div className="py-8 text-center text-slate-400 font-medium">Loading vault logs...</div>
              ) : docsList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-medium">No documents uploaded under {activeFolder} category.</div>
              ) : (
                <div className="space-y-3">
                  {docsList.map((d) => (
                    <div key={d.id} className="p-3.5 border border-slate-150 dark:border-slate-850 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary shrink-0" />
                        <div>
                          <p className="font-bold text-slate-850 dark:text-white">{d.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Uploaded: {d.uploadedOn} {d.expiresOn ? `• Expiry: ${d.expiresOn}` : ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          d.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                          d.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}>
                          {d.status}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setViewingDoc(d)}
                            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg hover:scale-105 transition-all text-slate-500 hover:text-primary"
                            title="View / Preview Document"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button 
                            onClick={() => showAlert(`Downloading "${d.name}" file locker decryption stream...`, "File Download Started", "info")}
                            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg hover:scale-105 transition-all"
                            title="Download Document"
                          >
                            <Download className="h-4 w-4 text-slate-500" />
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteDoc(d.id, d.name)}
                            disabled={deleteDocMut.isPending}
                            className="p-1.5 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                            title="Delete Document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* 2. UPLOAD NEW DOCUMENT                  */}
      {/* ======================================= */}
      {activeSubModule === 'upload' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-xs max-w-xl">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Upload File to Vault</h3>
            <p className="text-slate-400 mt-1">Files uploaded here are encrypted and stored in the employee's secure profile folder.</p>
          </div>

          <form onSubmit={handleUploadDoc} className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Document Label Name</label>
              <input 
                type="text" 
                value={docName} 
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Master Degree Certificate.pdf" 
                required 
                className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-205"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Folder Vault Category</label>
                <select 
                  value={docCategory} 
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Identity">Identity</option>
                  <option value="Contract">Contract</option>
                  <option value="Academic">Academic</option>
                  <option value="Tax">Tax</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Expiration Date (Optional)</label>
                <input 
                  type="date" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-slate-400 font-medium">Drop File Upload</label>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/10 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-primary/50'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-emerald-500" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for upload
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs text-rose-500 underline font-semibold mt-1 hover:text-rose-600"
                    >
                      Remove / Change File
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-450 mx-auto mb-2" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Drag & drop files or click to browse
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Supports PDF, PNG, JPG, DOCX (Max 10MB)
                    </span>
                  </>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={uploadDocMut.isPending}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
            >
              {uploadDocMut.isPending ? "Uploading..." : "Upload Secure File"}
            </button>
          </form>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">{viewingDoc.name}</h3>
                  <p className="text-xs text-slate-400">Category: {viewingDoc.category} Vault • Uploaded: {viewingDoc.uploadedOn}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Document Preview View Box */}
            <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
              <FileText className="h-16 w-16 text-primary/80" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{viewingDoc.name}</p>
                <p className="text-xs text-slate-400 mt-1">Encrypted Vault Locker Document Preview</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-medium">
                  Category: {viewingDoc.category}
                </span>
                <span className={`px-2.5 py-1 rounded-md font-bold uppercase text-[10px] ${
                  viewingDoc.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' :
                  viewingDoc.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                  'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                }`}>
                  {viewingDoc.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Close Viewer
              </button>
              <button
                onClick={() => {
                  showAlert(`Downloading "${viewingDoc.name}" file locker decryption stream...`, "File Download Started", "info");
                  setViewingDoc(null);
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs hover:scale-105 transition-all flex items-center gap-2 shadow-md shadow-primary/10"
              >
                <Download className="h-4 w-4" />
                Download File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
