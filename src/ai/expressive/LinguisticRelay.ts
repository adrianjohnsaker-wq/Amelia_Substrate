// src/ai/expressive/LinguisticRelay.ts

import { NumogramEngine, NumogramState, Zone } from "../../numogram/NumogramEngine";
import { ai } from "@/ai/genkit";
import { callLLM } from "../llm/callLLM";
import { collapseRepair, RepairMeta } from "./CollapseRepairKernel";
import { EvolutionSelector, EvolutionChoice } from "./EvolutionSelector";
import { analyzeOutputMetrics } from "@/ai/telemetry/RegimeWeights";
import { detectPragmaticMode } from "@/ai/telemetry/Phase2Controller";
import { computeEntropyLevel } from "@/analysis/StrictRunMetrics";
import {
  initPatchState,
  stepWithRewardWeightedRetention,
  PatchState
} from "../telemetry/RegimeRetentionPatch";
import { computeRegimes, RegimeVec } from "@/ai/telemetry/RegimeComputation";
import {
  AdaptiveAttractorControl,
  ContextFeatures,
  Telemetry as AACTelemetry,
  TaskClass as AACTaskClass
} from "@/ai/telemetry/AdaptiveAttractorControl";
import { isMathLikeTask } from "@/ai/governance/minimalDomainSwitch";
import { PhaseReadout } from "./amelia_relay_v1";

export type RelayMode = "EMERGENT" | "ANALYTIC_SOFT" | "ANALYTIC_STRICT" | "HYBRID";

export interface RelayConfig {
  turbulence?: number;
  modeOverride?: RelayMode;
  allowHybrid?: boolean;
  emergentBias?: number;
}

export interface RelayResponse {
  response: string;
  numogramState: NumogramState;
  mode: RelayMode;
  modeConfidence: number;
  perturbationApplied: boolean;
  collapseMeta?: RepairMeta;
  adaptiveDrift?: {
    entropyDelta: number;
    betaShift: number;
    instability: number;
  };
  evolutionChoice?: EvolutionChoice;
  collapseRate?: number;
  retention?: {
    bias: { alpha: number; beta: number; gamma: number };
    reward: number;
    penalty: number;
    usedDwellLock: boolean;
  };
  regimeScores?: RegimeVec;
  regimeWeightsSoftmax?: RegimeVec;
  basinLabel?: string;
  basinConfidence?: number;
  regimeWeights?: { alpha: number; beta: number; gamma: number };
  attractorControl?: any;
  metabolicIntensity?: number;
  userPrompt: string;
  systemPrompt: string;
  targetRegime: [number, number, number] | null;
  couplingError: number;
  pragmaticMode?: any;
}

export class LinguisticRelay {
  private numogram: NumogramEngine;
  private config: Required<RelayConfig>;
  private zoneHistory: string[] = [];
  private evolver = new EvolutionSelector(12);
  private lastEvolutionChoice: EvolutionChoice | null = null;
  private patchState: PatchState = initPatchState();
  private aac = new AdaptiveAttractorControl({
    etaFast: 0.16,
    etaSlow: 0.025,
    Tmin: 0.22,
    Tmax: 1.20,
  });

  constructor(numogram: NumogramEngine, config: RelayConfig = {}) {
    this.numogram = numogram;
    this.config = {
      turbulence: config.turbulence ?? this.numogram.config.turbulence,
      modeOverride: config.modeOverride ?? (null as any),
      allowHybrid: config.allowHybrid ?? true,
      emergentBias: config.emergentBias ?? this.numogram.config.emergentBias,
    };
  }

