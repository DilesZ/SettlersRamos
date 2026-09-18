// T005: simulación económica desacoplada del render. Tick fijo 50ms, determinista.
import { Grid } from './grid';
import { astar, Tile } from './astar';
import balance from '../data/balance.json';

export type Carry = 'log' | 'plank' | null;

export interface Settler {
  id: number;
  job: 'lumberjack' | 'carrier';
  x: number; // posición en celdas (float)
  y: number;
  path: Tile[];
  state: string;
  timer: number;
  carry: Carry;
  // tarea actual del portador
  from: { x: number; y: number } | null;
  to: { x: number; y: number } | null;
  building: 'sawmill' | 'warehouse' | null;
}

export interface World {
  grid: Grid;
  settlers: Settler[];
  hut: { x: number; y: number; logs: number };
  sawmill: { x: number; y: number; busy: boolean; timer: number; done: boolean };
  warehouse: { x: number; y: number; planks: number };
  time: number;
  won: boolean;
}

export const SPEED = 2.2; // celdas por segundo a x1

function adjacentFree(grid: Grid, tx: number, ty: number): Tile | null {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
  for (const [dx, dy] of dirs) {
    if (grid.passable(tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy };
  }
  return null;
}

function nearestForest(w: World, fx: number, fy: number): Tile | null {
  let best: Tile | null = null;
  let bd = Infinity;
  for (let y = 0; y < w.grid.h; y++) {
    for (let x = 0; x < w.grid.w; x++) {
      if (w.grid.get(x, y).terrain !== 'forest') continue;
      const d = Math.abs(x - fx) + Math.abs(y - fy);
      if (d < bd) { bd = d; best = { x, y }; }
    }
  }
  return best;
}

function setPathTo(w: World, s: Settler, tx: number, ty: number): void {
  s.path = astar(w.grid, { x: Math.round(s.x), y: Math.round(s.y) }, { x: tx, y: ty });
}

/** Avanza por el path. Devuelve true al llegar al destino. */
function moveAlong(s: Settler, dt: number): boolean {
  if (s.path.length === 0) return true;
  const n = s.path[0];
  const dx = n.x - s.x;
  const dy = n.y - s.y;
  const dist = Math.hypot(dx, dy);
  const step = SPEED * dt;
  if (dist <= step) {
    s.x = n.x; s.y = n.y;
    s.path.shift();
    return s.path.length === 0;
  }
  s.x += (dx / dist) * step;
  s.y += (dy / dist) * step;
  return false;
}

export function createDemoWorld(): World {
  const grid = new Grid(15, 8);
  for (let x = 1; x <= 13; x++) grid.setTerrain(x, 4, 'road');
  const forest: Tile[] = [
    { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 0 }, { x: 0, y: 2 },
    { x: 4, y: 1 }, { x: 2, y: 2 }, { x: 5, y: 0 }, { x: 5, y: 1 },
    { x: 0, y: 1 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 0, y: 0 },
  ];
  for (const t of forest) grid.setTerrain(t.x, t.y, 'forest');
  grid.setTerrain(12, 1, 'rock');
  grid.setTerrain(13, 2, 'rock');
  const hut = { x: 4, y: 6, logs: 0 };
  const sawmill = { x: 7, y: 6, busy: false, timer: 0, done: false };
  const warehouse = { x: 10, y: 6, planks: 0 };
  grid.get(hut.x, hut.y).building = 'hut';
  grid.get(sawmill.x, sawmill.y).building = 'sawmill';
  grid.get(warehouse.x, warehouse.y).building = 'warehouse';
  const w: World = { grid, settlers: [], hut, sawmill, warehouse, time: 0, won: false };
  const jack: Settler = {
    id: 1, job: 'lumberjack', x: 4, y: 5, path: [], state: 'toTree',
    timer: 0, carry: null, from: null, to: null, building: null,
  };
  assignTree(w, jack);
  const mkCarrier = (id: number): Settler => ({
    id, job: 'carrier', x: 10, y: 5, path: [], state: 'idle',
    timer: 0, carry: null, from: null, to: null, building: null,
  });
  w.settlers = [jack, mkCarrier(2), mkCarrier(3)];
  return w;
}

function assignTree(w: World, s: Settler): void {
  const t = nearestForest(w, Math.round(s.x), Math.round(s.y));
  if (!t) { s.state = 'idle'; s.path = []; return; }
  const adj = adjacentFree(w.grid, t.x, t.y);
  if (!adj) { s.state = 'idle'; s.path = []; return; }
  s.to = t;
  setPathTo(w, s, adj.x, adj.y);
  s.state = s.path.length > 0 ? 'toTree' : 'chopping';
  if (s.state === 'chopping') s.timer = balance.times.chopTree;
}

function tickLumberjack(w: World, s: Settler, dt: number): void {
  if (s.state === 'idle') { assignTree(w, s); return; }
  if (s.state === 'toTree') {
    if (moveAlong(s, dt)) {
      s.state = 'chopping';
      s.timer = balance.times.chopTree;
    }
    return;
  }
  if (s.state === 'chopping') {
    s.timer -= dt;
    if (s.timer <= 0 && s.to) {
      w.grid.setTerrain(s.to.x, s.to.y, 'grass');
      s.carry = 'log';
      const adj = adjacentFree(w.grid, w.hut.x, w.hut.y);
      if (adj) setPathTo(w, s, adj.x, adj.y);
      s.state = 'toHut';
    }
    return;
  }
  if (s.state === 'toHut') {
    if (moveAlong(s, dt)) {
      w.hut.logs++;
      s.carry = null;
      assignTree(w, s);
    }
  }
}

function tickCarrier(w: World, s: Settler, dt: number): void {
  if (s.state === 'idle') {
    // Prioridad: llevar tablón listo al almacén; si no, llevar tronco al aserradero.
    if (w.sawmill.done) {
      const adj = adjacentFree(w.grid, w.sawmill.x, w.sawmill.y);
      if (adj) {
        setPathTo(w, s, adj.x, adj.y);
        s.from = { x: w.sawmill.x, y: w.sawmill.y };
        s.to = { x: w.warehouse.x, y: w.warehouse.y };
        s.building = 'warehouse';
        s.state = 'toPickup';
      }
      return;
    }
    if (w.hut.logs > 0 && !w.sawmill.busy && !w.sawmill.done) {
      const adj = adjacentFree(w.grid, w.hut.x, w.hut.y);
      if (adj) {
        setPathTo(w, s, adj.x, adj.y);
        s.from = { x: w.hut.x, y: w.hut.y };
        s.to = { x: w.sawmill.x, y: w.sawmill.y };
        s.building = 'sawmill';
        s.state = 'toPickup';
      }
    }
    return;
  }
  if (s.state === 'toPickup') {
    if (moveAlong(s, dt)) {
      if (s.building === 'sawmill' && w.hut.logs > 0) {
        w.hut.logs--;
        s.carry = 'log';
        const adj = adjacentFree(w.grid, w.sawmill.x, w.sawmill.y);
        if (adj) setPathTo(w, s, adj.x, adj.y);
        s.state = 'toDrop';
      } else if (s.building === 'warehouse' && w.sawmill.done) {
        w.sawmill.done = false;
        s.carry = 'plank';
        const adj = adjacentFree(w.grid, w.warehouse.x, w.warehouse.y);
        if (adj) setPathTo(w, s, adj.x, adj.y);
        s.state = 'toDrop';
      } else {
        s.state = 'idle';
      }
    }
    return;
  }
  if (s.state === 'toDrop') {
    if (moveAlong(s, dt)) {
      if (s.building === 'sawmill' && s.carry === 'log') {
        w.sawmill.busy = true;
        w.sawmill.timer = balance.times.sawPlank;
        s.carry = null;
      } else if (s.building === 'warehouse' && s.carry === 'plank') {
        w.warehouse.planks++;
        s.carry = null;
        if (w.warehouse.planks >= balance.winPlanks) w.won = true;
      }
      s.state = 'idle';
    }
  }
}

export function tick(w: World, dt: number): void {
  if (w.won) return;
  w.time += dt;
  if (w.sawmill.busy) {
    w.sawmill.timer -= dt;
    if (w.sawmill.timer <= 0) {
      w.sawmill.busy = false;
      w.sawmill.done = true;
    }
  }
  for (const s of w.settlers) {
    if (s.job === 'lumberjack') tickLumberjack(w, s, dt);
    else tickCarrier(w, s, dt);
  }
}
