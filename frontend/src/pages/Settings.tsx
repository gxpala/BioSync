import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Shield, Server, UserPlus, Users, Key, Lock, CheckCircle2, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

interface UserAccount {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const Settings: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'HR_MANAGER'
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const { showToast } = useToast();

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsersList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      showToast('Portal login user account created successfully', 'success');
      setShowUserModal(false);
      setFormData({ email: '', full_name: '', password: '', role: 'HR_MANAGER' });
      loadUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create user account', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      showToast('New password and confirm password do not match', 'error');
      return;
    }
    if (passwordData.new_password.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }
    try {
      await api.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      showToast('Password updated successfully', 'success');
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to change password', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-sky-400" />
          <span>Platform Settings & Appearance</span>
        </h1>
        <p className="text-xs text-slate-400">System parameters, theme preferences, and portal user access management</p>
      </div>

      {/* Theme & Appearance Section */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          <span>Theme & Appearance Mode</span>
        </h2>
        <p className="text-xs text-slate-400">Choose your preferred portal theme styling</p>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-xs font-semibold gap-2 ${
              theme === 'light'
                ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-400" />
            <span>Light Mode</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-xs font-semibold gap-2 ${
              theme === 'dark'
                ? 'bg-sky-500/15 border-sky-500 text-sky-400 shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-5 h-5 text-sky-400" />
            <span>Dark Mode</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-xs font-semibold gap-2 ${
              theme === 'system'
                ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400 shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-5 h-5 text-indigo-400" />
            <span>System Default</span>
          </button>
        </div>
      </div>

      {/* User Session & Security Section */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>My Account & Security Settings</span>
          </h2>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Change My Password</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Account Email</div>
            <div className="font-semibold text-white mt-0.5 truncate">{user?.email}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Assigned Role</div>
            <div className="font-mono text-sky-400 font-bold mt-0.5">{user?.role}</div>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400">Tenant Security</div>
            <div className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active & Enforced
            </div>
          </div>
        </div>
      </div>

      {/* User Login Management Section */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>Portal User Accounts & Logins</span>
          </h2>
          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Portal Login</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-500">No user accounts found.</td>
                </tr>
              ) : (
                usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-3 font-semibold text-white">{u.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{u.email}</td>
                    <td className="py-2.5 px-3 font-mono text-sky-400 font-bold">{u.role}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Change Account Password</span>
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Re-type new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              <span>Create Employee Portal Login</span>
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Login Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul.sharma@vysolar.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password@123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Portal Access Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="HR_MANAGER">HR Manager (Full HR Access)</option>
                  <option value="HR_EXECUTIVE">HR Executive (Daily Operations)</option>
                  <option value="CLIENT_ADMIN">Client Admin (Company Admin)</option>
                  <option value="VIEWER">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                >
                  Create Login ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
