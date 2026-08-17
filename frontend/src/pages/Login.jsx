import React from 'react';
import { SignIn } from '@clerk/react';
import { Network, Check } from 'lucide-react';

export default function Login() {
  return (
    <div className="w-screen h-screen flex">
      {/* Left Side: Dark Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0B0D17] flex-col justify-center px-20 xl:px-32 relative overflow-hidden">
        
        {/* Subtle background gradient / noise can go here if needed */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-primary/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/50 shadow-[0_0_20px_rgba(126,114,231,0.3)]">
              <Network className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">Setu</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight leading-tight">
            Welcome back to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-cyan-400">Setu</span>
          </h1>

          {/* Subtext */}
          <p className="text-brand-text-muted text-lg leading-relaxed mb-12">
            The Cognitive AI Automation platform for intelligent fleet matching, real-time routing, and dynamic logistics execution.
          </p>

          <div className="h-px w-full bg-brand-border/50 mb-8"></div>

          {/* Checkmarks */}
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-brand-text-secondary text-sm font-medium">
              <Check className="w-4 h-4 text-brand-primary" /> Automated Carrier Matching
            </li>
            <li className="flex items-center gap-3 text-brand-text-secondary text-sm font-medium">
              <Check className="w-4 h-4 text-brand-primary" /> Real-time Live Telemetry
            </li>
            <li className="flex items-center gap-3 text-brand-text-secondary text-sm font-medium">
              <Check className="w-4 h-4 text-brand-primary" /> Predictive Route Optimization
            </li>
          </ul>
        </div>
      </div>

      {/* Right Side: Clerk SignIn */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <SignIn routing="path" path="/login" forceRedirectUrl="/select-role" />
      </div>
    </div>
  );
}
