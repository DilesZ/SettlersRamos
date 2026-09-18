import { describe, it, expect } from 'vitest';
import { createDemoWorld, tick, totalPlanks, ofKind } from '../src/sim/economy';
import { serialize, deserialize } from '../src/sim/save';

describe('Guardado', () => {
  it('Roundtrip conserva estado clave', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 3000; i++) tick(w, 0.5);
    const w2 = deserialize(serialize(w), createDemoWorld);
    expect(w2).not.toBeNull();
    expect(totalPlanks(w2!)).toBe(totalPlanks(w));
    expect(ofKind(w2!, 'hut')[0].logs).toBe(ofKind(w, 'hut')[0].logs);
    expect(ofKind(w2!, 'sawmill')[0].built).toBe(ofKind(w, 'sawmill')[0].built);
    expect(w2!.buildings.length).toBe(w.buildings.length);
    expect(w2!.settlers.length).toBe(w.settlers.length);
    expect(w2!.time).toBeCloseTo(w.time, 6);
    expect(w2!.stumps.length).toBe(w.stumps.length);
    // La sim continúa igual tras cargar
    for (let i = 0; i < 5000 && !w2!.won; i++) tick(w2!, 0.5);
    for (let i = 0; i < 5000 && !w.won; i++) tick(w, 0.5);
    expect(totalPlanks(w2!)).toBe(totalPlanks(w));
  });

  it('JSON corrupto o versión distinta devuelve null', () => {
    expect(deserialize('no-json', createDemoWorld)).toBeNull();
    expect(deserialize('{"v":99}', createDemoWorld)).toBeNull();
  });
});
