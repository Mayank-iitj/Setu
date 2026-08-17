# SAMANVAY — Demo Script & Judge Q&A

**Every number in this document is computed by the code in this repository.**
Reproduce the benchmark table with `make bench`, and the exchange figures with
`python scripts/precompute_demo.py`. Nothing here is illustrative except the
per-km rupee rates, which are labelled as such on screen.

---

## The one-sentence pitch

Indian freight fleets do not primarily lose money on badly ordered stops — they
lose it running empty, because the load that would fill a truck's return leg
belongs to a competitor. SAMANVAY is a neutral clearing house where carriers
exchange shipment requests through a sealed-bid combinatorial auction, and the
surplus is split by an **exact Shapley value** so every participating carrier is
provably no worse off than operating alone.

---

## Six minutes

### 0:00 — Open on the live map. Never on a login screen.

`http://localhost:5173/app` — vehicles already moving, three carriers in three
colours, telemetry ticking at 2 Hz.

> "Three carriers, one corridor, live telemetry. Everything you're about to see
> is computed, not scripted — and I'll prove that twice."

### 0:45 — The problem, in one number

> "A truck runs Ahmedabad to Delhi loaded and comes back with air inside it. No
> amount of single-fleet route optimisation fixes that, because the load that
> would fill the return leg belongs to a different company. Every team on this
> problem statement is optimising inside one fleet. We're attacking the
> coordination failure between fleets."

### 1:15 — Proof page: collaboration OFF → ON  ← **the moment that wins**

Go to `/proof`. Toggle is OFF.

> "Collaboration off. Three carriers planning independently — this is today."

| | OFF | ON |
|---|---|---|
| Total cost | ₹263,377 | **₹159,063** |
| Distance | 4,515 km | **2,621 km** |
| Vehicles | 11 | 11 |
| Unserved loads | 1 | **0** |

Flip the toggle.

> "Same 42 loads, same 11 trucks — **1,894 fewer kilometres**, a 33% routing cost
> reduction, and one load delivered that no single carrier could deliver at all."

**Be honest about the vehicle count.** Do not claim fleet reduction:

> "Notice trucks stay at 11. We're not cutting the fleet — we're cutting the
> distance each truck drives, by letting the nearest depot serve each drop."

### 2:30 — Why would competitors cooperate?

Scroll to the per-carrier chart. Three pairs of bars, every carrier's cost lower.

| Carrier | Alone | Shapley share | After | Better by |
|---|---|---|---|---|
| Gujarat Express | ₹78,802 | ₹37,146 | ₹41,656 | 47.1% |
| Saurashtra Freight | ₹105,214 | ₹40,037 | ₹65,176 | 38.1% |
| Tapi Logistics | ₹79,361 | ₹27,129 | ₹52,231 | 34.2% |

> "That's the question everyone asks, and the answer is a chart, not a promise.
> All three bars go down. Individual rationality isn't asserted — it's asserted
> **by a test that fails the build if any carrier ends up worse off**."

Point at the two green verification badges.

> "Efficiency: the three shares sum to the total saving, to the rupee. That's the
> Shapley efficiency axiom, checked at runtime."

### 3:30 — The mechanism, briefly

> "Each carrier plans privately with its own solver. Requests that are marginal
> for them go into a pool. Bundles get priced by every other carrier at their
> **true marginal insertion cost** — cost with the bundle minus cost without.
> Winner determination is a set-packing problem solved with CP-SAT. Carriers
> submit **prices, never networks** — nobody sees anyone's customer list, routes,
> or margins. That's the trust story, and it needs no blockchain."

Show the auction table: 3 bundles awarded, ₹41,519 reallocation gain, CP-SAT
`OPTIMAL`, no request awarded twice.

### 4:15 — "How do I know your routes are actually good?"  ← **the credibility moment**

Go to `/benchmark`. Click **Run all instances**. It solves live, in front of them.

