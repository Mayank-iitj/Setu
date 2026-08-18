import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/react';
import LandingPage from './LandingPage';
import Dashboard from './pages/Dashboard';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import DocsPage from './pages/DocsPage';
import BenchmarkPage from './pages/BenchmarkPage';
import ProofPage from './pages/ProofPage';
import TrackingPage from './pages/TrackingPage';

import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import RoleSelectionPage from './pages/LoginPage';
import Login from './pages/Login';
import CarrierDashboard from './pages/CarrierDashboard';
import { setAuthToken } from './lib/api';

// Auth is optional (see main.jsx). Without a Clerk key there is no ClerkProvider,
// and calling useAuth() would throw and take down every page — including the
// public evidence pages that need no login. Rendered only when Clerk is configured.
export const CLERK_ENABLED = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

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
      {CLERK_ENABLED && <TokenManager />}
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
          <Route path="/track/:id" element={<TrackingPage />} />
          
          {/* Protected Role Selection Route */}
          <Route path="/select-role" element={
            <>
              <SignedIn>
                <RoleSelectionPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />

          {/* Protected Routes */}
          <Route path="/app/*" element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />
          
          <Route path="/carrier" element={<CarrierDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
