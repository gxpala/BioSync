import React, { useEffect, useState } from 'react';
import { CalendarCheck, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle, Play } from 'lucide-react';
import api from '../api/client';
import { DailyAttendance, Employee, Client, Branch } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const DailyAttendanceView: React.FC = () => {
  const { selectedClientId } = useAuth();
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [reprocessing, setReprocessing] = useState(false);
  const { showToast } = useToast();

  const loadAttendance = async () => {
    try {
      let params = new URLSearchParams();
      if (selectedClientId) params.append('client_id', selectedClientId.toString());
      if (dateFilter) params.append('attendance_date', dateFilter);
      if (statusFilter) params.append('status_filter', statusFilter);

      const [aRes, eRes, cRes, bRes] = await Promise.all([
        api.get(`/attendance?${params.toString()}`),
        api.get('/employees'),
        api.get('/clients'),
        api.get('/branches'),
      ]);
      setAttendance(aRes.data);
      setEmployees(eRes.data);
      setClients(cRes.data);
      setBranches(bRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedClientId, dateFilter, statusFilter]);

  const handleTriggerReprocess = async () => {
    if (!selectedClientId && clients.length > 0) {
      showToast('Reprocessing attendance for default client...', 'info');
    }
    const targetCId = selectedClientId || (clients.length > 0 ? clients[0].id : 1);
    setReprocessing(true);
    try {
      const res = await api.post(`/attendance/reprocess?client_id=${targetCId}&target_date=${dateFilter}`);
      showToast(res.data.message, 'success');
      loadAttendance();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to reprocess attendance', 'error');
    } finally {
      setReprocessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-sky-400" />
            <span>Processed Daily Attendance</span>
          </h1>
          <p className="text-xs text-slate-400">Calculated First In, Last Out, Working Hours & Late/Early Exit Statuses</p>
        </div>

        <button
          onClick={handleTriggerReprocess}
          disabled={reprocessing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{reprocessing ? 'Processing...' : 'Run Attendance Calculation Engine'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Attendance Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="Miss Punch">Miss Punch</option>
          </select>
        </div>

        <button
          onClick={loadAttendance}
          className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">First In</th>
                <th className="py-3.5 px-4">Last Out</th>
                <th className="py-3.5 px-4">Working Hours</th>
                <th className="py-3.5 px-4">Late Mins</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No attendance calculated for selected filters yet.
                  </td>
                </tr>
              ) : (
                attendance.map((a) => {
                  const emp = employees.find((e) => e.id === a.employee_id);
                  return (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{emp?.employee_name || `Emp #${a.employee_id}`}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Code: {emp?.employee_code || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{a.attendance_date}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">{a.first_in || '-'}</td>
                      <td className="py-3.5 px-4 font-mono text-indigo-400 font-semibold">{a.last_out || '-'}</td>
                      <td className="py-3.5 px-4 font-mono text-white font-bold">{a.total_working_hours} hrs</td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">{a.late_minutes ? `${a.late_minutes} mins` : '-'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            a.status === 'Present'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : a.status === 'Late'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : a.status === 'Absent'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {a.status === 'Present' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {a.status === 'Late' && <Clock className="w-3 h-3 text-amber-400" />}
                          {a.status === 'Absent' && <XCircle className="w-3 h-3 text-rose-400" />}
                          {a.status}
                        </span>
                      </td>
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
