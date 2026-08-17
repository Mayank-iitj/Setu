import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hoverEffect = true }) {
  return (
    <motion.div
      className={`glass-card p-6 ${className}`}
      whileHover={hoverEffect ? { y: -5, boxShadow: '0 20px 40px -10px rgba(0, 240, 255, 0.1)' } : {}}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
