"""Migración iso UH: cura sprites de Unknown Horizons (CC-BY-SA 3.0) a approved/ + atlas.
Reproducible: `python scripts/curate-uh.py` (requiere assets/vendor/unknown-horizons/).

Fuentes (rotación 135 = vista SE):
  tiles 64x64/64x32 : ts_grass0/1 (hierba), ts_shallow0 (agua), gravel_path/a (camino)
  nature            : as_spruce0 (pino), as_birch0 (frondoso), as_treestumps0 (tocón),
                      as_rock0 (roca)
  edificios         : pioneers/warehouse, lumberjack_barrack (+ overlays logs_01/02),
                      weaver (= nuestra sierra)
  unidad            : lumberjack idle/move/move_full/work (rotación 135 + flipX)
  derivados         : flag (banderín iso procedural), _style_master (tablero)

Anclas: tiles -> centro del diamante (bbox); objetos -> base-centro del bbox.
Se escriben en src/view/atlasMeta.ts (generado) + public/atlas/atlas.json.

Licencias: ver assets/vendor/unknown-horizons/SOURCE.txt y approved/CREDITS.md.
Contenido CC-BY-SA 3.0 de Unknown Horizons y colaboradores; derivados igual.
"""
import json
from PIL import Image, ImageDraw
from pathlib import Path

VENDOR = Path("assets/vendor/unknown-horizons")
GFX = VENDOR / "content" / "gfx"
RAW = Path("assets/raw")
OUT = Path("assets/approved")
ATLAS_DIR = Path("public/atlas")
META_TS = Path("src/view/atlasMeta.ts")
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)
ATLAS_DIR.mkdir(parents=True, exist_ok=True)
META_TS.parent.mkdir(parents=True, exist_ok=True)

P = "content/gfx/"  # prefijo informativo para SOURCE.txt


def src(rel: str) -> Path:
    p = GFX / rel
    assert p.exists(), f"falta fuente UH (vendoriza primero): {p}"
    return p


FILES = {
    "grass": "base/moderate/ts_grass0/straight/135/0.png",
    "grass_var": "base/moderate/ts_grass1/straight/135/0.png",
    "water": "base/moderate/ts_shallow0/straight/135/0.png",
    "road": "buildings/pioneers/streets/as_gravel_path/a/135/0.png",
    "pine": "terrain/trees/as_spruce0/idle_full/135/0.png",
    "leaf_tree": "terrain/trees/as_birch0/idle_full/135/0.png",
    "stump": "terrain/ambient/as_treestumps0/idle/135/0.png",
    "rock": "terrain/ambient/as_rock0/idle/135/0.png",
    "warehouse": "buildings/pioneers/warehouse/as_warehouse_pioneers0/idle/135/0.png",
    "hut": "buildings/pioneers/lumberjack_barrack/as_lumberjack_barrack0/idle/135/0.png",
    "_hut_logs1": "buildings/pioneers/lumberjack_barrack/as_lumberjack_barrack0/logs_01/135/0.png",
    "_hut_logs2": "buildings/pioneers/lumberjack_barrack/as_lumberjack_barrack0/logs_02/135/0.png",
    "sawmill": "buildings/pioneers/weaver/as_weaver0/idle/135/0.png",
    "quarry": "buildings/pioneers/clay_pit/as_clay_pit0/idle/135/0.png",
    "mushroom": "terrain/ambient/as_mushroom0/idle/135/000.png",
    "rock2": "terrain/ambient/as_rock1/idle/135/0.png",
}

ROTS = ["r0", "r45", "r90", "r135", "r180", "r225", "r270", "r315"]
ROT_DIR = {"r0": "0", "r45": "45", "r90": "90", "r135": "135",
           "r180": "180", "r225": "225", "r270": "270", "r315": "315"}
UNIT_ACTS = {"idle": ("idle", ["0000"]),
             "walk": ("move", ["0001", "0002", "0003", "0004"]),
             "carry": ("move_full", ["0001", "0002", "0003", "0004"]),
             "work": ("work", ["0000"])}
for _rot in ROTS:
    _d = ROT_DIR[_rot]
    for _act, (_dir, _frames) in UNIT_ACTS.items():
        # lj_idle_r135 / lj_walk1_r135 / lj_carry1_r135 / lj_work_r135
        for _i, _fr in enumerate(_frames):
            _slot = f"lj_{_act}_{_rot}" if len(_frames) == 1 else f"lj_{_act}{_i + 1}_{_rot}"
            FILES[_slot] = f"units/lumberjack/as_lumberjackunit0/{_dir}/{_d}/{_fr}.png"

TILES = {"grass", "grass_var", "water", "road"}


