import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="w-full relative overflow-hidden bg-brand-deep-space pt-48 pb-12">
      {/* Massive Background Gradient */}
      <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-brand-deep-space via-brand-primary/20 to-[#0a0a0a] z-0 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-8 flex flex-col items-center">
        
        {/* Call to Action Section */}
        <div className="flex flex-col items-center text-center gap-6 mb-32 max-w-3xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-[64px] font-bold font-display tracking-tight text-white leading-tight"
          >
            LoadSetu: Permit-Aware<br/>Truck-Load Matching
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-brand-text-secondary text-lg mt-2 mb-4"
          >
            The SIH 2025 solution for Smart Fleet Coordination & Logistics Management, eliminating empty miles and automating freight compliance.
          </motion.p>
          <motion.a 
            href="/app"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 button-primary bg-brand-primary text-brand-deep-space hover:bg-white border-none mt-2"
          >
            Launch Web Console
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.a>
        </div>

        {/* Footer Links Section */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-start gap-16 border-b border-white/10 pb-12">
          
          {/* Logo & Description */}
          <div className="flex flex-col gap-6 max-w-xs">
            <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity text-white">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-brand-primary">
                <path d="M4 12H20M12 4V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-2xl font-bold tracking-tight font-display">SETU / ZION</span>
            </Link>
            <p className="text-brand-text-secondary text-sm leading-relaxed font-medium">
              A Smart India Hackathon 2025 Prototype by Team ZION. Transforming India's fragmented trucking sector with AI and verifiable data.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-24 text-sm w-full lg:w-auto">
            {/* Column 1 */}
            <div className="flex flex-col gap-4">
              <span className="text-white font-bold tracking-widest text-xs uppercase mb-2">Platform</span>
              <Link to="/app" className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors">Shipper Web Console</Link>
              <span className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors cursor-pointer">Driver App (Flutter)</span>
              <span className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors cursor-pointer">Matching Engine (FastAPI)</span>
              <span className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors cursor-pointer">Event Backbone (Kafka)</span>
            </div>
            
            {/* Column 2 */}
            <div className="flex flex-col gap-4">
              <span className="text-white font-bold tracking-widest text-xs uppercase mb-2">Integrations</span>
              <span className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors cursor-pointer">VAHAN Verification</span>
              <span className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors cursor-pointer">AIS-140 GPS Feed</span>
              <span className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors cursor-pointer">NIC e-Way Bill</span>
              <span className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors cursor-pointer">UPI Escrow Settlement</span>
            </div>

            {/* Column 3 - Get in touch */}
            <div className="flex flex-col gap-4 col-span-2 md:col-span-1">
              <span className="text-white font-bold tracking-widest text-xs uppercase mb-2">SIH 2025</span>
              <span className="text-brand-text-secondary font-medium">Problem Statement ID: PS 2</span>
              <span className="text-brand-text-secondary font-medium">Theme: Transportation & Logistics</span>
              <span className="text-brand-text-secondary font-medium">Category: Software</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="w-full flex justify-between items-center pt-8 text-xs text-brand-text-muted font-medium">
          <p>© 2026 Team ZION. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-white cursor-pointer transition-colors">GitHub Repository</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
