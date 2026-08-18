import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, Radio } from 'lucide-react';
import api from '../api/client';
import { RawPunch, Client, Branch, Device, Employee } from '../types';
import { useAuth } from '../context/AuthContext';

export const LivePunches: React.FC = () => {
  const { selectedClientId } = useAuth();
  const [punches, setPunches] = useState<RawPunch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveStream = async () => {
    try {
      const url = selectedClientId ? `/raw-punches?client_id=${selectedClientId}&limit=50` : '/raw-punches?limit=50';
      const [pRes, cRes, bRes, dRes, eRes] = await Promise.all([
        api.get(url),
        api.get('/clients'),
        api.get('/branches'),
        api.get('/devices'),
        api.get('/employees'),
      ]);
      setPunches(pRes.data);
      setClients(cRes.data);
      setBranches(bRes.data);
      setDevices(dRes.data);
      setEmployees(eRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStream();
    const interval = setInterval(fetchLiveStream, 5000);
    return () => clearInterval(interval);
  }, [selectedClientId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
            <span>Live Biometric Punch Stream</span>
          </h1>
          <p className="text-xs text-slate-400">Real-time incoming punch feed polled every 5 seconds</p>
        </div>
        <button
          onClick={fetchLiveStream}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Feed Now</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3.5 px-4">Punch Time</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Employee Code</th>
                <th className="py-3.5 px-4">Device</th>
                <th className="py-3.5 px-4">Device Serial</th>
                <th className="py-3.5 px-4">Punch Type</th>
                <th className="py-3.5 px-4">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {punches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No live punches received yet.
                  </td>
                </tr>
              ) : (
                punches.map((p) => {
                  const cli = clients.find((c) => c.id === p.client_id);
                  const br = branches.find((b) => b.id === p.branch_id);
                  const dev = devices.find((d) => d.id === p.device_id);
                  const emp = employees.find((e) => e.id === p.employee_id);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-sky-400 font-semibold">{p.punch_time}</td>
                      <td className="py-3.5 px-4 text-slate-200">{cli?.client_name || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{br?.branch_name || '-'}</td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {emp ? emp.employee_name : `Device User #${p.device_user_id}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">{emp ? emp.employee_code : p.device_user_id}</td>
                      <td className="py-3.5 px-4">{dev?.device_name || 'Device'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{p.device_serial}</td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{p.source}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
