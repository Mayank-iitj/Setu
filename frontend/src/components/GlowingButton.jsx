import React from 'react';
import { motion } from 'framer-motion';

export default function GlowingButton({ children, onClick, className = '' }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative inline-flex items-center justify-center px-6 py-3 font-semibold transition-all duration-200 bg-brand-primary text-white rounded-full hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${className}`}
    >
      <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none"></span>
      <span className="relative">{children}</span>
    </motion.button>
  );
}
