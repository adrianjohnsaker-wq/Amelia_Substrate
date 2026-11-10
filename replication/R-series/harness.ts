// R-series harness. Reads the sealed protocol, verifies its digest and the
// ProcessFieldMemory source digest, executes every run, and writes raw
// per-run records before any analysis.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ProcessFieldMemory } from "./ProcessFieldMemory.ts";

const sha = (b: string | Buffer) => createHash("sha256").update(b).digest("hex");
const protoRaw = readFileSync(new URL("./protocol.json", import.meta.url));
const SEALED = readFileSync(new URL("./protocol.sha256", import.meta.url), "utf8").split(/\s+/)[0];
if (sha(protoRaw) !== SEALED) throw new Error("protocol digest mismatch");
const P = JSON.parse(protoRaw.toString());
const pfmSrc = readFileSync(new URL("./ProcessFieldMemory.ts", import.meta.url));
if (sha(pfmSrc) !== P.memory.fileSha256) throw new Error("PFM source digest mismatch");

const ARCS: number[][] = P.graph.arcs;
const N = 9;
const OUT: number[][] = Array.from({ length: N }, () => []);
for (const [u, v] of ARCS) OUT[u].push(v);
const STR: Record<string, number[]> = P.strata;
const stratumOf = (z: number) => (STR.return.includes(z) ? "return" : STR.hinge.includes(z) ? "hinge" : "metabolic");
const GROUPS = ["return", "hinge", "metabolic"];
const REGION: Record<string, string> = P.regions;

// Null: stationary distribution of the unbiased walk.
let pi = new Array(N).fill(1 / N);
for (let k = 0; k < 5000; k++) {
  const nx = new Array(N).fill(0);
  for (let u = 0; u < N; u++) for (const v of OUT[u]) nx[v] += pi[u] / OUT[u].length;
  pi = nx;
}
const PI_G: Record<string, number> = {};
for (const g of GROUPS) PI_G[g] = STR[g].reduce((a, z) => a + pi[z], 0);

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Cond { name: string; startZone: number; c: number; s: number; hingeScale?: number; metabolicScale?: number; returnScale?: number }

