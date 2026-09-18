# Arquitectura — SettlersRamos

Tributo económico estilo Settlers (facción propia: Aurelianos). TS + Phaser 3 + Vite.
Sim determinista a 20 ticks/s separada del render.

## Mapa de carpetas

```
specs/00-constitution.md      reglas no negociables (leer primero)
specs/001-slice-eco/          spec.md (qué) / plan.md (cómo) / tasks.md (estado)
src/
  main.ts                     Boot/Preload/Title/Game/Hud scenes + vista iso
  sim/grid.ts                 rejilla, terrenos, pasable (bosque/agua/roca/edificio bloquean)
  sim/astar.ts                A* 4-dir con coste (camino x0.66), permite meta adyacente
  sim/economy.ts              colonos (leñador/portador/constructor/cantero),
                              edificios[] con huellas, costes, territorio, victoria
  sim/save.ts                 serialize/deserialize (v3) + localStorage
  sim/../view/atlasMeta.ts    GENERADO: anclas por sprite (no editar)
  data/balance.json           TODOS los números (tiempos, costes, radios, topes)
assets/
  vendor/unknown-horizons/    25 PNG CC-BY-SA + CC-BY-SA.txt + SOURCE.txt
  vendor/kenney-audio/        5 ogg CC0 + licencias + SOURCE.txt
  approved/ + raw/            lote curado (MANIFEST.txt manda) + CREDITS.md
  NANO_BANANA_BRIEF.md        vía manual gratis (12 prompts, app web Gemini)
public/atlas/                 atlas.png/.json GENERADOS · public/sfx/ oggs
scripts/                      curate-uh.py, check-assets.mjs, smoke.mjs, gen borrados
tests/                        astar/economy/save/pacing (vitest)
docs/                         esta documentación
```

## Simulación (`src/sim/`)

- `tick(w, dt)` con `dt = 0.05`. Sin Phaser, sin azar → testeable y con save exacto
  (hasta los paths se serializan: la partida continúa idéntica tras cargar).
- Trabajos: `lumberjack` (tala→cabaña), `carrier` (cabaña→sierra→almacén),
  constructor = portador id 3 mientras haya obras, `mason` (roca→almacén/cabaña).
- Edificios: `{ id, kind, cells[], built, gotLogs/needLogs, constructing,
  logs|busy|timer|done|planks }`. Huellas multi-celda bloquean A*.
- Colocación (`placeBuilding`): valida terreno=hierba, libre, territorio
  (radio 6 de cabañas/almacenes) y, para cantera, roca ≤2. Cobra costes
  (`costOf`: base + 2🪨 desde la 2ª unidad salvo cabañas).
- Economía actual: cabaña→troncos, sierra→tablones (10 = victoria),
  cantera→piedra (expansión). Bosque rebrota a 140 s.
- `pacing.test.ts` fija la banda de victoria autoplay: 7–13 min
  (diseño 8–12; el jugador activo acelera con 2ª sierra/cabaña y ×2).

## Vista (`src/main.ts` + escenas)

- Iso 2:1, tile 64×32, origen OX=310 OY=70, `depth = (x+y)*10 + capa`.
- Anclas por sprite en `atlasMeta.ts` (tiles: centro diamante; objetos: base-centro).
- Unidades UH rotación 135 + 8 rotaciones reales por dirección (`rotFor`,
  verificada en contact sheet; cantero = tinte gris).
- Escenas: Boot (`?scene=game` salta título) → Preload (atlas + 5 ogg) →
  Title (Jugar/Continuar) → Game (mundo+sim) + Hud (overlay: barra, minimapa
  CanvasTexture clicable, panel por edificio, menú construir, día/noche 240 s).
- Cámara: zoom 1–2 (rueda), drag, clic en minimapa para saltar.
- Sonido por eventos (hacha, tala, tablón, obra, clic, victoria) + mute (M).

## Assets (pipeline reproducible)

```
assets/vendor/…  --python scripts/curate-uh.py-->  assets/approved/ (MANIFEST.txt)
                                                   public/atlas/atlas.png+.json
                                                   src/view/atlasMeta.ts
```

- `npm run asset:check` verifica el MANIFEST (lo que usa CI).
- Añadir un sprite: vendorizar fuente en `assets/vendor/<pack>/` (+ licencia y
  línea en `SOURCE.txt`), mapear en `curate-uh.py`, correrlo, citar en `CREDITS.md`.
- Licencias: arte UH **CC-BY-SA 3.0** (crédito obligatorio; derivados igual);
  audio Kenney **CC0**; nada de Square/Ubisoft/Blue Byte.

## Guardado

`localStorage['settlers-ramos-save-v3']`, autoguardado 10 s + victoria.
Terrenos, edificios[], colonos (con paths), tocones con edad, piedra, tiempo.

## Verificación y deploy

- `npm test` (vitest, 17 tests) · `npm run asset:check` · `npm run build`.
- `npm run smoke` (Playwright + Edge real): título → clic JUGAR → juego visible
  (varianza de píxeles) → menú construir, 0 errores/404. Requiere `preview` en 4173.
- CI (`.github/workflows/ci.yml`): install + asset-check + tests + build.
  `vercel.json`: framework Vite, `dist/`. Alias prod:
  `https://settlers-ramos.vercel.app` (auto-deploy desde `main`).

## Convenciones

- Un commit por tarea: `T006: …`, `V3: …`, `Piedra jugable: …`.
- Checkpoints: tags `cp-*` (ver `docs/CHECKPOINTS.md`).
- `?scene=game` y overlay `#err` (index.html) para diagnóstico.
