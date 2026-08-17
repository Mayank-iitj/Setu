import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, CheckCircle, Upload, LogOut, Search, MapPin, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BorderGlow from '../components/landing/BorderGlow';
import GlowingButton from '../components/GlowingButton';

export default function CarrierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bidding, setBidding] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [podUploading, setPodUploading] = useState(false);
  const [podSuccess, setPodSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBid = async () => {
    setBidding(true);
    try {
      const res = await fetch('http://localhost:3000/exchange/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId: 'BND-1042', amount: 14500 })
      });
      if (res.ok) {
        setBidding(false);
        setBidSuccess(true);
        setTimeout(() => setBidSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
      setBidding(false);
    }
  };

  const handlePodUpload = async () => {
    setPodUploading(true);
    try {
      const res = await fetch('http://localhost:3000/exchange/pod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: 'ASN-7732' })
      });
      if (res.ok) {
        setPodUploading(false);
        setPodSuccess(true);
        setTimeout(() => setPodSuccess(false), 4000);
      }
    } catch (e) {
      console.error(e);
      setPodUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-deep-space text-brand-text-primary p-6 font-sans">
      
      {/* Carrier Navbar */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center border border-cyan-400/50">
            <Truck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white tracking-tight">Driver Portal</h1>
            <p className="text-xs text-brand-text-muted">Welcome back, {user?.name || 'Driver'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-brand-text-muted hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Active Job & POD */}
        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <BorderGlow glowColor="40 240 255" backgroundColor="#0a0a0f" glowIntensity={0.6}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-4">
                  <h2 className="font-bold text-lg text-white">Current Assignment</h2>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded">In Transit</span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-cyan-400 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-white">Ahmedabad Hub</p>
                      <p className="text-xs text-brand-text-muted">Origin</p>
                    </div>
                  </div>
                  <div className="w-0.5 h-6 bg-brand-border ml-2.5"></div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-primary mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-white">Delhi NCR (Gurgaon)</p>
                      <p className="text-xs text-brand-text-muted">Destination</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-brand-deep-space/50 rounded-lg border border-brand-border flex gap-4 text-xs">
                  <div className="flex-1">
                    <p className="text-brand-text-muted font-bold uppercase tracking-wider mb-2">Permit & Compliance</p>
                    <p className="text-green-400 flex items-center gap-1 font-semibold"><CheckCircle className="w-3 h-3" /> RC & Fitness Valid</p>
                    <p className="text-green-400 flex items-center gap-1 font-semibold mt-1"><CheckCircle className="w-3 h-3" /> All Route States Covered</p>
                  </div>
                  <div className="w-px bg-brand-border"></div>
                  <div className="flex-1">
                    <p className="text-brand-text-muted font-bold uppercase tracking-wider mb-2">Driver Status</p>
                    <p className="text-white font-semibold">Duty: <span className="text-cyan-400">4h 15m / 9h max</span></p>
                    <p className="text-white font-semibold mt-1">Status: <span className="text-cyan-400">Available</span></p>
                  </div>
                </div>

                <div className="p-4 bg-brand-surface rounded-lg border border-brand-border">
                  <h3 className="text-xs font-bold text-brand-text-muted uppercase mb-3">Proof of Delivery</h3>
                  <button 
                    onClick={handlePodUpload}
                    disabled={podUploading || podSuccess}
                    className="w-full py-3 border-2 border-dashed border-cyan-400/50 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-cyan-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {podUploading ? (
                      <span className="text-sm text-cyan-400 font-semibold animate-pulse">Uploading securely...</span>
                    ) : podSuccess ? (
                      <span className="text-sm text-green-400 font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> e-POD Verified</span>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm text-white font-semibold">Upload Signed Document</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </div>

        {/* Right Column: Bidding */}
        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <BorderGlow glowColor="126 114 231" backgroundColor="#0a0a0f" glowIntensity={0.6}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-4">
                  <h2 className="font-bold text-lg text-white">Combinatorial Backhaul</h2>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-brand-text-muted" />
                    <span className="text-xs text-brand-text-muted">Scanning for Return Loads</span>
                  </div>
                </div>
                
                <div className="mb-6 p-4 bg-brand-primary/10 border border-brand-primary/30 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-brand-primary" /> Bundle #1042
                    </h3>
                    <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded font-bold">94% Match</span>
                  </div>
                  <p className="text-sm text-brand-text-secondary mb-3">Delhi NCR → Ahmedabad (20T Steel Coils)</p>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-brand-text-muted uppercase">Recommended Bid</p>
                      <p className="text-xl font-bold font-display text-white">₹14,500</p>
                    </div>
                    <GlowingButton 
                      onClick={handleBid} 
                      disabled={bidding || bidSuccess}
                      className="px-4 py-2 text-sm bg-brand-primary text-white"
                    >
                      {bidding ? 'Submitting...' : bidSuccess ? 'Bid Accepted!' : 'Submit Marginal Bid'}
                    </GlowingButton>
                  </div>
                </div>

                <div className="p-4 bg-brand-surface border border-brand-border rounded-lg opacity-50 grayscale">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Package className="w-4 h-4 text-brand-text-muted" /> Bundle #1088
                    </h3>
                    <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded font-bold">42% Match</span>
                  </div>
                  <p className="text-sm text-brand-text-secondary">Delhi NCR → Jaipur (5T Electronics)</p>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
