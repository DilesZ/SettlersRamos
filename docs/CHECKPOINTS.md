# Checkpoints (tags) — volver a cualquier punto del proyecto

Tags anotados en GitHub. Verlos: `git tag -l 'cp-*'` (con `git fetch --tags` en otro PC).

| Tag | Commit | Estado del juego en ese punto |
|---|---|---|
| `cp-s0-base` | `37e5906` | Scaffolding Vite+Phaser+TS+CI+Vercel, specs SDD, brief Nano Banana |
| `cp-t002-kenney` | `0a85d04` | Lote Kenney top-down (era descartada, solo historia) |
| `cp-t005-sim` | `c51cb78` | Sim grid+A*+economía con 7 tests, colonia automática top-down |
| `cp-uh-iso` | `8d40099` | Migración a iso Unknown Horizons CC-BY-SA, leñador animado |
| `cp-v4` | `9a5160c` | Título, día/noche, guardado localStorage, SFX, minimapa |
| `cp-t006` | `40e7bbb` | Colocar edificios con costes y territorio, sim `edificios[]` |
| `cp-t010-balance` | `84cb4f8` | Victoria autoplay ~8,3 min, test de ritmo, reinicio |
| `cp-quarry` | `9936387` | Cadena de piedra: cantera + cantero + costes con 🪨 (HEAD actual) |

## Retomar un checkpoint en otro PC

```powershell
git clone https://github.com/DilesZ/SettlersRamos.git
Set-Location SettlersRamos
git checkout cp-uh-iso   # el punto que quieras
npm ci
npm run dev              # o npm test / npm run build
```

Volver a lo último: `git checkout main; git pull`.

## Notas

- Los tags son inmutables: si reescribes historia, crea `cp-xxx-v2`.
- `dist/`, `.vercel/` y `smoke-*.png` no se versionan (se regeneran).
- Saves viejos del navegador (`save-v1/v2`) se ignoran desde el código (actual: v3).
- Convención para nuevos checkpoints: `cp-<tarea>-<resumen>` anotado
  (`git tag -a cp-... -m "..."` + `git push origin <tag>`).
