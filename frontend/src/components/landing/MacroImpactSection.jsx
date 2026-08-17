import React from 'react';
import { motion } from 'framer-motion';
import StrokeText from './StrokeText';

export default function MacroImpactSection() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const benefits = [
    {
      title: "Economic",
      desc: "Every point of empty running removed becomes revenue on kilometres that are already being driven — no new asset, no new fuel.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-brand-primary">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      )
    },
    {
      title: "Social",
      desc: "Predictable income and faster settlement for 3.5 million small operators; shorter waiting time and fewer night stops for drivers.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-brand-primary">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Environmental",
      desc: "Fewer empty kilometres means proportionally less diesel and less CO2 — road freight is over a quarter of India's oil imports.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-brand-primary">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="bg-brand-deep-space w-full py-32 px-8">
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="max-w-7xl mx-auto flex flex-col gap-16"
      >
        <div className="flex flex-col gap-6 max-w-3xl">
          <motion.div variants={itemVariants} className="flex items-center gap-2 text-brand-text-muted font-medium mb-4">
            <span className="uppercase tracking-[0.2em] text-xs font-bold text-white">Benefits Beyond the Balance Sheet</span>
          </motion.div>
          <motion.div variants={itemVariants} className="w-full relative h-[80px] md:h-[120px]">
            <StrokeText
              text="Macro-level Impact"
              strokeColor="#8b5cf6"
              fillColor="#ffffff"
              strokeWidth={1.5}
              drawDuration={1.5}
              fillDelay={0.2}
              stagger={0.08}
              ease="power2.out"
              trigger="scroll"
              fillMode="wipe"
              fontSize={72}
              fontWeight={800}
              letterSpacing={-2}
              className="absolute left-0 top-0 w-[200%]"
            />
          </motion.div>
        </div>

        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, idx) => (
            <motion.div key={idx} variants={itemVariants} className="glass-card p-10 flex flex-col gap-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-surface-muted/50 ghost-border flex items-center justify-center">
                {benefit.icon}
              </div>
              <div>
                <h3 className="text-2xl font-semibold font-display text-white mb-3">{benefit.title}</h3>
                <p className="text-brand-text-secondary leading-relaxed font-medium">
                  {benefit.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </motion.div>
    </section>
  );
}
