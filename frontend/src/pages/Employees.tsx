import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Link2, CheckCircle2, Cpu } from 'lucide-react';
import api from '../api/client';
import { Employee, Client, Branch, Device, EmployeeDeviceMapping } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Employees: React.FC = () => {
  const { selectedClientId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [mappings, setMappings] = useState<EmployeeDeviceMapping[]>([]);

  const [form, setForm] = useState({
    client_id: 1,
    branch_id: 1,
    employee_code: '',
    default_device_user_id: '',
    employee_name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: 'Solar Engineer',
    joining_date: '2024-01-15',
    status: 'ACTIVE'
  });

  const [mappingForm, setMappingForm] = useState({
    device_id: 1,
    device_user_id: ''
  });

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const url = selectedClientId ? `/employees?client_id=${selectedClientId}` : '/employees';
      const [eRes, cRes, bRes, dRes] = await Promise.all([
        api.get(url),
        api.get('/clients'),
        api.get('/branches'),
        api.get('/devices')
      ]);
      setEmployees(eRes.data);
      setClients(cRes.data);
      setBranches(bRes.data);
      setDevices(dRes.data);
      if (cRes.data.length > 0) {
        setForm((prev) => ({
          ...prev,
          client_id: cRes.data[0].id,
          branch_id: bRes.data.find((b: Branch) => b.client_id === cRes.data[0].id)?.id || 1
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClientId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', form);
      showToast('Employee registered successfully', 'success');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to register employee', 'error');
    }
  };

  const openMappingModal = async (emp: Employee) => {
    setSelectedEmp(emp);
    try {
      const res = await api.get(`/employees/${emp.id}/mappings`);
      setMappings(res.data);
      setShowMappingModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      await api.post('/employees/mappings', {
        employee_id: selectedEmp.id,
        device_id: Number(mappingForm.device_id),
        device_user_id: mappingForm.device_user_id
      });
      showToast('Device User ID mapping saved', 'success');
      const res = await api.get(`/employees/${selectedEmp.id}/mappings`);
      setMappings(res.data);
      setMappingForm({ device_id: 1, device_user_id: '' });
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save mapping', 'error');
    }
  };

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
          onClick={() => setShowModal(true)}
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
                <th className="py-3.5 px-4 text-right">Device Mappings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {filtered.map((e) => {
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
                      <button
                        onClick={() => openMappingModal(e)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900 border border-sky-800/60 text-sky-300 text-xs font-semibold transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Configure Hardware Mappings</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Add New Employee</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client</label>
                <select
                  value={form.client_id}
                  onChange={(e) => {
                    const cId = Number(e.target.value);
                    const firstB = branches.find((b) => b.client_id === cId);
                    setForm({ ...form, client_id: cId, branch_id: firstB ? firstB.id : 1 });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.client_name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={form.employee_name}
                  onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={form.employee_code}
                    onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                    placeholder="EMP001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Default Device User ID</label>
                  <input
                    type="text"
                    value={form.default_device_user_id}
                    onChange={(e) => setForm({ ...form, default_device_user_id: e.target.value })}
                    placeholder="15"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Engineering"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Solar Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Device Mapping Modal */}
      {showMappingModal && selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Biometric Hardware Mappings</h2>
              <p className="text-xs text-slate-400">
                Employee: <span className="text-sky-400 font-semibold">{selectedEmp.employee_name} ({selectedEmp.employee_code})</span>
              </p>
            </div>

            {/* Configured mappings table */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Existing Mappings across Devices:
              </span>
              {mappings.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">No custom device user ID mappings yet (Using default: {selectedEmp.default_device_user_id || selectedEmp.employee_code})</p>
              ) : (
                <div className="space-y-1">
                  {mappings.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-medium text-white">{m.device_name}</span>
                        <span className="text-slate-500 font-mono text-[10px]">({m.device_serial})</span>
                      </div>
                      <div className="font-mono text-amber-400 font-bold">
                        Device User ID = {m.device_user_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new mapping form */}
            <form onSubmit={handleAddMapping} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white block">Add Device-Specific User ID Mapping</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Biometric Device</label>
                  <select
                    value={mappingForm.device_id}
                    onChange={(e) => setMappingForm({ ...mappingForm, device_id: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.device_name} ({d.brand})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hardware User ID</label>
                  <input
                    type="text"
                    required
                    value={mappingForm.device_user_id}
                    onChange={(e) => setMappingForm({ ...mappingForm, device_user_id: e.target.value })}
                    placeholder="e.g. 102"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
              >
                Save Device Mapping
              </button>
            </form>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowMappingModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
