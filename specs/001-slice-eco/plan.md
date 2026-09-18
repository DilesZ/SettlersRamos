# Plan técnico 001 — Sim + vista iso 2:1 con Phaser 3 (enmienda UH-iso: top-down → iso)

## Stack
TypeScript + Phaser 3 + Vite. Salida estática `dist/` para Vercel.

## Arquitectura
```
src/sim/   : grid, astar.ts, economy.ts (tick 20Hz), jobs.ts, territory.ts, save.ts — sin Phaser
src/view/  : BootScene, PreloadScene, GameScene, atlasMeta.ts (generado: anclas), Minimap.ts
src/data/balance.json : todos los tiempos/costes
```

- Mapa: `15x8` iso 2:1 (64x32), Tiled o array seed. Capas: terreno, objetos, edificios, unidades.
- Iso: `sx = OX+(x-y)*32`, `sy = OY+(x+y)*16`. Depth = (x+y)*10 + capa. Anclas por sprite.
- Edificios con huella multi-celda (almacén 3, cabaña/sierra 2). Bosque/agua bloquean.
- Pathfinding A* 4-dir sobre celdas transitables, carreteras con coste 0.66.
- Render: un `Container` por edificio, `Sprite` por colono con atlas. Cámara con drag + zoom.
- HUD en escena separada para no mezclar. Minimapa canvas 96x96.

## Atlas
`public/atlas/atlas.png + .json` generados por `scripts/curate-uh.py` (24 frames + anclas).
`scripts/check-assets.mjs` verifica el lote UH-iso antes del build.

## Tests
- `vitest`: economy tick produce tronco→tablón, A* evita colisiones, save/load roundtrip.
- `playwright` (smoke futuro): carga `/`, coloca aserradero, 30s sin errores.

## Orden de implementación (ver tasks.md)
S0 base → Lote1 atlas dummy aprobado → sim → vista → HUD → balance/deploy.
