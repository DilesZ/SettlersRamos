# Nano Banana (gratis) — Brief Lote 1 bloqueante

Acceso: `aistudio.google.com` con cuenta Google → Create image. Cuota gratuita diaria.
Si pide límite, para en el Lote 1: con eso ya maquetamos.

## 0. Imagen maestra (haz esta primero, 1 sola)
Prompt:
> isometric 2:1 RTS game sprites, original settlers-like, warm saturated colors,
> tiny 32px workers with red tunic, wooden houses with red roofs, 64x32 grass tile,
> soft top-left light, 1px dark outline, clean shapes, isometric view,
> single game asset on solid magenta #FF00FF background, no shadow, no text

Guárdala como `assets/approved/_style_master.png` (también deja copia en `raw/`).

## 1-12. Un mensaje por asset, usando "Edit image" sobre la maestra
1. `same style, isometric grass tile 64x32, single asset on magenta background`
2. `same style, isometric pine tree, single asset on magenta background`
3. `same style, isometric leafy tree, single asset on magenta background`
4. `same style, pile of wooden logs icon, single asset on magenta background`
5. `same style, grey rock pile, single asset on magenta background`
6. `same style, dirt road tile isometric 64x32, single asset on magenta background`
7. `same style, small warehouse storehouse wooden building, single asset on magenta background`
8. `same style, woodcutter hut small wooden building, single asset on magenta background`
9. `same style, worker standing idle front view, red tunic, single character on magenta background`
10. `same style, worker walking carrying log on shoulder side view, single character on magenta background`
11. `same style, small territory flag banner red, single asset on magenta background`
12. Guarda todo en `assets/raw/` con esos nombres.

## Limpieza (Photopea gratis, 2 min por img)
1. Abrir, `Seleccionar > Por color` magenta → Suprimir.
2. `Imagen > Tamaño`: tiles 64x32, edificios máx 192px, personajes ~32x44, modo Vecino más próximo.
3. Exportar PNG a `assets/approved/` con el mismo nombre.
4. `npm run asset:check` debe decir OK.

## Lote 2 (después, no bloquea S0)
Cantera, aserradero, residencia, andamios x3, humo 4f, iconos tablón/piedra 16px.