export function run(cond: Cond, seed: number) {
  const rnd = mulberry32(seed);
  const pfm = new ProcessFieldMemory();
  pfm.reset();
  const T = P.runs.stepsPerCycle;
  const hs = cond.hingeScale ?? 1, ms = cond.metabolicScale ?? 1, rs = cond.returnScale ?? 1;
  let z = cond.startZone;
  let mod = { thresholdShift: 0, corridorAvailability: 0, persistenceFactor: 0, releaseVolatility: 0 };
  const seq: number[] = [z];
  const strHist: string[] = [stratumOf(z)];
  for (let t = 1; t <= T; t++) {
    const outs = OUT[z];
    const w = outs.map((j) => {
      let base = P.graph.baselineArcWeight;
      if (z === P.manipulatedArc.arc[0] && j === P.manipulatedArc.arc[1]) base = 1 + 10 * cond.c;
      const g = stratumOf(j);
      let m = 0;
      if (g === "hinge") m = mod.corridorAvailability * hs;
      else if (g === "metabolic") m = mod.persistenceFactor * ms;
      else if (j === 0) m = mod.releaseVolatility * rs;
      return base * (1 + m) * (1 + (g === "hinge" ? cond.s : 0));
    });
    const tot = w.reduce((a, b) => a + b, 0);
    let r = rnd() * tot, k = 0;
    while (r >= w[k] && k < w.length - 1) { r -= w[k]; k++; }
    const nz = outs[k];
    const fromS = stratumOf(z), toS = stratumOf(nz);
    strHist.push(toS);
    const win = strHist.slice(-21);
    let same = 0;
    for (let i = 1; i < win.length; i++) if (win[i] === win[i - 1]) same++;
    const sl = win.length > 1 ? same / (win.length - 1) : 0;
    const out = pfm.update({
      step: t,
      currentZone: String(nz),
      selfLoopDepth: sl,
      ringSignal: nz === 0 && z !== 0 ? 1 : 0,
      corridorSignal: toS === "hinge" && fromS !== "hinge" ? 1 : 0,
      latentSignal: z === P.manipulatedArc.arc[0] && nz === P.manipulatedArc.arc[1] ? 1 : 0,
      releaseSignal: fromS === "hinge" && toS === "return" ? 1 : 0,
      transitionSuccess: toS !== fromS,
      compressionActive: sl > 0.35,
    });
    mod = out;
    z = nz;
    seq.push(z);
  }
  // Metrics (over steps 1..T, excluding the start position).
  const steps = seq.slice(1);
  const occ: Record<string, number> = { return: 0, hinge: 0, metabolic: 0 };
  for (const q of steps) occ[stratumOf(q)] += 1 / steps.length;
  const e: Record<string, number> = {};
  for (const g of GROUPS) e[g] = occ[g] / PI_G[g];
  const ranked = [...GROUPS].sort((a, b) => e[b] - e[a]);
  const sumE = GROUPS.reduce((a, g) => a + e[g], 0);
  const fc = e[ranked[0]] / sumE;
  const bm = (e[ranked[0]] - e[ranked[1]]) / sumE;
  const half = steps.slice(Math.floor(steps.length / 2));
  const rcs = half.filter((q) => stratumOf(q) === "return").length / half.length;
  let hingeTr = 0;
  for (let i = 1; i < seq.length; i++) if (stratumOf(seq[i - 1]) === "hinge" || stratumOf(seq[i]) === "hinge") hingeTr++;
  const mts = hingeTr / (seq.length - 1);
  const third = Math.floor(steps.length / 3);
  const hFirst = steps.slice(0, third).filter((q) => stratumOf(q) === "hinge").length / third;
  const hLast = steps.slice(-third).filter((q) => stratumOf(q) === "hinge").length / third;
  const d = hLast - hFirst;
  const gamma = d > 0.02 ? "directional" : d < -0.02 ? "oscillatory" : "stabilized";
  const composite = (fc + occ.hinge + mts + (1 - rcs) + bm) / 5;
  return {
    region: REGION[ranked[0]],
    fieldConfidence: fc, boundaryMargin: bm, hingeOccupancy: occ.hinge,
    recaptureScore: rcs, morphogeneticTransitionScore: mts, composite, gammaTrajectory: gamma,
    enrichment: e, occupancy: occ, traceDigest: sha(seq.join(",")),
  };
}

function shuffle<T>(a: T[], seed: number) {
  const r = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const phases: Record<string, Cond[]> = {};
phases["R-XXXIX"] = P.phases["R-XXXIX"].conditions;
phases["R-XL"] = P.phases["R-XL"].conditions;
const xli = P.phases["R-XLI"];
phases["R-XLI"] = Array.from({ length: 15 }, (_, i) => ({ name: `c${i + 1}`, startZone: xli.startZone, s: xli.s, c: +(0.0015 + (i * (0.1512 - 0.0015)) / 14).toFixed(6) }));
const xlir = P.phases["R-XLI-R"];
phases["R-XLI-R"] = xlir.coefficients.map((c: number, i: number) => ({ name: `P${i + 1}`, startZone: xlir.startZone, s: xlir.s, c }));

const records: any[] = [];
for (const [ph, conds] of Object.entries(phases)) {
  const jobs: { ci: number; rep: number }[] = [];
  conds.forEach((_, ci) => { for (let rep = 1; rep <= P.runs.seedsPerCondition; rep++) jobs.push({ ci, rep }); });
  shuffle(jobs, 7);
  jobs.forEach(({ ci, rep }, order) => {
    const seed = P.runs.phaseBases[ph] + ci * 1000 + rep;
    const cond = conds[ci];
    records.push({ phase: ph, condition: cond.name, conditionIndex: ci, replicate: rep, seed, executionOrder: order, ...cond, ...run(cond, seed) });
  });
}
const lines = records.map((r) => JSON.stringify(r)).join("\n") + "\n";
writeFileSync(new URL("./raw_records.jsonl", import.meta.url), lines);
writeFileSync(new URL("./raw_records.sha256", import.meta.url), sha(lines) + "  raw_records.jsonl\n");
console.log("runs", records.length, "rawDigest", sha(lines), "nullPi", PI_G);
