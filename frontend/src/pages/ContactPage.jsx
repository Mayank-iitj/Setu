import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import { submitContact } from '../lib/api';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ carrier_name: '', fleet_size: '10 - 50 Vehicles', email: '' });

  const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitContact(formData);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="w-full min-h-screen bg-brand-deep-space font-sans selection:bg-brand-primary selection:text-white overflow-x-hidden text-brand-text-primary">
      <Header />
      <div className="pt-32 pb-16 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-16">
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="md:w-1/2 flex flex-col justify-center"
        >
          <motion.h1 variants={fadeUp} className="text-5xl md:text-[64px] font-bold font-display tracking-tight text-white mb-6 leading-tight">
            Ready to optimize<br/>your network?
          </motion.h1>
          <motion.p variants={fadeUp} className="text-xl text-brand-text-muted leading-relaxed mb-12">
            Join the leading logistics carriers leveraging Setu's cognitive AI to eliminate deadhead and maximize profitability.
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
             <div className="flex items-center gap-4 text-brand-text-secondary">
               <div className="w-10 h-10 rounded-full ghost-border flex items-center justify-center bg-brand-surface-muted/50">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                     <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                     <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
               </div>
               <span>partnerships@setu.ai</span>
             </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="md:w-1/2"
        >
          <div className="glass-card p-10">
            {submitted ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-6">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8" strokeWidth="2" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 font-display">Transmission Received</h3>
                <p className="text-brand-text-muted">Our network architects will be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-brand-text-secondary uppercase tracking-widest">Carrier Name</label>
                  <input required name="carrier_name" type="text" value={formData.carrier_name} onChange={handleChange}
                    className="bg-brand-surface-muted border border-brand-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors" placeholder="Acme Logistics Inc." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-brand-text-secondary uppercase tracking-widest">Fleet Size</label>
                  <select name="fleet_size" value={formData.fleet_size} onChange={handleChange}
                    className="bg-brand-surface-muted border border-brand-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors appearance-none">
                    <option>10 - 50 Vehicles</option>
                    <option>50 - 200 Vehicles</option>
                    <option>200+ Vehicles</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-brand-text-secondary uppercase tracking-widest">Contact Email</label>
                  <input required name="email" type="email" value={formData.email} onChange={handleChange}
                    className="bg-brand-surface-muted border border-brand-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-primary transition-colors" placeholder="dispatch@acme.com" />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="button-primary mt-4 w-full disabled:opacity-60">
                  {loading ? 'Sending…' : 'Initialize Contact'}
                </button>
              </form>
            )}
          </div>
        </motion.div>

      </div>
      <Footer />
    </div>
  );
}
