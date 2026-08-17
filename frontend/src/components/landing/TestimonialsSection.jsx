import React from 'react';
import { motion } from 'framer-motion';
import BorderGlow from './BorderGlow';
import RotatingText from './RotatingText';

export default function TestimonialsSection() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const stats = [
    {
      value: "28–43%",
      title: "of Indian truck-kms run empty",
      subtitle: "Compared to USA 13–29% & Europe 15–30%"
    },
    {
      value: "250–400 km",
      title: "covered per truck per day",
      subtitle: "Compared to USA & Europe 700–800 km"
    },
    {
      value: "14%",
      title: "of GDP spent on logistics",
      subtitle: "Compared to developed economies 8–10%"
    },
    {
      value: "75%",
      title: "of operators own < 5 trucks",
      subtitle: "3.5 million operators · 12.5 million trucks"
    }
  ];

  return (
    <section className="bg-brand-deep-space w-full py-32 px-8 border-t border-brand-border relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="max-w-7xl mx-auto flex flex-col items-center gap-16 relative z-10"
      >
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-6">
          <motion.div variants={itemVariants} className="flex items-center gap-2 text-brand-text-muted font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-brand-primary">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="uppercase tracking-[0.2em] text-xs font-bold text-white">The Gap This Closes</span>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-4xl md:text-[52px] font-bold font-display tracking-tight text-white leading-tight text-center flex flex-col items-center gap-2">
            <span>Baseline for Indian</span>
            <RotatingText
              texts={['Road Freight', 'Logistics', 'Supply Chains', 'Operations']}
              mainClassName="px-3 sm:px-4 md:px-5 bg-cyan-400 text-black overflow-hidden py-1 sm:py-2 md:py-3 justify-center rounded-xl inline-flex mt-2"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={3000}
            />
          </motion.h2>
        </div>

        {/* Stats Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants} 
              className="h-[280px] w-full"
            >
              <BorderGlow
                className="w-full h-full"
                backgroundColor="#0a0a0a"
                glowColor="40 80 80"
                glowRadius={40}
                edgeSensitivity={30}
                borderRadius={16}
                animated={false}
                colors={['#c084fc', '#f472b6', '#38bdf8']}
              >
                <div className="p-10 flex flex-col justify-center h-full relative group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                     <span className="text-8xl font-black text-brand-primary font-display">{idx + 1}</span>
                  </div>
                  <h3 className="text-4xl lg:text-5xl font-bold font-display text-white mb-4 z-10">{stat.value}</h3>
                  <p className="text-white font-semibold text-lg leading-snug z-10 mb-2">{stat.title}</p>
                  <p className="text-brand-text-muted text-xs uppercase tracking-widest font-semibold z-10">{stat.subtitle}</p>
                </div>
              </BorderGlow>
            </motion.div>
          ))}
        </motion.div>

      </motion.div>
    </section>
  );
}
