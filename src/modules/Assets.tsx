import React, { useState, useEffect } from 'react';
import {
  Download,
  Key,
  Monitor,
  Smartphone,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useEmployees } from '../api/hook/useEmployee';
import {
  useAssets,
  useCreateAsset,
  useAssignAsset,
} from '../api/hook/useAssets';

export const Assets: React.FC = () => {
  const { activeSubModule, setActiveSubModule, addAuditLog, showConfirm, showAlert } = useApp();

  // Queries & Mutations
  const { data: assetsRes, isLoading: assetsLoading } = useAssets();
  const assetsList = assetsRes?.data || [];

  const { data: employeesRes } = useEmployees();
  const employeesList = employeesRes?.data || [];

  const createAssetMut = useCreateAsset();
  const assignAssetMut = useAssignAsset();

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Automatically select first asset
  useEffect(() => {
    if (assetsList.length > 0 && !selectedAssetId) {
      setSelectedAssetId(assetsList[0].id);
    }
  }, [assetsList, selectedAssetId]);

  const selectedAsset = assetsList.find(a => a.id === selectedAssetId);

  // New Asset Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'Hardware' | 'Mobile' | 'Keycard' | 'Other'>('Hardware');
  const [newSerial, setNewSerial] = useState('');

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    showConfirm({
      title: "Add New Asset",
      message: `Register "${newName}" (${newCategory}) in stock inventory?`,
      type: "confirm",
      confirmText: "Register Asset",
      onConfirm: () => {
        createAssetMut.mutate({
          name: newName,
          category: newCategory,
          serial: newSerial || `SR-${Math.floor(Math.random() * 1000000)}`,
        }, {
          onSuccess: () => {
            addAuditLog("Added Asset", "Asset Tracking", `Registered new asset in stock: ${newName}`);
            showAlert(`Asset "${newName}" added to inventory stock list!`, "Asset Registered", "success");
            setNewName('');
            setNewSerial('');
            setActiveSubModule('register');
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to add asset", "Error", "danger");
          }
        });
      }
    });
  };

  const handleReassign = (employeeId: string | null) => {
    if (!selectedAsset) return;

    const empName = employeesList.find(e => e.id === employeeId)?.name || 'Unassigned';
    showConfirm({
      title: "Reassign Asset",
      message: `Assign asset ${selectedAsset.name} to ${empName}?`,
      type: "confirm",
      confirmText: "Assign Asset",
      onConfirm: () => {
        assignAssetMut.mutate({ id: selectedAsset.id, employeeId }, {
          onSuccess: () => {
            addAuditLog("Asset Assigned", "Asset Tracking", `Assigned asset ${selectedAsset.name} to ${empName}`);
            showAlert(`Asset assignment updated successfully.`, "Asset Assigned", "success");
          },
          onError: (err: any) => {
            showAlert(err?.response?.data?.message || err.message || "Failed to assign asset", "Error", "danger");
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
          onClick={() => setActiveSubModule('register')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'register' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Asset Register & Barcode
        </button>
        <button 
          onClick={() => setActiveSubModule('add-asset')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeSubModule === 'add-asset' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Add Asset Item
        </button>
      </div>

      {/* ======================================= */}
      {/* 1. ASSET REGISTER & BARCODE PREVIEW     */}
      {/* ======================================= */}
      {activeSubModule === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
          
          {/* Asset List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Hardware Stock Ledger</h3>
            
            {assetsLoading ? (
              <div className="py-8 text-center text-slate-400 font-medium">Loading hardware register...</div>
            ) : assetsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium">No assets registered yet.</div>
            ) : (
              <div className="space-y-3">
                {assetsList.map((ast) => (
                  <div 
                    key={ast.id} 
                    onClick={() => setSelectedAssetId(ast.id)}
                    className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      selectedAssetId === ast.id 
                        ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                        : 'border-slate-150 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg">
                        {ast.category === 'Hardware' && <Monitor className="h-4 w-4 text-slate-500" />}
                        {ast.category === 'Mobile' && <Smartphone className="h-4 w-4 text-slate-500" />}
                        {ast.category === 'Keycard' && <Key className="h-4 w-4 text-slate-500" />}
                        {ast.category === 'Other' && <Monitor className="h-4 w-4 text-slate-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-850 dark:text-white">{ast.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Serial: {ast.serial} • Tag ID: {ast.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        ast.status === 'Assigned' ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {ast.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barcode & QR Details card */}
          <div className="space-y-6 lg:col-span-1">
            {selectedAsset ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 h-fit">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Asset Label Tag</h3>
                  <p className="text-slate-400 mt-1">Generate and print custom barcodes for quick physical verification audits.</p>
                </div>

                {/* Mock Barcode render */}
                <div className="border border-slate-350 dark:border-slate-800 rounded-xl p-6 text-center space-y-4 bg-white dark:bg-slate-950">
                  <p className="font-bold text-[10px] uppercase text-slate-450">FactoCorp Asset Tag</p>
                  
                  <div className="flex flex-col items-center py-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                    {/* CSS Mock Barcode */}
                    <div className="flex items-end justify-center h-12 w-44 gap-0.5">
                      {[3,1,4,2,5,1,2,4,3,1,5,2,1,4,3,2,1,5,3,2,4,1,2,5,3].map((val, idx) => (
                        <span 
                          key={idx} 
                          className="bg-black dark:bg-white rounded-t" 
                          style={{ width: val % 2 === 0 ? '3px' : '1.5px', height: `${20 + val * 6}px` }}
                        ></span>
                      ))}
                    </div>
                    <span className="text-[10px] font-mono tracking-widest mt-2">{selectedAsset.id.slice(0, 8)} - {selectedAsset.serial.slice(0, 6)}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p><span className="font-bold">Asset:</span> {selectedAsset.name}</p>
                    <p><span className="font-bold">Assigned To:</span> {selectedAsset.assignedTo || "Unassigned (In Stock)"}</p>
                  </div>
                </div>

                {/* Assignment Selector */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span>Assign Resource</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedAsset.employeeId || ''}
                      onChange={(e) => handleReassign(e.target.value || null)}
                      className="w-full px-2 py-1.5 border rounded bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-300 font-bold focus:outline-none"
                    >
                      <option value="">-- Unassigned (In Stock) --</option>
                      {employeesList.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => alert("Printing label to tag printer...")}
                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    Printer Label
                  </button>
                  <button 
                    onClick={() => alert("Downloading tag design vector...")}
                    className="w-full py-2 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-1.5"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center text-slate-450 font-medium">
                Select an asset from the ledger to view details and print barcodes.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================= */}
      {/* 2. ADD ASSET ITEM                       */}
      {/* ======================================= */}
      {activeSubModule === 'add-asset' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-xs max-w-xl">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b pb-2">Add Asset to Stock</h3>
            <p className="text-slate-400 mt-1">Register new hardware and issue a unique inventory tag identifier.</p>
          </div>

          <form onSubmit={handleAddAsset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Asset Name / Model Description</label>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. ThinkPad T14 Gen 4" 
                required 
                className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-205"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Asset Category</label>
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Hardware">Hardware (Laptops/Monitors)</option>
                  <option value="Mobile">Mobile (Phones/Tablets)</option>
                  <option value="Keycard">Keycards & Access Tokens</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Serial Number (S/N)</label>
                <input 
                  type="text" 
                  value={newSerial} 
                  onChange={(e) => setNewSerial(e.target.value)}
                  placeholder="e.g. L3N2X48Y3"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-350"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={createAssetMut.isPending}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
            >
              {createAssetMut.isPending ? "Registering..." : "Add Asset to Stock"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
