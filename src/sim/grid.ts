// T004: rejilla genérica (ancho x alto). La slice usa 15x8; el motor soporta 48x48.
export type Terrain = 'grass' | 'road' | 'forest' | 'rock' | 'water';

export interface Cell {
  terrain: Terrain;
  building: string | null; // id edificio
}

export class Grid {
  readonly w: number;
  readonly h: number;
  private cells: Cell[];

  constructor(w: number, h: number, fill: Terrain = 'grass') {
    this.w = w;
    this.h = h;
    this.cells = Array.from({ length: w * h }, () => ({ terrain: fill, building: null }));
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): Cell {
    if (!this.inBounds(x, y)) throw new Error(`fuera del mapa: ${x},${y}`);
    return this.cells[y * this.w + x];
  }

  setTerrain(x: number, y: number, t: Terrain): void {
    this.get(x, y).terrain = t;
  }

  /** Transitable: hierba y camino. Bosque (árboles altos), agua, roca y edificios bloquean. */
  passable(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    const c = this.get(x, y);
    return (c.terrain === 'grass' || c.terrain === 'road') && c.building === null;
  }

  /** Coste de entrar en la celda (camino más rápido). */
  cost(x: number, y: number): number {
    return this.get(x, y).terrain === 'road' ? 0.66 : 1;
  }

  neighbors(x: number, y: number): Array<{ x: number; y: number }> {
    const out: Array<{ x: number; y: number }> = [];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      if (this.passable(x + dx, y + dy)) out.push({ x: x + dx, y: y + dy });
    }
    return out;
  }
}
