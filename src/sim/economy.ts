// Sim económica desacoplada del render. Tick fijo 50ms, determinista.
// T006: N edificios (cabañas/sierras/almacenes) con costes, territorio y colocación.
import { Grid } from './grid';
import { astar, Tile } from './astar';
import balance from '../data/balance.json';

export type Carry = 'log' | 'plank' | null;
export type BuildKind = 'hut' | 'sawmill' | 'warehouse';

export interface Settler {
  id: number;
  job: 'lumberjack' | 'carrier';
  x: number; // posición en celdas (float)
  y: number;
  path: Tile[];
  state: string;
  timer: number;
  carry: Carry;
  from: { x: number; y: number } | null;
  to: { x: number; y: number } | null;
  building: 'sawmill' | 'warehouse' | null; // destino del portador
  siteId: number | null; // obra objetivo del constructor
}

export interface Building {
  id: number;
  kind: BuildKind;
  cells: Tile[];
  built: boolean;
  constructing: boolean;
  buildTimer: number;
  needLogs: number;
  gotLogs: number;
  logs: number; // stock en cabañas
  busy: boolean; // sierra trabajando
  timer: number; // sierra
  done: boolean; // sierra: tablón listo
  planks: number; // stock en almacenes
}

export interface Stump { x: number; y: number; age: number }

export interface World {
  grid: Grid;
  settlers: Settler[];
  buildings: Building[];
  stumps: Stump[];
  time: number;
  won: boolean;
  nextId: number;
}

export const SPEED = 2.2; // celdas por segundo a x1
export const BUILD_TIME: number = balance.buildTime;
export const REGROW_TIME = 140;

const SHAPES: Record<BuildKind, Array<[number, number]>> = {
  hut: [[0, 0], [1, 0]],
  sawmill: [[0, 0], [1, 0]],
  warehouse: [[0, 0], [1, 0], [2, 0]],
};

function adjacentFree(grid: Grid, tx: number, ty: number): Tile | null {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]];
  for (const [dx, dy] of dirs) {
    if (grid.passable(tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy };
  }
  return null;
}

