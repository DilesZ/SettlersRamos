# SettlersRamos — tributo económico estilo Settlers (sin assets de Ubisoft)

Colonia automática jugable + construcción por el jugador: tala→tronco→sierra→tablón→almacén (10 = victoria) y cadena de piedra para expandirse.
Stack: TypeScript + Phaser 3 + Vite → deploy estático en Vercel.

- 🎮 Juego: https://settlers-ramos.vercel.app
- 📖 Empezar en otro PC: [`docs/SETUP-OTRO-PC.md`](docs/SETUP-OTRO-PC.md) (5 min)
- 🏗 Arquitectura y pipelines: [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md)
- 🚩 Volver a un punto anterior: [`docs/CHECKPOINTS.md`](docs/CHECKPOINTS.md) (tags `cp-*`)
- 📜 Reglas y plan: `specs/00-constitution.md`, `specs/001-slice-eco/`

## Comandos

```powershell
npm install
npm run dev        # juego local (puerto 5173)
npm run asset:check
npm test           # 17 tests
npm run build
npm run smoke      # verificación con Edge real (requiere npm run preview en otro terminal)
python scripts/curate-uh.py   # regenerar sprites (requiere Pillow)
```

## Créditos de arte

Arte isométrico de **Unknown Horizons** (contenido CC-BY-SA 3.0, equipo UH y
colaboradores). SFX CC0 de Kenney. Detalle en `assets/approved/CREDITS.md`;
derivados de este repo bajo CC-BY-SA 3.0.
