import { describe, it, expect } from 'vitest';
import { createDemoWorld, tick } from '../src/sim/economy';

// T010: ritmo de partida. La colonia automática debe ganar en 7-13 min sim
// (objetivo de diseño 8-12; el jugador activo con 2ª sierra acelera).
describe('Ritmo', () => {
  it('victoria entre 7 y 13 minutos de simulación', () => {
    const w = createDemoWorld();
    let i = 0;
    for (; i < 400000 && !w.won; i++) tick(w, 0.5);
    expect(w.won).toBe(true);
    expect(w.time).toBeGreaterThanOrEqual(420);
    expect(w.time).toBeLessThanOrEqual(780);
  });
});
