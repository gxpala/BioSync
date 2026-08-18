import React, { useEffect, useState } from 'react';
import { Database, Search, Filter, Code } from 'lucide-react';
import api from '../api/client';
import { RawPunch, Client, Branch, Device } from '../types';
import { useAuth } from '../context/AuthContext';

export const RawPunches: React.FC = () => {
  const { selectedClientId } = useAuth();
  const [punches, setPunches] = useState<RawPunch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedPunch, setSelectedPunch] = useState<RawPunch | null>(null);

  const [sourceFilter, setSourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadRawPunches = async () => {
    try {
      let params = new URLSearchParams();
      if (selectedClientId) params.append('client_id', selectedClientId.toString());
      if (sourceFilter) params.append('source_filter', sourceFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const [pRes, cRes, bRes, dRes] = await Promise.all([
        api.get(`/raw-punches?${params.toString()}`),
        api.get('/clients'),
        api.get('/branches'),
        api.get('/devices'),
      ]);
      setPunches(pRes.data);
      setClients(cRes.data);
      setBranches(bRes.data);
      setDevices(dRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRawPunches();
  }, [selectedClientId, sourceFilter, startDate, endDate]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-400" />
          <span>Raw Biometric Punch Audit Logs</span>
        </h1>
        <p className="text-xs text-slate-400">Low-level immutable raw punch records with original hardware payloads & deduplication hashes</p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All Punch Sources</option>
          <option value="LOCAL_CONNECTOR">LOCAL_CONNECTOR (Agent)</option>
          <option value="ADMS_PUSH">ADMS_PUSH (Cloud Push)</option>
          <option value="MOCK">MOCK (Testing)</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
        />

        <button
          onClick={loadRawPunches}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
        >
          Apply Filters
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Device Serial</th>
                <th className="py-3.5 px-4">Device User ID</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Deduplication Hash Key</th>
                <th className="py-3.5 px-4 text-right">Raw Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {punches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No raw punches match query.
                  </td>
                </tr>
              ) : (
                punches.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-sky-400">
                      {p.punch_date} {p.punch_time}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">{p.device_serial}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">{p.device_user_id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{p.source}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[180px]">
                      {p.unique_hash}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedPunch(p)}
                        className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>Payload</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Payload Drawer Modal */}
      {selectedPunch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" />
              <span>Original Hardware Raw Payload</span>
            </h2>
            <div className="space-y-2 text-xs text-slate-400">
              <div>Serial Number: <code className="text-sky-400 font-mono">{selectedPunch.device_serial}</code></div>
              <div>Unique Hash: <code className="text-slate-300 font-mono text-[11px]">{selectedPunch.unique_hash}</code></div>
              <div>Ingested At: <span className="text-slate-200">{new Date(selectedPunch.received_at).toLocaleString()}</span></div>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto whitespace-pre-wrap">
              {selectedPunch.raw_payload || 'No raw string payload captured'}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedPunch(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
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
