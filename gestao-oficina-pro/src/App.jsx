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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
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
        <Router>
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
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
