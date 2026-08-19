import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, GitBranch, Cpu, Users, ArrowLeft, CheckCircle2, Clock, XCircle, AlertTriangle, Pencil } from 'lucide-react';
import api from '../api/client';
import { Client, Branch, Device, Employee, DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<DashboardStats['summary'] | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_code: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [cRes, bRes, dRes, eRes, sRes] = await Promise.all([
        api.get(`/clients/${clientId}`),
        api.get(`/branches?client_id=${clientId}`),
        api.get(`/devices?client_id=${clientId}`),
        api.get(`/employees?client_id=${clientId}`),
        api.get(`/dashboard/stats?client_id=${clientId}`),
      ]);
      setClient(cRes.data);
      setBranches(bRes.data);
      setDevices(dRes.data);
      setEmployees(eRes.data);
      setStats(sRes.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  const openEditModal = () => {
    if (!client) return;
    setFormData({
      client_name: client.client_name,
      client_code: client.client_code,
      contact_person: client.contact_person || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      status: client.status || 'ACTIVE'
    });
    setShowEditModal(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    try {
      await api.put(`/clients/${clientId}`, formData);
      showToast('Client organization updated successfully', 'success');
      setShowEditModal(false);
      loadData();
      window.dispatchEvent(new Event('clientUpdated'));
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update client organization', 'error');
    }
  };

  if (loading || !client) {
    return <div className="p-8 text-slate-400">Loading Client Dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate('/clients')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Client Organizations</span>
      </button>

      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white">{client.client_name}</h1>
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-sky-950 text-sky-400 border border-sky-800 font-bold">
              {client.client_code}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{client.address || 'Industrial Office Location'}</p>
        </div>

        <div className="flex items-center gap-6 text-xs border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Contact Person</span>
            <span className="text-slate-200 font-semibold">{client.contact_person || '-'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Email & Phone</span>
            <span className="text-slate-200 font-semibold">{client.email || '-'}</span>
          </div>
          {isSuperAdmin && (
            <button
              onClick={openEditModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 font-bold text-xs transition-all shadow-sm"
              title="Edit Client Organization Details"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-400">Branches</span>
          <div className="text-xl font-bold text-white mt-1">{branches.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-400">Active Employees</span>
          <div className="text-xl font-bold text-white mt-1">{employees.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-400">Devices</span>
          <div className="text-xl font-bold text-white mt-1">{devices.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-400">Today's Attendance</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{stats?.today_present || 0} Present</div>
        </div>
      </div>

      {/* Device List */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>Configured Biometric Devices</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Device Name</th>
                <th className="py-3 px-4">Brand / Model</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Driver / Protocol</th>
                <th className="py-3 px-4">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No biometric devices added for this client yet.
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-white">{d.device_name}</td>
                    <td className="py-3 px-4">
                      <span>{d.brand}</span>
                      <span className="text-slate-500 block text-[11px]">{d.model || '-'}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-400">{d.serial_number}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Online'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : d.status === 'Offline'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{d.protocol_driver}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {d.last_seen ? new Date(d.last_seen).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Client Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Edit Client Organization: {client.client_name}</h2>
            <form onSubmit={handleUpdateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client Name</label>
                <input
                  type="text"
                  required
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="e.g. V & Y Solar Pvt Ltd"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client Code</label>
                <input
                  type="text"
                  required
                  value={formData.client_code}
                  onChange={(e) => setFormData({ ...formData, client_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. VYSOLAR"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g. Vikram Yadav"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@client.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Office address details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="ACTIVE" className="bg-slate-900 text-white">ACTIVE</option>
                  <option value="SUSPENDED" className="bg-slate-900 text-white">SUSPENDED</option>
                  <option value="INACTIVE" className="bg-slate-900 text-white">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
