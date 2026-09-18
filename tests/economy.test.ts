import { describe, it, expect } from 'vitest';
import { createDemoWorld, tick } from '../src/sim/economy';

describe('Economía', () => {
  it('Talar produce un tronco en la cabaña', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 20000 && w.hut.logs === 0; i++) tick(w, 0.5);
    expect(w.hut.logs).toBeGreaterThan(0);
  });

  it('El aserradero convierte tronco en tablón y llega al almacén', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 40000 && w.warehouse.planks === 0; i++) tick(w, 0.5);
    expect(w.warehouse.planks).toBeGreaterThan(0);
  });

  it('Con 10 tablones se gana la partida', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 200000 && !w.won; i++) tick(w, 0.5);
    expect(w.won).toBe(true);
    expect(w.warehouse.planks).toBeGreaterThanOrEqual(10);
  });
});