def anchor_of(img: Image.Image, is_tile: bool) -> tuple[int, int]:
    bb = img.getbbox()
    assert bb, "sprite vacío"
    if is_tile:
        return ((bb[0] + bb[2]) // 2, (bb[1] + bb[3]) // 2)
    return ((bb[0] + bb[2]) // 2, bb[3])  # base-centro


sprites: dict[str, Image.Image] = {}
anchors: dict[str, tuple[int, int]] = {}
for slot, rel in FILES.items():
    if slot.startswith("_"):
        continue
    img = Image.open(src(rel)).convert("RGBA")
    sprites[slot] = img
    anchors[slot] = anchor_of(img, slot in TILES)
    img.save(RAW / f"{slot}.png")

# hut con stock: composite overlay de troncos sobre la cabaña
hut = sprites["hut"]
for i, rel in (("hut_logs1", FILES["_hut_logs1"]), ("hut_logs2", FILES["_hut_logs2"])):
    ov = Image.open(src(rel)).convert("RGBA")
    comp = hut.copy()
    comp.alpha_composite(ov)
    sprites[i] = comp
    anchors[i] = anchors["hut"]
    ov.save(RAW / f"{i}_overlay.png")

# flag iso procedural (mismo estilo de trazo que UH: outline oscuro fino)
flag = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
d = ImageDraw.Draw(flag)
OL = (40, 30, 25, 255)
d.ellipse([20, 52, 44, 57], fill=(0, 0, 0, 60))
d.rectangle([30, 10, 34, 54], fill=(150, 150, 150, 255), outline=OL)
d.ellipse([28, 7, 36, 12], fill=(190, 190, 190, 255), outline=OL)
d.polygon([(34, 12), (54, 18), (34, 27)], fill=(178, 58, 46, 255), outline=OL)
sprites["flag"] = flag
anchors["flag"] = (32, 54)

# scaffold iso procedural (andamio de obra, paleta UH; derivado CC-BY-SA)
scaf = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
d = ImageDraw.Draw(scaf)
WOOD, WOOD_D = (139, 90, 43, 255), (94, 58, 26, 255)
d.ellipse([24, 112, 104, 122], fill=(0, 0, 0, 60))
for px in (34, 62, 90):
    d.rectangle([px, 30, px + 6, 114], fill=WOOD, outline=OL)
for py in (44, 78):
    d.polygon([(28, py), (100, py - 18), (100, py - 12), (28, py + 6)], fill=WOOD_D, outline=OL)
d.line([(34, 110), (68, 40)], fill=WOOD_D, width=3)
d.line([(96, 110), (62, 40)], fill=WOOD_D, width=3)
sprites["scaffold"] = scaf
anchors["scaffold"] = (64, 114)

for slot, img in sprites.items():
    img.save(OUT / f"{slot}.png")

# --- atlas: shelf packing 512px ---
unit_frames = [s for s in sprites
               if s.startswith("lj_") and any(s.endswith(f"_{r}") for r in
               ("r0", "r45", "r90", "r135", "r180", "r225", "r270", "r315"))]
order = (["grass", "grass_var", "water", "road", "stump", "rock", "rock2",
          "mushroom", "flag", "scaffold",
          "pine", "leaf_tree", "hut", "hut_logs1", "hut_logs2",
          "sawmill", "warehouse", "quarry"] + sorted(unit_frames))
W = 512
x = y = row_h = 0
frames: dict = {}
atlas_w = 0
for slot in order:
    im = sprites[slot]
    w2, h2 = im.size
    if x + w2 > W:
        y += row_h
        atlas_w = max(atlas_w, x)
        x, row_h = 0, 0
    frames[slot] = {"x": x, "y": y, "w": w2, "h": h2}
    x += w2
    row_h = max(row_h, h2)
atlas_w = max(atlas_w, x)
atlas_h = y + row_h
atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))
for slot, f in frames.items():
    atlas.alpha_composite(sprites[slot], (f["x"], f["y"]))
atlas.save(ATLAS_DIR / "atlas.png")
(ATLAS_DIR / "atlas.json").write_text(json.dumps({"frames": {
    s: {"frame": {"x": f["x"], "y": f["y"], "w": f["w"], "h": f["h"]},
          "rotated": False, "trimmed": False,
          "spriteSourceSize": {"x": 0, "y": 0, "w": f["w"], "h": f["h"]},
          "sourceSize": {"w": f["w"], "h": f["h"]}}
    for s, f in frames.items()},
    "meta": {"app": "settlers-ramos UH iso", "scale": "1"}}))

# --- atlasMeta.ts generado ---
lines = ["// GENERADO por scripts/curate-uh.py — no editar a mano.",
         "export interface Anchor { ax: number; ay: number; w: number; h: number }",
         "export const ATLAS_META: Record<string, Anchor> = {"]
for slot in order:
    ax, ay = anchors[slot]
    w2, h2 = sprites[slot].size
    lines.append(f'  {slot}: {{ ax: {ax}, ay: {ay}, w: {w2}, h: {h2} }},')
lines.append("};")
META_TS.write_text("\n".join(lines) + "\n", encoding="utf-8")

# --- tablero maestro ---
board = Image.new("RGBA", (760, 560), (24, 22, 32, 255))
d = ImageDraw.Draw(board)
d.text((12, 8), "SETTLERSRAMOS UH-iso - Unknown Horizons (CC-BY-SA 3.0) + derivados", fill=(255, 255, 255, 255))
d.text((12, 26), "rotacion 135 - contenido CC-BY-SA, ver CREDITS.md", fill=(180, 180, 180, 255))
show = ["grass", "water", "road", "pine", "leaf_tree", "stump", "rock", "rock2",
        "mushroom", "hut", "hut_logs2", "sawmill", "warehouse", "quarry", "scaffold",
        "lj_idle_r135", "lj_walk1_r135", "lj_carry1_r135", "lj_work_r135",
        "lj_idle_r270", "lj_walk1_r90", "flag"]
for i, s in enumerate(show):
    im = sprites[s].copy()
    im.thumbnail((120, 120))
    x0, y0 = 12 + (i % 8) * 94, 52 + (i // 8) * 170
    board.alpha_composite(im, (x0, y0))
    d.text((x0, y0 + 126), s, fill=(255, 255, 255, 255))
board.save(OUT / "_style_master.png")
board.save(RAW / "_style_master.png")
(OUT / "MANIFEST.txt").write_text("\n".join(sorted(sprites)) + "\n_states: _style_master\n")

print(f"UH-iso OK: {len(sprites)} sprites, atlas {atlas_w}x{atlas_h}, {len(frames)} frames")