/** Celda libre adyacente a cualquier celda de la huella. */
export function adjacentTo(grid: Grid, cells: Tile[]): Tile | null {
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

export function byId(w: World, id: number): Building | undefined {
  return w.buildings.find((b) => b.id === id);
}

export function ofKind(w: World, kind: BuildKind, builtOnly = true): Building[] {
  return w.buildings.filter((b) => b.kind === kind && (!builtOnly || b.built));
}

function nearest(
  list: Building[], fx: number, fy: number, pred: (b: Building) => boolean = () => true,
): Building | null {
  let best: Building | null = null;
  let bd = Infinity;
  for (const b of list) {
    if (!pred(b)) continue;
    const c = b.cells[0];
    const d = Math.abs(c.x - fx) + Math.abs(c.y - fy);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

export function nearestHutWithLogs(w: World, fx: number, fy: number): Building | null {
  return nearest(ofKind(w, 'hut'), fx, fy, (b) => b.logs > 0);
}

function markFootprint(grid: Grid, id: number, cells: Tile[]): void {
  for (const c of cells) grid.get(c.x, c.y).building = id;
}

function makeBuilding(w: World, kind: BuildKind, cells: Tile[], built: boolean, needLogs: number): Building {
  const b: Building = {
    id: w.nextId++, kind, cells, built,
    constructing: false, buildTimer: 0, needLogs, gotLogs: built ? needLogs : 0,
    logs: 0, busy: false, timer: 0, done: false, planks: 0,
  };
  markFootprint(w.grid, b.id, cells);
  w.buildings.push(b);
  return b;
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
  const w: World = { grid, settlers: [], buildings: [], stumps: [], time: 0, won: false, nextId: 1 };
  makeBuilding(w, 'hut', [{ x: 4, y: 6 }, { x: 5, y: 6 }], true, 0);
  makeBuilding(w, 'sawmill', [{ x: 7, y: 6 }, { x: 8, y: 6 }], false, balance.needLogsInitial);
  makeBuilding(w, 'warehouse', [{ x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }], false, balance.needLogsInitial);
  const jack: Settler = {
    id: 1, job: 'lumberjack', x: 4, y: 5, path: [], state: 'toTree',
    timer: 0, carry: null, from: null, to: null, building: null, siteId: null,
  };
  assignTree(w, jack);
  const mkCarrier = (id: number): Settler => ({
    id, job: 'carrier', x: 10, y: 5, path: [], state: 'idle',
    timer: 0, carry: null, from: null, to: null, building: null, siteId: null,
  });
  w.settlers = [jack, mkCarrier(2), mkCarrier(3)];
  return w;
}

// ---------- colocación (T006) ----------

export function footprintFor(kind: BuildKind, ax: number, ay: number): Tile[] {
  return SHAPES[kind].map(([dx, dy]) => ({ x: ax + dx, y: ay + dy }));
}

/** ¿La huella es construible? Terreno hierba, sin edificios y dentro del territorio. */
export function placementError(w: World, kind: BuildKind, cells: Tile[]): string | null {
  for (const c of cells) {
    if (!w.grid.inBounds(c.x, c.y)) return 'Fuera del mapa';
    const cell = w.grid.get(c.x, c.y);
    if (cell.terrain !== 'grass') return 'Solo en hierba';
    if (cell.building !== null) return 'Ocupado';
  }
  const r: number = balance.territoryRadius;
  const anchors: Tile[] = [];
  for (const b of w.buildings) {
    if (b.kind === 'warehouse' || b.kind === 'hut') anchors.push(...b.cells);
  }
  const inside = cells.some((c) =>
    anchors.some((a) => Math.abs(a.x - c.x) + Math.abs(a.y - c.y) <= r),
  );
  if (!inside) return 'Fuera del territorio';
  return null;
}

export function totalLogs(w: World): number {
  return ofKind(w, 'hut').reduce((a, b) => a + b.logs, 0);
}

export function totalPlanks(w: World): number {
  return ofKind(w, 'warehouse').reduce((a, b) => a + b.planks, 0);
}

function payCost(w: World, kind: BuildKind): boolean {
  const cost = (balance.costs as Record<BuildKind, { logs: number; planks: number }>)[kind];
  if (totalLogs(w) < cost.logs || totalPlanks(w) < cost.planks) return false;
  let need = cost.logs;
  for (const b of ofKind(w, 'hut')) {
    const take = Math.min(b.logs, need);
    b.logs -= take;
    need -= take;
    if (need <= 0) break;
  }
  need = cost.planks;
  for (const b of ofKind(w, 'warehouse')) {
    const take = Math.min(b.planks, need);
    b.planks -= take;
    need -= take;
    if (need <= 0) break;
  }
  return true;
}

/** Cobra el coste y crea la obra (sin construir). Null si no se puede. */
export function placeBuilding(w: World, kind: BuildKind, anchor: Tile): Building | null {
  const cells = footprintFor(kind, anchor.x, anchor.y);
  if (placementError(w, kind, cells)) return null;
  const cost = (balance.costs as Record<BuildKind, { logs: number; planks: number }>)[kind];
  if (!payCost(w, kind)) return null;
  return makeBuilding(w, kind, cells, false, cost.logs);
}

// ---------- lógica de colonos ----------

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
      w.stumps.push({ x: s.to.x, y: s.to.y, age: 0 });
      s.carry = 'log';
      const hut = nearest(ofKind(w, 'hut'), Math.round(s.x), Math.round(s.y));
      const adj = hut ? adjacentTo(w.grid, hut.cells) : null;
      if (adj) setPathTo(w, s, adj.x, adj.y);
      s.siteId = hut ? hut.id : null; // cabaña destino
      s.state = 'toHut';
    }
    return;
  }
  if (s.state === 'toHut') {
    if (moveAlong(s, dt)) {
      const hut = (s.siteId != null ? byId(w, s.siteId) : null)
        ?? nearest(ofKind(w, 'hut'), Math.round(s.x), Math.round(s.y));
      if (hut) hut.logs++;
      s.carry = null;
      s.siteId = null;
      assignTree(w, s);
    }
  }
}

