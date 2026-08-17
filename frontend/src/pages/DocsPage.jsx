import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Search, Menu, X, BookOpen, Code, Lock, Shield, Server, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CodeBlock from '../components/docs/CodeBlock';
import Aurora from '../components/landing/Aurora';

const DOC_SECTIONS = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'api-reference', title: 'API Reference', icon: Code },
  { id: 'authentication', title: 'Authentication', icon: Lock },
  { id: 'security', title: 'Security & Compliance', icon: Shield },
  { id: 'architecture', title: 'Architecture', icon: Server },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 40; // Reduced offset since there's no navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-brand-deep-space font-sans text-white selection:bg-brand-primary selection:text-white relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <Aurora colorStops={['#2a1391', '#7e72e7', '#c6bfff']} blend={0.4} />
      </div>

      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 p-2.5 rounded-xl bg-[#0F111A]/80 border border-brand-border/50 text-brand-text-muted hover:text-white hover:border-brand-primary/50 transition-all backdrop-blur-md shadow-xl group"
        aria-label="Go Back"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Mobile Menu Toggle (Moved next to back button for mobile convenience) */}
      <button 
        className="md:hidden fixed top-6 right-6 z-50 p-2.5 rounded-xl bg-[#0F111A]/80 border border-brand-border/50 text-brand-text-muted hover:text-white transition-all backdrop-blur-md shadow-xl"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 relative z-10 flex">
        
        {/* Sidebar */}
        <aside className={`fixed md:sticky top-24 w-64 shrink-0 h-[calc(100vh-8rem)] overflow-y-auto hidden md:block pr-8 custom-scrollbar`}>
          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-brand-text-muted mb-4">On this page</h4>
              <ul className="space-y-2">
                {DOC_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeSection === section.id 
                            ? 'bg-brand-primary/10 text-brand-primary font-semibold border border-brand-primary/20' 
                            : 'text-brand-text-secondary hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {section.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden fixed top-16 left-0 right-0 bg-brand-deep-space/95 backdrop-blur-xl border-b border-brand-border/50 p-6 z-40"
            >
               <ul className="space-y-2">
                {DOC_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                        activeSection === section.id 
                          ? 'bg-brand-primary/20 text-brand-primary font-bold' 
                          : 'text-brand-text-secondary'
                      }`}
                    >
                      <section.icon className="w-5 h-5" />
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl lg:pl-8 lg:border-l border-brand-border/50">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-24"
          >

            {/* Section 1: Getting Started */}
            <section id="getting-started" className="scroll-mt-32">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 tracking-tight">Getting Started with Setu</h1>
              <p className="text-lg text-brand-text-secondary leading-relaxed mb-8">
                Setu is an AI-driven cognitive logistics platform designed to optimize Indian Road Freight. 
                Our API allows you to integrate dynamic fleet matching, telemetry, and smart routing directly into your enterprise systems.
              </p>

              <div className="glass-card p-6 border-l-4 border-l-cyan-400 bg-cyan-400/5 mb-8 rounded-r-xl">
                <h4 className="flex items-center gap-2 font-bold text-cyan-400 mb-2">
                  <BookOpen className="w-5 h-5" /> Quick Concept
                </h4>
                <p className="text-brand-text-secondary text-sm leading-relaxed">
                  The Setu engine uses highly optimized matching algorithms to ensure that the 28-43% of Indian truck-kms run empty are drastically reduced. You can integrate as a <strong>Shipper</strong> to post loads, or as a <strong>Carrier</strong> to receive telemetry-backed routing.
                </p>
              </div>

              <h3 className="text-2xl font-display font-bold mt-12 mb-4">Installation</h3>
              <p className="text-brand-text-secondary mb-4">Install the Setu Node.js SDK to quickly connect to the exchange:</p>
              
              <CodeBlock 
                language="bash" 
                code="npm install @setu/logistics-sdk" 
              />
            </section>

            {/* Section 2: API Reference */}
            <section id="api-reference" className="scroll-mt-32">
              <h2 className="text-3xl font-display font-bold mb-6 flex items-center gap-3">
                <Code className="text-brand-primary" /> API Reference
              </h2>
              <p className="text-brand-text-secondary mb-6">
                All endpoints are mounted under <code>https://api.setu.network/v1/</code>. Requests must be authenticated using your Bearer token.
              </p>

              <h4 className="text-xl font-bold mb-4">1. Fetching Live Stats</h4>
              <p className="text-brand-text-secondary mb-4">Retrieve current macro-level exchange statistics.</p>
              
              <CodeBlock 
                language="javascript" 
                code={`import { SetuClient } from '@setu/logistics-sdk';

const client = new SetuClient({ apiKey: 'YOUR_API_KEY' });

async function getStats() {
  const stats = await client.exchange.getStats();
  console.log(stats);
  // { activeLoads: 1205, availableFleet: 450, currentRound: 42 }
}`} 
              />

              <h4 className="text-xl font-bold mt-12 mb-4">2. Real-time Telemetry (WebSocket)</h4>
              <p className="text-brand-text-secondary mb-4">Connect to the live fleet event stream to get instant updates on vehicle locations and delays.</p>
              
              <CodeBlock 
                language="javascript" 
                code={`const ws = new WebSocket('wss://api.setu.network/ws/events?token=YOUR_TOKEN');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'FLEET_UPDATE') {
    console.log('Vehicle moved:', data.payload.location);
  }
};`} 
              />
            </section>

            {/* Section 3: Authentication */}
            <section id="authentication" className="scroll-mt-32">
              <h2 className="text-3xl font-display font-bold mb-6 flex items-center gap-3">
                <Lock className="text-brand-primary" /> Authentication
              </h2>
              <p className="text-brand-text-secondary mb-6">
                Setu utilizes Clerk for seamless Enterprise Single Sign-On (SSO) and RBAC. To authenticate API requests, you must pass your JWT token in the Authorization header.
              </p>

              <div className="glass-card p-6 border border-brand-border/50 bg-[#0F111A]">
                <h4 className="font-bold text-white mb-2">HTTP Header Format</h4>
                <code className="text-brand-primary bg-brand-primary/10 px-2 py-1 rounded text-sm">
                  Authorization: Bearer &lt;YOUR_CLERK_JWT_TOKEN&gt;
                </code>
              </div>
            </section>

             {/* Section 4: Security */}
             <section id="security" className="scroll-mt-32">
              <h2 className="text-3xl font-display font-bold mb-6 flex items-center gap-3">
                <Shield className="text-brand-primary" /> Security & Compliance
              </h2>
              <p className="text-brand-text-secondary mb-6">
                Data security is our top priority. The Setu platform is built to adhere to global logistics and data privacy standards.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500/20 p-1 rounded-full"><CheckCircle className="w-4 h-4 text-green-500" /></div>
                  <div>
                    <h5 className="font-bold text-white">End-to-End Encryption</h5>
                    <p className="text-sm text-brand-text-secondary">All payloads and telemetry streams are encrypted in transit via TLS 1.3 and at rest using AES-256.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 bg-green-500/20 p-1 rounded-full"><CheckCircle className="w-4 h-4 text-green-500" /></div>
                  <div>
                    <h5 className="font-bold text-white">Role Based Access Control (RBAC)</h5>
                    <p className="text-sm text-brand-text-secondary">Shippers cannot view other shippers' proprietary lane data. Carriers only see assigned load parameters.</p>
                  </div>
                </li>
              </ul>
            </section>

          </motion.div>
        </main>

      </div>
    </div>
  );
}
