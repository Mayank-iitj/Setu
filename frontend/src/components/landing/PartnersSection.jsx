import React from 'react';
import LogoLoop from './LogoLoop';

const partnerLogos = [
  { node: <span className="font-bold text-2xl md:text-3xl text-white/40 tracking-wider font-display uppercase whitespace-nowrap">Tata Motors</span>, title: "Tata Motors" },
  { node: <span className="font-bold text-2xl md:text-3xl text-white/40 tracking-wider font-display uppercase whitespace-nowrap">Mahindra Logistics</span>, title: "Mahindra Logistics" },
  { node: <span className="font-bold text-2xl md:text-3xl text-white/40 tracking-wider font-display uppercase whitespace-nowrap">Delhivery</span>, title: "Delhivery" },
  { node: <span className="font-bold text-2xl md:text-3xl text-white/40 tracking-wider font-display uppercase whitespace-nowrap">Blue Dart</span>, title: "Blue Dart" },
  { node: <span className="font-bold text-2xl md:text-3xl text-white/40 tracking-wider font-display uppercase whitespace-nowrap">Xpressbees</span>, title: "Xpressbees" },
  { node: <span className="font-bold text-2xl md:text-3xl text-white/40 tracking-wider font-display uppercase whitespace-nowrap">Rivigo</span>, title: "Rivigo" },
  { node: <span className="font-bold text-2xl md:text-3xl text-white/40 tracking-wider font-display uppercase whitespace-nowrap">Ecom Express</span>, title: "Ecom Express" },
];

export default function PartnersSection() {
  return (
    <section className="w-full py-16 bg-brand-surface border-t border-brand-border/50 overflow-hidden relative">
      <div className="container mx-auto px-6 mb-10 text-center relative z-10">
        <p className="uppercase tracking-[0.2em] text-xs font-semibold text-brand-primary">Trusted by Logistics Leaders</p>
      </div>
      <div className="relative z-10 w-full overflow-hidden flex items-center justify-center">
        <div className="w-full max-w-7xl">
          <LogoLoop
            logos={partnerLogos}
            speed={40}
            direction="left"
            logoHeight={50}
            gap={80}
            hoverSpeed={10}
            scaleOnHover={true}
            fadeOut={true}
            fadeOutColor="#121414" 
          />
        </div>
      </div>
    </section>
  );
}
