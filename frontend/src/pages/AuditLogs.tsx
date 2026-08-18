import React, { useEffect, useState } from 'react';
import { ShieldCheck, User } from 'lucide-react';
import api from '../api/client';
import { AuditLog } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.get('/audit').then((res) => setLogs(res.data)).catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-400" />
          <span>System Audit Logs</span>
        </h1>
        <p className="text-xs text-slate-400">Security compliance audit trail tracking logins, client updates, and hardware test actions</p>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {l.created_at ? new Date(l.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">{l.user_email || 'System'}</td>
                    <td className="py-3.5 px-4 font-mono text-sky-400 font-bold">{l.action}</td>
                    <td className="py-3.5 px-4 text-slate-400">{l.entity || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] truncate max-w-xs">
                      {l.metadata_json || '-'}
                    </td>
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
