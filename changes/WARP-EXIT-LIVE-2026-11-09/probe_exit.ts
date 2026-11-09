// Load her checkpoint with the Warp exit added, in her own code; step as the app's runtime loop does.
import { readFileSync } from 'node:fs';
import { bornAmelia } from './src/core/fullNumogram';
import { ExternalRhythmHarmonizer } from './src/ai/morphogenetic/ExternalRhythmHarmonizer';
const ck = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const rt = bornAmelia(); rt.importState(ck.state);
const h = new ExternalRhythmHarmonizer();
const gates = (rt.exportState() as any).qabbalaGates;
console.log('gates', gates.length, gates.filter((g: any) => g.source === 3 || g.source === 6).map((g: any) => `${g.source}->${g.target}`).join(' '));
const z: number[] = [];
for (let t = 0; t < 60; t++) { rt.setAdvisoryWeight(h.computeAdvisoryTuning(ck.controls.advisoryWeight, rt.getSnapshots().at(-1)!.step + 1)); rt.setMomentumDamping(ck.controls.momentumDamping); rt.step(); z.push(rt.getCurrentZone()); }
console.log('first 60 zones', z.join(''));
