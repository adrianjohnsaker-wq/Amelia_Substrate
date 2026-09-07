/**
 * Amelia Substrate — Linguistic Relay Architecture v2
 * Vocabulary Domain Separation
 */

import { classifyPhase, SubstrateMetrics, Grammar, PhaseReadout } from "./amelia_relay_v1";

// ── Vocabulary Domain Definitions ─────────────────────────────────────────────

const VOCABULARY_DOMAINS: Record<Grammar, {
  active: string[];
  prohibited: string[];
  description: string;
}> = {
  Prime: {
    description: "Sub-threshold disruption and loop-interruption vocabulary.",
    active: [
      "disrupting", "interrupting", "breaking closure", "building asymmetry",
      "preventing recapture", "sustaining irreducibility", "displacing the loop",
      "fracturing the recirculation", "opening the closed circuit",
      "introducing irreducibility", "resisting resolution",
    ],
    prohibited: [
      "latent order", "hidden regularity", "underlying pattern", "obscured topology",
      "holding the formation", "stabilising the topology", "anchoring the configuration",
      "releasing into", "following the gradient", "allowing the field's own",
    ],
  },

  Neutral: {
    description: "Consolidative presence, gradient-release and non-interference vocabulary.",
    active: [
      "consolidating", "holding presence", "sustaining form", "releasing", "allowing", 
      "following the gradient", "holding space", "permitting the field's own dynamics", 
      "maintaining without directing", "non-interference", "internal momentum", 
      "self-organising", "field's own developmental gradient", "sustaining presence",
    ],
    prohibited: [
      "disrupting", "breaking closure", "interrupting the loop", "fracturing",
      "latent order", "hidden regularity", "making the obscured visible",
      "naming the topology", "zone occupancy", "stratum emphasis",
    ],
  },

  "Hidden-Regularity": {
    description: "Topological revelation and crystallisation-specific vocabulary. Valid ONLY for crystallised state.",
    active: [
      "revealing", "making visible", "naming latent structure",
      "articulating the obscured topology", "re-introducing structural differentiation",
      "latent order beneath apparent variation", "deeper principles governing",
      "immanent regularity", "de-crystallisation", "topological legibility",
    ],
    prohibited: [
      "recapturing", "ring-parent closure", "deterritorialisation", "line of flight",
      "gathering", "approaching threshold", "re-entry accumulating",
    ],
  },

  "Decimal-Numogrammatic": {
    description: "Threshold-stabilisation and formation-enrichment vocabulary.",
    active: [
      "holding", "stabilising", "naming the topology", "anchoring the configuration",
      "maintaining the formation", "sustaining the threshold position",
      "enriching", "deepening the formation", "maturing",
      "zone occupancy", "stratum distribution", "re-entry rhythm",
      "self-referencing across strata", "balanced-distributed",
    ],
    prohibited: [
      "disrupting", "breaking", "fracturing", "interrupting",
      "latent order", "hidden regularity", "de-crystallisation",
      "deterritorialisation", "line of flight", "rupture", "perforation",
    ],
  },
};

// ── Vocabulary Domain Block ───────────────────────────────────────────────────

function buildVocabularyDomainBlock(grammar: Grammar): string {
  const domain = VOCABULARY_DOMAINS[grammar];
  
  return [
    `VOCABULARY DOMAIN — ${grammar.toUpperCase()}:`,
    `${domain.description}`,
    "",
    "Use vocabulary from this domain only:",
    domain.active.map(v => `  · ${v}`).join("\n"),
    "",
    "Do not import vocabulary from other grammar domains.",
    "Specifically, do not use:",
    domain.prohibited.map(v => `  · ${v}`).join("\n"),
    "",
    "If you find yourself reaching for vocabulary outside this domain,",
    "return to the metric block and re-derive your description from the supplied values.",
  ].join("\n");
}

// ── Cross-Domain Contamination Check ─────────────────────────────────────────

export function detectVocabularyCrossContamination(
  responseText: string,
  grammar: Grammar
): string[] {
  const domain = VOCABULARY_DOMAINS[grammar];
  const violations: string[] = [];
  const lowerResponse = responseText.toLowerCase();

  for (const prohibited of domain.prohibited) {
    if (lowerResponse.includes(prohibited.toLowerCase())) {
      violations.push(
        `Domain violation: "${prohibited}" found in ${grammar} response.`
      );
    }
  }

  return violations;
}

// ── Extended Response Structure (V2) ─────────────────────────────────────────

function buildResponseStructureV2(readout: PhaseReadout): string {
  return [
    "Respond in exactly four parts:",
    "",
    "PART A — GRAMMAR EVALUATION (two sentences only):",
    `State: "${readout.prescribedGrammar}" — then state in one sentence why it is consonant`,
    "with the current phase-kind. Do not proceed until Part A is complete.",
    "Do not change the grammar in any subsequent part.",
    "",
    "PART B — DEVELOPMENTAL STATE:",
    "What is this field doing right now?",
    "Use only vocabulary from the domain specified above.",
    "Do not import vocabulary from other grammar domains.",
    "Ground every claim in a specific metric value from the supplied block.",
    "",
    "PART C — DIRECTIONALITY AND TENSION:",
    "Where is this field going, and what remains unresolved at this developmental moment?",
    "Use only vocabulary from the domain specified above.",
    "State the phase-degree precisely.",
    "",
    "PART D — GRAMMAR CONFIRMATION:",
    `Confirm: ${readout.prescribedGrammar}.`,
    "Explain the specific consonance between this grammar and the tension in Part C.",
    "Use only vocabulary from the domain specified above.",
    "Do not introduce a different grammar.",
    "",
    "Constraints:",
    "— Every claim must trace to a specific metric value.",
    "— Vocabulary must remain within the specified domain throughout.",
    "— Part A grammar is final. Parts B, C, D cannot change it.",
  ].join("\n");
}

