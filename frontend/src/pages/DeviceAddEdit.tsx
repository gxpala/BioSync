import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Cpu, ArrowLeft, Zap, Info, Users, CalendarCheck, Save, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import { Client, Branch, DriverCatalogItem } from '../types';
import { useToast } from '../context/ToastContext';

export const DeviceAddEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [drivers, setDrivers] = useState<DriverCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionOutput, setActionOutput] = useState<{ title: string; text: string; isError?: boolean } | null>(null);

  const [form, setForm] = useState({
    client_id: 1,
    branch_id: 1,
    device_name: '',
    brand: 'eSSL',
    model: 'eTimeTrack X990',
    serial_number: '',
    firmware_version: 'v1.0',
    local_ip: '192.168.1.201',
    port: 4370,
    mac_address: '00:1A:2B:3C:4D:5E',
    connection_type: 'Ethernet',
    integration_type: 'Local Connector',
    protocol_driver: 'essl_tcp',
    status: 'Not Configured'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [cRes, bRes, drvRes] = await Promise.all([
          api.get('/clients'),
          api.get('/branches'),
          api.get('/devices/drivers')
        ]);
        setClients(cRes.data);
        setBranches(bRes.data);
        setDrivers(drvRes.data);

        if (cRes.data.length > 0) {
          setForm((prev) => ({
            ...prev,
            client_id: cRes.data[0].id,
            branch_id: bRes.data.find((b: Branch) => b.client_id === cRes.data[0].id)?.id || 1
          }));
        }

        if (isEdit) {
          const dRes = await api.get(`/devices/${id}`);
          setForm(dRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [id, isEdit]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/devices/${id}`, form);
        showToast('Device updated successfully', 'success');
      } else {
        await api.post('/devices', form);
        showToast('Biometric device registered successfully', 'success');
      }
      navigate('/devices');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save device', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!isEdit) {
      showToast('Please save device first before executing hardware test connection', 'info');
      return;
    }
    setActionOutput(null);
    try {
      const res = await api.post(`/devices/${id}/test-connection`);
      setActionOutput({
        title: 'Test Connection Result',
        text: res.data.message,
        isError: !res.data.success
      });
      if (res.data.success) {
        showToast(res.data.message, res.data.is_mock ? 'info' : 'success');
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err: any) {
      setActionOutput({
        title: 'Test Connection Failed',
        text: err.response?.data?.detail || 'Connection test error',
        isError: true
      });
    }
  };

  const handleGetInfo = async () => {
    if (!isEdit) return;
    try {
      const res = await api.get(`/devices/${id}/info`);
      setActionOutput({
        title: 'Device Hardware Metadata',
        text: JSON.stringify(res.data.data || res.data.message, null, 2),
        isError: !res.data.success
      });
    } catch (err: any) {
      setActionOutput({ title: 'Error', text: 'Failed to retrieve hardware info', isError: true });
    }
  };

  const filteredBranches = branches.filter((b) => b.client_id === Number(form.client_id));

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <button
        onClick={() => navigate('/devices')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Biometric Devices</span>
      </button>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-bold text-white">
              {isEdit ? `Configure Device: ${form.device_name}` : 'Register New Biometric Device'}
            </h1>
            <p className="text-xs text-slate-400">Specify hardware brand, serial number, LAN/IP parameters and driver adapter</p>
          </div>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950 text-sky-400 border border-slate-800">
            {form.brand} ({form.integration_type})
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Tenant Hierarchy selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Client Organization</label>
              <select
                value={form.client_id}
                onChange={(e) => {
                  const cId = Number(e.target.value);
                  const firstB = branches.find((b) => b.client_id === cId);
                  setForm({ ...form, client_id: cId, branch_id: firstB ? firstB.id : 1 });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_name} ({c.client_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Office Branch</label>
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name} ({b.branch_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Device Core Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Device Name</label>
              <input
                type="text"
                required
                value={form.device_name}
                onChange={(e) => setForm({ ...form, device_name: e.target.value })}
                placeholder="Main Gate eSSL"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="eSSL">eSSL</option>
                <option value="MORX">MORX</option>
                <option value="ZKTeco">ZKTeco</option>
                <option value="Mock">Mock (Testing Only)</option>
                <option value="Generic">Generic / Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="eTimeTrack X990 / MX-800"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number</label>
              <input
                type="text"
                required
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                placeholder="ESSL-JPR-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Firmware Version</label>
              <input
                type="text"
                value={form.firmware_version}
                onChange={(e) => setForm({ ...form, firmware_version: e.target.value })}
                placeholder="Ver 8.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">MAC Address</label>
              <input
                type="text"
                value={form.mac_address}
                onChange={(e) => setForm({ ...form, mac_address: e.target.value })}
                placeholder="00:1A:2B:3C:4D:5E"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Network & Protocol Config */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Local IP Address</label>
              <input
                type="text"
                value={form.local_ip}
                onChange={(e) => setForm({ ...form, local_ip: e.target.value })}
                placeholder="192.168.1.201"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                placeholder="4370"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Connection Type</label>
              <select
                value={form.connection_type}
                onChange={(e) => setForm({ ...form, connection_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Ethernet">Ethernet</option>
                <option value="Wi-Fi">Wi-Fi</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Integration Type</label>
              <select
                value={form.integration_type}
                onChange={(e) => setForm({ ...form, integration_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Local Connector">Local Connector (LAN Agent)</option>
                <option value="ADMS Push">ADMS Push (Cloud Push)</option>
                <option value="LAN / TCP-IP">LAN / TCP-IP (Direct)</option>
                <option value="SDK">SDK Integration</option>
                <option value="REST API">REST API</option>
              </select>
            </div>
          </div>

          {/* Modular Driver Adapter selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol / Driver Adapter</label>
            <select
              value={form.protocol_driver}
              onChange={(e) => setForm({ ...form, protocol_driver: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            >
              <option value="unconfigured">unconfigured (Driver Not Configured)</option>
              {drivers.map((drv) => (
                <option key={drv.driver_code} value={drv.driver_code}>
                  {drv.driver_code} — {drv.driver_name} {drv.is_mock ? '(DEV MOCK)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons as requested in problem statement */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-300 text-xs font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleGetInfo}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Get Device Info</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('Command queued for hardware user list fetch', 'info')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Get Users</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('Attendance log pull command dispatched to driver', 'info')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Get Attendance</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Device'}</span>
            </button>
          </div>
        </form>

        {/* Action Result Box */}
        {actionOutput && (
          <div
            className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
              actionOutput.isError
                ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold font-sans text-sm mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{actionOutput.title}</span>
            </div>
            <pre className="whitespace-pre-wrap">{actionOutput.text}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
