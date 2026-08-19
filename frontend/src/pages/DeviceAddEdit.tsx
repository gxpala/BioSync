import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Cpu, ArrowLeft, Zap, Info, Users, CalendarCheck, Save, AlertTriangle } from 'lucide-react';
import api from '../api/client';
import { Client, Branch, DriverCatalogItem } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const DeviceAddEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { selectedClientId } = useAuth();

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

  // Initial load: Fetch clients, drivers, and pre-select based on active Client Scope
  useEffect(() => {
    const init = async () => {
      try {
        const [cRes, drvRes] = await Promise.all([
          api.get('/clients'),
          api.get('/devices/drivers')
        ]);
        const clientList = cRes.data;
        setClients(clientList);
        setDrivers(drvRes.data);

        if (!isEdit && clientList.length > 0) {
          let initialClientId = selectedClientId ? Number(selectedClientId) : Number(clientList[0].id);
          const matchedClient = clientList.find((c: Client) => Number(c.id) === initialClientId);
          if (!matchedClient) {
            initialClientId = Number(clientList[0].id);
          }

          const bRes = await api.get('/branches', { params: { client_id: initialClientId } });
          const branchList = bRes.data;
          setBranches(branchList);

          setForm((prev) => ({
            ...prev,
            client_id: initialClientId,
            branch_id: branchList.length > 0 ? Number(branchList[0].id) : 1
          }));
        }

        if (isEdit) {
          const dRes = await api.get(`/devices/${id}`);
          const devData = dRes.data;
          const bRes = await api.get('/branches', { params: { client_id: devData.client_id } });
          setBranches(bRes.data);

          setForm({
            ...devData,
            client_id: Number(devData.client_id),
            branch_id: Number(devData.branch_id)
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [id, isEdit, selectedClientId]);

  // Handle manual client selection change inside form
  const handleClientChange = async (newClientId: number) => {
    try {
      const bRes = await api.get('/branches', { params: { client_id: newClientId } });
      const branchList = bRes.data;
      setBranches(branchList);
      setForm((prev) => ({
        ...prev,
        client_id: newClientId,
        branch_id: branchList.length > 0 ? Number(branchList[0].id) : 1
      }));
    } catch (err) {
      console.error(err);
    }
  };

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
      showToast(err.response?.data?.detail || 'Failed to save biometric device', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setActionOutput(null);
      const res = await api.post(`/devices/${id}/test-connection`);
      setActionOutput({
        title: res.data.success ? 'Connection Success' : 'Connection Failed',
        text: res.data.message,
        isError: !res.data.success
      });
      showToast(res.data.message, res.data.success ? 'success' : 'info');
    } catch (err: any) {
      setActionOutput({ title: 'Error', text: 'Failed to test connection', isError: true });
    }
  };

  const handleGetInfo = async () => {
    try {
      setActionOutput(null);
      const res = await api.get(`/devices/${id}/info`);
      setActionOutput({
        title: 'Hardware Information Fetched',
        text: JSON.stringify(res.data.info || res.data, null, 2)
      });
    } catch (err: any) {
      setActionOutput({ title: 'Error', text: 'Failed to retrieve hardware info', isError: true });
    }
  };

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
                onChange={(e) => handleClientChange(Number(e.target.value))}
                className="w-full bg-slate-950 text-white font-semibold border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white font-semibold">
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
                className="w-full bg-slate-950 text-white font-semibold border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {branches.length === 0 ? (
                  <option value="" className="bg-slate-900 text-slate-400 font-semibold">No branches registered for this client</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-white font-semibold">
                      {b.branch_name} ({b.branch_code})
                    </option>
                  ))
                )}
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
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
              <select
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full bg-slate-950 text-white font-semibold border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="eSSL" className="bg-slate-900 text-white">eSSL</option>
                <option value="MORX" className="bg-slate-900 text-white">MORX</option>
                <option value="ZKTeco" className="bg-slate-900 text-white">ZKTeco</option>
                <option value="Mock" className="bg-slate-900 text-white">Mock</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="eTimeTrack X990"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Network & Hardware Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number</label>
              <input
                type="text"
                required
                value={form.serial_number}
                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                placeholder="ESSL-JPR-001"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Firmware Version</label>
              <input
                type="text"
                value={form.firmware_version}
                onChange={(e) => setForm({ ...form, firmware_version: e.target.value })}
                placeholder="v1.0"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">MAC Address</label>
              <input
                type="text"
                value={form.mac_address}
                onChange={(e) => setForm({ ...form, mac_address: e.target.value })}
                placeholder="00:1A:2B:3C:4D:5E"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Local IP Address</label>
              <input
                type="text"
                required
                value={form.local_ip}
                onChange={(e) => setForm({ ...form, local_ip: e.target.value })}
                placeholder="192.168.1.201"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
              <input
                type="number"
                required
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                placeholder="4370"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Connection Type</label>
              <select
                value={form.connection_type}
                onChange={(e) => setForm({ ...form, connection_type: e.target.value })}
                className="w-full bg-slate-950 text-white font-semibold border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="Ethernet" className="bg-slate-900 text-white">Ethernet</option>
                <option value="Wi-Fi" className="bg-slate-900 text-white">Wi-Fi</option>
                <option value="4G SIM" className="bg-slate-900 text-white">4G SIM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Integration Type</label>
              <select
                value={form.integration_type}
                onChange={(e) => setForm({ ...form, integration_type: e.target.value })}
                className="w-full bg-slate-950 text-white font-semibold border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="Local Connector" className="bg-slate-900 text-white">Local Connector (LAN Agent)</option>
                <option value="ADMS Push" className="bg-slate-900 text-white">ADMS Push (Cloud Outbound)</option>
                <option value="Direct TCP/IP" className="bg-slate-900 text-white">Direct TCP/IP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol / Driver Adapter</label>
              <select
                value={form.protocol_driver}
                onChange={(e) => setForm({ ...form, protocol_driver: e.target.value })}
                className="w-full bg-slate-950 text-white font-semibold border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {drivers.map((drv) => (
                  <option key={drv.driver_code} value={drv.driver_code} className="bg-slate-900 text-white">
                    {drv.driver_name} ({drv.driver_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Toolbar for Editing */}
          {isEdit && (
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-950/80 border border-sky-800 text-sky-300 font-semibold text-xs hover:bg-sky-900 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Test Connection</span>
              </button>

              <button
                type="button"
                onClick={handleGetInfo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Get Device Info</span>
              </button>
            </div>
          )}

          {/* Output Display */}
          {actionOutput && (
            <div
              className={`p-4 rounded-xl border text-xs font-mono space-y-1 ${
                actionOutput.isError
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {actionOutput.isError ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                <span>{actionOutput.title}</span>
              </div>
              <pre className="text-[11px] whitespace-pre-wrap">{actionOutput.text}</pre>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/devices')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Device...' : 'Save Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
