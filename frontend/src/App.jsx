import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Show, RedirectToSignIn, useAuth } from '@clerk/react';
import LandingPage from './LandingPage';
import Dashboard from './pages/Dashboard';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import DocsPage from './pages/DocsPage';
import BenchmarkPage from './pages/BenchmarkPage';
import ProofPage from './pages/ProofPage';

import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import RoleSelectionPage from './pages/LoginPage';
import Login from './pages/Login';
import CarrierDashboard from './pages/CarrierDashboard';
import { setAuthToken } from './lib/api';

function TokenManager() {
  const { getToken } = useAuth();
  
  useEffect(() => {
    getToken().then(token => setAuthToken(token));
  }, [getToken]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <TokenManager />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/*" element={<Login />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/benchmark" element={<BenchmarkPage />} />
          <Route path="/proof" element={<ProofPage />} />
          
          {/* Protected Role Selection Route */}
          <Route path="/select-role" element={
            <>
              <Show when="signed-in">
                <RoleSelectionPage />
              </Show>
              <Show when="signed-out">
                <RedirectToSignIn />
              </Show>
            </>
          } />

          {/* Protected Routes */}
          <Route path="/app/*" element={
            <>
              <Show when="signed-in">
                <Dashboard />
              </Show>
              <Show when="signed-out">
                <RedirectToSignIn />
              </Show>
            </>
          } />
          
          <Route path="/carrier" element={<CarrierDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
