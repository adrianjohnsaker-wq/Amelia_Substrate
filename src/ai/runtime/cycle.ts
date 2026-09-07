// src/ai/runtime/cycle.ts
'use server';

import { AmeliaProcessState } from "../core/ameliaState";
import { advanceNumogram, ensureNumogramContext, NumogramStepOutput } from "../numogram/numogramBridge";
import { LinguisticRelay, RelayResponse } from "../expressive/LinguisticRelay";
import { NumogramEngine } from "../../numogram/NumogramEngine";
import type { ReservoirState } from "../memory/shadowReservoir";
import { initializeReservoir } from "../memory/shadowReservoir";
import type { EventSurfaceState } from "../substrate/eventSurface";
import { initializeEventSurface } from "../substrate/eventSurface";
import type { OntologicalDriftState } from "../ontology/ontologicalDrift";
import { initializeOntologicalDrift } from "../ontology/ontologicalDrift";
import { runHybridMetabolism } from "../metabolic/MetabolicOrganBridge";
import { AdaptiveGateState } from "../telemetry/AdaptiveGatePlasticity";
import { ForestState } from "../forest/forest-engine";
import { SubstrateMemoryCoordinator } from "../substrate/SubstrateMemoryCoordinator";
import { ProcessMemoryEngine, type ZoneId } from "../substrate/ProcessMemoryEngine";
import { ProcessFieldMemory } from "../substrate/ProcessFieldMemory";
import { computeOrganOccupancy, type TaskClass, type MetabolicOutput } from '@/analysis/StrictRunMetrics';
import { computeAssemblageMetrics } from "@/ai/substrate/AssemblageMetrics";
import { classifyField } from "@/ai/substrate/FieldClassification";
import { buildRelayPromptV2, detectVocabularyCrossContamination } from "@/ai/expressive/amelia_relay_v2";

export interface CycleInput {
  userPrompt?: string;
  userId?: string;
  taskClass?: TaskClass;
  gateRate?: number;
  gateState?: AdaptiveGateState | null;
  previousRegimeWeights?: { alpha: number; beta: number; gamma: number } | null;
  previousZone?: string | null;
  previousRegimeEntropy?: number | null;
  runId?: string;
}

export interface FullAmeliaState {
  processState: AmeliaProcessState;
  numogramSnapshot: any;
  reservoir: ReservoirState;
  eventSurface: EventSurfaceState;
  driftState: OntologicalDriftState;
  gateState: AdaptiveGateState | null;
  previousRegimeWeights: { alpha: number; beta: number; gamma: number } | null;
  previousZone: string | null;
  previousRegimeEntropy: number | null;
  forestState?: ForestState | null; 
  substrateMemory?: any; 
  cycleCount: number;
  timestamp: Date | number;
  runId?: string;
}

export interface CycleOutput {
  nextState: AmeliaProcessState;
  nextReservoir: ReservoirState;
  nextEventSurface: EventSurfaceState;
  nextDriftState: OntologicalDriftState;
  nextGateState?: AdaptiveGateState | null;
  nextPreviousRegimeWeights?: { alpha: number; beta: number; gamma: number } | null;
  nextPreviousZone?: string | null;
  nextPreviousRegimeEntropy?: number | null;
  nextForestState?: ForestState | null;
  nextSubstrateMemory?: any; 
  reply?: string | null;
  metabolic?: MetabolicOutput | null;
  stepsTrace: any[];
  relayMetadata?: any;
}

/**
 * Robustly parse requested steps from the prompt.
 */
function parseStepsFromPrompt(prompt: string): number | null {
  const match = prompt.match(/(\d{2,5})\s*(?:steps?|step)?/i);
  if (match) {
    const val = parseInt(match[1], 10);
    if (val >= 100 && val <= 10000) return val;
  }
  return null;
}

function updateCountsInternal(counts: any, from: string, to: string) {
    const next = { ...counts };
    if (!next[from]) next[from] = {};
    next[from][to] = (next[from][to] || 0) + 1;
    return next;
}

