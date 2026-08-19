import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Cpu, CheckCircle2, ShieldAlert, Link, Trash2, Pencil } from 'lucide-react';
import api from '../api/client';
import { Employee, Client, Branch, Device } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

interface MappingItem {
  id: number;
  employee_id: number;
  device_id: number;
  device_name: string;
  device_serial: string;
  device_user_id: string;
  created_at: string;
}

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { isSuperAdmin, selectedClientId } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    client_id: 1,
    branch_id: 1,
    employee_code: '',
    default_device_user_id: '',
    employee_name: '',
    email: '',
    phone: '',
    department: 'Operations',
    designation: 'Executive',
    status: 'ACTIVE'
  });

  const [mappingForm, setMappingForm] = useState({
    device_id: 1,
    device_user_id: ''
  });

  const fetchData = async () => {
    try {
      const [empRes, cliRes, brRes, devRes] = await Promise.all([
        api.get('/employees', { params: { client_id: selectedClientId } }),
        api.get('/clients'),
        api.get('/branches'),
        api.get('/devices')
      ]);
      setEmployees(empRes.data);
      setClients(cliRes.data);
      setBranches(brRes.data);
      setDevices(devRes.data);

      if (cliRes.data.length > 0) {
        const targetClientId = selectedClientId || cliRes.data[0].id;
        const matchingBranches = brRes.data.filter((b: Branch) => b.client_id === targetClientId);
        setFormData((prev) => ({
          ...prev,
          client_id: targetClientId,
          branch_id: matchingBranches.length > 0 ? matchingBranches[0].id : 1
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClientId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', formData);
      showToast('Employee created successfully', 'success');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create employee', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    try {
      await api.put(`/employees/${editingEmp.id}`, formData);
      showToast('Employee details updated successfully', 'success');
      setEditingEmp(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update employee', 'error');
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      client_id: emp.client_id,
      branch_id: emp.branch_id,
      employee_code: emp.employee_code,
      default_device_user_id: emp.default_device_user_id || '',
      employee_name: emp.employee_name,
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Operations',
      designation: emp.designation || 'Executive',
      status: emp.status || 'ACTIVE'
    });
  };

  const resetForm = () => {
    const targetClientId = selectedClientId || (clients[0]?.id || 1);
    const matchingBranches = branches.filter((b) => b.client_id === targetClientId);
    setFormData({
      client_id: targetClientId,
      branch_id: matchingBranches[0]?.id || 1,
      employee_code: '',
      default_device_user_id: '',
      employee_name: '',
      email: '',
      phone: '',
      department: 'Operations',
      designation: 'Executive',
      status: 'ACTIVE'
    });
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/employees/${deleteTarget.id}`);
      showToast(`Employee '${deleteTarget.employee_name}' deleted successfully`, 'success');
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete employee', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openMappingModal = async (emp: Employee) => {
    setSelectedEmp(emp);
    setMappingForm({ device_id: devices[0]?.id || 1, device_user_id: emp.default_device_user_id || emp.employee_code });
    try {
      const res = await api.get(`/employees/${emp.id}/mappings`);
      setMappings(res.data);
    } catch (err) {
      console.error(err);
    }
    setShowMappingModal(true);
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      await api.post('/employees/mappings', {
        employee_id: selectedEmp.id,
        device_id: mappingForm.device_id,
        device_user_id: mappingForm.device_user_id
      });
      showToast('Device mapping saved', 'success');
      const res = await api.get(`/employees/${selectedEmp.id}/mappings`);
      setMappings(res.data);
      setMappingForm({ device_id: devices[0]?.id || 1, device_user_id: '' });
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save mapping', 'error');
    }
  };

  const filteredBranchesForEmp = branches.filter((b) => b.client_id === Number(formData.client_id));

  const filtered = employees.filter(
    (e) =>
      e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_code.toLowerCase().includes(search.toLowerCase()) ||
      (e.department && e.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Employee Directory & Biometric Mapping</h1>
          <p className="text-xs text-slate-400">Map employee identities to device user IDs across eSSL, MORX & ZKTeco hardware</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-500 mr-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, employee code, department..."
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Employee Code</th>
                <th className="py-3.5 px-4">Default Device ID</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Client / Branch</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No employee records found.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const cli = clients.find((c) => c.id === e.client_id);
                  const br = branches.find((b) => b.id === e.branch_id);
                  return (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{e.employee_name}</div>
                        <div className="text-[11px] text-slate-400">{e.email || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-sky-400 font-semibold">{e.employee_code}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">{e.default_device_user_id || e.employee_code}</td>
                      <td className="py-3.5 px-4">
                        <div>{e.department || 'General'}</div>
                        <div className="text-[11px] text-slate-500">{e.designation || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{cli?.client_name || `Client #${e.client_id}`}</div>
                        <div className="text-[11px] text-slate-500">{br?.branch_name || 'Main Branch'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEditModal(e)}
                            className="p-1 rounded-lg bg-sky-950/60 border border-sky-800 text-sky-400 hover:bg-sky-600 hover:text-white transition-all"
                            title="Edit Employee Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openMappingModal(e)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900 border border-sky-800 text-sky-400 font-semibold text-xs transition-colors"
                          >
                            <Link className="w-3 h-3" />
                            <span>Device Mapping</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(e)}
                            className="p-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                            title="Delete Employee Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Employee Record"
        itemName={deleteTarget?.employee_name}
        message="Are you sure you want to delete this employee record? Historical attendance log data will remain preserved."
        loading={deleting}
        onConfirm={handleDeleteEmployee}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Device Mapping Modal */}
      {showMappingModal && selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span>Hardware Device Mappings</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mapping for <span className="text-white font-semibold">{selectedEmp.employee_name}</span> ({selectedEmp.employee_code})
                </p>
              </div>
              <button onClick={() => setShowMappingModal(false)} className="text-xs text-slate-400 hover:text-white">
                Close
              </button>
            </div>

            {/* Existing mappings */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300">Active Device User IDs</h3>
              {mappings.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500 text-center">
                  No specific device mappings created yet. Using default fallback: <code className="text-amber-400 font-mono">{selectedEmp.default_device_user_id || selectedEmp.employee_code}</code>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {mappings.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <div>
                        <span className="font-semibold text-white">{m.device_name}</span>
                        <span className="text-[11px] text-slate-500 ml-2 font-mono">{m.device_serial}</span>
                      </div>
                      <div className="font-mono text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800">
                        ID: {m.device_user_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add mapping form */}
            <form onSubmit={handleSaveMapping} className="pt-3 border-t border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300">Add / Override Device Specific User ID</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Device</label>
                  <select
                    value={mappingForm.device_id}
                    onChange={(e) => setMappingForm({ ...mappingForm, device_id: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.device_name} ({d.serial_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Device Internal User ID</label>
                  <input
                    type="text"
                    required
                    value={mappingForm.device_user_id}
                    onChange={(e) => setMappingForm({ ...mappingForm, device_user_id: e.target.value })}
                    placeholder="e.g. 101 or EMP001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMappingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Done
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Employee Modal */}
      {(showModal || editingEmp) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">
              {editingEmp ? `Edit Employee: ${editingEmp.employee_name}` : 'Add New Employee'}
            </h2>
            <form onSubmit={editingEmp ? handleUpdate : handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Client</label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => {
                      const cId = Number(e.target.value);
                      const matchingB = branches.find((b) => b.client_id === cId);
                      setFormData({ ...formData, client_id: cId, branch_id: matchingB ? matchingB.id : 1 });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.client_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {filteredBranchesForEmp.length === 0 ? (
                      <option value="" className="bg-slate-900 text-slate-400">No branches for this client</option>
                    ) : (
                      filteredBranchesForEmp.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                          {b.branch_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.employee_name}
                  onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    placeholder="e.g. EMP001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Default Device User ID</label>
                  <input
                    type="text"
                    value={formData.default_device_user_id}
                    onChange={(e) => setFormData({ ...formData, default_device_user_id: e.target.value })}
                    placeholder="e.g. 101 (Optional)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Engineering"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Solar Tech Lead"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="emp@company.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 99000 11122"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEmp(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                >
                  {editingEmp ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
