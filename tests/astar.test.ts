import { describe, it, expect } from 'vitest';
import { Grid } from '../src/sim/grid';
import { astar } from '../src/sim/astar';

describe('A*', () => {
  it(' Rodea un muro de roca', () => {
    const g = new Grid(5, 5);
    for (let y = 0; y < 4; y++) g.setTerrain(2, y, 'rock');
    const path = astar(g, { x: 0, y: 0 }, { x: 4, y: 0 });
    expect(path.length).toBeGreaterThan(0);
    const last = path[path.length - 1];
    expect(last).toEqual({ x: 4, y: 0 });
    for (const t of path) expect(g.passable(t.x, t.y)).toBe(true);
  });

  it('Prefiere camino (coste menor)', () => {
    const g = new Grid(5, 3);
    for (let x = 0; x < 5; x++) g.setTerrain(x, 1, 'road');
    const path = astar(g, { x: 0, y: 1 }, { x: 4, y: 1 });
    expect(path).toEqual([
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
    ]);
  });

  it('Sin ruta devuelve []', () => {
    const g = new Grid(3, 3);
    g.setTerrain(1, 0, 'rock');
    g.setTerrain(1, 1, 'rock');
    g.setTerrain(1, 2, 'rock');
    g.setTerrain(0, 1, 'rock');
    g.setTerrain(2, 1, 'rock');
    expect(astar(g, { x: 0, y: 0 }, { x: 2, y: 2 })).toEqual([]);
  });

  it('Llega junto a un objetivo bloqueado (árbol/edificio)', () => {
    const g = new Grid(5, 5);
    g.setTerrain(2, 2, 'rock');
    const path = astar(g, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(path.length).toBeGreaterThan(0);
    const last = path[path.length - 1];
    expect(Math.abs(last.x - 2) + Math.abs(last.y - 2) <= 1).toBe(true);
  });
});
