import { describe, it, expect } from 'vitest';
import { createDemoWorld, tick } from '../src/sim/economy';
import { serialize, deserialize } from '../src/sim/save';

describe('Guardado', () => {
  it('Roundtrip conserva estado clave', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 3000; i++) tick(w, 0.5);
    const w2 = deserialize(serialize(w), createDemoWorld);
    expect(w2).not.toBeNull();
    expect(w2!.warehouse.planks).toBe(w.warehouse.planks);
    expect(w2!.hut.logs).toBe(w.hut.logs);
    expect(w2!.sawmill.built).toBe(w.sawmill.built);
    expect(w2!.settlers.length).toBe(w.settlers.length);
    expect(w2!.time).toBeCloseTo(w.time, 6);
    expect(w2!.stumps.length).toBe(w.stumps.length);
    // La sim continúa igual tras cargar
    for (let i = 0; i < 5000 && !w2!.won; i++) tick(w2!, 0.5);
    for (let i = 0; i < 5000 && !w.won; i++) tick(w, 0.5);
    expect(w2!.warehouse.planks).toBe(w.warehouse.planks);
  });

  it('JSON corrupto o versión distinta devuelve null', () => {
    expect(deserialize('no-json', createDemoWorld)).toBeNull();
    expect(deserialize('{"v":99}', createDemoWorld)).toBeNull();
  });
});
