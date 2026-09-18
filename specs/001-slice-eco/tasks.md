# Tasks 001 — orden estricto, una por PR

- [x] T001 S0: scaffolding Vite+Phaser+TS+CI+Vercel
- [x] T002b Lote1 CC0 Kenney (sustituye T002 procedural): 9 CC0 + 3 derivados en
  `assets/approved/` + vendor + `CREDITS.md` (`python scripts/curate-cc0.py`).
  Enmienda: vista iso → top-down 64x64 (constitución + plan actualizados).
- [x] T003 Atlas (`python scripts/make-atlas.py` -> `public/atlas/`) + `GameScene` demo top-down
- [x] T004 Sim grid 15x8 + A* + tests (`tests/astar.test.ts`, 4 tests)
- [x] T005 Economy tick 20Hz: talar→tronco→sierra→tablón→almacén + tests (`tests/economy.test.ts`, 3 tests, victoria verificada)
- [x] UH-iso: 24 sprites CC-BY-SA Unknown Horizons (leñador idle/move/carry/work,
  edificios, árboles, duelda 64x32) + `curate-uh.py` + `atlasMeta` + vista iso
  (huellas, tocones, stock en cabaña). Enmienda top-down → iso.
- [x] V2 visual: leñador en 8 direcciones (idle/move/carry/work × 8 rots),
  construcción con andamios (sierra+almacén piden 2 troncos, 15 s de obra),
  rebrote de bosque a 120 s, setas, roca variada, agua viva. 9/9 tests.
- [x] V3 juego: cámara RTS (zoom 1-2 + drag + minimapa clicable), suelo con tintes,
  partículas (tala/obra/tablón), SFX CC0 Kenney (hacha, tablón, obra, clic,
  victoria) + mute, puestos de territorio, panel de edificio clicable. 9/9 tests.
- [x] Verificación real: `scripts/smoke.mjs` (Playwright+Edge: título, clic JUGAR,
  juego visible por varianza, 0 errores/404). Favicons inline. `npm run smoke`.
- [x] T006 Edificios del jugador: menú (cabaña 2🪵/sierra 4🪵/almacén 4🪵2🧱),
  fantasma verde/rojo, territorio (radio 6), costes, constructor, cabaña nueva =
  leñador nuevo (tope 6). Sim con edificios[] + stocks globales. 14/14 tests.
- [ ] T007 Vista colonos: FSM + carry sprites + depth por filas
- [ ] T008 HUD: minimapa, panel, stocks, x1/x2/pausa
- [ ] T009 Save/load localStorage + victoria 10 tablones
- [x] T010 Balance 8-12 min: tala 24 s, sierra 28 s, obra 30 s, rebrote 140 s.
  Medido: victoria autoplay en ~8,3 min (495 s). Test `pacing` fija banda 7-13 min.
  Botón Jugar de nuevo en victoria. Deploy prod continuo OK.

Regla: T004-T010 bloqueadas hasta T002b aprobada (sin placeholders en main).