/** Primera obra sin terminar que aún necesita troncos (sierras, almacenes, cabañas). */
function siteNeedingLogs(w: World): Building | null {
  const order: BuildKind[] = ['sawmill', 'warehouse', 'hut'];
  for (const k of order) {
    const b = w.buildings.find((x) => x.kind === k && !x.built && x.gotLogs < x.needLogs);
    if (b) return b;
  }
  return null;
}

function tickBuilder(w: World, s: Settler, dt: number): void {
  if (s.state === 'idle') {
    const site = siteNeedingLogs(w);
    const hut = site ? nearestHutWithLogs(w, Math.round(s.x), Math.round(s.y)) : null;
    if (site && hut) {
      const adj = adjacentTo(w.grid, hut.cells);
      if (!adj) return;
      setPathTo(w, s, adj.x, adj.y);
      s.siteId = site.id;
      s.state = 'bPickup';
    }
    return;
  }
  if (s.state === 'bPickup') {
    if (moveAlong(s, dt)) {
      const hut = nearestHutWithLogs(w, Math.round(s.x), Math.round(s.y));
      const site = s.siteId != null ? byId(w, s.siteId) : null;
      if (hut && site && !site.built && hut.logs > 0) {
        hut.logs--;
        s.carry = 'log';
        const adj = adjacentTo(w.grid, site.cells);
        if (adj) setPathTo(w, s, adj.x, adj.y);
        s.state = 'bDrop';
      } else {
        s.state = 'idle';
        s.siteId = null;
      }
    }
    return;
  }
  if (s.state === 'bDrop') {
    if (moveAlong(s, dt)) {
      const site = s.siteId != null ? byId(w, s.siteId) : null;
      if (site && !site.built && site.gotLogs < site.needLogs && s.carry === 'log') {
        site.gotLogs++;
        s.carry = null;
        if (site.gotLogs >= site.needLogs) {
          site.constructing = true;
          site.buildTimer = BUILD_TIME;
        }
      } else {
        if (s.carry === 'log') {
          const hut = nearest(ofKind(w, 'hut'), Math.round(s.x), Math.round(s.y));
          if (hut) hut.logs++;
          s.carry = null;
        }
      }
      s.state = 'idle';
      s.siteId = null;
    }
  }
}

