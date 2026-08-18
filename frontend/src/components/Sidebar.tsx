import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Cpu,
  Users,
  Activity,
  CalendarCheck,
  Clock,
  FileSpreadsheet,
  MonitorCheck,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MabiconsLogo } from './MabiconsLogo';

export const Sidebar: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Clients', path: '/clients', icon: Building2, superAdminOnly: true },
    { label: 'Branches', path: '/branches', icon: GitBranch },
    { label: 'Devices', path: '/devices', icon: Cpu, superAdminOnly: true },
    { label: 'Employees', path: '/employees', icon: Users },
    { label: 'Live Punches', path: '/live-punches', icon: Activity },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { label: 'Shifts', path: '/shifts', icon: Clock },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Device Monitoring', path: '/device-monitoring', icon: MonitorCheck, superAdminOnly: true },
    { label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck, superAdminOnly: true },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0 z-30 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <MabiconsLogo size="md" />
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-none">Mabicons</h1>
          <p className="text-[11px] text-sky-400 font-medium mt-1">Biometric Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.superAdminOnly && !isSuperAdmin) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
