import React, { useState, useCallback, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, TrendingUp, Truck, Zap, Activity, Wifi, WifiOff, FileCheck, ScanLine, ShieldCheck, Settings, Network, BarChart2, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

import Navbar from '../components/Navbar';
import BorderGlow from '../components/landing/BorderGlow';
import GlowingButton from '../components/GlowingButton';
import { useSetuWebSocket } from '../hooks/useWebSocket';

const DEMO_HUBS = [
  "Ahmedabad - Sanand Hub", "Delhi NCR - Gurugram", "Surat - Hazira Port", "Vadodara - GSFC",
  "Mumbai - JNPT", "Pune - Chakan", "Chennai - Sriperumbudur", "Bengaluru - Peenya",
  "Hyderabad - Patancheru", "Kolkata - Haldia", "Ludhiana - Dhandari Kalan", "Kanpur - Panki",
  "Indore - Pithampur", "Nagpur - MIHAN", "Coimbatore - Tirupur", "Jaipur - Sitapura",
  "Bhiwandi - Logistics Park", "Hosur - SIPCOT", "Nashik - Ambad", "Aurangabad - Waluj",
  "Faridabad - IMT", "Ghaziabad - Loni", "Noida - Phase 2", "Lucknow - Transport Nagar",
  "Bhopal - Mandideep", "Raipur - Urla", "Jamshedpur - Adityapur", "Ranchi - Namkum",
  "Guwahati - Amingaon", "Patna - Fatuha", "Bhubaneswar - Mancheswar", "Visakhapatnam - Auto Nagar",
  "Vijayawada - Autonagar", "Kochi - Vallarpadam", "Thiruvananthapuram - Kochuveli", "Mysuru - Hebbal",
  "Mangaluru - Baikampady", "Hubli - Tarihal", "Belagavi - Kakti", "Goa - Verna",
  "Rajkot - Metoda", "Jamnagar - Reliance SEZ", "Bhavnagar - Chitra", "Vapi - GIDC",
  "Ankleshwar - GIDC", "Bharuch - Dahej", "Gandhidham - Kandla", "Mundra - SEZ",
  "Morbi - Ceramic Zone", "Pithampur - SEZ"
];

const DEMO_MATERIALS = [
  "Industrial Steel Coils", "Auto Parts & Components", "FMCG Pallets", "Pharmaceuticals",
  "Textiles & Garments", "Cement Bags", "Chemical Drums", "Electronics & White Goods",
  "Agricultural Produce", "Machinery Spares", "Plastics & Polymers", "Paper Rolls",
  "Glass Sheets", "Ceramic Tiles", "Rubber Products", "Paint & Resins",
  "Furniture & Fixtures", "Beverages & Water", "Processed Food", "Cold Chain Produce",
  "Fertilizers", "Coal & Minerals", "Wood & Timber", "Metal Scrap",
  "Lubricants & Oils", "Wires & Cables", "Building Materials", "Packaging Materials",
  "Hardware & Tools", "Cosmetics & Toiletries", "Footwear", "Stationery",
  "Toys & Games", "Sports Goods", "Medical Devices", "Automotive Tires",
  "Batteries & Inverters", "Solar Panels", "Transformers", "Pipes & Fittings",
  "Sanitaryware", "Handicrafts", "Leather Goods", "Spices & Condiments",
  "Tea & Coffee", "Edible Oil", "Sugar & Molasses", "Cotton Bales",
  "Yarn & Threads", "Scrap & Recyclables"
];

const DEMO_ASSETS = [
  "40ft Open Top", "32ft Multi-Axle", "20ft Container", "Flatbed Heavy",
  "Reefer 40ft (Temp Controlled)", "Reefer 20ft", "24ft Closed Body", "19ft Open Body",
  "14ft Eicher", "Tata Ace / LCV", "Bolero Pickup", "Canter 17ft",
  "Tanker - Liquid Chemicals", "Tanker - Petroleum", "Tanker - Edible Oil", "Bulker - Cement",
  "Bulker - Fly Ash", "Car Carrier", "Bike Carrier", "Lowbed Trailer",
  "Semi Lowbed Trailer", "Hydraulic Axle Trailer", "Tipper 10 Wheeler", "Tipper 14 Wheeler",
  "Tipper 16 Wheeler", "Tractor Trailer", "JCB Carrier", "Crane Mounted Truck",
  "Garbage Compactor", "Sweeper Truck", "Concrete Mixer", "Boom Pump",
  "Fire Tender Chassis", "Ambulance Chassis", "Bus Chassis", "Livestock Carrier",
  "Poultry Carrier", "Glass Carrier (A-Frame)", "Logging Truck", "Dump Truck",
  "Hook Loader", "Skip Loader", "Gully Emptier", "Jetting Machine",
  "Vacuum Truck", "Mobile Workshop", "Mobile ATM", "Food Truck Chassis",
  "Exhibition Van", "Armored Vehicle Chassis"
];

const STATUS_COLORS = {
  en_route: [0, 240, 255],
  empty: [255, 160, 0],
  loading: [100, 255, 100],
};

function formatINR(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

function EventDot({ color }) {
  const cls = {
    accent: 'text-brand-primary',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  }[color] || 'text-white';
  return <span className={cls}>●</span>;
}

export default function Dashboard() {
  const location = useLocation();
  const [viewState, setViewState] = useState({
    longitude: 74.5,
    latitude: 25.5,
    zoom: 5,
    pitch: 45,
    bearing: 0
  });

  const [connected, setConnected] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({
    vehicles_en_route: '—',
    empty_running_pct: '—',
    total_surplus_inr: 0,
    shipments_processed: '—',
    carriers_connected: '—',
  });
  const [events, setEvents] = useState([]);
  const [exchangeRound, setExchangeRound] = useState(null);
  
  // Recharts Data
  const SURPLUS_DATA = [
    { time: '10:00', surplus: 12000 },
    { time: '10:30', surplus: 18500 },
    { time: '11:00', surplus: 14000 },
    { time: '11:30', surplus: 29000 },
    { time: '12:00', surplus: 42000 },
    { time: '12:30', surplus: 38000 },
    { time: '13:00', surplus: 55000 },
  ];

  const EMISSIONS_DATA = [
    { hub: 'Ahmedabad', saved: 1.2 },
    { hub: 'Delhi NCR', saved: 2.8 },
    { hub: 'Surat', saved: 1.5 },
    { hub: 'Vadodara', saved: 0.9 },
    { hub: 'Mumbai', saved: 2.0 },
  ];

  const FLEET_DATA = [
    { name: 'En Route', value: 65, color: '#00f0ff' },
    { name: 'Deadhead', value: 20, color: '#ffa000' },
    { name: 'Loading', value: 15, color: '#4ade80' },
  ];
  
  // Interactive Map Filters
  const [mapFilter, setMapFilter] = useState('all'); // 'all', 'en_route', 'empty'

  // Config State
  const [config, setConfig] = useState({
    strictCompliance: true,
    autoAccept: true,
    routeTolerance: 45,
    pricingStrategy: 'dynamic'
  });
  const [configSaved, setConfigSaved] = useState(false);

  // Shipper form state
  const [formData, setFormData] = useState({
    origin: 'Ahmedabad - Sanand Hub',
    destination: 'Delhi NCR - Gurugram',
    material: 'Industrial Steel Coils',
    weight: '24.5',
    vehicleType: '40ft Open Top',
    temperature: 'Ambient',
  });
  const [posting, setPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [compliance, setCompliance] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleMessage = useCallback((data) => {
    setConnected(true);
    if (data.stats) setStats(data.stats);
    if (data.events) setEvents(data.events);
    if (data.vehicles) setVehicles(data.vehicles);
    if (data.round) setExchangeRound(data.round);
  }, []);

  const wsRef = useSetuWebSocket(handleMessage);

  useEffect(() => {
    const interval = setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        setConnected(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [wsRef]);

  // Handle actual load posting
  const handlePostLoad = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPosting(true);
    
    try {
      // Simulate pushing to exchange network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch compliance data from real NestJS APIs
      const [vahanRes, aisRes, fastagRes] = await Promise.all([
        fetch('http://localhost:3000/integrations/vahan/verify?vehicleNumber=RJ14GC1234').catch(() => null),
        fetch('http://localhost:3000/integrations/ais140/location?vehicleId=v-1234').catch(() => null),
        fetch('http://localhost:3000/integrations/fastag/status?vehicleId=v-1234').catch(() => null)
      ]);

      const vahan = vahanRes?.ok ? await vahanRes.json() : { status: 'VALID (Fallback)', details: 'National Permit' };
      const ais = aisRes?.ok ? await aisRes.json() : { speed: 45, status: 'TRACKING' };
      const fastag = fastagRes?.ok ? await fastagRes.json() : { lastToll: 'JAIPUR_TOLL_1' };

      setPosting(false);
      setPostSuccess(true);
      setCompliance({
        vahan: `${vahan.status} (${vahan.details})`,
        ais140: `${ais.status} (${ais.speed}km/h)`,
        fastag: fastag.lastToll,
        ewayBill: 'ACTIVE',
      });
      setTimeout(() => setPostSuccess(false), 5000);
    } catch (err) {
      setPosting(false);
      console.error(err);
    }
  }, []);

  // Auto-Simulate Workflow Loop
  useEffect(() => {
    let timeoutId;
    if (isSimulating) {
      const simulateStep = async () => {
        // Pick randoms
        const randOrigin = DEMO_HUBS[Math.floor(Math.random() * DEMO_HUBS.length)];
        const randDest = DEMO_HUBS[Math.floor(Math.random() * DEMO_HUBS.length)];
        const randMat = DEMO_MATERIALS[Math.floor(Math.random() * DEMO_MATERIALS.length)];
        const randAsset = DEMO_ASSETS[Math.floor(Math.random() * DEMO_ASSETS.length)];
        const randWeight = (Math.random() * 30 + 5).toFixed(1);

        setFormData({
          origin: randOrigin,
          destination: randDest,
          material: randMat,
          vehicleType: randAsset,
          weight: randWeight,
          temperature: Math.random() > 0.8
        });

        // Trigger form submit
        await handlePostLoad();

        // Queue next one in 6.5 seconds
        timeoutId = setTimeout(simulateStep, 6500);
      };
      
      // Start the loop immediately
      simulateStep();
    }
    return () => clearTimeout(timeoutId);
  }, [isSimulating, handlePostLoad]);

  // Frontend Active Fleet Map Simulation
  useEffect(() => {
    // Generate 350 random trucks scattered across India's bounding box
    const generateDemoFleet = () => {
      const statuses = ['en_route', 'en_route', 'empty', 'loading'];
      const demoVehicles = Array.from({ length: 350 }).map((_, i) => {
        // India bounding box rough coords
        const lat = 11 + Math.random() * 18; // 11 to 29
        const lon = 71 + Math.random() * 15; // 71 to 86
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const destHub = Object.keys(HUB_COORDS)[Math.floor(Math.random() * Object.keys(HUB_COORDS).length)];
        
        return {
          id: `v-demo-${i}`,
          lat,
          lon,
          status,
          route_to: destHub,
        };
      });
      
      // Only inject if the backend isn't sending a dense array
      setVehicles(prev => prev.length > 50 ? prev : demoVehicles);
      
      setStats(prev => ({
        ...prev,
        vehicles_en_route: prev.vehicles_en_route === '—' ? '2,845' : prev.vehicles_en_route,
        empty_running_pct: prev.empty_running_pct === '—' ? '18.4' : prev.empty_running_pct,
      }));
    };

    if (vehicles.length < 50) {
      generateDemoFleet();
    }

    // Animate the fleet on the map
    const interval = setInterval(() => {
      setVehicles(prev => {
        if (prev.length < 100) return prev; // Let real backend take over if it's running
        return prev.map(v => {
          if (v.status === 'en_route' || v.status === 'empty') {
             // Move trucks slowly
             return { ...v, lat: v.lat + (Math.random() - 0.5) * 0.05, lon: v.lon + (Math.random() - 0.5) * 0.05 };
          }
          return v;
        });
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [vehicles.length]);

  // Frontend Event Stream Simulation
  useEffect(() => {
    const eventTemplates = [
      { c: 'accent', m: 'Bundle #{BND} cleared! Carrier RJ14 assigned. Surplus: ₹1,450' },
      { c: 'green', m: 'Vehicle {VEH} arrived safely at Destination Hub: {HUB}.' },
      { c: 'green', m: 'e-POD successfully verified for Load #{LOD} via VAHAN API.' },
      { c: 'yellow', m: 'FASTag scan mismatch detected at {HUB} Toll Plaza for {VEH}.' },
      { c: 'yellow', m: 'High demand spike detected in {HUB}. Adjusting Shapley pricing.' },
      { c: 'red', m: 'Geofence Alert: Vehicle {VEH} is 6.2km off the optimal route.' },
      { c: 'accent', m: 'New Combinatorial Match! 3 shipments bundled from {HUB}.' }
    ];

    const interval = setInterval(() => {
      setEvents(prev => {
        // If WebSocket is sending lots of events, don't spam
        if (prev.length > 20 && !prev[0]?.id?.startsWith('demo')) return prev;

        const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
        const randHub = DEMO_HUBS[Math.floor(Math.random() * DEMO_HUBS.length)].split(' - ')[0];
        const msg = template.m
          .replace('{HUB}', randHub)
          .replace('{BND}', Math.floor(1000 + Math.random() * 9000))
          .replace('{LOD}', Math.floor(10000 + Math.random() * 90000))
          .replace('{VEH}', `MH${Math.floor(10 + Math.random() * 90)} ${Math.floor(1000 + Math.random() * 9000)}`);
        
        // Random coords near the hub
        const lat = 11 + Math.random() * 18;
        const lon = 71 + Math.random() * 15;

        const newEvent = {
          id: `demo-evt-${Date.now()}`,
          timestamp: Date.now(),
          color: template.c,
          message: msg,
          lat,
          lon
        };

        return [newEvent, ...prev].slice(0, 50); // Keep last 50 events
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Frontend Live Exchange Simulation
  useEffect(() => {
    let timerId;
    let currentRoundId = Math.floor(Math.random() * 1000) + 1000;
    
    const generateBundles = () => {
      const count = Math.floor(Math.random() * 3) + 3; // 3 to 5 bundles
      return Array.from({ length: count }).map((_, i) => ({
        bundle_id: `BND-${Math.floor(1000 + Math.random() * 9000)}`,
        min_price: Math.floor(12000 + Math.random() * 15000),
        awarded_to: null,
        requests: Array(Math.floor(Math.random() * 3) + 2).fill(1) // 2 to 4 requests
      }));
    };

    let simulatedRound = {
      isSimulated: true,
      round_id: currentRoundId,
      status: 'accepting_bids',
      seconds_remaining: 30,
      bundles: generateBundles()
    };

    const tick = () => {
      setExchangeRound(prev => {
        // If a real round came in from WebSocket, stop simulating
        if (prev && !prev.isSimulated) return prev;

        let next = { ...simulatedRound };
        
        if (next.status === 'accepting_bids') {
          next.seconds_remaining -= 1;
          
          // Randomly award some bundles as time ticks down
          if (next.seconds_remaining < 25 && Math.random() > 0.7) {
            const unawarded = next.bundles.filter(b => !b.awarded_to);
            if (unawarded.length > 0) {
              const b = unawarded[Math.floor(Math.random() * unawarded.length)];
              b.awarded_to = 'simulated'; // UI hash will generate real name
            }
          }

          if (next.seconds_remaining <= 0) {
            next.status = 'clearing';
            next.seconds_remaining = 0;
          }
        } else if (next.status === 'clearing') {
          // Wait a few seconds in clearing state, then start new round
          if (!next.clearingTicks) next.clearingTicks = 0;
          next.clearingTicks += 1;
          if (next.clearingTicks > 3) {
            currentRoundId += 1;
            next = {
              isSimulated: true,
              round_id: currentRoundId,
              status: 'accepting_bids',
              seconds_remaining: 30,
              bundles: generateBundles()
            };
          }
        }

        simulatedRound = next;
        return next;
      });
    };

    // Only start simulator if there is no real data
    if (!exchangeRound || exchangeRound.isSimulated) {
       timerId = setInterval(tick, 1000);
    }
    
    return () => clearInterval(timerId);
  }, []);

  // Layers
  const filteredVehicles = vehicles.filter(v => mapFilter === 'all' || v.status === mapFilter);

  const scatterLayer = new ScatterplotLayer({
    id: 'vehicles',
    data: filteredVehicles,
    pickable: true,
    opacity: 0.9,
    stroked: true,
    filled: true,
    radiusScale: 5,
    radiusMinPixels: 4,
    radiusMaxPixels: 20,
    lineWidthMinPixels: 1,
    getPosition: d => [d.lon, d.lat],
    getFillColor: d => STATUS_COLORS[d.status] || [200, 200, 200],
    getLineColor: [255, 255, 255, 100],
  });

  const HUB_COORDS = {
    'Ahmedabad': [72.5714, 23.0225],
    'Surat': [72.8311, 21.1702],
    'Vadodara': [73.1812, 22.3072],
    'Rajkot': [70.8022, 22.3039],
    'Delhi NCR': [77.2090, 28.6139],
    'Jaipur': [75.7873, 26.9124],
    'Jodhpur': [73.0243, 26.2389],
    'Udaipur': [73.7125, 24.5854],
  };

  const arcData = filteredVehicles
    .filter(v => v.status === 'en_route' && HUB_COORDS[v.route_to])
    .slice(0, 15)
    .map(v => ({
      source: [v.lon, v.lat],
      target: HUB_COORDS[v.route_to],
      color: STATUS_COLORS[v.status] || [200, 200, 200],
    }));

  const arcLayer = new ArcLayer({
    id: 'routes',
    data: arcData,
    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: d => [...d.color, 150],
    getTargetColor: [198, 191, 255, 200],
    getWidth: 1.5,
  });

  const panToEvent = (evt) => {
    if (evt.lat && evt.lon) {
      setViewState({
        ...viewState,
        longitude: evt.lon,
        latitude: evt.lat,
        zoom: 9,
        transitionDuration: 1000
      });
    }
  };

  const renderLeftPanel = () => {
    if (location.pathname === '/app/security') {
      return (
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 pointer-events-auto overflow-y-auto pb-10 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-text-muted">
              Account Security
            </h1>
            <p className="text-brand-text-muted mb-4 leading-relaxed text-sm">
              Manage your credentials, 2FA, and API access keys.
            </p>
          </motion.div>
          <BorderGlow glowColor="255 100 100" backgroundColor="#000000" glowIntensity={0.8}>
            <div className="p-6 space-y-8">
              <div className="space-y-4 border-b border-brand-border pb-6">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between p-4 bg-brand-surface border border-brand-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-sm font-bold text-white">Authenticator App</p>
                      <p className="text-xs text-brand-text-muted">Currently active</p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-bold text-red-400 border border-red-400/30 rounded hover:bg-red-400/10 transition-colors">Disable</button>
                </div>
              </div>

              <div className="space-y-4 border-b border-brand-border pb-6">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Change Password</h3>
                <div className="flex flex-col gap-3">
                  <input type="password" placeholder="Current Password" className="bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-sm text-white focus:border-brand-primary outline-none" />
                  <input type="password" placeholder="New Password" className="bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-sm text-white focus:border-brand-primary outline-none" />
                  <input type="password" placeholder="Confirm New Password" className="bg-brand-surface border border-brand-border rounded-lg px-4 py-3 text-sm text-white focus:border-brand-primary outline-none" />
                  <GlowingButton className="w-full text-sm py-3 font-bold !bg-brand-primary text-white mt-2">Update Password</GlowingButton>
                </div>
              </div>

              <div className="space-y-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">API Keys</h3>
                  <span className="text-xs text-brand-primary cursor-pointer hover:underline">+ Generate New Key</span>
                </div>
                <div className="p-4 bg-brand-surface border border-brand-border rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-white">Production VAHAN Webhook</p>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                  </div>
                  <p className="text-xs font-mono text-brand-text-muted bg-brand-deep-space p-2 rounded">sk_live_83921...f9a2</p>
                  <p className="text-[10px] text-brand-text-muted">Last used: 2 minutes ago</p>
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>
      );
    }

    if (location.pathname === '/app/preferences') {
      return (
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 pointer-events-auto overflow-y-auto pb-10 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-text-muted">
              Preferences
            </h1>
            <p className="text-brand-text-muted mb-4 leading-relaxed text-sm">
              Customize your ZION dashboard experience.
            </p>
          </motion.div>
          <BorderGlow glowColor="40 240 255" backgroundColor="#000000" glowIntensity={0.8}>
            <div className="p-6 space-y-8">
              <div className="space-y-4 border-b border-brand-border pb-6">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">User Interface</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-sm font-semibold text-white block">Theme Mode</span>
                    <span className="text-xs text-brand-text-muted">Dark matter is forced for SIH</span>
                  </div>
                  <span className="text-xs bg-brand-primary/20 text-brand-primary px-3 py-1 rounded font-bold">Dark Only</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Default Startup View</label>
                  <select className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors">
                    <option>Shipper Console</option>
                    <option>Live Exchange</option>
                    <option>Operations Analytics</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 border-b border-brand-border pb-6">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Notifications</h3>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-white">Email Alerts for Match Success</span>
                    <input type="checkbox" defaultChecked className="accent-brand-primary w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-white">SMS Alerts for Geofence Breach</span>
                    <input type="checkbox" defaultChecked className="accent-brand-primary w-4 h-4" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-white">Weekly Analytics Digest</span>
                    <input type="checkbox" className="accent-brand-primary w-4 h-4" />
                  </label>
                </div>
              </div>

              <div className="space-y-4 pb-2">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Regional Settings</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Default Origin Hub</label>
                    <select className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors">
                      {DEMO_HUBS.map(hub => <option key={hub}>{hub}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Currency Display</label>
                    <select className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors">
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <GlowingButton className="w-full text-sm py-3 font-bold !bg-brand-primary text-white">
                  Save Preferences
                </GlowingButton>
              </div>
            </div>
          </BorderGlow>
        </div>
      );
    }

    if (location.pathname === '/app/exchange') {
      return (
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 pointer-events-auto overflow-y-auto pb-10 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-text-muted">
              Live Exchange
            </h1>
            <p className="text-brand-text-muted mb-4 leading-relaxed text-sm">
              Real-time combinatorial order book viewing supply and demand bundles.
            </p>
          </motion.div>
          <BorderGlow glowColor="126 114 231" backgroundColor="#000000" glowIntensity={0.8}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-4">
                <div className="flex items-center gap-3">
                  <Network className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-xl font-bold font-display text-white">
                    Round #{exchangeRound?.round_id || '---'}
                  </h3>
                </div>
                {exchangeRound?.status === 'clearing' ? (
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest animate-pulse">Clearing...</span>
                ) : (
                  <span className="text-xs font-bold text-green-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span> 
                    {exchangeRound?.seconds_remaining || 0}s remaining
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                {!exchangeRound && (
                  <div className="text-center py-8 text-brand-text-muted text-sm">Waiting for exchange sync...</div>
                )}
                {exchangeRound?.bundles?.map(bundle => {
                  // Generate pseudo-random realistic data based on bundle_id string hash
                  const hash = String(bundle.bundle_id).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
                  const h = Math.abs(hash);
                  const o = DEMO_HUBS[h % DEMO_HUBS.length];
                  const d = DEMO_HUBS[(h + 5) % DEMO_HUBS.length];
                  const m = DEMO_MATERIALS[(h + 10) % DEMO_MATERIALS.length];
                  const a = DEMO_ASSETS[(h + 15) % DEMO_ASSETS.length];
                  const w = (10 + (h % 30)).toFixed(1);
                  const carrier = `VRL Logistics Fleet #${(h % 900) + 100}`;

                  return (
                    <div key={bundle.bundle_id} className={`flex flex-col gap-3 p-4 rounded-lg border transition-colors ${bundle.awarded_to ? 'bg-brand-primary/10 border-brand-primary shadow-[0_0_15px_rgba(126,114,231,0.15)]' : 'bg-brand-surface border-brand-border hover:border-brand-primary/50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          {bundle.awarded_to && <ShieldCheck className="w-4 h-4 text-brand-primary" />}
                          {bundle.bundle_id}
                        </span>
                        <span className="text-lg text-brand-primary font-bold font-display tracking-tight">₹{bundle.min_price.toLocaleString()}</span>
                      </div>
                      
                      {/* Realistic Bundle Data */}
                      <div className="flex flex-col gap-1.5 pb-3 mb-1 border-b border-brand-border/50">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{o.split(' - ')[0]} <span className="text-brand-text-muted px-1">→</span> {d.split(' - ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                          <Truck className="w-3 h-3" />
                          <span>{a}</span>
                          <span className="text-brand-border">•</span>
                          <span>{w} Tons</span>
                          <span className="text-brand-border">•</span>
                          <span className="truncate">{m}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-1 text-[10px] uppercase font-bold tracking-wider text-brand-text-muted">
                          <span>{bundle.requests?.length || ((h % 3) + 2)} Shipments Bundled</span>
                        </div>
                        {bundle.awarded_to ? (
                          <span className="text-[10px] uppercase font-bold text-brand-primary bg-brand-primary/20 px-2 py-1 rounded">Awarded to {carrier}</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-green-400 bg-green-400/20 px-2 py-1 rounded">Accepting Bids</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </BorderGlow>
        </div>
      );
    }

    if (location.pathname === '/app/config') {
      return (
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 pointer-events-auto overflow-y-auto pb-10 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-text-muted">
              Configuration
            </h1>
            <p className="text-brand-text-muted mb-4 leading-relaxed text-sm">
              Set your matching tolerances and compliance enforcement rules.
            </p>
          </motion.div>
          <BorderGlow glowColor="126 114 231" backgroundColor="#000000" glowIntensity={0.8}>
            <div className="p-6 space-y-8">
              
              <div className="space-y-4 border-b border-brand-border pb-6">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">1. HARD FILTERS (Permits, Payload, Axle Restrictions)</h3>
                <div className="flex items-center justify-between mb-6 p-3 bg-brand-surface border border-brand-border rounded-lg">
                  <div>
                    <span className="text-sm font-semibold text-white block">Strict API Verification</span>
                    <span className="text-xs text-brand-text-muted">Ineligible trucks never reach the shortlist</span>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-brand-primary w-4 h-4" />
                </div>

                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">2. RANKING SCORE (Net Margin, Empty KMs, Tolls)</h3>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-white">AI Risk Tolerance</span>
                    <span className="text-sm text-brand-primary font-bold">{config.riskTolerance || 'Medium'}</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="50" onChange={e => {
                    let val = 'Medium';
                    if (e.target.value < 33) val = 'Low (Conservative)';
                    if (e.target.value > 66) val = 'High (Aggressive)';
                    setConfig({...config, riskTolerance: val});
                  }} className="w-full accent-brand-primary cursor-pointer" />
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-white">Combinatorial Aggressiveness</span>
                    <span className="text-sm text-brand-primary font-bold">{config.aggression || 75}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={config.aggression || 75} onChange={e => setConfig({...config, aggression: parseInt(e.target.value)})} className="w-full accent-brand-primary cursor-pointer" />
                  <div className="flex justify-between text-xs text-brand-text-muted">
                    <span>Speed-optimized</span>
                    <span>Savings-optimized</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-white">Carbon Optimization Weighting</span>
                    <span className="text-sm text-brand-primary font-bold">{config.carbonWeight || 40}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={config.carbonWeight || 40} onChange={e => setConfig({...config, carbonWeight: parseInt(e.target.value)})} className="w-full accent-green-400 cursor-pointer" />
                </div>
              </div>

              <div className="space-y-4 pb-2 mt-6">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Pricing Engine</h3>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 text-sm text-white cursor-pointer p-3 border border-brand-primary/50 bg-brand-primary/10 rounded-lg">
                    <input type="radio" name="pricing" checked={config.pricingStrategy === 'dynamic'} onChange={() => setConfig({...config, pricingStrategy: 'dynamic'})} className="accent-brand-primary w-4 h-4" />
                    <div>
                      <span className="block font-bold">AI Predictive (Shapley Value)</span>
                      <span className="text-xs text-brand-text-muted">Splits network surplus fairly</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-white cursor-pointer p-3 border border-brand-border bg-brand-surface rounded-lg hover:border-brand-primary/50">
                    <input type="radio" name="pricing" checked={config.pricingStrategy === 'fixed'} onChange={() => setConfig({...config, pricingStrategy: 'fixed'})} className="accent-brand-primary w-4 h-4" />
                    <div>
                      <span className="block font-bold">Fixed Contract Rates</span>
                      <span className="text-xs text-brand-text-muted">Legacy lane-based pricing</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 relative">
                <AnimatePresence>
                  {configSaved && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-2 text-sm font-bold text-green-400 bg-green-400/20 py-2 rounded border border-green-400/50 shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                    >
                      <Zap className="w-4 h-4 animate-pulse" /> Re-calibrating AI Engine...
                    </motion.div>
                  )}
                </AnimatePresence>
                <GlowingButton 
                  className="w-full text-sm py-3 font-bold !bg-brand-primary text-white" 
                  onClick={() => {
                    setConfigSaved(true);
                    setTimeout(() => setConfigSaved(false), 3000);
                  }}
                >
                  Apply Settings
                </GlowingButton>
              </div>

            </div>
          </BorderGlow>
        </div>
      );
    }

    if (location.pathname === '/app/analytics') {
      return (
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 pointer-events-auto pb-10" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-text-muted">
              Operations
            </h1>
            <p className="text-brand-text-muted mb-4 leading-relaxed text-sm">
              Historical performance and network density analytics via Metabase.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-4">
            <BorderGlow glowColor="40 240 255" backgroundColor="#000000" glowIntensity={0.5}>
              <div className="p-4 flex flex-col gap-1 h-full">
                <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider mb-2">Total Surplus Generated</span>
                <div className="flex-1 min-h-[100px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SURPLUS_DATA}>
                      <defs>
                        <linearGradient id="colorSurplus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0B0D17', borderColor: '#212433', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="surplus" stroke="#00f0ff" strokeWidth={3} fillOpacity={1} fill="url(#colorSurplus)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-2xl font-bold text-cyan-400 font-display mt-2">₹{stats.total_surplus_inr?.toLocaleString() || '4,28,400'}</span>
              </div>
            </BorderGlow>
            <BorderGlow glowColor="100 255 100" backgroundColor="#000000" glowIntensity={0.5}>
              <div className="p-4 flex flex-col gap-1 h-full">
                <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider mb-2">Fleet Utilization Spread</span>
                <div className="flex-1 min-h-[100px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={FLEET_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {FLEET_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0B0D17', borderColor: '#212433', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xl font-bold text-green-400 font-display">80%</span>
                  <span className="text-xs text-brand-text-muted">Active Usage</span>
                </div>
              </div>
            </BorderGlow>
            <BorderGlow glowColor="126 114 231" backgroundColor="#000000" glowIntensity={0.5}>
              <div className="p-4 flex flex-col gap-1 h-full">
                <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider mb-2">CO2 Emissions Reduced (Tons)</span>
                <div className="flex-1 min-h-[100px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={EMISSIONS_DATA}>
                      <XAxis dataKey="hub" hide />
                      <RechartsTooltip cursor={{fill: '#ffffff10'}} contentStyle={{ backgroundColor: '#0B0D17', borderColor: '#212433', fontSize: '12px' }} />
                      <Bar dataKey="saved" radius={[4, 4, 0, 0]}>
                        {EMISSIONS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7E72E7' : '#C6BFFF'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-2xl font-bold text-brand-primary font-display mt-2">8.4 Tons</span>
              </div>
            </BorderGlow>
            <BorderGlow glowColor="255 160 0" backgroundColor="#000000" glowIntensity={0.5}>
              <div className="p-4 flex flex-col gap-1 h-full">
                <span className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wider mb-2">AI Empty Miles Saved</span>
                <div className="flex-1 flex items-center justify-center py-6">
                  <LineIcon className="w-16 h-16 text-yellow-400 opacity-20" />
                </div>
                <span className="text-2xl font-bold text-yellow-400 font-display mt-2">12,450 km</span>
              </div>
            </BorderGlow>
          </div>

          <BorderGlow glowColor="126 114 231" backgroundColor="#000000" glowIntensity={0.8} className="flex-1 flex flex-col min-h-[300px]">
            <div className="p-1 flex-1 flex flex-col rounded-xl overflow-hidden bg-brand-surface relative group">
              <iframe
                src="http://localhost:3000/public/dashboard/mock-dashboard-id?theme=night"
                frameBorder="0"
                width="100%"
                height="100%"
                className="flex-1 rounded-lg opacity-30 group-hover:opacity-100 transition-opacity duration-700"
                title="Metabase Analytics"
              ></iframe>
              <div className="absolute inset-0 bg-brand-deep-space/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 rounded-xl z-10 border border-brand-border group-hover:opacity-0 transition-opacity duration-700 pointer-events-none">
                <BarChart2 className="w-12 h-12 text-brand-primary mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Connect Metabase Instance</h3>
                <p className="text-sm text-brand-text-muted max-w-xs">
                  Your Metabase container is offline. Hover to preview layout, or start the container to view live network graphs.
                </p>
              </div>
            </div>
          </BorderGlow>
        </div>
      );
    }

    return (
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 pointer-events-auto overflow-y-auto pb-10 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 font-display bg-clip-text text-transparent bg-gradient-to-r from-white to-brand-text-muted">
            Shipper Web Console
          </h1>
          <p className="text-brand-text-muted mb-4 leading-relaxed text-sm">
            Post consignments directly to the combinatorial exchange. Our AI matches your load with empty backhaul capacity in &lt;50ms.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <BorderGlow glowColor="126 114 231" backgroundColor="#000000" glowIntensity={0.8}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg border border-brand-primary/20"><Truck className="text-brand-primary w-5 h-5" /></div>
                  <h3 className="text-xl font-bold font-display text-white">Post New Load</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border transition-colors ${
                    isSimulating 
                    ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' 
                    : 'bg-brand-primary/20 text-brand-primary border-brand-primary/50 hover:bg-brand-primary/30'
                  }`}
                >
                  {isSimulating ? 'Stop Sim' : 'Auto-Simulate'}
                </button>
              </div>
              <form onSubmit={handlePostLoad} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Origin Hub</label>
                    <select 
                      className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                      value={formData.origin}
                      onChange={e => setFormData({...formData, origin: e.target.value})}
                    >
                      {DEMO_HUBS.map(hub => <option key={`orig-${hub}`} value={hub}>{hub}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Destination Hub</label>
                    <select 
                      className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                      value={formData.destination}
                      onChange={e => setFormData({...formData, destination: e.target.value})}
                    >
                      {DEMO_HUBS.map(hub => <option key={`dest-${hub}`} value={hub}>{hub}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Asset Class</label>
                    <select 
                      className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                      value={formData.vehicleType}
                      onChange={e => setFormData({...formData, vehicleType: e.target.value})}
                    >
                      {DEMO_ASSETS.map(asset => <option key={asset} value={asset}>{asset}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Weight (Tons)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors"
                      value={formData.weight}
                      onChange={e => setFormData({...formData, weight: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Pickup Window</label>
                    <input 
                      type="datetime-local" 
                      className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors [color-scheme:dark]"
                      defaultValue="2026-08-18T08:00"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Delivery Window</label>
                    <input 
                      type="datetime-local" 
                      className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors [color-scheme:dark]"
                      defaultValue="2026-08-20T18:00"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">Commodity / Material</label>
                  <select 
                    className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-brand-primary outline-none transition-colors w-full"
                    value={formData.material}
                    onChange={e => setFormData({...formData, material: e.target.value})}
                  >
                    {DEMO_MATERIALS.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                  </select>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 text-xs text-white">
                    <input type="checkbox" className="accent-brand-primary rounded" defaultChecked />
                    Requires Temperature Control
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white">
                    <input type="checkbox" className="accent-brand-primary rounded" defaultChecked />
                    High Value Goods (Escort Req.)
                  </label>
                </div>
                <AnimatePresence>
                  {postSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs px-3 py-2.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Load pushed to combinatorial exchange!
                    </motion.div>
                  )}
                </AnimatePresence>
                <GlowingButton className="w-full mt-2" type="submit" disabled={posting}>
                  {posting ? 'Optimising Matches...' : 'Push to Exchange'}
                </GlowingButton>
              </form>
            </div>
          </BorderGlow>
        </motion.div>

        <AnimatePresence>
          {compliance && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <BorderGlow glowColor="40 240 255" backgroundColor="#000000" glowIntensity={0.6}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20"><ScanLine className="text-cyan-400 w-5 h-5" /></div>
                      <h3 className="text-lg font-bold font-display text-white">Live Match Verification</h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-brand-primary font-bold animate-pulse">Matched</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-brand-border pb-2">
                      <span className="text-sm text-brand-text-muted flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-primary"/> VAHAN API</span>
                      <span className="text-sm font-semibold text-white">{compliance.vahan}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-brand-border pb-2">
                      <span className="text-sm text-brand-text-muted flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-primary"/> AIS-140 GPS</span>
                      <span className="text-sm font-semibold text-white">{compliance.ais140}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-brand-border pb-2">
                      <span className="text-sm text-brand-text-muted flex items-center gap-2"><Zap className="w-4 h-4 text-brand-primary"/> FASTag</span>
                      <span className="text-sm font-semibold text-white">{compliance.fastag}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-brand-text-muted flex items-center gap-2"><FileCheck className="w-4 h-4 text-brand-primary"/> NIC e-Way Bill</span>
                      <span className="text-sm font-semibold text-green-400">{compliance.ewayBill}</span>
                    </div>
                  </div>
                </div>
              </BorderGlow>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

const CARTO_DARK_MATTER = {
  version: 8,
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
    }
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-brand-deep-space text-brand-text-primary font-sans">
      <div className="absolute inset-0 z-0 w-full h-full">
        <DeckGL
          width="100%"
          height="100%"
          viewState={viewState}
          onViewStateChange={e => setViewState(e.viewState)}
          controller={true}
          layers={[scatterLayer, arcLayer]}
        >
          <Map 
            mapStyle={CARTO_DARK_MATTER} 
            style={{ width: '100%', height: '100%' }}
          />
        </DeckGL>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-brand-deep-space via-transparent to-brand-deep-space/80"></div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-brand-deep-space via-transparent to-brand-deep-space/30"></div>
      </div>

      <div className="relative z-10 w-full h-full pointer-events-none flex flex-col">
        <Navbar />

        <div className="absolute top-28 right-8 z-50 pointer-events-auto">
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30"
          >
            <Wifi className="w-3 h-3" />
            Live Data Feed
          </motion.div>
        </div>

        <div className="flex-1 mt-32 px-8 pb-8 grid grid-cols-12 gap-6 pointer-events-none">
          {renderLeftPanel()}

          <div className="col-span-12 lg:col-span-3 lg:col-start-10 flex flex-col gap-6 pointer-events-auto">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <BorderGlow glowColor="126 114 231" backgroundColor="#000000" glowIntensity={0.5}>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-primary/10 rounded-lg border border-brand-primary/20"><Activity className="text-brand-primary w-5 h-5" /></div>
                      <h3 className="text-lg font-bold font-display text-white">Active Fleet</h3>
                    </div>
                    {mapFilter !== 'all' && (
                      <button onClick={() => setMapFilter('all')} className="text-xs text-brand-primary hover:text-white transition-colors">Clear Filter</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div 
                      onClick={() => setMapFilter('en_route')}
                      className={`bg-brand-surface rounded-xl p-3 border cursor-pointer transition-all ${mapFilter === 'en_route' ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'border-brand-border hover:border-cyan-400/50'}`}
                    >
                      <p className="text-xs text-brand-text-muted mb-1 uppercase tracking-widest font-semibold">Live Assets</p>
                      <motion.p
                        key={stats.vehicles_en_route}
                        initial={{ scale: 1.2, color: '#00f0ff' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        className="text-3xl font-bold font-display text-white"
                      >
                        {stats.vehicles_en_route}
                      </motion.p>
                    </div>
                    <div 
                      onClick={() => setMapFilter('empty')}
                      className={`bg-brand-surface rounded-xl p-3 border cursor-pointer transition-all ${mapFilter === 'empty' ? 'border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'border-brand-border hover:border-green-400/50'}`}
                    >
                      <p className="text-xs text-brand-text-muted mb-1 uppercase tracking-widest font-semibold">Deadhead %</p>
                      <motion.p
                        key={stats.empty_running_pct}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-3xl font-bold font-display text-green-400"
                      >
                        {stats.empty_running_pct}%
                      </motion.p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-brand-text-muted mt-2 border-t border-brand-border pt-3">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] inline-block shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>En Route (Matched)</span>
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#ffa000] inline-block shadow-[0_0_8px_rgba(255,160,0,0.8)]"></span>Empty (Seeking Backhaul)</span>
                  </div>
                </div>
              </BorderGlow>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <BorderGlow glowColor="126 114 231" backgroundColor="#000000" glowIntensity={0.5}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-primary/10 rounded-lg border border-brand-primary/20"><TrendingUp className="text-brand-primary w-5 h-5" /></div>
                    <h3 className="text-lg font-bold font-display text-white">Event Stream</h3>
                  </div>
                  <ul className="space-y-3 text-xs max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    <AnimatePresence initial={false}>
                      {events.length === 0 && (
                        <li className="text-brand-text-muted text-center py-4">Waiting for Kafka events...</li>
                      )}
                      {events.map((evt, i) => (
                        <motion.li
                          key={`${evt.timestamp}-${i}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          onClick={() => panToEvent(evt)}
                          className="flex gap-2.5 items-start text-brand-text-secondary border-b border-brand-border/40 pb-2 last:border-0 cursor-pointer hover:bg-brand-primary/10 p-1 rounded transition-colors"
                        >
                          <EventDot color={evt.color} />
                          <span className="leading-relaxed">{evt.message}</span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              </BorderGlow>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
