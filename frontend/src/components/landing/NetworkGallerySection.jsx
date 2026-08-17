import React from 'react';
import { motion } from 'framer-motion';
import DriftWall from './DriftWall';

// Logistics & infrastructure imagery from Unsplash (free, no auth required)
const SETU_ITEMS = [
  { image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop', title: 'Highway Corridor' },
  { image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop', title: 'Fleet Dispatch' },
  { image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop', title: 'Long Haul' },
  { image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&h=400&fit=crop', title: 'Night Logistics' },
  { image: 'https://images.unsplash.com/photo-1612630741022-b29ec3f5f8de?w=600&h=400&fit=crop', title: 'Freight Network' },
  { image: 'https://images.unsplash.com/photo-1530521954074-e64f4810b5a9?w=600&h=400&fit=crop', title: 'Route Planning' },
  { image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop', title: 'Cargo Bay' },
  { image: 'https://images.unsplash.com/photo-1615840287214-7ff58936c4cf?w=600&h=400&fit=crop', title: 'Supply Chain' },
  { image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=400&fit=crop', title: 'Distribution Hub' },
  { image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop', title: 'Urban Delivery' },
  { image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&h=400&fit=crop', title: 'AI Control' },
  { image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop', title: 'Intermodal' },
  { image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop', title: 'Empty Miles' },
  { image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&h=400&fit=crop', title: 'Depot Hub' },
  { image: 'https://images.unsplash.com/photo-1612630741022-b29ec3f5f8de?w=600&h=400&fit=crop', title: 'Smart Routes' },
];

export default function NetworkGallerySection() {
  return (
    <section className="relative w-full bg-brand-deep-space overflow-hidden border-t border-brand-border">
      {/* Background DriftWall — full-bleed */}
      <div style={{ height: 560, position: 'relative' }}>
        <DriftWall
          items={SETU_ITEMS}
          columns={6}
          tileWidth={210}
          tileHeight={138}
          gap={14}
          radius={12}
          tilt={14}
          turn={-10}
          perspective={1400}
          depth={100}
          speed={36}
          direction="up"
          variance={0.5}
          parallax={0.5}
          lift={60}
          fade={0.55}
          dim={0.45}
          grayscale={true}
          overlayColor="#0a0010"
        />

        {/* Centered overlay text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="flex flex-col items-center gap-6 max-w-2xl"
          >
            <span className="uppercase tracking-widest text-xs font-semibold text-brand-primary flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                <path d="M12 4v16m-8-8h16" strokeWidth="2" strokeLinecap="round" />
              </svg>
              The Network
            </span>

            <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tighter text-white leading-tight">
              Every truck.<br />Every corridor.
            </h2>

            <p className="text-brand-text-muted text-lg leading-relaxed max-w-lg">
              Setu's AI sees the entire Gujarat–NCR freight network in real time — matching empty legs to live loads before deadhead ever happens.
            </p>

            <a
              href="/app"
              className="pointer-events-auto mt-2 inline-flex items-center gap-2 bg-white text-black px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-brand-primary hover:text-white transition-all duration-300"
            >
              View Live Network
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                <path d="M7 17L17 7M17 7H7M17 7V17" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </a>
          </motion.div>
        </div>

        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-deep-space to-transparent pointer-events-none z-20" />
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-brand-deep-space to-transparent pointer-events-none z-20" />
      </div>
    </section>
  );
}
