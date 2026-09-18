# Plan técnico 001 — Sim + vista top-down con Phaser 3 (enmienda T002b: iso → top-down por pack CC0)

## Stack
TypeScript + Phaser 3 + Vite. Salida estática `dist/` para Vercel.

## Arquitectura
```
src/sim/   : grid, astar.ts, economy.ts (tick 20Hz), jobs.ts, territory.ts, save.ts — sin Phaser
src/view/  : BootScene, PreloadScene, GameScene, HudScene, GridView.ts (ortogonal), Minimap.ts
src/data/balance.json : todos los tiempos/costes
```

- Mapa: `48x48` ortogonal top-down 64px/celda, Tiled o array seed. Capas: terreno, objetos, edificios, unidades.
- Proyección: `sx = x*64`, `sy = y*64`. Depth = y (pintor por filas).
- Pathfinding A* 4-dir sobre celdas transitables, carreteras con coste 0.66.
- Render: un `Container` por edificio, `Sprite` por colono con atlas. Cámara con drag + zoom.
- HUD en escena separada para no mezclar. Minimapa canvas 96x96.

## Atlas
`assets/atlas/atlas.png + .json` generados. `PreloadScene` carga eso + `balance.json`.
`scripts/check-assets.mjs` verifica que existen los 12 del Lote 1 antes del build.

## Tests
- `vitest`: economy tick produce tronco→tablón, A* evita colisiones, save/load roundtrip.
- `playwright` (smoke futuro): carga `/`, coloca aserradero, 30s sin errores.

## Orden de implementación (ver tasks.md)
S0 base → Lote1 atlas dummy aprobado → sim → vista → HUD → balance/deploy.