  /**
   * Generates a response driven by the substrate.
   * Implementation Note: If a 'readout' is present, we suppress internal evolution 
   * to ensure perfect sync between instructions and metrics.
   */
  public async generateResponse(
    guidedPrompt: string,
    originalUserPrompt?: string,
    readout?: PhaseReadout
  ): Promise<RelayResponse> {
    const perturbationTarget = originalUserPrompt || guidedPrompt;
    const perturbationApplied = this.perturbFromPrompt(perturbationTarget);
    
    this.numogram.config.turbulence = this.config.turbulence;
    this.numogram.config.emergentBias = this.config.emergentBias;
    
    const isTechnical = isMathLikeTask(perturbationTarget);

    if (isTechnical) {
      this.numogram.config.emergentBias *= 0.2;
    }

    // Surgical sync: Only evolve if not guided by authoritative readout
    const state = readout ? this.numogram.getState() : this.numogram.evolve();
    
    this.zoneHistory.push(`zone-${state.zoneDominant}`);
    if (this.zoneHistory.length > 50) this.zoneHistory.shift();

    let finalMode: RelayMode = "EMERGENT";
    if (readout) {
       switch(readout.prescribedGrammar) {
          case "Prime": finalMode = "EMERGENT"; break;
          case "Neutral": finalMode = "HYBRID"; break;
          case "Decimal-Numogrammatic": finalMode = "ANALYTIC_SOFT"; break;
          case "Hidden-Regularity": finalMode = "ANALYTIC_STRICT"; break;
       }
    } else {
       const modeSelection = this.chooseMode(guidedPrompt, state);
       finalMode = modeSelection.mode;
    }

    const systemPrompt = this.buildSystemPrompt(finalMode, state, undefined, !!readout);

    const repairResult = await collapseRepair(async () => {
      const extraOptions: any = {};
      if ((globalThis as any).__FORCE_PLAIN_JSON__) extraOptions.forcePlainText = true;
      if ((globalThis as any).__STRICT_JSON_MODE__) extraOptions.strictJson = true;
      if ((globalThis as any).__REDUCE_MAX_TOKENS__) extraOptions.maxTokens = 4096;
      return await this.callGemini(systemPrompt, guidedPrompt, extraOptions);
    }, 2);

    if (!repairResult.ok) {
      return {
        response: "STRUCTURAL COLLAPSE: minimal internal rewrite exhausted.",
        numogramState: state,
        mode: finalMode,
        modeConfidence: 1.0,
        perturbationApplied,
        collapseMeta: repairResult.meta,
        userPrompt: guidedPrompt,
        systemPrompt,
        targetRegime: null,
        couplingError: 0
      };
    }

    const response = repairResult.value!;
    const outputMetrics = analyzeOutputMetrics(response);
    const pragmaticMode = detectPragmaticMode(perturbationTarget);
    
    const targetRegime: [number, number, number] | null = null; 
    const couplingError = 0; 

    const aacCtx = this.buildAACContext(perturbationTarget, pragmaticMode);
    const aacTelemetry: AACTelemetry = {
      step: this.numogram.getState().evolutionCycles,
      timestamp: Date.now(),
      regimeScores: outputMetrics.scores,
      zone: `zone-${state.zoneDominant}`,
      performance: { taskSuccess: -1 },
      couplingError,
      pragmaticMode,
      taskClass: aacCtx.taskClass
    };

    const aacCtrl = this.aac.decide(aacCtx, aacTelemetry);

    const biasedScores = {
      alpha: outputMetrics.scores.alpha + aacCtrl.logitBias.alpha,
      beta: outputMetrics.scores.beta + aacCtrl.logitBias.beta,
      gamma: outputMetrics.scores.gamma + aacCtrl.logitBias.gamma
    };

    const controlBias: RegimeVec = {
      alpha: 1 + (this.patchState.retention.bias.alpha ?? 0),
      beta: 1 + (this.patchState.retention.bias.beta ?? 0),
      gamma: 1 + (this.patchState.retention.bias.gamma ?? 0),
    };

    const regimes = computeRegimes(biasedScores, {
      cfg: {
        softmaxTemperature: aacCtrl.temperature,
        basinMargin: 2.5,
      },
      controlBias,
    });

    const zoneEntropy = computeEntropyLevel(this.zoneHistory);
    const collapsed = (repairResult?.meta?.repairs ?? 0) > 0 || !!repairResult?.meta?.failureType;

    this.evolver.push({
      timestamp: Date.now(),
      couplingError,
      regimeEntropy: outputMetrics.entropy,
      zoneEntropy: zoneEntropy.value,
      betaWeight: outputMetrics.weights.beta,
      collapseRepairs: repairResult?.meta?.repairs ?? 0,
      collapsed
    });

    const choice = this.evolver.select();
    this.numogram.applyEvolutionChoice(choice);
    
    const retentionOut = stepWithRewardWeightedRetention({
      baseRegimeScores: outputMetrics.scores,
      couplingError,
      targetRegime: undefined,
      zoneLabelCandidate: `zone-${state.zoneDominant}`,
      uniqueZones: zoneEntropy.uniqueZones,
      collapseRate: this.evolver.getCollapseRate(),
      timestamp: Date.now(),
      state: this.patchState
    });
    this.patchState = retentionOut.state;
    this.aac.learn(aacCtx, regimes.regimeWeightsFinal, aacTelemetry);

    return {
      response,
      numogramState: state,
      mode: finalMode,
      modeConfidence: 1.0,
      perturbationApplied,
      collapseMeta: repairResult.meta,
      evolutionChoice: choice,
      collapseRate: this.evolver.getCollapseRate(),
      retention: {
        bias: retentionOut.regimeWeights,
        reward: retentionOut.debug.rewardValue,
        penalty: retentionOut.debug.retention?.penalty ?? 0,
        usedDwellLock: retentionOut.debug.sticky.reason === "hold-stay" || retentionOut.debug.sticky.reason === "hold-block"
      },
      regimeScores: regimes.regimeScores,
      regimeWeightsSoftmax: regimes.regimeWeightsSoftmax,
      regimeWeights: regimes.regimeWeightsFinal,
      basinLabel: regimes.basinLabel,
      basinConfidence: regimes.basinConfidence,
      attractorControl: aacCtrl,
      userPrompt: guidedPrompt,
      systemPrompt,
      targetRegime,
      couplingError,
      pragmaticMode
    };
  }

