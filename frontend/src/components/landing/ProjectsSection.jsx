import React from 'react';
import { motion } from 'framer-motion';

export default function ProjectsSection() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
  };

  const projects = [
    {
      title: "Delhi-Mumbai Corridor Optimization",
      category: "Network Efficiency",
      image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop",
      description: "Reduced empty miles by 34% across 400+ daily truck trips on India's busiest freight corridor by dynamically matching backhauls in real-time.",
      metric: "34% Reduction"
    },
    {
      title: "Real-time Spot Exchange",
      category: "Market Dynamics",
      image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=600&fit=crop",
      description: "Deployed an AI-driven double auction exchange, instantly matching spot loads and carrier capacity during peak festival seasons.",
      metric: "<50ms Latency"
    },
    {
      title: "Predictive Fleet Positioning",
      category: "AI Forecasting",
      image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&h=600&fit=crop",
      description: "Anticipated demand spikes in the NCR region up to 48 hours in advance, pre-positioning assets and slashing carrier deadhead times.",
      metric: "92% Accuracy"
    }
  ];

  return (
    <section className="bg-brand-deep-space w-full py-32 px-8 relative overflow-hidden border-t border-brand-border/40">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="max-w-7xl mx-auto flex flex-col gap-12 relative z-10"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex flex-col gap-4">
            <motion.div variants={itemVariants} className="flex items-center gap-2 text-brand-text-muted font-medium">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-brand-primary">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="uppercase tracking-[0.2em] text-xs font-bold text-white">Featured Deployments</span>
            </motion.div>
            <motion.h2 variants={itemVariants} className="text-4xl md:text-[52px] font-bold tracking-tight text-white leading-tight font-display">
              AI deployments that<br/>drive real impact
            </motion.h2>
          </div>
          <motion.a 
            href="/app"
            variants={itemVariants} 
            className="pointer-events-auto mt-2 inline-flex items-center gap-2 bg-transparent text-white border border-white/20 px-7 py-3.5 rounded-full font-semibold text-sm hover:border-brand-primary hover:bg-brand-primary/10 transition-all duration-300"
          >
            View Live Exchange
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {projects.map((project, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants} 
              whileHover={{ y: -8 }} 
              className="group cursor-pointer rounded-[20px] overflow-hidden bg-brand-surface border border-brand-border hover:border-brand-primary/40 transition-all duration-500 flex flex-col shadow-2xl relative"
            >
              {/* Image Section */}
              <div className="h-64 w-full overflow-hidden relative bg-black">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-surface to-transparent opacity-100"></div>
                
                {/* Metric Badge */}
                <div className="absolute bottom-4 left-6 bg-brand-primary/10 backdrop-blur-md border border-brand-primary/30 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                  <span className="text-xs font-semibold text-brand-primary tracking-widest uppercase">{project.metric}</span>
                </div>
              </div>
              
              {/* Content Section */}
              <div className="p-8 pt-4 flex flex-col flex-1 z-10 relative">
                <p className="text-brand-text-muted text-[10px] font-bold tracking-[0.2em] uppercase mb-3">{project.category}</p>
                <h3 className="text-2xl font-bold text-white leading-tight mb-4 group-hover:text-brand-primary transition-colors font-display">{project.title}</h3>
                <p className="text-brand-text-secondary text-sm leading-relaxed mb-8 flex-1">
                  {project.description}
                </p>
                
                <div className="flex items-center gap-2 text-white font-semibold text-sm group-hover:text-brand-primary transition-colors mt-auto">
                  Read Case Study
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 transform group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

