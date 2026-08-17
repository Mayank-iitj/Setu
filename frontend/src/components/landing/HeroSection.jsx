import React from 'react';
import { motion } from 'framer-motion';
import Aurora from './Aurora';
import DepthText from './DepthText';

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen bg-brand-deep-space flex items-center justify-center overflow-hidden pt-20">
      {/* Background Aurora */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen">
        <Aurora 
          colorStops={["#23038b", "#c6bfff", "#5a4dc0"]}
          blend={0.6}
          amplitude={1.2}
          speed={0.6}
        />
      </div>
      
      {/* Central Image */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute z-10 w-[600px] h-[600px] rounded-full flex items-center justify-center opacity-80 mix-blend-screen pointer-events-none"
      >
        <img src="/hero_image.avif" alt="AI Core" className="object-cover w-full h-full rounded-full" />
      </motion.div>

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-8 flex justify-between items-center mt-20">
        
        {/* Left Text */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md text-brand-text-secondary font-medium text-lg md:text-xl leading-relaxed tracking-wide"
        >
          Empowering logistics through intelligent automation and scalable AI-driven digital systems
        </motion.div>

        {/* Right Card */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-card p-6 w-80 text-white"
        >
          <p className="text-sm text-brand-text-muted mb-8 font-medium">Explore a curated selection of our selected projects</p>
          <div className="flex justify-between items-end">
            <span className="text-4xl font-light font-display">12+</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 mb-1 text-brand-primary">
              <path d="M7 17L17 7M17 7H7M17 7V17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Large 3D Text at Bottom */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-4 md:bottom-8 left-0 right-0 w-full flex justify-center z-30 pointer-events-auto"
      >
        <DepthText
          text="SETU"
          layers={32}
          depth={3}
          faceColor="#f8fafc"
          depthColor="#2a1391"
          tilt={10}
          pointerTracking={true}
          smoothing={0.12}
          perspective={1100}
          autoOrbit={true}
          orbitSpeed={0.25}
          fontSize="clamp(6rem, 18vw, 14rem)"
          fontWeight={900}
          shadow={true}
          className="mix-blend-overlay opacity-90"
        />
      </motion.div>
    </section>
  );
}
