'use server';
// src/ai/flows/autonomous-cycle.ts
import { runCycle, FullAmeliaState, CycleOutput } from "@/ai/runtime/cycle";
import { TaskClass } from "@/ai/metabolic/MetabolicOrgan";

export async function autonomousCycleOnce(input: {
  prompt: string;
  prevState: FullAmeliaState;
  taskClass?: TaskClass;
  gateRate?: number;
}): Promise<{ nextState: FullAmeliaState; surface: string; metabolic: CycleOutput['metabolic']; relayMetadata: any; stepsTrace: any[] }> {
  // 1) advance substrate + numogram + forest etc.
  const updatedState = await runCycle(
    input.prevState.processState,
    input.prevState.numogramSnapshot,
    input.prevState.reservoir,
    input.prevState.eventSurface,
    input.prevState.driftState,
    { 
      userPrompt: input.prompt, 
      taskClass: input.taskClass, 
      gateRate: input.gateRate,
      gateState: input.prevState.gateState,
      previousRegimeWeights: input.prevState.previousRegimeWeights,
      previousZone: input.prevState.previousZone,
      previousRegimeEntropy: input.prevState.previousRegimeEntropy,
      operatorEcology: input.prevState.operatorEcology,
      episodes: input.prevState.episodes
    },
    input.prevState.cycleCount,
    input.prevState.forestState // PASS forestState
  );

  const nextState: FullAmeliaState = {
    ...input.prevState,
    processState: updatedState.nextState,
    numogramSnapshot: updatedState.nextState.numo,
    reservoir: updatedState.nextReservoir,
    eventSurface: updatedState.nextEventSurface,
    driftState: updatedState.nextDriftState,
    gateState: updatedState.nextGateState ?? input.prevState.gateState ?? null,
    previousRegimeWeights: updatedState.nextPreviousRegimeWeights,
    previousZone: updatedState.nextPreviousZone,
    previousRegimeEntropy: updatedState.nextPreviousRegimeEntropy,
    operatorEcology: updatedState.nextOperatorEcology,
    episodes: updatedState.nextEpisodes,
    forestState: updatedState.nextForestState ?? input.prevState.forestState ?? null, // PERSIST forestState
    cycleCount: input.prevState.cycleCount + 1,
    timestamp: Date.now(),
  };

  const surface = updatedState.reply || "[a very quiet field presses against language, but does not fully form]";

  return {
    nextState,
    surface: surface,
    metabolic: updatedState.metabolic,
    relayMetadata: updatedState.relayMetadata,
    stepsTrace: updatedState.stepsTrace
  };
}