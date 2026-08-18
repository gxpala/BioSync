import React from 'react';
import { Settings as SettingsIcon, Shield, Server, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-sky-400" />
          <span>Platform Settings & Architecture</span>
        </h1>
        <p className="text-xs text-slate-400">System parameters for Mabicons Technosoft Pvt Ltd Central Attendance</p>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-400" />
          <span>User Session & Multi-Tenant Role</span>
        </h2>
        <div className="space-y-2 text-xs text-slate-300">
          <div>Email: <span className="font-semibold text-white">{user?.email}</span></div>
          <div>Role: <span className="font-mono text-sky-400 font-bold">{user?.role}</span></div>
          <div>Tenant Isolation: <span className="text-emerald-400 font-semibold">Active & Enforced</span></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Biometric Driver Layer & ADMS Engine</span>
        </h2>
        <div className="space-y-2 text-xs text-slate-300">
          <div>Supported Brands: <span className="font-semibold text-white">eSSL, MORX, ZKTeco, Generic TCP/IP</span></div>
          <div>Communication Methods: <span className="text-sky-300 font-mono">ADMS Push, LAN Agent, TCP/IP, SDK, REST API</span></div>
          <div>Idempotent Deduplication Hash: <span className="font-mono text-amber-400">MD5(Device + User + Timestamp + Source)</span></div>
        </div>
      </div>
    </div>
  );
};