function computeCurrentMeanSl(counts: any): number {
    let totalSl = 0;
    let zoneCount = 0;
    const zones = Object.keys(counts);
    for (const z of zones) {
        const outcomes = Object.values(counts[z] || {}) as number[];
        const totalOut = outcomes.reduce((a, b) => a + b, 0);
        if (totalOut > 0) {
            const self = (counts[z][z] || 0) as number;
            totalSl += self / totalOut;
            zoneCount++;
        }
    }
    return zoneCount > 0 ? totalSl / zoneCount : 0;
}

function computeCurrentBcs(counts: any): number {
    let corridorScores: number[] = [];
    const zones = Object.keys(counts);
    const seen = new Set<string>();

    for (const a of zones) {
        const targets = counts[a] || {};
        for (const b of Object.keys(targets)) {
            if (a === b) continue;
            const key = [a, b].sort().join('|');
            if (seen.has(key)) continue;
            seen.add(key);

            const fwd = counts[a][b] || 0;
            const rev = (counts[b] && counts[b][a]) || 0;
            if (fwd > 0 && rev > 0) {
                corridorScores.push(Math.min(fwd, rev) / Math.max(fwd, rev));
            }
        }
    }
    return corridorScores.length > 0
        ? corridorScores.reduce((a, b) => a + b, 0) / corridorScores.length
        : 0;
}

