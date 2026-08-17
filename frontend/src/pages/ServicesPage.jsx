import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';

export default function ServicesPage() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const services = [
    {
      title: "1. Onboard",
      desc: "Truck, permit, and licence are auto-verified against VAHAN and DigiLocker databases before entering the ecosystem."
    },
    {
      title: "2. Post",
      desc: "Shippers post loads specifying the origin-destination corridor, tonnage, body type, and delivery time window."
    },
    {
      title: "3. Filter",
      desc: "Our Drools rule engine hard-filters and removes every truck ineligible for that specific route and payload."
    },
    {
      title: "4. Optimise",
      desc: "Survivors are ranked on empty km, ETA, and net margin via OR-Tools. Backhauls are paired instantly."
    },
    {
      title: "5. Execute",
      desc: "Real-time execution with geofenced pickups, live ETA tracking via AIS-140, detention clock, and e-POD capture."
    },
    {
      title: "6. Settle",
      desc: "e-Way Bill closed, UPI escrow automatically released, and trip profit and loss booked digitally."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-brand-deep-space font-sans selection:bg-brand-primary selection:text-white overflow-x-hidden text-brand-text-primary">
      <Header />
      <div className="pt-32 pb-16 px-8 max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col gap-12"
        >
          <div className="max-w-3xl">
            <motion.div variants={itemVariants} className="flex items-center gap-2 text-brand-primary font-medium mb-6">
              <span className="uppercase tracking-widest text-sm font-semibold">Methodology</span>
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-5xl md:text-[64px] font-bold font-display tracking-tight text-white mb-6 leading-tight">
              Process for Implementation
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-brand-text-muted leading-relaxed">
              Explore the technical foundation that powers the LoadSetu ecosystem. From our proprietary permit-filtering rule engine to seamless VAHAN and UPI integrations.
            </motion.p>
          </div>

          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv, idx) => (
              <motion.div key={idx} variants={itemVariants} className="glass-card p-10 group relative overflow-hidden flex flex-col">
                 <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <h3 className="text-[28px] font-semibold font-display text-white mb-4 relative z-10">{srv.title}</h3>
                 <p className="text-base text-brand-text-secondary leading-relaxed relative z-10 flex-1">{srv.desc}</p>
                 <div className="w-full h-1 bg-gradient-to-r from-brand-primary to-transparent opacity-0 group-hover:opacity-100 absolute bottom-0 left-0 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
