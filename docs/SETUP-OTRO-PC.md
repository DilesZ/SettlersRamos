# Seguir en otro PC (desde cero hasta `npm run dev`)

> Repo: https://github.com/DilesZ/SettlersRamos · Juego en vivo: https://settlers-ramos.vercel.app

## 1. Requisitos

| Qué | Versión usada | Para qué |
|---|---|---|
| Node.js + npm | Node 24 / npm 11 (vale 20+) | juego, tests, build, deploy |
| Python 3 + Pillow | 3.14 + Pillow 12 | **solo** regenerar sprites (`scripts/curate-uh.py`) |
| Git | cualquiera | clonar, tags de checkpoint |
| Edge o Chrome | cualquiera | `npm run smoke` (opcional) |
| Cuenta Vercel | gratis | desplegar (opcional) |

## 2. Puesta en marcha (5 min)

```powershell
git clone https://github.com/DilesZ/SettlersRamos.git
Set-Location SettlersRamos
npm ci
npm test            # 17 tests en verde
npm run asset:check # lote UH-iso presente (98 ficheros)
npm run dev         # abre el enlace local -> título -> JUGAR
```

Comandos útiles:

| Comando | Qué hace |
|---|---|
| `npm run dev` | juego en local (puerto 5173) |
| `npm run build` | `tsc + vite build` a `dist/` |
| `npm run preview` | sirve `dist/` (puerto 4173) |
| `npm test` | vitest (sim, economía, guardado, ritmo) |
| `npm run asset:check` | verifica el lote de sprites |
| `npm run smoke` | test con Edge real: título, clic JUGAR, colocación, 0 errores (requiere servidor en 4173: primero `npm run preview` en otro terminal) |
| `python scripts/curate-uh.py` | regenera `assets/approved/` + `public/atlas/` + `src/view/atlasMeta.ts` desde `assets/vendor/` |

## 3. Desplegar en Vercel (2 min, opcional)

Opción A (dashboard, sin nada instalado): vercel.com → Add New → Project →
Import `DilesZ/SettlersRamos` (Vite se autodetecta por `vercel.json`) → Deploy.
Cada push a `main` redespliega solo.

Opción B (CLI): `npm i -g vercel; vercel login; vercel --prod` desde la raíz.
No commitees nunca `.vercel/` (ya ignorado) ni tokens.

## 4. Secretos (opcionales, ninguno obligatorio para jugar/desplegar)

| Variable | Dónde se consigue | Para qué |
|---|---|---|
| `GEMINI_API_KEY` | `aistudio.google.com/apikey` (gratis) | MCP `nano-banana` de OpenCode (generar imágenes; la API de imágenes suele pedir facturación: ver `assets/NANO_BANANA_BRIEF.md`) |
| `VERCEL_TOKEN` | `vercel.com/account/tokens` | desplegar por CLI sin `vercel login` |

En Windows se guardan fuera del repo: `setx GEMINI_API_KEY "…"`.
**Jamás** van commiteadas (revisa `git status` antes de cada commit).

## 5. MCP nano-banana (opcional, solo OpenCode)

- Config global: `%USERPROFILE%\.config\opencode\opencode.jsonc` (clave `mcp.nano-banana`).
- Requiere `npm i -g @seungmanchoi/nano-banana-mcp` + `GEMINI_API_KEY` en entorno.
- Tras tocar la config: **reiniciar OpenCode** (se carga al arrancar).
- Verificar: `get_status` debe decir `Configured (source: env, model: gemini-2.5-flash-image)`.

## 6. Problemas conocidos (nos costaron horas)

1. **Red corporativa con TLS interceptado**: `kenney.nl`, `opengameart.org` e `itch.io`
   fallan con `SSL connection could not be established`. Solución usada: mirrors en
   GitHub (`github.com` sí funciona) + `cdn.jsdelivr.net`. Si un dominio falla,
   busca su mirror antes de pelear con certificados.
2. **`npm run smoke` necesita Edge/Chrome instalado** y servidor previo en 4173.
   En headless corporativo puede hacer falta `--no-proxy-server` (ya puesto en el script).
3. **Puertos**: 5173 (`dev`), 4173 (`preview`). Si están ocupados, libera el proceso
   o usa `--port`.
4. **Avisos `LF will be replaced by CRLF`**: inocuos (Windows).
5. **Guardados viejos**: el save es `settlers-ramos-save-v3` en `localStorage`;
   saves v1/v2 se ignoran (el juego sigue con partida nueva).
6. **`?scene=game`** salta el título (útil para pruebas y capturas).

## 7. Cómo se trabaja aquí (Spec-Driven)

1. Lee `specs/00-constitution.md` (reglas no negociables, p. ej. nada sin sprite aprobado).
2. La tarea manda: `specs/001-slice-eco/tasks.md` (casillas `[x]` = hecho).
3. Un commit por tarea (`T006: …`), push a `main` → Vercel redespliega solo.
4. Para retomar un punto anterior: ver `docs/CHECKPOINTS.md` (tags).
5. Arquitectura y pipelines: `docs/ARQUITECTURA.md`.
