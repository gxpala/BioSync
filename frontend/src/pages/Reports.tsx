import React, { useState } from 'react';
import { FileSpreadsheet, Download, Filter, FileText, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Reports: React.FC = () => {
  const { selectedClientId } = useAuth();
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let params = new URLSearchParams({ report_type: reportType });
      if (selectedClientId) params.append('client_id', selectedClientId.toString());
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await api.get(`/reports/data?${params.toString()}`);
      setReportData(res.data.data || []);
      showToast(`Report generated with ${res.data.count || 0} records`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      let params = new URLSearchParams({ report_type: reportType });
      if (selectedClientId) params.append('client_id', selectedClientId.toString());

      const res = await api.get(`/reports/export-csv?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mabicons_${reportType}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('CSV Report downloaded successfully', 'success');
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-sky-400" />
          <span>Biometric Attendance Reports</span>
        </h1>
        <p className="text-xs text-slate-400">Generate executive daily, monthly, late, absent, device sync and raw punch reports</p>
      </div>

      {/* Report Builder Controls */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="daily">1. Daily Attendance Report</option>
              <option value="monthly">2. Monthly Summary Report</option>
              <option value="late">3. Late Exception Report</option>
              <option value="absent">4. Absenteeism Report</option>
              <option value="device_sync">5. Device Fleet Sync Report</option>
              <option value="raw_punches">6. Raw Biometric Punch Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-600/20"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center p-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition-colors"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Report Output ({reportData.length} records)
          </span>
          {reportData.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold hover:text-emerald-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV File</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {reportData.length > 0 && (
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  {Object.keys(reportData[0]).map((key) => (
                    <th key={key} className="py-3 px-4 capitalize">
                      {key.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
              {reportData.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-slate-500">
                    Click 'Generate Report' to view live attendance records.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    {Object.values(row).map((val: any, vIdx) => (
                      <td key={vIdx} className="py-3 px-4">
                        {String(val)}
                      </td>
                    ))}
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
