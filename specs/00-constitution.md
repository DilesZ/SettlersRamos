# Constitution — SettlersRamos (tributo original estilo Settlers 4)

> Tributo original inspirado en The Settlers IV. NO clonar: nada de sprites, música,
> nombres de facciones/mapas ni textos de Blue Byte/Ubisoft. Facción propia: Aurelianos.

## 1. Principios no negociables
1. **Arte original primero:** ningún sistema entra en `main` sin su sprite en `assets/approved/`.
   Prohibido `fillRect` / cuadrados de colores como edificio o unidad en `main`.
   Solo permitido en ramas `spike/` desechables.
2. **Sim desacoplada del render:** toda la economía en `src/sim/` TypeScript puro, 20 ticks/s,
   determinista y testeable sin Phaser. `src/view/` solo dibuja.
3. **Vista iso 2:1 estilo Unknown Horizons (enmienda UH-iso):** tiles 64x32,
   edificios multi-celda con huella lógica en la sim, ancla base-centro por sprite
   (`src/view/atlasMeta.ts` generado), rotación 135 (SE) + flipX. Bosque y agua
   bloquean; al talar queda tocón visual. Toda la slice usa la misma
   perspectiva; prohibido mezclar iso y top-down.
4. **Fuentes de assets (orden):** 1º contenido CC-BY-SA vendorizado en
   `assets/vendor/` con `SOURCE.txt` + crédito en `CREDITS.md` (los derivados de
   este repo se comparten bajo CC-BY-SA); 2º derivados documentados en
   `scripts/curate-uh.py`. Nada de Ubi/Blue Byte.
5. **Balance en datos:** tiempos/costes/capacidades solo en `src/data/balance.json`. Nada hardcodeado.
6. **Vercel siempre verde:** cada PR debe pasar `lint + asset-check + test + build`.

## 2. Definición de Hecho (DoD) de la slice
- `npm run asset:check`, `npm test`, `npm run build` en verde.
- Partida completable 8-12 min: entregar 10 tablones al almacén.
- 60fps con 15 colonos en portátil medio. Pausa / x1 / x2 funcionan.
- Guardado `localStorage` + minimapa + panel edificio.
- Sin assets originales de terceros salvo CC0 vendorizado. Licencias anotadas en `assets/approved/CREDITS.md`.

## 3. Flujo Spec-Driven
`spec.md -> plan.md -> tasks.md -> PR por tarea -> review -> merge`.
Si una tarea necesita un sprite no aprobado, se bloquea y se cura primero (CC0 o derivado).
