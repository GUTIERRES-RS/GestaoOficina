import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './views/Dashboard';
import Clients from './views/Clients';
import ServiceOrders from './views/ServiceOrders';
import Inventory from './views/Inventory';
import Finances from './views/Finances';
import Settings from './views/Settings';
import Login from './views/Login';
import Mechanics from './views/Mechanics';
import Commission from './views/Commission';
import Vehicles from './views/Vehicles';
import Users from './views/Users';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { ConnectionProvider, useConnection } from './context/ConnectionContext';
import ProtectedRoute from './components/ProtectedRoute';
import ApiErrorScreen from './components/ApiErrorScreen';

const AppContent = () => {
  const { isConnected, isInitialCheck } = useConnection();

  if (isInitialCheck) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-400 font-medium">Verificando conexão...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <ApiErrorScreen />;
  }

  return (
    <Router basename={import.meta.env.VITE_BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="veiculos" element={<Vehicles />} />
            <Route path="os" element={<ServiceOrders />} />
            <Route path="estoque" element={<Inventory />} />
            <Route path="financeiro" element={<Finances />} />
            <Route path="configuracoes" element={<Settings />} />
            <Route path="mecanicos" element={<Mechanics />} />
            <Route path="comissoes" element={<Commission />} />
            <Route path="usuarios" element={<Users />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ConnectionProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#1e293b',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0'
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#ffffff' }
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#ffffff' }
              }
            }}
          />
          <AppContent />
        </ConnectionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
