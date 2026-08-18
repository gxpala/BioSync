import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { Branches } from './pages/Branches';
import { Devices } from './pages/Devices';
import { DeviceAddEdit } from './pages/DeviceAddEdit';
import { DeviceMonitoring } from './pages/DeviceMonitoring';
import { Employees } from './pages/Employees';
import { LivePunches } from './pages/LivePunches';
import { RawPunches } from './pages/RawPunches';
import { DailyAttendanceView } from './pages/DailyAttendance';
import { Shifts } from './pages/Shifts';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

const ProtectedLayout: React.FC = () => {
  const { token, isSuperAdmin } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={isSuperAdmin ? <Clients /> : <Navigate to="/dashboard" replace />} />
            <Route path="/clients/:clientId" element={<ClientDetail />} />
            <Route path="/branches" element={<Branches />} />
            
            {/* Device Management restricted strictly to Super Admin */}
            <Route path="/devices" element={isSuperAdmin ? <Devices /> : <Navigate to="/dashboard" replace />} />
            <Route path="/devices/new" element={isSuperAdmin ? <DeviceAddEdit /> : <Navigate to="/dashboard" replace />} />
            <Route path="/devices/:id/edit" element={isSuperAdmin ? <DeviceAddEdit /> : <Navigate to="/dashboard" replace />} />
            <Route path="/device-monitoring" element={isSuperAdmin ? <DeviceMonitoring /> : <Navigate to="/dashboard" replace />} />
            
            <Route path="/employees" element={<Employees />} />
            <Route path="/live-punches" element={<LivePunches />} />
            <Route path="/raw-punches" element={<RawPunches />} />
            <Route path="/attendance" element={<DailyAttendanceView />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={isSuperAdmin ? <AuditLogs /> : <Navigate to="/dashboard" replace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
