import React, { useEffect, useState } from 'react';
import { GitBranch, Plus, Search, MapPin, Globe, Download, Trash2, Pencil } from 'lucide-react';
import api from '../api/client';
import { Branch, Client } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { isSuperAdmin, selectedClientId } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    client_id: 1,
    branch_name: '',
    branch_code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    timezone: 'Asia/Kolkata',
    status: 'ACTIVE'
  });

  const fetchData = async () => {
    try {
      const [branchRes, clientRes] = await Promise.all([
        api.get('/branches', { params: { client_id: selectedClientId } }),
        api.get('/clients')
      ]);
      setBranches(branchRes.data);
      setClients(clientRes.data);
      if (clientRes.data.length > 0) {
        const targetClientId = selectedClientId || clientRes.data[0].id;
        setFormData((prev) => ({ ...prev, client_id: targetClientId }));
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
      await api.post('/branches', formData);
      showToast('Branch created successfully', 'success');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create branch', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    try {
      await api.put(`/branches/${editingBranch.id}`, formData);
      showToast('Branch updated successfully', 'success');
      setEditingBranch(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update branch', 'error');
    }
  };

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    setFormData({
      client_id: b.client_id,
      branch_name: b.branch_name,
      branch_code: b.branch_code,
      address: b.address || '',
      city: b.city || '',
      state: b.state || '',
      pincode: b.pincode || '',
      timezone: b.timezone || 'Asia/Kolkata',
      status: b.status || 'ACTIVE'
    });
  };

  const resetForm = () => {
    const targetClientId = selectedClientId || (clients[0]?.id || 1);
    setFormData({
      client_id: targetClientId,
      branch_name: '',
      branch_code: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE'
    });
  };

  const handleDeleteBranch = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/branches/${deleteTarget.id}`);
      showToast(`Branch '${deleteTarget.branch_name}' deleted successfully`, 'success');
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to delete branch', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadInstaller = async (clientCode: string, branchCode: string) => {
    try {
      const serverUrl = window.location.origin;
      const res = await api.get('/connector/download-installer', {
        params: { client_code: clientCode, branch_code: branchCode, server_url: serverUrl },
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/x-bat' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `install-mabicons-agent-${clientCode}-${branchCode}.bat`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast(`Downloaded installer script for Branch ${branchCode}`, 'success');
    } catch (err: any) {
      showToast('Failed to download agent installer script', 'error');
    }
  };

  const filtered = branches.filter(
    (b) =>
      b.branch_name.toLowerCase().includes(search.toLowerCase()) ||
      b.branch_code.toLowerCase().includes(search.toLowerCase()) ||
      (b.city && b.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Branches & Locations</h1>
          <p className="text-xs text-slate-400">Manage client office locations and timezone configurations</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-500 mr-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by branch name, code, or city..."
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((b) => {
          const cli = clients.find((c) => c.id === b.client_id);
          const clientCode = cli?.client_code || 'VYSOLAR';
          return (
            <div key={b.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3 relative group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{b.branch_name}</h3>
                  <span className="font-mono text-[11px] text-sky-400 font-semibold">{b.branch_code}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {b.status}
                  </span>
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1 rounded-lg bg-sky-950/60 border border-sky-800 text-sky-400 hover:bg-sky-600 hover:text-white transition-all"
                    title="Edit Branch Details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(b)}
                    className="p-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                    title="Delete Branch Location"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                Client: <span className="text-slate-200">{cli?.client_name || `Client #${b.client_id}`}</span>
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{b.city || 'City N/A'}, {b.state || 'State N/A'} ({b.pincode || '-'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Timezone: <code className="text-sky-300 font-mono">{b.timezone}</code></span>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleDownloadInstaller(clientCode, b.branch_code)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900 border border-sky-800/60 text-sky-300 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download 1-Click Client Agent Installer</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Branch Location"
        itemName={deleteTarget?.branch_name}
        message="Are you sure you want to delete this office branch location? Active devices and employees registered to this branch will require re-assignment."
        loading={deleting}
        onConfirm={handleDeleteBranch}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Create / Edit Modal */}
      {(showModal || editingBranch) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">
              {editingBranch ? `Edit Branch: ${editingBranch.branch_name}` : 'Add New Branch'}
            </h2>
            <form onSubmit={editingBranch ? handleUpdate : handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Client Organization</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.client_name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={formData.branch_name}
                  onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                  placeholder="e.g. Jaipur Head Office"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Code</label>
                <input
                  type="text"
                  required
                  value={formData.branch_code}
                  onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. JPR007"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Jaipur"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Rajasthan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address / Industrial Area"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
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
                  <option value="INACTIVE" className="bg-slate-900 text-white">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBranch(null);
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
                  {editingBranch ? 'Update Branch' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
