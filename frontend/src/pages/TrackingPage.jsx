import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react';
import BorderGlow from '../components/landing/BorderGlow';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function TrackingPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/track/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-deep-space flex items-center justify-center">
        <div className="text-brand-primary animate-pulse font-display text-xl font-bold">Locating Shipment...</div>
      </div>
    );
  }

  if (!data) return <div className="text-white text-center mt-20">Shipment not found.</div>;

  return (
    <div className="min-h-screen bg-brand-deep-space text-white font-sans flex flex-col items-center py-20 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-text-muted mb-2">
            Shipment Tracker
          </h1>
          <p className="text-brand-text-muted">Real-time status for <span className="font-mono text-white font-bold">{data.shipment_id}</span></p>
        </div>

        <BorderGlow glowColor={data.status === 'Delivered' ? '74 222 128' : '0 240 255'} backgroundColor="#000000">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8 border-b border-brand-border pb-6">
              <div>
                <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider block mb-1">Current Status</span>
                <span className={`text-2xl font-bold flex items-center gap-2 ${data.status === 'Delivered' ? 'text-green-400' : 'text-cyan-400'}`}>
                  {data.status === 'Delivered' ? <CheckCircle /> : <Truck />}
                  {data.status}
                </span>
                <p className="text-sm text-brand-text-muted mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {data.current_location}</p>
              </div>
              
              {data.status !== 'Delivered' && (
                <div className="text-right">
                  <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider block mb-1">AI ETA Prediction</span>
                  <div className="bg-brand-surface border border-brand-border rounded-lg p-3 inline-block text-left">
                    <span className="block text-2xl font-bold font-display text-white">{data.eta.p10} - {data.eta.p90}</span>
                    <span className="text-xs text-brand-text-muted block mt-1"><Clock className="w-3 h-3 inline mr-1 text-brand-primary"/>{data.eta.confidence} Confidence</span>
                    <span className="text-[10px] text-brand-text-muted">Median ETA: {data.eta.p50}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative border-l border-brand-border ml-3 space-y-6">
              {data.timeline.map((event, i) => (
                <div key={i} className="relative pl-6">
                  <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ${event.completed ? 'bg-brand-primary shadow-[0_0_8px_rgba(126,114,231,0.8)]' : 'bg-brand-border'}`}></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-bold ${event.completed ? 'text-white' : 'text-brand-text-muted'}`}>{event.status}</p>
                      <p className="text-sm text-brand-text-muted">{event.location}</p>
                    </div>
                    <span className="text-xs text-brand-text-muted font-mono">{event.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BorderGlow>
      </motion.div>
    </div>
  );
}
