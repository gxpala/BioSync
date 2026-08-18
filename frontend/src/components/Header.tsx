import React, { useEffect, useState, useCallback } from 'react';
import { LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Client } from '../types';

export const Header: React.FC = () => {
  const { logout, isSuperAdmin, selectedClientId, setSelectedClientId } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);

  const fetchClients = useCallback(() => {
    if (isSuperAdmin) {
      api.get('/clients').then((res) => setClients(res.data)).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchClients();

    const handleClientUpdate = () => fetchClients();
    window.addEventListener('clientUpdated', handleClientUpdate);
    return () => {
      window.removeEventListener('clientUpdated', handleClientUpdate);
    };
  }, [fetchClients]);

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Client Tenant Selector (Super Admin) */}
      <div className="flex items-center gap-4">
        {isSuperAdmin ? (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium text-slate-400">Client Scope:</span>
            <select
              value={selectedClientId || ''}
              onFocus={fetchClients}
              onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-300">All Clients (Mabicons Central)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.client_name} ({c.client_code})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Mabicons Managed Tenant</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 px-2.5 py-1 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Online</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