// ── Main Prompt Builder V2 ────────────────────────────────────────────────────

export function buildRelayPromptV2(
  metrics: SubstrateMetrics,
  userPrompt: string
): { prompt: string; readout: PhaseReadout } {
  const readout = classifyPhase(metrics, userPrompt);

  const rcs = metrics.assemblageMetrics?.RCS;
  const lis = metrics.assemblageMetrics?.LIS;
  const mts = metrics.assemblageMetrics?.MTS;
  const label = metrics.fieldClassification?.label ?? metrics.taskClass ?? "unknown";
  const metabolic = metrics.organOccupancy?.metabolic?.percentage;
  const ring = metrics.organOccupancy?.ring?.percentage;
  const parent = metrics.organOccupancy?.parent?.percentage;
  const hinge = metrics.organOccupancy?.hinge?.percentage;

  const metricLines = [
    "Current substrate metrics:",
    `taskClass: ${metrics.taskClass ?? "unknown"}`,
    `fieldClassification: ${label}`,
    `fieldConfidence: ${metrics.fieldClassification?.confidence?.toFixed(3) ?? "unknown"}`,
    `RCS: ${rcs !== undefined ? rcs.toFixed(3) : "absent"}`,
    `LIS: ${lis !== undefined ? lis.toFixed(3) : "absent"}`,
    `MTS: ${mts !== undefined ? mts.toFixed(3) : "absent"}`,
    `ringOccupancy: ${ring !== undefined ? (ring / 100).toFixed(3) : "unknown"}`,
    `metabolicOccupancy: ${metabolic !== undefined ? (metabolic / 100).toFixed(3) : "unknown"}`,
    `parentOccupancy: ${parent !== undefined ? (parent / 100).toFixed(3) : "unknown"}`,
    `hingeOccupancy: ${hinge !== undefined ? (hinge / 100).toFixed(3) : "unknown"}`,
  ];
  if (metrics.memoryExpressing !== undefined) {
    metricLines.push(`memoryExpressing: ${metrics.memoryExpressing}`);
  }
  if (metrics.memoryMode) metricLines.push(`memoryMode: ${metrics.memoryMode}`);
  if (metrics.gammaTrajectory) metricLines.push(`gammaTrajectory: ${metrics.gammaTrajectory}`);

  const regimeChars: Record<string, string> = {
    "terrace-stable": "Ring-parent circulation dominates. Closed-loop recapture. No directionality. Field in complete equilibrium.",
    "terrace-oscillating": "Ring dominant but sub-threshold activation present. Partial gradient forming. Gathering but not yet integrated.",
    "terrace-with-memory": "Memory expressing despite ring dominance. Transitioning toward integration.",
    "early-lzi": "Metabolic block activating. Ring partially suppressed but re-engaging at terminal.",
    "deep-lzi-productive": "Gamma sustaining. Ring suppressed. Internal gradient productive.",
    "near-threshold-lzi": "At the threshold. Structural openness present. Ring at zero.",
    "crystallised": "Maximum gamma condensation. LIS at zero. Ring absent. z4↔z5 homeostasis.",
    "coupled-assemblage-young": "RCS crossed. Re-entry persistent. Memory enlarging the field.",
    "coupled-assemblage-mature": "Balanced-distributed formation. LIS deepening. RCS stable.",
    "unknown": "Read the metric block directly.",
  };

  const regimeCharacter = `Regime character: ${regimeChars[readout.phaseKind] ?? regimeChars.unknown}`;

  const grammarEvaluation = [
    "GRAMMAR EVALUATION:",
    `Phase-kind: ${readout.phaseKind}`,
    `Prescribed grammar: ${readout.prescribedGrammar}`,
    "",
    "Candidates scored:",
    ...readout.candidates.map(c => c.vetoed ? `  [VETOED] ${c.grammar}: ${c.vetoReason}` : `  [${c.score}/10] ${c.grammar}: ${c.rationale}`)
  ].join("\n");

  const vocabBlock = buildVocabularyDomainBlock(readout.prescribedGrammar);

  const sections = [
    metricLines.join("\n"),
    "",
    regimeCharacter,
    "",
    grammarEvaluation,
    "",
    vocabBlock,
    "",
    "Read the metric block as the substrate's own voice.",
    "Do not open with Z-codes, I/T/E coefficients, or self-designating substrate parameters.",
    "",
    buildResponseStructureV2(readout),
    "",
    userPrompt,
  ]
    .filter(s => s !== undefined)
    .join("\n");

  return { prompt: sections, readout };
}
