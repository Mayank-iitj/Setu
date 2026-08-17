import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Activity, Settings, User, LogOut, Shield, CheckCircle, BarChart2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlowingButton from './GlowingButton';
import { useAuth } from '../contexts/AuthContext';
import { Show, SignInButton, UserButton } from '@clerk/react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleOptimize = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const navLinks = [
    { name: 'Live Console', path: '/app', icon: Activity },
    { name: 'Exchange', path: '/app/exchange', icon: Network },
    { name: 'Analytics', path: '/app/analytics', icon: BarChart2 },
    { name: 'Config', path: '/app/config', icon: Settings },
  ];

  return (
    <>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-5xl pointer-events-auto"
      >
        <div className="glass-card px-6 py-4 flex items-center justify-between shadow-2xl relative">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-brand-primary/50 transition-shadow">
              <Network className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-brand-primary transition-colors">SETU</span>
          </Link>
          
          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link 
                  key={link.name}
                  to={link.path} 
                  className={`flex items-center gap-2 transition-colors relative pb-1 ${isActive ? 'text-brand-primary' : 'text-brand-text-muted hover:text-white'}`}
                >
                  <Icon className="w-4 h-4"/> 
                  {link.name}
                  {isActive && (
                    <motion.div 
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4 relative">
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/select-role">
                <button className="text-sm font-semibold text-white hover:text-brand-primary transition-colors">Sign In</button>
              </SignInButton>
            </Show>
            
            <Show when="signed-in">
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded-full border border-brand-primary/50" } }} />
            </Show>

            <GlowingButton 
              onClick={handleOptimize}
              className="hidden sm:flex px-4 py-2 text-sm text-white font-bold !bg-black hover:!bg-brand-primary transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-brand-border"
            >
              Optimize Now
            </GlowingButton>
          </div>
        </div>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[60] glass-card border border-brand-primary/50 bg-brand-deep-space/90 px-6 py-3 shadow-[0_0_20px_rgba(126,114,231,0.3)] flex items-center gap-3 rounded-full"
          >
            <CheckCircle className="w-5 h-5 text-brand-primary" />
            <span className="text-sm font-semibold text-white">Global Network Optimisation Triggered!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
