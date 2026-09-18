import { describe, it, expect } from 'vitest';
import {
  createDemoWorld, tick, placeBuilding, placementError, totalPlanks, ofKind,
} from '../src/sim/economy';

const hut = (w: ReturnType<typeof createDemoWorld>) =>
  w.buildings.find((b) => b.kind === 'hut')!;
const saw = (w: ReturnType<typeof createDemoWorld>) =>
  w.buildings.find((b) => b.kind === 'sawmill')!;
const wh = (w: ReturnType<typeof createDemoWorld>) =>
  w.buildings.find((b) => b.kind === 'warehouse')!;

describe('Economía', () => {
  it('Talar produce un tronco en la cabaña', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 20000 && hut(w).logs === 0; i++) tick(w, 0.5);
    expect(hut(w).logs).toBeGreaterThan(0);
  });

  it('El aserradero convierte tronco en tablón y llega al almacén', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 40000 && totalPlanks(w) === 0; i++) tick(w, 0.5);
    expect(totalPlanks(w)).toBeGreaterThan(0);
  });

  it('La sierra y el almacén se construyen con 2 troncos cada uno', () => {
    const w = createDemoWorld();
    expect(saw(w).built).toBe(false);
    for (let i = 0; i < 60000 && !wh(w).built; i++) tick(w, 0.5);
    expect(saw(w).built).toBe(true);
    expect(wh(w).built).toBe(true);
  });

  it('Sin sierra construida no hay tablones prematuros', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 600; i++) tick(w, 0.5); // 5 min sim
    if (!saw(w).built) expect(totalPlanks(w)).toBe(0);
  });

  it('Con 10 tablones se gana la partida', () => {
    const w = createDemoWorld();
    for (let i = 0; i < 200000 && !w.won; i++) tick(w, 0.5);
    expect(w.won).toBe(true);
    expect(totalPlanks(w)).toBeGreaterThanOrEqual(10);
  });

  it('Colocar fuera del territorio se rechaza', () => {
    const w = createDemoWorld();
    expect(placeBuilding(w, 'sawmill', { x: 13, y: 0 })).toBeNull();
    expect(placementError(w, 'sawmill', [{ x: 13, y: 0 }, { x: 14, y: 0 }])).toBe('Fuera del territorio');
    expect(placementError(w, 'sawmill', [{ x: 0, y: 0 }, { x: 0, y: 1 }])).toBe('Solo en hierba');
  });

  it('Colocar sin recursos se rechaza y con recursos crea la obra', () => {
    const w = createDemoWorld();
    expect(placeBuilding(w, 'sawmill', { x: 5, y: 2 })).toBeNull(); // 0 troncos
    hut(w).logs = 4;
    w.stone = 2; // la 2ª sierra exige piedra
    const b = placeBuilding(w, 'sawmill', { x: 5, y: 2 });
    expect(b).not.toBeNull();
    expect(b!.built).toBe(false);
    expect(hut(w).logs).toBe(0); // coste cobrado
    expect(w.stone).toBe(0);
    expect(ofKind(w, 'sawmill', false).length).toBe(2);
  });

  it('La segunda sierra produce tablones', () => {
    const w = createDemoWorld();
    hut(w).logs = 4;
    w.stone = 2;
    const b = placeBuilding(w, 'sawmill', { x: 5, y: 2 });
    expect(b).not.toBeNull();
    for (let i = 0; i < 120000 && !b!.built; i++) tick(w, 0.5);
    expect(b!.built).toBe(true);
    for (let i = 0; i < 40000 && totalPlanks(w) === 0; i++) tick(w, 0.5);
    expect(totalPlanks(w)).toBeGreaterThan(0);
  });

  it('La cantera exige roca cerca', () => {
    const w = createDemoWorld();
    hut(w).logs = 4;
    expect(placeBuilding(w, 'quarry', { x: 3, y: 3 })).toBeNull(); // hierba sin roca
    expect(placementError(w, 'quarry', [{ x: 3, y: 3 }, { x: 4, y: 3 }])).toBe('Lejos de la roca');
    const q = placeBuilding(w, 'quarry', { x: 0, y: 5 }); // junto a roca (2,6)
    expect(q).not.toBeNull();
    expect(hut(w).logs).toBe(0); // 4 troncos cobrados
  });

  it('El cantero produce piedra y la 2ª sierra la exige', () => {
    const w = createDemoWorld();
    hut(w).logs = 4;
    const q = placeBuilding(w, 'quarry', { x: 0, y: 5 });
    expect(q).not.toBeNull();
    for (let i = 0; i < 120000 && !q!.built; i++) tick(w, 0.5);
    expect(q!.built).toBe(true);
    expect(w.settlers.some((s) => s.job === 'mason')).toBe(true);
    for (let i = 0; i < 60000 && w.stone === 0; i++) tick(w, 0.5);
    expect(w.stone).toBeGreaterThan(0);
    // 2ª sierra sin piedra se rechaza, con piedra se acepta
    hut(w).logs = 4;
    w.stone = 0;
    expect(placeBuilding(w, 'sawmill', { x: 6, y: 2 })).toBeNull();
    w.stone = 2;
    expect(placeBuilding(w, 'sawmill', { x: 5, y: 2 })).not.toBeNull();
    expect(w.stone).toBe(0);
  });
});
