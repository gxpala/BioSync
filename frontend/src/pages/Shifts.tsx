import React, { useEffect, useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import api from '../api/client';
import { Shift, Client } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Shifts: React.FC = () => {
  const { selectedClientId } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    client_id: 1,
    shift_name: 'General Shift',
    start_time: '09:00',
    end_time: '18:00',
    grace_period_minutes: 15,
    min_working_hours: 4.0,
    break_duration_minutes: 30,
    weekly_off_days: 'Sunday'
  });
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const url = selectedClientId ? `/shifts?client_id=${selectedClientId}` : '/shifts';
      const [sRes, cRes] = await Promise.all([api.get(url), api.get('/clients')]);
      setShifts(sRes.data);
      setClients(cRes.data);
      if (cRes.data.length > 0) {
        setForm((prev) => ({ ...prev, client_id: cRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClientId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/shifts', form);
      showToast('Shift configuration created successfully', 'success');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create shift', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>Shift Management</span>
          </h1>
          <p className="text-xs text-slate-400">Configure shift timings, grace periods, minimum working hours and break rules</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shift</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((s) => {
          const cli = clients.find((c) => c.id === s.client_id);
          return (
            <div key={s.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{s.shift_name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{cli?.client_name || `Client #${s.client_id}`}</p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                  {s.start_time} - {s.end_time}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Grace Period:</span>
                  <span className="font-semibold text-amber-400">{s.grace_period_minutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Min Working Duration:</span>
                  <span className="font-semibold text-slate-200">{s.min_working_hours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Break Duration:</span>
                  <span className="font-semibold text-slate-200">{s.break_duration_minutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Weekly Off:</span>
                  <span className="font-semibold text-sky-300">{s.weekly_off_days}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Create Shift Configuration</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Client</label>
                <select
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.client_name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Name</label>
                <input
                  type="text"
                  required
                  value={form.shift_name}
                  onChange={(e) => setForm({ ...form, shift_name: e.target.value })}
                  placeholder="General Shift"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="text"
                    required
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    placeholder="09:00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                  <input
                    type="text"
                    required
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    placeholder="18:00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Grace Period (Mins)</label>
                  <input
                    type="number"
                    value={form.grace_period_minutes}
                    onChange={(e) => setForm({ ...form, grace_period_minutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.min_working_hours}
                    onChange={(e) => setForm({ ...form, min_working_hours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500"
                >
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