| Instance | Vehicles (BKS) | Distance (BKS) | Gap |
|---|---|---|---|
| C101 | 10 (10) | 829.01 (828.94) | **+0.008%** |
| C201 | 3 (3) | 591.58 (591.56) | **+0.003%** |
| R101 | 19 (19) | 1653.54 (1650.80) | **+0.166%** |
| R201 | 4 (4) | 1283.07 (1252.37) | +2.451% |
| RC101 | 16 (14) | 1669.40 (1696.95) | −1.624% |
| RC201 | 4 (4) | 1471.18 (1406.94) | +4.566% |

> "Public Solomon benchmarks, published best-known solutions, our gap, our
> runtime — reproducible on your laptop right now. Worst case 4.6% off
> best-known. Five of six match the best-known vehicle count exactly."

**On RC101, volunteer the weakness before they find it:**

> "One honest caveat — RC101 shows a negative distance gap, but we used 16
> vehicles against best-known 14. Solomon's objective is hierarchical: vehicles
> first, then distance. So that row is *worse* than best-known, not better. We
> flag it amber rather than green for exactly that reason."

That single sentence buys more credibility than the other five rows combined.

### 5:30 — Close

> "Fragmented coordination is named in the problem statement as a root cause.
> Everyone else optimises inside one fleet. We built the clearing house that
> makes competing fleets cooperate, and we proved the split is fair with an
> exact Shapley value — not a Monte-Carlo estimate, exact, over all seven
> coalitions."

---

## Judge Q&A — the questions that actually come

**"Is this data real?"**
> Synthetic demand on a real Gujarat corridor geography, and we say so on screen.
> No public inter-carrier dataset exists — carriers won't publish who they turned
> away. The mechanism is what's novel; the demand generator is seeded and
> deterministic so anyone can reproduce our exact numbers with `--seed 42`.

**"Are these real road distances?"**
> No, and the UI says so. Straight-line distance with a 1.3 circuity correction.
> A routed OSRM matrix was designed and specced but cut for time. Distances are
> therefore approximate; the *optimisation and the settlement* are exact.

**"Why is the Shapley value exact and not sampled?"**
> With three carriers there are 2³−1 = 7 coalitions. Sampling would approximate
> something we can compute outright. It scales as 2ⁿ, so at 10+ carriers we'd
> switch to Monte-Carlo — the code is structured for that swap.

**"Why would a carrier hand a profitable load to a rival?"**
> They wouldn't, and the mechanism never asks them to. Only requests whose
> marginal cost to the owner exceeds a rival's bid are reallocated, and the
> winner-determination objective only awards strictly positive gains. Then the
> Shapley split returns a share of the surplus to the releasing carrier.

**"What stops a carrier from lying about its costs?"**
> Nothing in this version, and that's the honest answer. Marginal-cost bidding is
> not strategy-proof. A VCG payment rule would be; it's the obvious next step and
> the winner-determination code is already the right shape for it.

**"You used more trucks in the collaborative case at one point."**
> Yes — adding a truck costs ₹3,500 and saved 1,895 km, about ₹79,000. The
> optimiser is right to do that. Our claim is distance and service, not fleet size.

**"What's not built?"**
> 3D load packing with LIFO reachability, time-dependent city entry bans,
> chance-constrained ETAs, and the routed road matrix. All four are specified in
> `docs/superpowers/specs/` with acceptance criteria. We cut them to keep every
> number on screen honest rather than ship four half-features.

---

## Pre-demo checklist

- [ ] `make api` running on :8000, `make web` on :5173
- [ ] `curl localhost:8000/health` returns `ok`
- [ ] `/benchmark` loads and all six rows show **PASS**
- [ ] `/proof` loads, toggle animates, three green bars
- [ ] Both verification badges are green
- [ ] Browser zoom at 100%, console closed, notifications off
- [ ] Rehearse the RC101 caveat out loud — it is the highest-value 15 seconds
