// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { autonomousCycleOnce } from "@/ai/flows/autonomous-cycle";
import {
  FullAmeliaState,
} from "@/ai/runtime/cycle";
import { initNumogramState } from "@/ai/numogram/numogramEngine";
import { initializeReservoir } from "@/ai/memory/shadowReservoir";
import { initializeEventSurface } from "@/ai/substrate/eventSurface";
import { initializeOntologicalDrift } from "@/ai/ontology/ontologicalDrift";
import { getDb } from "@/firebase/server-init";

// Baseline state for anonymous/missing-user scenarios
const getBaselineState = (): FullAmeliaState => ({
  processState: {
    numo: null,
    substrate: {
      time: 0,
      heartbeatPhase: 0,
      pulses: [],
      reservoirSignature: "init",
    },
    numogramContext: {
      state: initNumogramState("amelia-numogram"),
    },
  },
  numogramSnapshot: null,
  reservoir: initializeReservoir(),
  eventSurface: initializeEventSurface(),
  driftState: initializeOntologicalDrift(),
  gateState: null,
  previousRegimeWeights: null,
  previousZone: null,
  previousRegimeEntropy: null,
  operatorEcology: null,
  episodes: [],
  cycleCount: 0,
  timestamp: Date.now(),
});

export async function POST(req: Request) {
  try {
    const { prompt, gateConfig, taskClass, userId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // ENHANCEMENT 4: Disk Serialization (Persistence)
    let userState: FullAmeliaState = getBaselineState();
    const db = getDb();
    const statePath = userId ? `users/${userId}/substrate/state` : null;

    if (statePath) {
        const doc = await db.doc(statePath).get();
        if (doc.exists) {
            userState = doc.data() as FullAmeliaState;
            console.log(`[Persistence] Loaded state for user: ${userId}`);
        }
    }

    const result = await autonomousCycleOnce({
      prompt,
      prevState: userState,
      taskClass: taskClass,
      gateRate: gateConfig?.rate,
    });

    const nextState = result.nextState;

    // Save updated state to disk
    if (statePath) {
        await db.doc(statePath).set({
            ...nextState,
            timestamp: Date.now()
        });
        console.log(`[Persistence] Saved state for user: ${userId}`);
    }

    return NextResponse.json({
      reply: result.surface,
      meta: {
        numogram: nextState.numogramSnapshot,
        gateConfig: result.relayMetadata?.gateConfig,
        taskClass,
        metabolic: result.metabolic,
        stepsTrace: result.stepsTrace,
        aacLogitBias: result.relayMetadata?.aacLogitBias,
        aacSource: result.relayMetadata?.aacSource,
        momentumWeight: result.relayMetadata?.momentumWeight,
        pragmaticMode: result.relayMetadata?.pragmaticMode,
        // Path E Metadata
        season: result.relayMetadata?.season,
        operatorEcology: result.relayMetadata?.operatorEcology,
        trajectoryMemory: result.relayMetadata?.trajectoryMemory
      },
    });
  } catch (error: any) {
    console.error("[API_ERROR] /api/chat:", error);
    return NextResponse.json(
      {
        reply: "[Amelia is currently unable to respond due to an internal system error.]",
        error: error.message || "An unexpected server error occurred.",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
