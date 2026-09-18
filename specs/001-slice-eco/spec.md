# 001 — Slice económica mínima (cadenas de producción)

## Objetivo
Mapa iso 48x48, 1 facción (Aurelianos), partida ganable produciendo **10 tablones**.

## Alcance SÍ
- Edificios (6): Almacén, Cabaña leñador, Cantera, Aserradero, Residencia, Bandera/camino.
  Estados: solar → andamio → terminado.
- Cadenas: árbol → tronco → tablón / roca → piedra (solo construir).
- Colonos (10-15): portador, leñador, cantero, carpintero, obrero.
  FSM: idle / ir / trabajar / llevar / entregar. A* + bonus en camino.
- Territorio por radio, borde con postes, no construir fuera.
- UI: minimapa, panel edificio, stocks, velocidad x1/x2/pausa, save/load local.
- Controles: click seleccionar, click derecho / botón para ordenar, drag mapa.

## Alcance NO (futuras specs)
Combate, maná/tribu oscura, comida/herramientas/oro, multijugador, editor, campaña.

## Historias de aceptación
1. Como jugador coloco Almacén y veo su radio de territorio.
2. Como jugador pongo Cabaña leñador + Aserradero y tras talar veo al portador llevar
   tronco → tablón → almacén sumando stock.
3. Como jugador subo a x2 y pauso sin romper la sim.
4. Como jugador recargo la página y continúo mi partida.
5. Como jugador entrego 10 tablones y veo pantalla de victoria en 8-12 min.

## Reglas económicas v1 (en `src/data/balance.json`)
- Leñador: 8s/árbol → 1 tronco. Portador carga 1. Aserradero: 10s/tronco → 1 tablón.
- Cantera: 12s → 1 piedra. Costes: leñador 2 troncos, aserradero 2 troncos+2 piedras.
- Camino x1.5 velocidad. Tick sim 50ms.