function tickCarrier(w: World, s: Settler, dt: number): void {
  const rx = Math.round(s.x);
  const ry = Math.round(s.y);
  const goPickup = (from: Building, cargo: 'sawmill' | 'warehouse', dst: Building) => {
    const adj = adjacentTo(w.grid, from.cells);
    if (!adj) return;
    setPathTo(w, s, adj.x, adj.y);
    const c = from.cells[0];
    s.from = { x: c.x, y: c.y };
    const dc = dst.cells[0];
    s.to = { x: dc.x, y: dc.y };
    s.building = cargo;
    s.state = 'toPickup';
  };
  if (s.state === 'idle') {
    const readySaw = nearest(ofKind(w, 'sawmill'), rx, ry, (b) => b.done);
    const anyWh = nearest(ofKind(w, 'warehouse'), rx, ry);
    if (readySaw && anyWh) {
      goPickup(readySaw, 'warehouse', anyWh);
      return;
    }
    const hut = nearestHutWithLogs(w, rx, ry);
    const idleSaw = nearest(ofKind(w, 'sawmill'), rx, ry, (b) => !b.busy && !b.done);
    if (hut && idleSaw) {
      goPickup(hut, 'sawmill', idleSaw);
    }
    return;
  }
  if (s.state === 'toPickup') {
    if (moveAlong(s, dt)) {
      if (s.building === 'sawmill') {
        const hut = nearestHutWithLogs(w, rx, ry);
        const saw = nearest(ofKind(w, 'sawmill'), rx, ry, (b) => !b.busy && !b.done);
        if (hut && saw && hut.logs > 0) {
          hut.logs--;
          s.carry = 'log';
          const adj = adjacentTo(w.grid, saw.cells);
          if (adj) setPathTo(w, s, adj.x, adj.y);
          s.to = { x: saw.cells[0].x, y: saw.cells[0].y };
          s.state = 'toDrop';
        } else s.state = 'idle';
      } else if (s.building === 'warehouse') {
        const saw = nearest(ofKind(w, 'sawmill'), rx, ry, (b) => b.done);
        const wh = nearest(ofKind(w, 'warehouse'), rx, ry);
        if (saw && wh) {
          saw.done = false;
          s.carry = 'plank';
          const adj = adjacentTo(w.grid, wh.cells);
          if (adj) setPathTo(w, s, adj.x, adj.y);
          s.to = { x: wh.cells[0].x, y: wh.cells[0].y };
          s.state = 'toDrop';
        } else s.state = 'idle';
      } else s.state = 'idle';
    }
    return;
  }
  if (s.state === 'toDrop') {
    if (moveAlong(s, dt)) {
      if (s.building === 'sawmill' && s.carry === 'log') {
        const saw = nearest(ofKind(w, 'sawmill'), rx, ry, (b) => !b.busy && !b.done);
        if (saw) {
          saw.busy = true;
          saw.timer = balance.times.sawPlank;
          s.carry = null;
        } else {
          const hut = nearest(ofKind(w, 'hut'), rx, ry);
          if (hut) hut.logs++;
          s.carry = null;
        }
      } else if (s.building === 'warehouse' && s.carry === 'plank') {
        const wh = nearest(ofKind(w, 'warehouse'), rx, ry);
        if (wh) {
          wh.planks++;
          s.carry = null;
          if (totalPlanks(w) >= balance.winPlanks) w.won = true;
        } else {
          const saw = nearest(ofKind(w, 'sawmill'), rx, ry);
          if (saw) saw.done = true;
          s.carry = null;
        }
      } else {
        s.carry = null;
      }
      s.state = 'idle';
    }
  }
}

function finishConstruction(w: World, b: Building): void {
  b.constructing = false;
  b.built = true;
  if (b.kind === 'hut') {
    // Nueva cabaña = nuevo leñador (con tope).
    const jacks = w.settlers.filter((s) => s.job === 'lumberjack').length;
    if (jacks < balance.maxLumberjacks) {
      const adj = adjacentTo(w.grid, b.cells);
      const id = Math.max(...w.settlers.map((s) => s.id)) + 1;
      const s: Settler = {
        id, job: 'lumberjack', x: adj ? adj.x : b.cells[0].x, y: adj ? adj.y : b.cells[0].y,
        path: [], state: 'idle', timer: 0, carry: null,
        from: null, to: null, building: null, siteId: null,
      };
      w.settlers.push(s);
    }
  }
}

export function tick(w: World, dt: number): void {
  if (w.won) return;
  w.time += dt;
  for (let i = w.stumps.length - 1; i >= 0; i--) {
    w.stumps[i].age += dt;
    if (w.stumps[i].age >= REGROW_TIME) {
      const st = w.stumps[i];
      if (w.grid.get(st.x, st.y).terrain === 'grass') w.grid.setTerrain(st.x, st.y, 'forest');
      w.stumps.splice(i, 1);
    }
  }
  for (const b of w.buildings) {
    if (b.constructing) {
      b.buildTimer -= dt;
      if (b.buildTimer <= 0) finishConstruction(w, b);
    }
    if (b.kind === 'sawmill' && b.busy) {
      b.timer -= dt;
      if (b.timer <= 0) {
        b.busy = false;
        b.done = true;
      }
    }
  }
  for (const s of w.settlers) {
    if (s.job === 'lumberjack') tickLumberjack(w, s, dt);
    else if (s.id === 3 && (siteNeedingLogs(w) || s.state === 'bPickup' || s.state === 'bDrop')) tickBuilder(w, s, dt);
    else tickCarrier(w, s, dt);
  }
}
