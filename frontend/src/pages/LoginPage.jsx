import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, Network } from 'lucide-react';
import Aurora from '../components/landing/Aurora';
import BorderGlow from '../components/landing/BorderGlow';
import DotGrid from '../components/landing/DotGrid';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    if (role === 'shipper') {
      navigate('/app');
    } else {
      navigate('/carrier');
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-deep-space flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Aurora colorStops={['#c6bfff', '#7e72e7', '#2a1391']} blend={0.6} speed={0.4} />
      </div>
      
      {/* Interactive Dot Grid overlay */}
      <div className="absolute inset-0 z-0 opacity-70 mix-blend-screen pointer-events-auto">
        <DotGrid
          dotSize={10}
          gap={15}
          baseColor="#5227FF"
          activeColor="#00f0ff"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      <div className="absolute inset-0 bg-brand-deep-space/60 z-0 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md pointer-events-auto"
      >
        <BorderGlow glowColor="126 114 231" backgroundColor="#0a0a0f" glowIntensity={0.8}>
          <div className="p-8 flex flex-col items-center text-center">
            
            <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center shadow-lg shadow-brand-primary/30">
              <Network className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-extrabold font-display text-white mb-2 tracking-tight">Access ZION</h1>
            <p className="text-brand-text-muted text-sm mb-8">
              Secured via Keycloak Enterprise SSO
            </p>

            <div className="flex flex-col gap-4 w-full">
              <button 
                onClick={() => handleLogin('shipper')}
                className="group relative w-full flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-surface hover:border-brand-primary hover:bg-brand-primary/10 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Shipper Login</h3>
                    <p className="text-xs text-brand-text-muted">Post loads & analytics</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => handleLogin('carrier')}
                className="group relative w-full flex items-center justify-between p-4 rounded-xl border border-brand-border bg-brand-surface hover:border-cyan-400 hover:bg-cyan-400/10 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-cyan-400/20 rounded-lg text-cyan-400 group-hover:bg-cyan-400 group-hover:text-brand-deep-space transition-colors">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Carrier / Driver Login</h3>
                    <p className="text-xs text-brand-text-muted">Accept bids & tracking</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 text-xs text-brand-text-muted flex items-center gap-2 justify-center">
              <ShieldCheck className="w-3 h-3 text-green-400" />
              <span>RBAC Enforced by Central Gateway</span>
            </div>
          </div>
        </BorderGlow>
      </motion.div>
    </div>
  );
}
