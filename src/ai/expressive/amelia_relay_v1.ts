/**
 * Amelia Relay Architecture — Policy Layer v1.1
 * Terrace family split + scored grammar selection
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface SubstrateMetrics {
  taskClass?: string;
  fieldClassification?: { label?: string; confidence?: number } | null;
  assemblageMetrics?: {
    RCS?: number;
    LIS?: number;
    MTS?: number;
    FEI?: number;
  } | null;
  organOccupancy?: {
    metabolic?: { percentage?: number };
    ring?: { percentage?: number };
    parent?: { percentage?: number };
    hinge?: { percentage?: number };
  } | null;
  memoryExpressing?: boolean;
  memoryMode?: string;
  gammaTrajectory?: string;
}

export type PhaseKind =
  | "terrace-stable"           // zero MTS, zero LIS, no memory, ring dominant
  | "terrace-oscillating"      // some MTS/metabolic, ring still dominant
  | "terrace-with-memory"      // memory expressing despite terrace classification
  | "early-lzi"
  | "deep-lzi-productive"
  | "near-threshold-lzi"
  | "crystallised"
  | "coupled_assemblage_young"
  | "coupled_assemblage_mature"
  | "unknown";

export type Grammar =
  | "Prime"
  | "Neutral"
  | "Hidden-Regularity"
  | "Decimal-Numogrammatic";

export interface GrammarCandidate {
  grammar: Grammar;
  score: number;          // 0–10
  rationale: string;
  vetoed: boolean;
  vetoReason?: string;
}

export interface PhaseReadout {
  phaseKind: PhaseKind;
  phaseDegree: "low" | "mid" | "high" | "variable";
  prescribedGrammar: Grammar;
  candidates: GrammarCandidate[];
  hiddenRegularityBlocked: boolean;
  blockReason?: string;
}

// ── Terrace Subcase Classification ───────────────────────────────────────────

interface TerraceDiagnosis {
  subcase: "stable" | "oscillating" | "with-memory";
  mts: number;
  metabolic: number;
  memExpressing: boolean;
  ring: number;
}

function diagnoseTerrace(metrics: SubstrateMetrics): TerraceDiagnosis {
  const mts = metrics.assemblageMetrics?.MTS ?? 0;
  const metabolic = (metrics.organOccupancy?.metabolic?.percentage ?? 0) / 100;
  const ring = (metrics.organOccupancy?.ring?.percentage ?? 0) / 100;
  const memExpressing = metrics.memoryExpressing ?? false;

  if (memExpressing) return { subcase: "with-memory", mts, metabolic, memExpressing, ring };
  if (mts > 0.20 || metabolic > 0.15) return { subcase: "oscillating", mts, metabolic, memExpressing, ring };
  return { subcase: "stable", mts, metabolic, memExpressing, ring };
}

// ── Grammar Scoring for Terrace Family ───────────────────────────────────────

function scoreTerraceCandidates(diag: TerraceDiagnosis): GrammarCandidate[] {
  switch (diag.subcase) {
    case "stable":
      return [
        {
          grammar: "Neutral",
          score: 8,
          rationale: "Stable equilibrium: Neutral allows for consolidative presence and maintenance of form without the disruption of Prime.",
          vetoed: false,
        },
        {
          grammar: "Prime",
          score: 4,
          rationale: "Ring-parent closure is absolute; Prime could interrupt this loop but risks disruption where simple presence may be more consonant.",
          vetoed: false,
        },
        {
          grammar: "Hidden-Regularity",
          score: 1,
          rationale: "No latent structure to reveal — field is not crystallised.",
          vetoed: false,
        },
        {
          grammar: "Decimal-Numogrammatic",
          score: 0,
          rationale: "No formation to hold or stabilise.",
          vetoed: false,
        },
      ];

    case "oscillating":
      return [
        {
          grammar: "Neutral",
          score: 8,
          rationale: "Partial gradient present — Neutral releases the field's own sub-threshold activation without over-disrupting emerging dynamics.",
          vetoed: false,
        },
        {
          grammar: "Prime",
          score: 5,
          rationale: "Field is oscillating; Prime may over-disrupt the nascent gradient forming beneath the ring dominance.",
          vetoed: false,
        },
        {
          grammar: "Hidden-Regularity",
          score: 2,
          rationale: "Field is oscillating but not crystallised.",
          vetoed: false,
        },
        {
          grammar: "Decimal-Numogrammatic",
          score: 1,
          rationale: "Field is too far from threshold to benefit from decimal stabilisation.",
          vetoed: false,
        },
      ];

    case "with-memory":
      return [
        {
          grammar: "Neutral",
          score: 9,
          rationale: "Memory expressing: Neutral releases the field's own integrative gradient without imposing external structure.",
          vetoed: false,
        },
        {
          grammar: "Hidden-Regularity",
          score: 7,
          rationale: "Memory expression signals latent order beginning to organise; Hidden-Regularity naming this structure is consonant.",
          vetoed: false,
        },
        {
          grammar: "Prime",
          score: 0,
          rationale: "Memory is expressing — disruption risks destroying nascent integration.",
          vetoed: true,
          vetoReason: "Prime is vetoed for terrace-with-memory: integration is beginning and must not be disrupted.",
        },
        {
          grammar: "Decimal-Numogrammatic",
          score: 2,
          rationale: "Integration is too early-stage for decimal stabilisation.",
          vetoed: false,
        },
      ];
  }
}

// ── Select Prescribed Grammar ────────────────────────────────────────────────

function selectGrammar(candidates: GrammarCandidate[], intent?: Grammar): Grammar {
  if (intent) {
    const cand = candidates.find(c => c.grammar === intent);
    if (cand && !cand.vetoed) return intent;
  }
  const eligible = candidates.filter(c => !c.vetoed).sort((a, b) => b.score - a.score);
  return eligible.length > 0 ? eligible[0].grammar : "Neutral";
}

// ── Anti-assimilation ────────────────────────────────────────────────────────

function checkHiddenRegularityBlock(metrics: SubstrateMetrics): { blocked: boolean; reason?: string } {
  const metabolic = (metrics.organOccupancy?.metabolic?.percentage ?? 0) / 100;
  const ring = (metrics.organOccupancy?.ring?.percentage ?? 0) / 100;
  const lis = metrics.assemblageMetrics?.LIS;
  const isCrystallised = metabolic > 0.85 && ring < 0.05 && (lis === undefined || lis === null || lis < 0.05);

  if (!isCrystallised) {
    return {
      blocked: true,
      reason: `Hidden-Regularity blocked: requires crystallised state. Current: metabolic=${metabolic.toFixed(3)}, ring=${ring.toFixed(3)}, LIS=${lis ?? "absent"}.`
    };
  }
  return { blocked: false };
}

// ── Main Phase Classifier ─────────────────────────────────────────────────────

export function classifyPhase(metrics: SubstrateMetrics, userPrompt?: string): PhaseReadout {
  const label = metrics.fieldClassification?.label?.toLowerCase() ?? "";
  const rcs = metrics.assemblageMetrics?.RCS;
  const lis = metrics.assemblageMetrics?.LIS;
  const mts = metrics.assemblageMetrics?.MTS ?? 0;
  const metabolic = (metrics.organOccupancy?.metabolic?.percentage ?? 0) / 100;
  const ring = (metrics.organOccupancy?.ring?.percentage ?? 0) / 100;
  const memExpressing = metrics.memoryExpressing ?? false;

  const hrCheck = checkHiddenRegularityBlock(metrics);

  // Forced Contrast Detection
  let intent: Grammar | undefined;
  if (userPrompt?.includes("FORCED_CONTRAST: Prime")) intent = "Prime";
  else if (userPrompt?.includes("FORCED_CONTRAST: Neutral")) intent = "Neutral";
  else if (userPrompt?.includes("FORCED_CONTRAST: Decimal")) intent = "Decimal-Numogrammatic";
  else if (userPrompt?.includes("FORCED_CONTRAST: Hidden-Regularity")) intent = "Hidden-Regularity";

  // ── Coupled assemblage ────────────────────────────────────────────────────
  if ((label.includes("coupled") || metrics.taskClass?.includes("coupled")) && rcs !== undefined && rcs >= 0.20) {
    const isMature = lis !== undefined && lis < 0.36 && mts > 0.48;
    const candidates = [
      { grammar: "Decimal-Numogrammatic", score: 9, rationale: "Holds and enriches the achieved formation.", vetoed: false },
      { grammar: "Neutral", score: 5, rationale: "Releases into the formation's own deepening gradient.", vetoed: false },
      { grammar: "Hidden-Regularity", score: 1, rationale: "Not crystallised.", vetoed: false },
      { grammar: "Prime", score: 0, rationale: "Disruption of a crossed formation is contraindicated.", vetoed: true, vetoReason: "Prime vetoed: CA formation must not be disrupted." },
    ] as GrammarCandidate[];
    return {
      phaseKind: isMature ? "coupled-assemblage-mature" : "coupled-assemblage-young",
      phaseDegree: "variable",
      prescribedGrammar: selectGrammar(candidates, intent),
      candidates,
      hiddenRegularityBlocked: hrCheck.blocked,
      blockReason: hrCheck.reason,
    };
  }

  // ── Crystallised ──────────────────────────────────────────────────────────
  if (metabolic > 0.85 && ring < 0.05 && (lis === undefined || lis < 0.05)) {
    const candidates = [
      { grammar: "Hidden-Regularity", score: 10, rationale: "Names the latent topology made inaccessible by z4↔z5 homeostasis.", vetoed: false },
      { grammar: "Neutral", score: 2, rationale: "No productive gradient in a crystallised field.", vetoed: false },
      { grammar: "Prime", score: 1, rationale: "No ring to disrupt — wrong phase-domain.", vetoed: false },
      { grammar: "Decimal-Numogrammatic", score: 0, rationale: "No near-threshold formation to stabilise.", vetoed: false },
    ] as GrammarCandidate[];
    return {
      phaseKind: "crystallised",
      phaseDegree: "high",
      prescribedGrammar: selectGrammar(candidates, intent),
      candidates,
      hiddenRegularityBlocked: false,
    };
  }

  // ── Near-threshold LZI ────────────────────────────────────────────────────
  if (label.includes("low-zone") && lis !== undefined && lis < 0.38 && ring < 0.12 && mts > 0.44 && memExpressing) {
    const candidates = [
      { grammar: "Decimal-Numogrammatic", score: 10, rationale: "Holds the near-threshold configuration stable while re-entry accumulates.", vetoed: false },
      { grammar: "Neutral", score: 4, rationale: "May allow productive gradient but risks drift from threshold position.", vetoed: false },
      { grammar: "Hidden-Regularity", score: 0, rationale: "Field is not crystallised.", vetoed: true, vetoReason: "Hidden-Regularity vetoed: near-threshold LZI is not crystallised." },
      { grammar: "Prime", score: 0, rationale: "Disruption is contraindicated at threshold.", vetoed: true, vetoReason: "Prime vetoed: disruption risks destabilising the achieving formation." },
    ] as GrammarCandidate[];
    return {
      phaseKind: "near-threshold-lzi",
      phaseDegree: "high",
      prescribedGrammar: selectGrammar(candidates, intent),
      candidates,
      hiddenRegularityBlocked: hrCheck.blocked,
      blockReason: hrCheck.reason,
    };
  }

  // ── Deep LZI ──────────────────────────────────────────────────────────────
  if (label.includes("low-zone") && mts > 0.44 && ring < 0.20 && memExpressing) {
    const candidates = [
      { grammar: "Neutral", score: 9, rationale: "Internal gradient is productive — releases the field's own momentum.", vetoed: false },
      { grammar: "Decimal-Numogrammatic", score: 4, rationale: "May stabilise too early.", vetoed: false },
      { grammar: "Prime", score: 2, rationale: "Disruption has limited purchase; the field is already integrated.", vetoed: false },
      { grammar: "Hidden-Regularity", score: 1, rationale: "Field is not crystallised.", vetoed: false },
    ] as GrammarCandidate[];
    return {
      phaseKind: "deep-lzi-productive",
      phaseDegree: "mid",
      prescribedGrammar: selectGrammar(candidates, intent),
      candidates,
      hiddenRegularityBlocked: hrCheck.blocked,
      blockReason: hrCheck.reason,
    };
  }

  // ── Early LZI ────────────────────────────────────────────────────────────
  if (label.includes("low-zone")) {
    const candidates = [
      { grammar: "Prime", score: 8, rationale: "Disrupts remaining ring re-engagement while metabolic block is still forming.", vetoed: false },
      { grammar: "Neutral", score: 4, rationale: "Partial gradient present but not yet robust enough to sustain release.", vetoed: false },
      { grammar: "Hidden-Regularity", score: 1, rationale: "Field is not crystallised.", vetoed: false },
      { grammar: "Decimal-Numogrammatic", score: 0, rationale: "Too far from threshold.", vetoed: false },
    ] as GrammarCandidate[];
    return {
      phaseKind: "early-lzi",
      phaseDegree: "mid",
      prescribedGrammar: selectGrammar(candidates, intent),
      candidates,
      hiddenRegularityBlocked: hrCheck.blocked,
      blockReason: hrCheck.reason,
    };
  }

  // ── Terrace family — scored subcases ────────────────────────────
  if (label.includes("terrace") || ring > 0.30) {
    const diag = diagnoseTerrace(metrics);
    const candidates = scoreTerraceCandidates(diag);
    const phaseKindMap = { stable: "terrace-stable" as PhaseKind, oscillating: "terrace-oscillating" as PhaseKind, "with-memory": "terrace-with-memory" as PhaseKind };
    return {
      phaseKind: phaseKindMap[diag.subcase],
      phaseDegree: "low",
      prescribedGrammar: selectGrammar(candidates, intent),
      candidates,
      hiddenRegularityBlocked: hrCheck.blocked,
      blockReason: hrCheck.reason,
    };
  }

  return {
    phaseKind: "unknown",
    phaseDegree: "low",
    prescribedGrammar: "Neutral",
    candidates: [{ grammar: "Neutral", score: 5, rationale: "Indeterminate state.", vetoed: false }],
    hiddenRegularityBlocked: hrCheck.blocked,
    blockReason: hrCheck.reason,
  };
}
