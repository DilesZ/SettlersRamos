"""T002b + V1 visual: cura el Lote 1+ desde el pack CC0 vendorizado (Kenney Medieval RTS).
V1: fuentes Retina (128) reducidas a 64 con LANCZOS (bordes más nítidos) + 4 slots
nuevos (grass_var, dirt, water, sawmill). Reproducible: `python scripts/curate-cc0.py`.

Mapeo fuente -> slot (ver specs/001-slice-eco/tasks.md T002b):
  grass            <- medievalTile_58.png          (hierba lisa)
  road             <- medievalTile_04.png          (camino recto)
  pine             <- medievalEnvironment_04.png   (pino grande)
  leaf_tree        <- medievalEnvironment_02.png   (pino mediano)
  log              <- medievalEnvironment_06.png   (troncos)
  rock             <- medievalEnvironment_10.png   (rocas)
  warehouse        <- medievalStructure_19.png     (gran salon/almacen)
  woodcutter       <- medievalStructure_17.png     (cabana)
  worker_idle      <- medievalUnit_06.png          (aldeano)
  grass_var        <- medievalTile_51.png          (hierba con flores, acento)
  dirt             <- medievalTile_13.png          (tierra, bajo edificios)
  water            <- medievalTile_27.png          (agua, estanque)
  sawmill          <- medievalStructure_21.png     (casa con pila de lena: sierra)
  worker_carry_log <- DERIVADO: Unit_06 + tronco al hombro (PIL, paleta Kenney)
  flag             <- DERIVADO procedural estilo plano Kenney (no hay bandera en el pack)
  _style_master    <- DERIVADO: tablero con los 12 + fuentes

Todo el pack es CC0 (ver assets/vendor/kenney-medieval-rts/License.txt).
"""
from PIL import Image, ImageDraw
from pathlib import Path
import shutil

VENDOR = Path("assets/vendor/kenney-medieval-rts")
SRC = VENDOR / "PNG" / "Retina"
OUT64 = 64
RAW = Path("assets/raw")
OUT = Path("assets/approved")
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)

KENNEY_OL = (45, 45, 45, 255)

MAP = {
    "grass": ("Tile/medievalTile_58.png", False),
    "road": ("Tile/medievalTile_04.png", False),
    "pine": ("Environment/medievalEnvironment_04.png", False),
    "leaf_tree": ("Environment/medievalEnvironment_02.png", False),
    "log": ("Environment/medievalEnvironment_06.png", False),
    "rock": ("Environment/medievalEnvironment_10.png", False),
    "warehouse": ("Structure/medievalStructure_19.png", False),
    "woodcutter": ("Structure/medievalStructure_17.png", False),
    "worker_idle": ("Unit/medievalUnit_06.png", False),
    "grass_var": ("Tile/medievalTile_51.png", False),
    "dirt": ("Tile/medievalTile_13.png", False),
    "water": ("Tile/medievalTile_27.png", False),
    "sawmill": ("Structure/medievalStructure_21.png", False),
}


def load(rel: str) -> Image.Image:
    p = SRC / rel
    assert p.exists(), f"falta fuente CC0: {p}"
    img = Image.open(p).convert("RGBA")
    if img.size != (OUT64, OUT64):
        img = img.resize((OUT64, OUT64), Image.LANCZOS)
    return img


def save(img: Image.Image, name: str, raw_src: Image.Image | None = None):
    img.save(OUT / f"{name}.png")
    (RAW / f"{name}.png").write_bytes(
        (OUT / f"{name}.png").read_bytes() if raw_src is None else b""
    )
    if raw_src is not None:
        raw_src.save(RAW / f"{name}.png")


for slot, (rel, _) in MAP.items():
    img = load(rel)
    assert img.size == (OUT64, OUT64), f"{rel}: se esperaba 64x64, es {img.size}"
    save(img, slot, raw_src=img)

# --- worker_carry_log: aldeano + tronco al hombro ---
worker = load("Unit/medievalUnit_06.png")
log = load("Environment/medievalEnvironment_06.png")
log = log.crop(log.getbbox())  # ajusta al contenido: evita caja oscura visible
log.thumbnail((30, 18), Image.LANCZOS)
carry = worker.copy()
d = ImageDraw.Draw(carry)
lx, ly = 30, 12  # hombro derecho (el sprite ya trae outline propio)
carry.alpha_composite(log, (lx, ly))
d.line([(lx + 3, ly + log.height - 3), (lx + log.width - 3, ly + log.height - 3)],
       fill=(122, 72, 40, 255), width=1)
save(carry, "worker_carry_log", raw_src=worker)

# --- flag: estilo plano Kenney ---
flag = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
d = ImageDraw.Draw(flag)
d.ellipse([18, 54, 46, 59], fill=(0, 0, 0, 60))
d.rectangle([30, 8, 35, 56], fill=(160, 160, 160, 255), outline=KENNEY_OL)
d.ellipse([28, 5, 37, 11], fill=(200, 200, 200, 255), outline=KENNEY_OL)
d.polygon([(35, 10), (56, 16), (35, 26)], fill=(192, 57, 43, 255), outline=KENNEY_OL)
d.line([(35, 14), (50, 17)], fill=(217, 95, 78, 255), width=2)
save(flag, "flag")

# --- _style_master: tablero de control del lote ---
master = Image.new("RGBA", (640, 420), (24, 22, 32, 255))
d = ImageDraw.Draw(master)
d.text((12, 8), "SETTLERSRAMOS Lote1+ V1 - Kenney Medieval RTS (CC0) + 3 derivados", fill=(255, 255, 255, 255))
d.text((12, 26), "top-down 64x64 desde Retina - mirror: github.com/meehow/medievalRTS - original: kenney.nl/assets/medieval-rts",
       fill=(180, 180, 180, 255))
slots = ["grass", "grass_var", "dirt", "water", "road", "pine", "leaf_tree", "log", "rock",
         "warehouse", "woodcutter", "sawmill", "worker_idle", "worker_carry_log", "flag"]
for i, s in enumerate(slots):
    im = Image.open(OUT / f"{s}.png")
    x, y = 12 + (i % 5) * 126, 52 + (i // 5) * 120
    master.alpha_composite(im, (x + 20, y))
    d.text((x, y + 70), s, fill=(255, 255, 255, 255))
    tag = "CC0" if s not in ("worker_carry_log", "flag") else "derivado"
    d.text((x, y + 84), tag, fill=(140, 220, 140, 255) if tag == "CC0" else (255, 210, 120, 255))
master.save(OUT / "_style_master.png")
master.save(RAW / "_style_master.png")

print("V1 OK: 16 PNG en assets/approved/ (13 CC0 + 3 derivados documentados)")
