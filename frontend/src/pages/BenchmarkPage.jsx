import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import { getBenchmarkInstances, runBenchmark } from '../lib/api';

const BUDGETS = [1000, 8000, 15000];

// CORRECTION (a): Solomon's objective is hierarchical — minimise vehicles FIRST,
// then distance. A negative distance gap while using MORE vehicles than the
// best-known solution is not an improvement; colour it amber, not green.
function GapBadge({ gap, vehiclesUsed, bksVehicles }) {
  if (gap === null || gap === undefined) return <span className="text-utomic-muted">n/a</span>;

  const usesMoreVehicles =
    vehiclesUsed !== undefined && bksVehicles !== undefined && vehiclesUsed !== null && bksVehicles !== null
      ? vehiclesUsed > bksVehicles
      : false;

  if (usesMoreVehicles) {
    return (
      <span
        className="font-mono font-semibold text-amber-400"
        title="More vehicles than best-known; Solomon ranks vehicle count before distance."
      >
        {gap >= 0 ? '+' : ''}{gap.toFixed(3)}%
      </span>
    );
  }

  const tone = gap <= 0 ? 'text-emerald-400' : gap < 2 ? 'text-utomic-accent' : 'text-amber-400';
  return <span className={`font-mono font-semibold ${tone}`}>{gap >= 0 ? '+' : ''}{gap.toFixed(3)}%</span>;
}

export default function BenchmarkPage() {
  const [instances, setInstances] = useState([]);
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(null);
  const [budget, setBudget] = useState(8000);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBenchmarkInstances().then(setInstances).catch((e) => setError(e.message));
  }, []);

  async function run(name) {
    setRunning(name);
    setError(null);
    try {
      const r = await runBenchmark({ instance: name, time_budget_ms: budget });
      setResults((prev) => ({ ...prev, [name]: r }));
    } catch (e) {
      setError(`${name}: ${e.message}`);
    } finally {
      setRunning(null);
    }
  }

  async function runAll() {
    for (const i of instances) await run(i.name);
  }

  return (
    <div className="min-h-screen bg-utomic-dark text-utomic-text font-sans">
      <Header />
      <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl md:text-5xl mb-4">Solver Benchmark</h1>
          <p className="text-utomic-muted max-w-3xl leading-relaxed">
            Our routing engine solved against the public{' '}
            <span className="text-utomic-text">Solomon (1987)</span> CVRPTW instances,
            live, in this browser. Gap is measured against published best-known
            solutions. Every result below is re-checked by an independent feasibility
            verifier before it is displayed — capacity, time windows, and single-visit
            coverage.
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3 mt-10 mb-6">
          <span className="text-utomic-muted text-sm">Time budget</span>
          {BUDGETS.map((b) => (
            <button
              key={b}
              onClick={() => setBudget(b)}
              className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                budget === b
                  ? 'border-utomic-accent text-utomic-accent bg-utomic-accent/10'
                  : 'border-utomic-border text-utomic-muted hover:text-utomic-text'
              }`}
            >
              {b / 1000}s
            </button>
          ))}
          <button
            onClick={runAll}
            disabled={running !== null}
            className="ml-auto px-5 py-2 rounded-md bg-utomic-accent text-utomic-dark font-semibold text-sm disabled:opacity-40"
          >
            {running ? `Solving ${running}…` : 'Run all instances'}
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto border border-utomic-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-utomic-card text-utomic-muted">
              <tr>
                {['Instance', 'Customers', 'Vehicles', 'Best known', 'Distance',
                  'Best known', 'Gap', 'Solve time', 'Verified', ''].map((h, i) => (
                  <th key={i} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => {
                const r = results[inst.name];
                return (
                  <tr key={inst.name} className="border-t border-utomic-border">
                    <td className="px-4 py-3 font-mono">{inst.name}</td>
                    <td className="px-4 py-3">{inst.customers}</td>
                    <td className="px-4 py-3 font-mono">{r ? r.vehicles_used : '—'}</td>
                    <td className="px-4 py-3 font-mono text-utomic-muted">{inst.bks_vehicles ?? '—'}</td>
                    <td className="px-4 py-3 font-mono">{r ? r.distance.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3 font-mono text-utomic-muted">
                      {inst.bks_distance ? inst.bks_distance.toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <GapBadge
                        gap={r ? r.gap_pct : null}
                        vehiclesUsed={r ? r.vehicles_used : null}
                        bksVehicles={inst.bks_vehicles}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono">{r ? `${r.solve_time_ms}ms` : '—'}</td>
                    <td className="px-4 py-3">
                      {!r ? '—' : r.feasible
                        ? <span className="text-emerald-400">PASS</span>
                        : <span className="text-red-400" title={r.violations.join('; ')}>FAIL</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => run(inst.name)}
                        disabled={running !== null}
                        className="px-3 py-1.5 rounded border border-utomic-border text-utomic-muted hover:text-utomic-accent hover:border-utomic-accent transition-colors disabled:opacity-40"
                      >
                        {running === inst.name ? '…' : 'Run'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* CORRECTION (b): visible footnote making the hierarchical objective explicit */}
        <p className="text-amber-400/90 text-xs mt-4 px-4 py-3 rounded-md border border-amber-500/30 bg-amber-500/5 leading-relaxed">
          Solomon's objective is hierarchical — fewer vehicles first, then shorter distance.
          A negative distance gap with more vehicles is not an improvement.
        </p>

        <p className="text-utomic-muted text-xs mt-6 leading-relaxed">
          Best-known values: Solomon (1987) benchmark set, as published by SINTEF TOP.
          Distances are Euclidean over the raw instance coordinates and travel time
          equals distance, per the standard benchmark convention. Solver: OR-Tools
          guided local search under a hard time budget, returning the best solution
          found so far.
        </p>
      </main>
      <Footer />
    </div>
  );
}