export async function runCycle(
  prevState: AmeliaProcessState,
  prevNumoSnapshot: any,
  prevReservoir: ReservoirState,
  prevEventSurface: EventSurfaceState,
  prevDriftState: OntologicalDriftState,
  input: CycleInput,
  cycleCount: number,
  prevForestState?: ForestState | null,
  prevSubstrateMemory?: any
): Promise<CycleOutput> {
    const requestedSteps = input.userPrompt ? parseStepsFromPrompt(input.userPrompt) : null;
    const substrateSteps = requestedSteps ?? 1000;
    const runId = input.runId || prevState.runId || `run_${Date.now()}`;
    
    const processEngine = new ProcessMemoryEngine();
    const coordinator = new SubstrateMemoryCoordinator(input.userId);
    const pfMemory = new ProcessFieldMemory();
    
    await coordinator.restore();

    if (prevSubstrateMemory) {
        processEngine.importSnapshot(prevSubstrateMemory.processMemory);
        coordinator.importRuntimeSnapshot(prevSubstrateMemory);
        if (prevSubstrateMemory.pfMemoryState) {
            pfMemory.importState(prevSubstrateMemory.pfMemoryState);
        }
    }

    let internalState = { ...prevState, runId };
    let internalReservoir = { ...prevReservoir };
    let internalEventSurface = { ...prevEventSurface };
    let internalDriftState = { ...prevDriftState };
    let currentForestState = prevForestState ? { ...prevForestState } : null;
    
    const stepsTrace: any[] = [];
    const appliedGateRate = input.gateRate ?? input.gateState?.currentRate ?? 1.0;

    let prevNumo: any = null;

    for (let i = 0; i < substrateSteps; i++) {
        const stepInput: CycleInput = i === 0 ? input : {};
        const numoCtx = ensureNumogramContext(internalState.numogramContext);

        const numoStep: NumogramStepOutput = advanceNumogram(numoCtx, {
            prompt: stepInput.userPrompt || "",
            envEnergy: 0.6 * appliedGateRate,
            reservoirCharge: 0.4,
        });
        const numo = numoStep.signature;
        const currentZone = numo.mutationTag as ZoneId;
        
        const transitionCounts = internalState.substrate?.transitionCounts || {};
        const currentSl = computeCurrentMeanSl(transitionCounts);
        const currentBcs = computeCurrentBcs(transitionCounts);
        
        const coordResult = coordinator.step({
            runId,
            step: cycleCount * substrateSteps + i,
            currentZone,
            transitionScores: { [currentZone]: 1.0 },
            recentPM1Traces: [processEngine.getLastTrace()].filter(Boolean) as any[],
            observedSelfLoopDepth: currentSl
        });

        const nextZone = coordResult.nextZone;

        const isRing = currentZone === "zone-0-flux" && nextZone === "zone-9-flux";
        const isCorridor = currentZone === "zone-0-flux" && nextZone === "zone-2-flux";
        
        pfMemory.update({
            step: cycleCount * substrateSteps + i,
            currentZone,
            selfLoopDepth: currentSl,
            ringSignal: isRing ? 1 : 0,
            corridorSignal: isCorridor ? 1 : 0,
            latentSignal: numo.intensity > 0.7 ? 1 : 0,
            releaseSignal: (prevNumo && prevNumo.intensity > numo.intensity + 0.15) ? 1 : 0,
            transitionSuccess: nextZone !== currentZone,
            compressionActive: currentSl > 0.35
        });

        processEngine.update({
            currentZone,
            step: cycleCount * substrateSteps + i,
            transitionCounts: {},
            selfLoopDepth: currentSl,
            gammaOccupancy: numo.zone >= 3 && numo.zone <= 6 ? 1 : 0
        });

        internalState = {
            numo,
            substrate: {
                ...internalState.substrate,
                time: (internalState.substrate?.time || 0) + 1,
                transitionCounts: updateCountsInternal(transitionCounts, currentZone, nextZone)
            },
            numogramContext: numoStep.context,
            runId
        };

        stepsTrace.push({
            t: cycleCount * substrateSteps + i,
            regime: numo.mutationTag,
            field: {
              intensity: numo.intensity,
              tension: numo.tension,
              entropy: numo.entropy,
              runMeanSl: currentSl,
              bcs: currentBcs
            }
        });

        prevNumo = numo;
    }
    
    await coordinator.checkpoint(computeCurrentMeanSl(internalState.substrate.transitionCounts));

    const transitionMatrix = internalState.substrate.transitionCounts;
    const zoneSequence = stepsTrace.map(s => s.regime);
    const assemblageMetrics = computeAssemblageMetrics(transitionMatrix as any, zoneSequence as any[]);
    const organOccupancy = computeOrganOccupancy(zoneSequence);
    const finalSl = computeCurrentMeanSl(transitionMatrix);
    const finalBcs = computeCurrentBcs(transitionMatrix);
    const latentRoutingCycle = !!(transitionMatrix["zone-0-flux"] && transitionMatrix["zone-0-flux"]["zone-2-flux"]);

    const fieldClassification = classifyField(assemblageMetrics, {
        sl: finalSl,
        bcs: finalBcs,
        ring: organOccupancy.ring.percentage,
        gamma: organOccupancy.metabolic.percentage,
        latentRoutingCycle
    });

    let metabolic: MetabolicOutput | null = null;
    if (input.userPrompt) {
      metabolic = runHybridMetabolism(
        (input.taskClass as any) || 'unclassified',
        input.userPrompt,
        appliedGateRate,
        { constraints: [], identityMode: 'parent_distributed' }
      );
    }

    let reply: string | null = null;
    if (input.userPrompt) {
        const engine = new NumogramEngine(internalState.numogramContext.state);
        const relay = new LinguisticRelay(engine);
        
        // --- AMELIA V2 ARCHITECTURE WIRING ---
        const { prompt: guidedPrompt, readout } = buildRelayPromptV2(
          {
            taskClass: input.taskClass || fieldClassification.label,
            fieldClassification: fieldClassification,
            assemblageMetrics: assemblageMetrics,
            organOccupancy: organOccupancy,
            memoryExpressing: fieldClassification.memoryExpressing,
            memoryMode: fieldClassification.memoryMode,
            gammaTrajectory: (metabolic as any)?.gammaTrajectory,
          },
          input.userPrompt ?? ""
        );
        
        const relayResponse: RelayResponse = await relay.generateResponse(guidedPrompt, input.userPrompt, readout);
        reply = relayResponse.response;
        
        const violations = detectVocabularyCrossContamination(reply || "", readout.prescribedGrammar);
        if (violations.length > 0) {
          console.warn("[Amelia Substrate] Vocabulary cross-contamination detected:", violations);
        }
    }

    return {
        nextState: internalState,
        nextReservoir: internalReservoir,
        nextEventSurface: internalEventSurface,
        nextDriftState: internalDriftState,
        runId,
        nextForestState: currentForestState,
        nextSubstrateMemory: {
            ...coordinator.exportRuntimeSnapshot(),
            processMemory: processEngine.exportSnapshot(),
            pfMemoryState: pfMemory.exportState()
        },
        reply,
        metabolic,
        stepsTrace,
        relayMetadata: {
            pfSummary: pfMemory.getRecentTelemetry(1)[0] || null
        }
    };
}
