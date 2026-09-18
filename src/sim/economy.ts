// Sim económica desacoplada del render. Tick fijo 50ms, determinista.
// Migración UH-iso: edificios con huella (varias celdas), bosque/agua bloquean,
// tocones visuales al talar.
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

export interface Building {
  kind: 'hut' | 'sawmill' | 'warehouse';
  cells: Tile[]; // huella lógica (todas marcadas con building en la rejilla)
  logs: number; // cabaña
  busy: boolean; // sierra
  timer: number; // sierra
  done: boolean; // sierra: tablón listo
  planks: number; // almacén
}

export interface World {
  grid: Grid;
  settlers: Settler[];
  hut: Building;
  sawmill: Building;
  warehouse: Building;
  stumps: Tile[]; // tocones visuales (transitables)
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

/** Celda libre adyacente a cualquier celda de la huella. */
function adjacentTo(grid: Grid, cells: Tile[]): Tile | null {
  for (const c of cells) {
    const adj = adjacentFree(grid, c.x, c.y);
    if (adj) return adj;
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

function markFootprint(grid: Grid, kind: string, cells: Tile[]): void {
  for (const c of cells) grid.get(c.x, c.y).building = kind;
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
  for (const [x, y] of [[13, 6], [14, 6], [13, 7], [14, 7]]) grid.setTerrain(x, y, 'water');
  const hut: Building = { kind: 'hut', cells: [{ x: 4, y: 6 }, { x: 5, y: 6 }], logs: 0, busy: false, timer: 0, done: false, planks: 0 };
  const sawmill: Building = { kind: 'sawmill', cells: [{ x: 7, y: 6 }, { x: 8, y: 6 }], logs: 0, busy: false, timer: 0, done: false, planks: 0 };
  const warehouse: Building = { kind: 'warehouse', cells: [{ x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }], logs: 0, busy: false, timer: 0, done: false, planks: 0 };
  markFootprint(grid, 'hut', hut.cells);
  markFootprint(grid, 'sawmill', sawmill.cells);
  markFootprint(grid, 'warehouse', warehouse.cells);
  const w: World = { grid, settlers: [], hut, sawmill, warehouse, stumps: [], time: 0, won: false };
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
      w.stumps.push({ x: s.to.x, y: s.to.y });
      s.carry = 'log';
      const adj = adjacentTo(w.grid, w.hut.cells);
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
  const goPickup = (b: Building, cargo: 'sawmill' | 'warehouse') => {
    const adj = adjacentTo(w.grid, b.cells);
    if (!adj) return;
    setPathTo(w, s, adj.x, adj.y);
    const c = b.cells[0];
    s.from = { x: c.x, y: c.y };
    const dst = cargo === 'sawmill' ? w.sawmill : w.warehouse;
    const dc = dst.cells[0];
    s.to = { x: dc.x, y: dc.y };
    s.building = cargo;
    s.state = 'toPickup';
  };
  if (s.state === 'idle') {
    // Prioridad: llevar tablón listo al almacén; si no, llevar tronco al aserradero.
    if (w.sawmill.done) {
      goPickup(w.sawmill, 'warehouse');
      return;
    }
    if (w.hut.logs > 0 && !w.sawmill.busy && !w.sawmill.done) {
      goPickup(w.hut, 'sawmill');
    }
    return;
  }
  if (s.state === 'toPickup') {
    if (moveAlong(s, dt)) {
      if (s.building === 'sawmill' && w.hut.logs > 0) {
        w.hut.logs--;
        s.carry = 'log';
        const adj = adjacentTo(w.grid, w.sawmill.cells);
        if (adj) setPathTo(w, s, adj.x, adj.y);
        s.state = 'toDrop';
      } else if (s.building === 'warehouse' && w.sawmill.done) {
        w.sawmill.done = false;
        s.carry = 'plank';
        const adj = adjacentTo(w.grid, w.warehouse.cells);
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
