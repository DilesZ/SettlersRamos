// T004: A* 4-dir sobre Grid. Determinista (sin aleatoriedad).
import { Grid } from './grid';

export interface Tile {
  x: number;
  y: number;
}

function key(t: Tile): string {
  return `${t.x},${t.y}`;
}

function heuristic(a: Tile, b: Tile): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** Camino de start a goal (sin incluir start, incluyendo goal). [] si no hay ruta. */
export function astar(grid: Grid, start: Tile, goal: Tile): Tile[] {
  if (start.x === goal.x && start.y === goal.y) return [];
  // El objetivo puede ser una celda con edificio/arbol: se permite terminar en
  // vecino transitable y se añade el goal al final si es adyacente.
  const goalPassable = grid.passable(goal.x, goal.y);
  const open: Tile[] = [{ ...start }];
  const came = new Map<string, Tile>();
  const g = new Map<string, number>([[key(start), 0]]);
  const closed = new Set<string>();

  const popBest = (target: Tile): Tile => {
    let bi = 0;
    let best = g.get(key(open[0]))! + heuristic(open[0], target);
    for (let i = 1; i < open.length; i++) {
      const s = g.get(key(open[i]))! + heuristic(open[i], target);
      if (s < best) { best = s; bi = i; }
    }
    return open.splice(bi, 1)[0];
  };

  while (open.length > 0) {
    // Si el goal no es transitable, vale llegar a cualquier vecino.
    const cur = popBest(goal);
    const ck = key(cur);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.x === goal.x && cur.y === goal.y) {
      const path: Tile[] = [];
      let c: Tile | undefined = cur;
      while (c && key(c) !== key(start)) {
        path.unshift({ ...c });
        c = came.get(key(c));
      }
      return path;
    }
    if (!goalPassable && Math.abs(cur.x - goal.x) + Math.abs(cur.y - goal.y) === 1) {
      const path: Tile[] = [{ x: goal.x, y: goal.y }];
      let c: Tile | undefined = cur;
      while (c && key(c) !== key(start)) {
        path.unshift({ ...c });
        c = came.get(key(c));
      }
      return path;
    }
    for (const nb of grid.neighbors(cur.x, cur.y)) {
      const nk = key(nb);
      if (closed.has(nk)) continue;
      const ng = g.get(ck)! + grid.cost(nb.x, nb.y);
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        came.set(nk, cur);
        if (!open.some((t) => key(t) === nk)) open.push({ ...nb });
      }
    }
  }
  return [];
}
