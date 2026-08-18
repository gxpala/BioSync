import React, { useEffect, useState } from 'react';
import {
  Building2,
  Cpu,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import api from '../api/client';
import { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { selectedClientId } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const url = selectedClientId ? `/dashboard/stats?client_id=${selectedClientId}` : '/dashboard/stats';
      const res = await api.get(url);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedClientId]);

  if (loading || !stats) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
        <span>Loading Mabicons Central Attendance Metrics...</span>
      </div>
    );
  }

  const s = stats.summary;

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400">Real-time attendance & device integration monitoring</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Clients</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{s.total_clients}</div>
          <p className="text-xs text-emerald-400 mt-1 font-medium">{s.active_clients} Active Clients</p>
        </div>

        {/* Devices Overview */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Biometric Devices</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{s.total_devices}</div>
          <div className="flex items-center gap-3 text-xs mt-1">
            <span className="text-emerald-400 font-semibold">{s.online_devices} Online</span>
            <span className="text-rose-400 font-semibold">{s.offline_devices} Offline</span>
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Employees</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{s.total_employees}</div>
          <p className="text-xs text-slate-400 mt-1">Across all registered branches</p>
        </div>

        {/* Today's Attendance */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Present</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{s.today_present}</div>
          <div className="flex items-center gap-2 text-xs mt-1 text-slate-400">
            <span className="text-amber-400 font-medium">{s.today_late} Late</span>
            <span>•</span>
            <span className="text-rose-400 font-medium">{s.today_absent} Absent</span>
          </div>
        </div>
      </div>

      {/* Device Health Status Cards */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>Biometric Device Fleet Health</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">Online</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white mt-2">{s.online_devices}</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400">Offline</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-white mt-2">{s.offline_devices}</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">Sync Delayed</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-2">{s.sync_delayed_devices}</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Not Configured</span>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-white mt-2">{s.not_configured_devices}</div>
          </div>
        </div>
      </div>

      {/* Live Recent Punches Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Recent Inbound Biometric Punches</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Real-time Stream</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {stats.recent_punches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No recent biometric punches ingested today yet.
                  </td>
                </tr>
              ) : (
                stats.recent_punches.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-sky-400">{p.punch_time}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.employee_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Code: {p.employee_code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{p.client_name}</td>
                    <td className="py-3 px-4">
                      <div>{p.device_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">S/N: {p.device_serial}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.punch_type === 'CHECK_IN'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}
                      >
                        {p.punch_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{p.source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
