import React, { useEffect, useState, useCallback } from 'react';
import { LogOut, Building2, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/client';
import { Client } from '../types';

export const Header: React.FC = () => {
  const { logout, isSuperAdmin, selectedClientId, setSelectedClientId } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
    <header className="h-16 bg-[#254479] border-b border-white/20 px-6 flex items-center justify-between sticky top-0 z-20 shadow-lg">
      {/* Client Tenant Selector (Super Admin) */}
      <div className="flex items-center gap-4">
        {isSuperAdmin ? (
          <div className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl px-3.5 py-1.5 text-xs text-white shadow-sm transition-all">
            <Building2 className="w-4 h-4 text-white shrink-0" />
            <span className="font-bold text-white">Client Scope:</span>
            <select
              value={selectedClientId || ''}
              onFocus={fetchClients}
              onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white font-semibold">All Clients (Mabicons Central)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white font-semibold">
                  {c.client_name} ({c.client_code})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-white bg-white/15 border border-white/30 px-3.5 py-1.5 rounded-xl font-bold shadow-sm">
            <Building2 className="w-4 h-4 text-white shrink-0" />
            <span>Mabicons Managed Tenant</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sun/Moon Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white transition-all flex items-center justify-center shadow-sm"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-sky-200" />
          )}
        </button>

        {/* Engine Status Badge */}
        <div className="flex items-center gap-2 bg-emerald-500/25 border border-emerald-300/50 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span>Engine Online</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-rose-600 border border-white/30 hover:border-rose-400 text-white transition-all shadow-sm group"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 text-white group-hover:scale-105 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
