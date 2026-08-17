import React from 'react';
import { motion } from 'framer-motion';

export default function ServicesSection() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section className="bg-brand-deep-space w-full py-32 px-8 text-brand-text-primary overflow-hidden border-t border-brand-border">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="max-w-7xl mx-auto flex flex-col items-center text-center gap-8"
      >
        
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-brand-text-muted font-medium">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-brand-primary">
            <path d="M12 4v16m-8-8h16" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="uppercase tracking-[0.2em] text-xs font-bold text-white">Target Audience</span>
        </motion.div>
        
        <motion.h2 variants={itemVariants} className="text-4xl md:text-[52px] font-bold tracking-tight leading-tight text-white font-display">
          Impact beyond the<br/>balance sheet
        </motion.h2>

        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full"
        >
          {/* Truck Owner */}
          <motion.div variants={itemVariants} className="glass-card p-10 flex flex-col items-start text-left h-[420px] group border border-brand-border hover:border-brand-primary/50 transition-colors relative overflow-hidden bg-gradient-to-b from-[#121414] to-brand-deep-space">
            <div className="w-14 h-14 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center mb-8 text-brand-primary group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth="2">
                <path d="M5 12h14M5 12l4-4m-4 4l4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-display">Truck Owner</h3>
            <ul className="flex flex-col gap-3 text-brand-text-secondary text-sm flex-1">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>Return load confirmed before outbound trip is unloaded</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>More paid kilometers from the same diesel</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>Payment released instantly on e-POD via escrow</span>
              </li>
            </ul>
            <div className="w-full h-1 bg-gradient-to-r from-brand-primary to-transparent opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 transition-opacity"></div>
          </motion.div>

          {/* Fleet Operator */}
          <motion.div variants={itemVariants} className="glass-card p-10 flex flex-col items-start text-left h-[420px] group border border-brand-border hover:border-brand-primary/50 transition-colors relative overflow-hidden bg-gradient-to-b from-[#121414] to-brand-deep-space">
            <div className="w-14 h-14 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center mb-8 text-brand-primary group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 9h18M9 21V9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-display">Fleet Operator</h3>
            <ul className="flex flex-col gap-3 text-brand-text-secondary text-sm flex-1">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>One console for trucks, drivers, permits, and documents</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>Allocation by dynamic rule engine instead of memory</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>Fewer idle days and less unplanned detention</span>
              </li>
            </ul>
            <div className="w-full h-1 bg-gradient-to-r from-brand-primary to-transparent opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 transition-opacity"></div>
          </motion.div>

          {/* Shipper */}
          <motion.div variants={itemVariants} className="glass-card p-10 flex flex-col items-start text-left h-[420px] group border border-brand-border hover:border-brand-primary/50 transition-colors relative overflow-hidden bg-gradient-to-b from-[#121414] to-brand-deep-space">
            <div className="w-14 h-14 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center mb-8 text-brand-primary group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-display">Shipper</h3>
            <ul className="flex flex-col gap-3 text-brand-text-secondary text-sm flex-1">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>A verified, permit-eligible truck assigned in minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>Live ETA and geofenced milestones instead of status calls</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 flex-shrink-0"></div>
                <span>Auditable digital trail: e-Way Bill, e-POD, and weights</span>
              </li>
            </ul>
            <div className="w-full h-1 bg-gradient-to-r from-brand-primary to-transparent opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 transition-opacity"></div>
          </motion.div>

        </motion.div>
      </motion.div>
    </section>
  );
}