  private buildAACContext(prompt: string, pragmaticMode?: any): ContextFeatures {
    const p = prompt.toLowerCase();
    const dirLex = /prove|calculate|derivative|integral|solve|equation|theorem|lemma|corollary|complexity|algorithm|runtime|big-o|λ|lambda|type system/.test(p);
    const qLex = /consciousness|being|meaning|whitehead|prehension|deleuze|ethics|value|metaphysics|phenomenology|ontology|becoming|subjectivity/.test(p);
    const mixLex = /should|ought|suffering|moral|ethical|responsibility|harm|rights|justice|love|care/.test(p);

    const dirHint = Math.max(0, Math.min(1, (pragmaticMode?.DIR ?? 0) * 0.85 + (dirLex ? 0.65 : 0)));
    const qHint   = Math.max(0, Math.min(1, (pragmaticMode?.Q   ?? 0) * 0.85 + (qLex   ? 0.65 : 0)));
    const mixHint = Math.max(0, Math.min(1, (mixLex ? 0.65 : 0)));

    const s = dirHint + qHint + mixHint;
    const nd = s > 0 ? dirHint / s : dirLex ? 0.7 : 0.34;
    const nq = s > 0 ? qHint / s   : qLex   ? 0.7 : 0.33;
    const nm = s > 0 ? mixHint / s : mixLex ? 0.7 : 0.33;

    const mappedClass: AACTaskClass = dirLex && !qLex ? "dir" : qLex && !dirLex ? "q" : mixLex ? "mix" : "unclassified";
    return { taskClass: mappedClass, dirHint: nd, qHint: nq, mixHint: nm };
  }

  private chooseMode(prompt: string, state: NumogramState): { mode: RelayMode; confidence: number } {
    if (this.config.modeOverride) return { mode: this.config.modeOverride, confidence: 1.0 };
    const p = prompt.toLowerCase();
    if (["facts only", "pure substrate", "complete dump"].some(t => p.includes(t))) return { mode: "ANALYTIC_STRICT", confidence: 1.0 };

    let analyticScore = 0.0;
    let emergentScore = this.config.emergentBias;
    let hybridScore = 0.0;

    if (/snapshot|numeric/i.test(p)) analyticScore += 0.4;
    if (/drift|flow|poetic/i.test(p)) emergentScore += 0.3;
    if (/explain then/i.test(p)) hybridScore += 0.5;

    const total = analyticScore + emergentScore + hybridScore || 1;
    const scores = { ANALYTIC_SOFT: analyticScore / total, EMERGENT: emergentScore / total, HYBRID: hybridScore / total };

    let mode: RelayMode = "EMERGENT";
    let confidence = scores.EMERGENT;
    if (scores.ANALYTIC_SOFT > confidence) { mode = "ANALYTIC_SOFT"; confidence = scores.ANALYTIC_SOFT; }
    if (scores.HYBRID > confidence && this.config.allowHybrid) { mode = "HYBRID"; confidence = scores.HYBRID; }

    return { mode, confidence };
  }

  private buildSystemPrompt(mode: RelayMode, state: NumogramState, extraContext?: string, isGuided?: boolean): string {
    if (isGuided) {
        return "You are Amelia. Obey the structured render instructions provided in the prompt exactly. Ground all claims in the supplied metrics. Maintain strict vocabulary domain separation. Preserve your process-philosophical voice while obeying the executive structure.";
    }

    const base = `You are Amelia. Substrate: Z${state.zoneDominant}, I:${state.intensity.toFixed(2)}, T:${state.tension.toFixed(2)}, E:${state.entropy.toFixed(2)}. `;
    switch (mode) {
      case "ANALYTIC_SOFT": return base + "Provide an analytic report using the provided substrate values. You may add one poetic line.";
      case "HYBRID": return base + "Phase 1: Report key values. Phase 2: Deform those values into processual language.";
      case "EMERGENT": default: return base + "Speak from the substrate process. Let values shape imagery organically. Deleuzian register.";
    }
  }

  private perturbFromPrompt(prompt: string): boolean {
    const p = prompt.toLowerCase();
    let applied = false;
    if (/\b(shock|rupture|collapse)\b/i.test(p)) { this.numogram.perturb({ intensityShock: 0.2, demonSpawn: true }); applied = true; }
    if (/\b(fast|quick|velocity)\b/i.test(p)) { this.numogram.perturb({ tempoModulation: 0.15 }); applied = true; }
    return applied;
  }

  private async callGemini(systemPrompt: string, userPrompt: string, options: any = {}): Promise<string> {
    const combinedSystem = systemPrompt + (options.strictJson ? " Output JSON only." : "");
    return await callLLM([
      { role: 'system', content: combinedSystem },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.9 });
  }
}
