import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Plus, Search, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Activity, Trash2, Pencil } from 'lucide-react';
import api from '../api/client';
import { Device, Client, Branch } from '../types';
import { useToast } from '../context/ToastContext';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useAuth } from '../context/AuthContext';

export const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [testingId, setTestingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isSuperAdmin, selectedClientId } = useAuth();

  const fetchAll = async () => {
    try {
      const [devRes, cliRes, brRes] = await Promise.all([
        api.get('/devices', { params: { client_id: selectedClientId } }),
        api.get('/clients'),
        api.get('/branches')
      ]);
      setDevices(devRes.data);
      setClients(cliRes.data);
      setBranches(brRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [selectedClientId]);

  const handleTestConnection = async (e: React.MouseEvent, deviceId: number) => {
    e.stopPropagation();
    setTestingId(deviceId);
    try {
      const res = await api.post(`/devices/${deviceId}/test-connection`);
      if (res.data.success) {
        showToast(`Connection successful: ${res.data.message}`, 'success');
      } else {
        showToast(`Connection result: ${res.data.message}`, 'info');
      }
      fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Connection test failed', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/devices/${deleteTarget.id}`);
      showToast(`Device '${deleteTarget.device_name}' unregistered successfully`, 'success');
      setDeleteTarget(null);
      fetchAll();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to unregister device', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = devices.filter((d) => {
    const matchSearch =
      d.device_name.toLowerCase().includes(search.toLowerCase()) ||
      d.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      (d.local_ip && d.local_ip.includes(search));

    const matchBrand = brandFilter ? d.brand === brandFilter : true;
    const matchStatus = statusFilter ? d.status === statusFilter : true;

    return matchSearch && matchBrand && matchStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span>Biometric Hardware Devices</span>
          </h1>
          <p className="text-xs text-slate-400">eSSL, MORX, ZKTeco LAN & ADMS push devices registry</p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => navigate('/devices/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Device</span>
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by device name, IP, or S/N..."
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="">All Brands</option>
          <option value="eSSL">eSSL</option>
          <option value="MORX">MORX</option>
          <option value="ZKTeco">ZKTeco</option>
          <option value="Mock">Mock</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
          <option value="Not Configured">Not Configured</option>
          <option value="Sync Delayed">Sync Delayed</option>
        </select>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3 col-span-full shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">No Biometric Devices Registered</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no biometric hardware devices registered for this client organization yet.
            </p>
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/devices/new')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-md mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Device</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map((d) => {
            const cli = clients.find((c) => c.id === d.client_id);
            const br = branches.find((b) => b.id === d.branch_id);
            return (
              <div
                key={d.id}
                onClick={() => navigate(`/devices/${d.id}/edit`)}
                className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700 transition-all cursor-pointer group relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-sky-400 transition-colors">
                      {d.device_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-slate-300">{d.brand}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{d.model || 'Standard'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        d.status === 'Online'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : d.status === 'Offline'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : d.status === 'Not Configured'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {d.status === 'Online' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {d.status === 'Offline' && <XCircle className="w-3 h-3 text-rose-400" />}
                      {d.status === 'Not Configured' && <AlertTriangle className="w-3 h-3 text-slate-400" />}
                      {d.status}
                    </span>
                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/devices/${d.id}/edit`);
                          }}
                          className="p-1 rounded-lg bg-sky-950/60 border border-sky-800 text-sky-400 hover:bg-sky-600 hover:text-white transition-all"
                          title="Configure Device Parameters"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(d);
                          }}
                          className="p-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
                          title="Unregister Biometric Device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Serial Number:</span>
                    <code className="text-sky-400 font-mono font-semibold">{d.serial_number}</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Client / Branch:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[160px]">
                      {cli?.client_name || `Client #${d.client_id}`} ({br?.branch_name || 'Main'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IP Address & Port:</span>
                    <span className="text-slate-300 font-mono">{d.local_ip}:{d.port}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={(e) => handleTestConnection(e, d.id)}
                    disabled={testingId === d.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingId === d.id ? 'animate-spin text-sky-400' : ''}`} />
                    <span>{testingId === d.id ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <Activity className="w-3 h-3 text-slate-600" />
                    <span>{d.protocol_driver}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Unregister Biometric Device"
        itemName={deleteTarget?.device_name}
        message="Are you sure you want to unregister this biometric device from the platform? Historical attendance log data will be preserved."
        loading={deleting}
        onConfirm={handleDeleteDevice}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
