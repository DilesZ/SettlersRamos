// T009: guardado local. Serializa el World a JSON plano (sin Phaser). v2 = edificios[].
import type { Terrain } from './grid';
import type { World, Building, BuildKind } from './economy';

export const SAVE_KEY = 'settlers-ramos-save-v3';

interface SaveBuilding {
  id: number; kind: BuildKind; cells: Array<{ x: number; y: number }>;
  logs: number; busy: boolean; timer: number; done: boolean; planks: number;
  built: boolean; gotLogs: number; needLogs: number;
  constructing: boolean; buildTimer: number;
}

interface SaveData {
  v: 3;
  w: number;
  h: number;
  terrain: Terrain[];
  buildings: SaveBuilding[];
  settlers: Array<{
    id: number; job: 'lumberjack' | 'carrier' | 'mason'; x: number; y: number;
    path: Array<{ x: number; y: number }>;
    state: string; timer: number; carry: 'log' | 'plank' | 'stone' | null;
    from: { x: number; y: number } | null; to: { x: number; y: number } | null;
    building: 'sawmill' | 'warehouse' | null; siteId: number | null;
  }>;
  stumps: Array<{ x: number; y: number; age: number }>;
  stone: number;
  time: number;
  won: boolean;
  nextId: number;
}

export function serialize(w: World): string {
  const b = (bd: Building): SaveBuilding => ({
    id: bd.id, kind: bd.kind, cells: bd.cells.map((c) => ({ x: c.x, y: c.y })),
    logs: bd.logs, busy: bd.busy, timer: bd.timer, done: bd.done, planks: bd.planks,
    built: bd.built, gotLogs: bd.gotLogs, needLogs: bd.needLogs,
    constructing: bd.constructing, buildTimer: bd.buildTimer,
  });
  const data: SaveData = {
    v: 3,
    w: w.grid.w,
    h: w.grid.h,
    terrain: Array.from({ length: w.grid.w * w.grid.h }, (_, i) => {
      const x = i % w.grid.w;
      const y = Math.floor(i / w.grid.w);
      return w.grid.get(x, y).terrain;
    }),
    buildings: w.buildings.map(b),
    settlers: w.settlers.map((s) => ({
      id: s.id, job: s.job, x: s.x, y: s.y,
      path: s.path.map((t) => ({ x: t.x, y: t.y })),
      state: s.state, timer: s.timer,
      carry: s.carry, from: s.from, to: s.to, building: s.building, siteId: s.siteId,
    })),
    stumps: w.stumps.map((s) => ({ x: s.x, y: s.y, age: s.age })),
    stone: w.stone,
    time: w.time,
    won: w.won,
    nextId: w.nextId,
  };
  return JSON.stringify(data);
}

export function deserialize(json: string, createWorld: () => World): World | null {
  try {
    const data = JSON.parse(json) as SaveData;
    if (data.v !== 3 || data.w !== 15 || data.h !== 8) return null;
    const w = createWorld();
    for (let y = 0; y < data.h; y++) {
      for (let x = 0; x < data.w; x++) {
        const cell = w.grid.get(x, y);
        cell.terrain = data.terrain[y * data.w + x];
        cell.building = null;
      }
    }
    w.buildings = data.buildings.map((s): Building => ({
      id: s.id, kind: s.kind, cells: s.cells.map((c) => ({ x: c.x, y: c.y })),
      logs: s.logs, busy: s.busy, timer: s.timer, done: s.done, planks: s.planks,
      built: s.built, gotLogs: s.gotLogs, needLogs: s.needLogs,
      constructing: s.constructing, buildTimer: s.buildTimer,
    }));
    for (const b of w.buildings) {
      for (const c of b.cells) w.grid.get(c.x, c.y).building = b.id;
    }
    w.settlers = data.settlers.map((s) => ({
      id: s.id, job: s.job, x: s.x, y: s.y,
      path: s.path.map((t) => ({ x: t.x, y: t.y })),
      state: s.state,
      timer: s.timer, carry: s.carry, from: s.from, to: s.to,
      building: s.building, siteId: s.siteId,
    }));
    w.stumps = data.stumps.map((s) => ({ x: s.x, y: s.y, age: s.age }));
    w.stone = data.stone;
    w.time = data.time;
    w.won = data.won;
    w.nextId = data.nextId;
    return w;
  } catch {
    return null;
  }
}

export function saveGame(w: World): void {
  try { localStorage.setItem(SAVE_KEY, serialize(w)); } catch { /* almacenamiento lleno/bloqueado */ }
}

export function loadGame(createWorld: () => World): World | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return deserialize(raw, createWorld);
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  try { return localStorage.getItem(SAVE_KEY) !== null; } catch { return false; }
}

export function clearSave(): void {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }
}
