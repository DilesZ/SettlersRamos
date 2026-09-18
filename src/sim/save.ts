// T009: guardado local. Serializa el World a JSON plano (sin Phaser).
import type { Terrain } from './grid';
import type { World, Building } from './economy';

export const SAVE_KEY = 'settlers-ramos-save-v1';

interface SaveData {
  v: 1;
  w: number;
  h: number;
  terrain: Terrain[];
  buildings: Record<'hut' | 'sawmill' | 'warehouse', {
    logs: number; busy: boolean; timer: number; done: boolean; planks: number;
    built: boolean; gotLogs: number; constructing: boolean; buildTimer: number;
  }>;
  settlers: Array<{
    id: number; job: 'lumberjack' | 'carrier'; x: number; y: number;
    path: Array<{ x: number; y: number }>;
    state: string; timer: number; carry: 'log' | 'plank' | null;
    from: { x: number; y: number } | null; to: { x: number; y: number } | null;
    building: 'sawmill' | 'warehouse' | null;
  }>;
  stumps: Array<{ x: number; y: number; age: number }>;
  time: number;
  won: boolean;
}

export function serialize(w: World): string {
  const b = (bd: Building) => ({
    logs: bd.logs, busy: bd.busy, timer: bd.timer, done: bd.done, planks: bd.planks,
    built: bd.built, gotLogs: bd.gotLogs, constructing: bd.constructing, buildTimer: bd.buildTimer,
  });
  const data: SaveData = {
    v: 1,
    w: w.grid.w,
    h: w.grid.h,
    terrain: Array.from({ length: w.grid.w * w.grid.h }, (_, i) => {
      const x = i % w.grid.w;
      const y = Math.floor(i / w.grid.w);
      return w.grid.get(x, y).terrain;
    }),
    buildings: { hut: b(w.hut), sawmill: b(w.sawmill), warehouse: b(w.warehouse) },
    settlers: w.settlers.map((s) => ({
      id: s.id, job: s.job, x: s.x, y: s.y,
      path: s.path.map((t) => ({ x: t.x, y: t.y })),
      state: s.state, timer: s.timer,
      carry: s.carry, from: s.from, to: s.to, building: s.building,
    })),
    stumps: w.stumps.map((s) => ({ x: s.x, y: s.y, age: s.age })),
    time: w.time,
    won: w.won,
  };
  return JSON.stringify(data);
}

export function deserialize(json: string, createWorld: () => World): World | null {
  try {
    const data = JSON.parse(json) as SaveData;
    if (data.v !== 1 || data.w !== 15 || data.h !== 8) return null;
    const w = createWorld();
    for (let y = 0; y < data.h; y++) {
      for (let x = 0; x < data.w; x++) {
        w.grid.setTerrain(x, y, data.terrain[y * data.w + x]);
      }
    }
    // Limpia huellas por defecto y remarca (createWorld ya las marcó igual).
    const apply = (bd: Building, kind: 'hut' | 'sawmill' | 'warehouse') => {
      const s = data.buildings[kind];
      bd.logs = s.logs; bd.busy = s.busy; bd.timer = s.timer; bd.done = s.done;
      bd.planks = s.planks; bd.built = s.built; bd.gotLogs = s.gotLogs;
      bd.constructing = s.constructing; bd.buildTimer = s.buildTimer;
    };
    apply(w.hut, 'hut');
    apply(w.sawmill, 'sawmill');
    apply(w.warehouse, 'warehouse');
    w.settlers = data.settlers.map((s) => ({
      id: s.id, job: s.job, x: s.x, y: s.y,
      path: s.path.map((t) => ({ x: t.x, y: t.y })),
      state: s.state,
      timer: s.timer, carry: s.carry, from: s.from, to: s.to, building: s.building,
    }));
    w.stumps = data.stumps.map((s) => ({ x: s.x, y: s.y, age: s.age }));
    w.time = data.time;
    w.won = data.won;
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
