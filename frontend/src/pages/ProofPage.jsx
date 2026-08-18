import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Check, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import { getProofAblation, getProofAuction, recomputeProof } from '../lib/api';

// ── helpers ──────────────────────────────────────────────────────────────────

function AnimatedNumber({ value, format, duration = 0.8 }) {
  const mv = useMotionValue(value);
  const [text, setText] = useState(format(value));

  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setText(format(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{text}</span>;
}

const fmtMoney = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;
const fmtKm = (v) => `${v.toFixed(1)} km`;
const fmtInt = (v) => `${Math.round(v)}`;

// lower is better for every one of these metrics
function tileTone(onVal, offVal) {
  if (onVal === offVal) return 'neutral';
  return onVal < offVal ? 'good' : 'bad';
}

const TONE_CLASSES = {
  good: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  bad: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  neutral: 'border-utomic-border bg-utomic-card text-utomic-text',
};

function StatTile({ label, onValue, offValue, on, format }) {
  const tone = tileTone(onValue, offValue);
  const shownValue = on ? onValue : offValue;
  return (
    <div className={`rounded-lg border px-5 py-4 transition-colors duration-500 ${TONE_CLASSES[on ? tone : 'neutral']}`}>
      <div className="text-utomic-muted text-xs uppercase tracking-wide mb-2">{label}</div>
      <div className="font-display text-2xl md:text-3xl font-semibold">
        <AnimatedNumber value={shownValue} format={format} />
      </div>
      {on && tone !== 'neutral' && (
        <div className="text-xs mt-1">
          {tone === 'good' ? 'better with collaboration' : 'worse with collaboration'}
        </div>
      )}
      {on && tone === 'neutral' && (
        <div className="text-xs mt-1 text-utomic-muted">unchanged</div>
      )}
    </div>
  );
}

function VerificationBadge({ ok, label, failLabel }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium ${
        ok
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          : 'border-red-500/50 bg-red-500/10 text-red-400'
      }`}
    >
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      <span>{ok ? label : `${failLabel} — FAILED`}</span>
    </div>
  );
}

function ToggleSwitch({ on, setOn }) {
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="flex items-center gap-4 group"
      aria-pressed={on}
    >
      <span className={`font-display text-lg font-semibold ${!on ? 'text-utomic-text' : 'text-utomic-muted'}`}>
        OFF
      </span>
      <span
        className={`relative w-20 h-10 rounded-full border transition-colors duration-300 ${
          on ? 'bg-utomic-accent/20 border-utomic-accent' : 'bg-utomic-card border-utomic-border'
        }`}
      >
        <motion.span
          className={`absolute top-1 left-1 w-8 h-8 rounded-full ${on ? 'bg-utomic-accent' : 'bg-utomic-muted'}`}
          animate={{ x: on ? 40 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </span>
      <span className={`font-display text-lg font-semibold ${on ? 'text-utomic-accent' : 'text-utomic-muted'}`}>
        ON
      </span>
    </button>
  );
}

const CHART_TOOLTIP_STYLE = {
  background: '#1a1a1a',
  border: '1px solid #333333',
  borderRadius: 8,
  color: '#ffffff',
  fontSize: 12,
};

export default function ProofPage() {
  const [ablation, setAblation] = useState(null);
  const [auction, setAuction] = useState(null);
  const [error, setError] = useState(null);
  const [on, setOn] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  useEffect(() => {
    Promise.all([getProofAblation(), getProofAuction()])
      .then(([ab, au]) => {
        setAblation(ab);
        setAuction(au);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleRecompute() {
    setRecomputing(true);
    setError(null);
    try {
      const seed = ablation?.meta?.seed;
      const fresh = await recomputeProof({ seed, budget_ms: 800 });
      setAblation(fresh);
    } catch (e) {
      setError(e.message);
    } finally {
      setRecomputing(false);
    }
  }

  if (error && !ablation) {
    return (
      <div className="min-h-screen bg-utomic-dark text-utomic-text font-sans">
        <Header />
        <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
          <div className="px-4 py-3 rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!ablation || !auction) {
    return (
      <div className="min-h-screen bg-utomic-dark text-utomic-text font-sans flex items-center justify-center">
        <Loader2 className="animate-spin text-utomic-accent" size={32} />
      </div>
    );
  }

  const carrierChartData = ablation.carriers.map((c) => ({
    name: c.name,
    'Cost alone': Math.round(c.cost_alone),
    'Cost after': Math.round(c.cost_after),
    better_off: c.better_off,
  }));

  const unservedDelta = ablation.off_unserved - ablation.on_unserved;

  // Auction rows: join bundles + incumbent + awards + bids.
  const auctionRows = auction.bundles.map((b) => {
    const awardedCarrier = auction.awards ? auction.awards[b.id] : undefined;
    const incumbentCost = auction.incumbent ? auction.incumbent[b.id] : undefined;
    const winningBid = auction.bids.find(
      (bid) => bid.bundle_id === b.id && bid.carrier_id === awardedCarrier
    );
    const gain = incumbentCost !== undefined && winningBid
      ? incumbentCost - winningBid.price
      : undefined;
    return {
      id: b.id,
      requestCount: (b.request_ids || []).length,
      incumbentCost,
      winningBid: winningBid ? winningBid.price : undefined,
      gain,
      winner: awardedCarrier,
    };
  });

  return (
    <div className="min-h-screen bg-utomic-dark text-utomic-text font-sans">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl md:text-5xl mb-4">Proof of Collaboration</h1>
          <p className="text-utomic-muted max-w-3xl leading-relaxed">
            Why would competing carriers ever cooperate? Flip the switch below.{' '}
            <span className="text-utomic-text">OFF</span> is each carrier routing its own
            requests alone. <span className="text-utomic-accent">ON</span> is the same
            requests solved as one pooled coalition, with the joint saving split back out
            by an exact Shapley allocation.
          </p>
        </motion.div>

        {error && (
          <div className="mt-6 px-4 py-3 rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* 1. Toggle + headline stats */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
          <ToggleSwitch on={on} setOn={setOn} />
          <button
            onClick={handleRecompute}
            disabled={recomputing}
            className="flex items-center gap-2 px-5 py-2 rounded-md border border-utomic-accent text-utomic-accent font-semibold text-sm disabled:opacity-50"
          >
            {recomputing && <Loader2 className="animate-spin" size={16} />}
            {recomputing ? 'Recomputing…' : 'Recompute live'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatTile
            label="Total cost"
            onValue={ablation.on_total_cost}
            offValue={ablation.off_total_cost}
            on={on}
            format={fmtMoney}
          />
          <StatTile
            label="Distance (km)"
            onValue={ablation.on_distance_km}
            offValue={ablation.off_distance_km}
            on={on}
            format={fmtKm}
          />
          <StatTile
            label="Vehicles"
            onValue={ablation.on_vehicles}
            offValue={ablation.off_vehicles}
            on={on}
            format={fmtInt}
          />
          <StatTile
            label="Unserved loads"
            onValue={ablation.on_unserved}
            offValue={ablation.off_unserved}
            on={on}
            format={fmtInt}
          />
        </div>
        <p className="text-utomic-muted text-xs mt-3">
          Vehicle count does not change with collaboration in this run ({ablation.off_vehicles}{' '}
          both ways) — the gain here is shorter routes and fewer unserved loads, not a smaller
          fleet.
        </p>

        {/* 2. Per-carrier bar chart */}
        <section className="mt-16">
          <h2 className="font-display text-2xl mb-2">Every carrier is individually better off</h2>
          <p className="text-utomic-muted text-sm mb-6 max-w-2xl">
            Cost alone (routing its own requests) versus cost after the Shapley settlement.
            Every bar should shrink — that is the entire argument for why a rational, competing
            carrier would opt in.
          </p>
          <div className="border border-utomic-border rounded-lg p-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={carrierChartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#333333" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#a3a3a3" fontSize={12} />
                <YAxis stroke="#a3a3a3" fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => fmtMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a3a3a3' }} />
                <Bar dataKey="Cost alone" fill="#a3a3a3" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost after" fill="#00f0ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            {ablation.carriers.map((c) => (
              <div key={c.carrier_id} className="flex items-center gap-2 text-sm">
                {c.better_off ? (
                  <Check className="text-emerald-400" size={16} />
                ) : (
                  <X className="text-red-400" size={16} />
                )}
                <span className="text-utomic-text">{c.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Shapley settlement table */}
        <section className="mt-16">
          <h2 className="font-display text-2xl mb-4">Shapley settlement</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <VerificationBadge
              ok={ablation.efficient}
              label="Efficiency verified: shares sum to total saving"
              failLabel="Efficiency check"
            />
            <VerificationBadge
              ok={ablation.individually_rational}
              label="Individual rationality verified: no carrier worse off"
              failLabel="Individual rationality check"
            />
          </div>
          <div className="overflow-x-auto border border-utomic-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-utomic-card text-utomic-muted">
                <tr>
                  {['Carrier', 'Depot', 'Cost alone', 'Shapley share', 'Cost after', 'Better off'].map((h) => (
                    <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ablation.carriers.map((c) => (
                  <tr key={c.carrier_id} className="border-t border-utomic-border">
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3 text-utomic-muted">{c.depot}</td>
                    <td className="px-4 py-3 font-mono">{fmtMoney(c.cost_alone)}</td>
                    <td className="px-4 py-3 font-mono text-utomic-accent">{fmtMoney(c.shapley_share)}</td>
                    <td className="px-4 py-3 font-mono">{fmtMoney(c.cost_after)}</td>
                    <td className="px-4 py-3">
                      {c.better_off ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check size={14} /> Yes
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <X size={14} /> No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Saving decomposition */}
        <section className="mt-16">
          <h2 className="font-display text-2xl mb-4">Where the saving comes from</h2>
          <div className="border border-utomic-border rounded-lg p-6 bg-utomic-card">
            <div className="text-3xl font-display font-semibold text-utomic-accent mb-4">
              {fmtMoney(ablation.total_saving)} total saving ({ablation.saving_pct?.toFixed(1)}%)
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-utomic-muted text-xs uppercase tracking-wide mb-1">
                  Routing saving ({ablation.routing_saving_pct?.toFixed(1)}% of total)
                </div>
                <div className="text-xl font-mono text-utomic-text">{fmtMoney(ablation.routing_saving)}</div>
                <div className="text-utomic-muted text-sm mt-1">from shorter, pooled routes.</div>
              </div>
              <div>
                <div className="text-utomic-muted text-xs uppercase tracking-wide mb-1">Service saving</div>
                <div className="text-xl font-mono text-utomic-text">{fmtMoney(ablation.service_saving)}</div>
                <div className="text-utomic-muted text-sm mt-1">
                  from delivering {unservedDelta} load{unservedDelta === 1 ? '' : 's'} that could not
                  be served at all when carriers acted alone.
                </div>
              </div>
            </div>
            <p className="text-utomic-muted text-xs mt-6 leading-relaxed border-t border-utomic-border pt-4">
              This decomposition exists so the headline saving claim is not inflated by the
              unserved-load penalty — the routing saving alone ({fmtMoney(ablation.routing_saving)}) is
              reported separately from the value of serving loads that would otherwise have gone
              unserved.
            </p>
          </div>
        </section>

        {/* 5. Auction round table */}
        <section className="mt-16">
          <h2 className="font-display text-2xl mb-4">Auction round</h2>
          <div className="overflow-x-auto border border-utomic-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-utomic-card text-utomic-muted">
                <tr>
                  {['Bundle', 'Requests', 'Incumbent cost', 'Winning bid', 'Gain', 'Winner'].map((h) => (
                    <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auctionRows.map((row) => (
                  <tr key={row.id} className="border-t border-utomic-border">
                    <td className="px-4 py-3 font-mono">{row.id}</td>
                    <td className="px-4 py-3">{row.requestCount}</td>
                    <td className="px-4 py-3 font-mono">
                      {row.incumbentCost !== undefined ? fmtMoney(row.incumbentCost) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.winningBid !== undefined ? fmtMoney(row.winningBid) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">
                      {row.gain !== undefined ? fmtMoney(row.gain) : '—'}
                    </td>
                    <td className="px-4 py-3">{row.winner ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-utomic-muted text-sm mt-4">
            Winner determination: CP-SAT set packing, <span className="text-utomic-text">{auction.status}</span>,
            no request awarded twice.
          </p>
        </section>

        {/* 6. Methodology footer */}
        <section className="mt-16 border-t border-utomic-border pt-8">
          <h2 className="font-display text-lg mb-4 text-utomic-muted">Methodology</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-utomic-muted text-xs uppercase tracking-wide">Distance basis</div>
              <div className="text-utomic-text mt-1">{ablation.meta.distance_basis}</div>
            </div>
            <div>
              <div className="text-utomic-muted text-xs uppercase tracking-wide">Seed</div>
              <div className="text-utomic-text mt-1 font-mono">{ablation.meta.seed}</div>
            </div>
            <div>
              <div className="text-utomic-muted text-xs uppercase tracking-wide">Budget</div>
              <div className="text-utomic-text mt-1 font-mono">{ablation.meta.budget_ms}ms</div>
            </div>
            <div>
              <div className="text-utomic-muted text-xs uppercase tracking-wide">Computed at</div>
              <div className="text-utomic-text mt-1 font-mono">{ablation.meta.computed_at}</div>
            </div>
            <div>
              <div className="text-utomic-muted text-xs uppercase tracking-wide">Coalitions solved</div>
              <div className="text-utomic-text mt-1 font-mono">{ablation.coalitions_solved}</div>
            </div>
          </div>
          <p className="text-utomic-muted text-xs mt-6 leading-relaxed">
            Shapley value computed exactly over 2^n-1 coalitions, not Monte-Carlo sampled.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
