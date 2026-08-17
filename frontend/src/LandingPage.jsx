import React from 'react';
import Header from './components/landing/Header';
import HeroSection from './components/landing/HeroSection';
import PartnersSection from './components/landing/PartnersSection';
import StatsSection from './components/landing/StatsSection';
import NetworkGallerySection from './components/landing/NetworkGallerySection';
import ProjectsSection from './components/landing/ProjectsSection';
import TestimonialsSection from './components/landing/TestimonialsSection';
import MacroImpactSection from './components/landing/MacroImpactSection';
import ServicesSection from './components/landing/ServicesSection';
import Footer from './components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-brand-deep-space font-sans selection:bg-brand-primary selection:text-white overflow-x-hidden">
      <Header />
      <HeroSection />
      <PartnersSection />
      <StatsSection />
      <NetworkGallerySection />
      <ProjectsSection />
      <TestimonialsSection />
      <MacroImpactSection />
      <ServicesSection />
      <Footer />
    </div>
  );
}


