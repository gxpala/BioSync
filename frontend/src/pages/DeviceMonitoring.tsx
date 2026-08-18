import React, { useEffect, useState } from 'react';
import { MonitorCheck, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import { Device, Client, Branch } from '../types';
import { useAuth } from '../context/AuthContext';

export const DeviceMonitoring: React.FC = () => {
  const { selectedClientId } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const url = selectedClientId ? `/devices?client_id=${selectedClientId}` : '/devices';
      const [dRes, cRes, bRes] = await Promise.all([api.get(url), api.get('/clients'), api.get('/branches')]);
      setDevices(dRes.data);
      setClients(cRes.data);
      setBranches(bRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClientId]);

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Device Fleet Monitoring</h1>
          <p className="text-xs text-slate-400">Live health telemetry, heartbeat status, and sync delay matrix</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Monitoring Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => {
          const cli = clients.find((c) => c.id === d.client_id);
          const br = branches.find((b) => b.id === d.branch_id);
          return (
            <div key={d.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{d.device_name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {cli?.client_name || 'Client'} ({br?.branch_name || 'Branch'})
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    d.status === 'Online'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : d.status === 'Offline'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {d.status === 'Online' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {d.status === 'Offline' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                  {d.status}
                </span>
              </div>

              <div className="space-y-2 text-xs border-t border-b border-slate-800/80 py-3 text-slate-300 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Serial Number:</span>
                  <code className="text-sky-400 font-mono font-semibold">{d.serial_number}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Brand / Driver:</span>
                  <span className="font-mono text-slate-300">{d.brand} ({d.protocol_driver})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Seen:</span>
                  <span className="text-emerald-400 font-medium">{getTimeAgo(d.last_seen)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Successful Sync:</span>
                  <span className="text-slate-200">{getTimeAgo(d.last_successful_sync)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Attendance Punch:</span>
                  <span className="text-slate-200">{getTimeAgo(d.last_attendance_received)}</span>
                </div>
              </div>

              {d.last_error && (
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-[11px] text-rose-300 font-mono flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="truncate">{d.last_error}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
