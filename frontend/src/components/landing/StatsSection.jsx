import React from 'react';
import { motion } from 'framer-motion';

export default function StatsSection() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <section className="bg-brand-deep-space w-full py-32 px-8 relative text-brand-text-primary border-t border-brand-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
        
        {/* Left Side: Copy */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
          className="md:w-1/2 flex flex-col items-start gap-8"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-2 text-brand-text-muted font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-brand-primary">
              <path d="M12 4v16m-8-8h16" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="uppercase tracking-[0.2em] text-xs font-bold text-white">The Setu Advantage</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl lg:text-[52px] font-bold tracking-tight leading-tight text-white font-display">
            We turn idle fleet capacity into dynamic, scalable profit centers
          </motion.h2>
          <motion.button variants={fadeUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pointer-events-auto mt-4 inline-flex items-center gap-2 bg-brand-primary text-brand-deep-space px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-white transition-all duration-300">
            Read Our Methodology
          </motion.button>
        </motion.div>

        {/* Right Side: Stats */}
        <div className="md:w-1/2 flex flex-col md:flex-row gap-12 relative w-full h-full pt-8">
          {/* Connector Line */}
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
            viewport={{ once: true }}
            className="hidden lg:block absolute top-12 -left-32 w-64 h-[1px] bg-brand-border origin-left"
          >
             <div className="absolute right-0 -top-[5px] w-3 h-3 border-2 border-brand-primary rounded-full bg-brand-deep-space"></div>
          </motion.div>
          
          {/* Circular Graphic */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.5 }}
            className="w-48 h-48 rounded-full flex items-center justify-center relative flex-shrink-0"
          >
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 w-full h-full"
            >
              <div className="absolute inset-0 rounded-full border border-brand-border" style={{ backgroundImage: "repeating-conic-gradient(from 0deg, rgba(198, 191, 255,0.1) 0deg 2deg, transparent 2deg 10deg)" }}></div>
            </motion.div>
            <div className="bg-black/40 backdrop-blur-md rounded-full w-40 h-40 flex flex-col items-center justify-center z-10 border border-brand-border/50">
              <span className="text-5xl font-bold font-display text-brand-primary">40k+</span>
              <span className="text-[10px] uppercase tracking-widest text-brand-text-muted mt-1 font-semibold">Live Trucks</span>
            </div>
          </motion.div>

          {/* Glass Card */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            viewport={{ once: true }}
            className="glass-card p-12 flex flex-col justify-between h-[400px] w-full max-w-sm ml-auto relative overflow-hidden group border border-brand-border/50 bg-[#121414]/80 backdrop-blur-xl"
          >
            <motion.div 
               className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            ></motion.div>
            <h3 className="text-[84px] font-bold tracking-tighter relative z-10 text-white font-display">&lt;50<span className="text-4xl text-brand-primary">ms</span></h3>
            <p className="text-brand-text-secondary font-medium leading-relaxed relative z-10">
              Average latency to compute pricing, match capacity, and clear transactions in our double auction exchange
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
