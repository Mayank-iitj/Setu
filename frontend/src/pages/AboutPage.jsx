import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';

export default function AboutPage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="w-full min-h-screen bg-brand-deep-space font-sans selection:bg-brand-primary selection:text-white overflow-x-hidden text-brand-text-primary">
      <Header />
      <div className="pt-32 pb-16 px-8 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
          className="max-w-4xl"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-2 text-brand-primary font-medium mb-6">
            <span className="uppercase tracking-widest text-sm font-semibold">About Setu</span>
          </motion.div>
          
          <motion.h1 variants={fadeUp} className="text-5xl md:text-[84px] font-bold font-display tracking-tighter leading-[1.1] text-white mb-12">
            The SIH 2025 solution for road freight.
          </motion.h1>

          <motion.div variants={fadeUp} className="glass-card p-10 mt-8 group relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <h2 className="text-3xl font-semibold font-display text-white mb-6 relative z-10">LoadSetu by Team ZION</h2>
             <p className="text-xl text-brand-text-secondary leading-relaxed mb-6 relative z-10">
               Built for the Smart India Hackathon 2025 (PS 2), LoadSetu is a permit-aware truck-load matching platform designed to eliminate the massive inefficiencies in India's logistics sector. 
             </p>
             <p className="text-lg text-brand-text-muted leading-relaxed relative z-10">
               By treating permit eligibility as a hard constraint and leveraging VAHAN, AIS-140 GPS, and NIC e-Way Bills, our matching engine ensures an ineligible truck never reaches the shortlist. We rank capacity on net margin after empty kilometers, tolls, and detention—not just headline freight rates.
             </p>
             
             <div className="mt-8 pt-8 border-t border-brand-border/50 relative z-10">
                <h3 className="text-sm uppercase tracking-widest text-brand-primary font-bold mb-4">Technical Approach</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium">
                  <div className="flex flex-col gap-1 text-white"><span className="text-brand-text-muted text-xs">Client</span>React, Next.js, Flutter</div>
                  <div className="flex flex-col gap-1 text-white"><span className="text-brand-text-muted text-xs">Services</span>NestJS, FastAPI, Kafka</div>
                  <div className="flex flex-col gap-1 text-white"><span className="text-brand-text-muted text-xs">Data</span>PostGIS, Redis, TimescaleDB</div>
                  <div className="flex flex-col gap-1 text-white"><span className="text-brand-text-muted text-xs">Routing</span>OSRM, OR-Tools, Drools</div>
                </div>
             </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
             <div className="ghost-border rounded-xl p-8 bg-brand-surface-muted/30">
                <h3 className="text-[48px] font-display font-bold text-white mb-2">28-43%</h3>
                <p className="text-brand-text-muted">Of Indian truck-kilometers run empty. Our core metric to reduce.</p>
             </div>
             <div className="ghost-border rounded-xl p-8 bg-brand-surface-muted/30">
                <h3 className="text-[48px] font-display font-bold text-white mb-2">12.5M</h3>
                <p className="text-brand-text-muted">Trucks on Indian roads, managed by 3.5 million operators.</p>
             </div>
          </motion.div>

          {/* Feasibility & Risks */}
          <motion.div variants={fadeUp} className="mt-20">
            <h2 className="text-3xl font-semibold font-display text-white mb-8">Feasibility & Risks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { risk: "Brokers see the platform as a threat and withhold loads", strategy: "Brokers onboarded as commission-earning partners inside the app, not bypassed" },
                { risk: "Low digital literacy and many languages among drivers", strategy: "Three-tap booking, vernacular interface, voice prompts and an IVR fallback" },
                { risk: "Fake postings, disputed weights and payment default", strategy: "VAHAN-verified KYC, two-way ratings, escrow released only on e-POD" },
                { risk: "Highway dead zones break live tracking and updates", strategy: "Offline-first app with store-and-forward sync plus SMS fallback" },
                { risk: "Two-sided cold start — no trucks without loads, no loads without trucks", strategy: "Corridor-first launch: saturate one dense lane until liquidity, then expand" }
              ].map((item, idx) => (
                <div key={idx} className="glass-card p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-brand-surface-muted/50 flex items-center justify-center text-brand-primary font-bold text-sm">{idx + 1}</span>
                    <h4 className="text-white font-medium text-sm leading-tight">{item.risk}</h4>
                  </div>
                  <div className="pl-11">
                    <p className="text-brand-text-secondary text-sm leading-relaxed">{item.strategy}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Phased Rollout */}
          <motion.div variants={fadeUp} className="mt-20">
            <h2 className="text-3xl font-semibold font-display text-white mb-8">Phased Rollout</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="ghost-border bg-brand-surface-muted/30 p-8 rounded-xl flex flex-col gap-4">
                <span className="text-brand-primary font-bold tracking-widest text-xs uppercase">Phase 1 • 0–3 months</span>
                <p className="text-brand-text-secondary text-sm leading-relaxed">One corridor, one commodity. Pilot fleet, brokers onboarded, matching and tracking proven.</p>
              </div>
              <div className="ghost-border bg-brand-surface-muted/30 p-8 rounded-xl flex flex-col gap-4">
                <span className="text-brand-primary font-bold tracking-widest text-xs uppercase">Phase 2 • 3–9 months</span>
                <p className="text-brand-text-secondary text-sm leading-relaxed">Three states. Backhaul pairing at scale, detention analytics, escrow settlement live.</p>
              </div>
              <div className="ghost-border bg-brand-surface-muted/30 p-8 rounded-xl flex flex-col gap-4">
                <span className="text-brand-primary font-bold tracking-widest text-xs uppercase">Phase 3 • 9–18 months</span>
                <p className="text-brand-text-secondary text-sm leading-relaxed">National corridors. Financing, insurance and fuel partners layered on verified trip history.</p>
              </div>
            </div>
          </motion.div>

          {/* Research and References */}
          <motion.div variants={fadeUp} className="mt-20 pt-12 border-t border-brand-border/50">
            <h2 className="text-2xl font-semibold font-display text-white mb-8">Sources behind every figure and design decision</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: "NITI AAYOG & RMI", desc: "Fast Tracking Freight in India: A Roadmap for Clean and Cost-Effective Goods Transport", extra: "Empty running of 28–43%, daily utilisation of 250–400 km, logistics cost at 14% of GDP." },
                { title: "RMI INDIA", desc: "Transforming Trucking in India", extra: "Road carries about 70% of national freight and accounts for more than a quarter of annual oil imports." },
                { title: "REDSEER STRATEGY CONSULTANTS", desc: "Unlocking Growth in India's Fragmented Trucking Sector", extra: "About 12.5 million trucks run by 3.5 million operators; roughly 75% own fewer than five vehicles." },
                { title: "TCI – IIM CALCUTTA", desc: "Operational Efficiency of National Highways for Freight Transportation", extra: "Corridor-level stoppage and detention measurement." },
                { title: "MORTH · ARAI", desc: "AIS-140 Vehicle Location Tracking Device standard", extra: "Mandated telematics on national-permit and public service vehicles." },
                { title: "NIC · MINISTRY OF ROAD TRANSPORT", desc: "e-Way Bill System and VAHAN / Parivahan public services", extra: "Consignment records, registration, permit class and fitness status." }
              ].map((ref, idx) => (
                <div key={idx} className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-brand-surface-muted/30 flex items-center justify-center shrink-0 mt-1">
                     <span className="text-brand-text-muted text-xs font-bold">{idx + 1}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                     <h4 className="text-white font-bold tracking-widest text-xs uppercase">{ref.title}</h4>
                     <span className="text-brand-text-secondary text-sm italic">{ref.desc}</span>
                     <p className="text-brand-text-muted text-xs leading-relaxed mt-1">{ref.extra}</p>
                   </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
