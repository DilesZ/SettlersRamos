# SettlersRamos — tributo original estilo Settlers 4 (sin assets de Ubisoft)

Vertical slice: 1 mapa iso, facción Aurelianos, cadenas madera/piedra, victoria 10 tablones.
Stack: TypeScript + Phaser 3 + Vite → deploy estático en Vercel.

## Estado
Migración UH-iso: colonia automática jugable (talar→tronco→sierra→tablón→almacén,
victoria a 10 tablones) en https://settlers-ramos.vercel.app.

## Créditos de arte
Arte isométrico de **Unknown Horizons** (contenido CC-BY-SA 3.0, equipo UH y
colaboradores). Detalle en `assets/approved/CREDITS.md`; derivados de este repo
bajo CC-BY-SA 3.0.

## Comandos
```powershell
npm install
npm run dev        # juego local
npm run asset:check
npm test
npm run build
```

## Specs
Ver `specs/00-constitution.md` y `specs/001-slice-eco/`.
