"""T002: genera Lote 1 procedural coherente (licencia propia, sin IA externa).
Estilo: iso 2:1 simplificado, paleta calida, outline 1px, luz arriba-izquierda.
`python scripts/gen-assets.py` -> assets/approved/*.png + raw/ copia.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import random

OUT = Path("assets/approved")
RAW = Path("assets/raw")
OUT.mkdir(parents=True, exist_ok=True)
RAW.mkdir(parents=True, exist_ok=True)
random.seed(7)

OL = (42, 31, 20, 255)
GRASS, GRASS_D, GRASS_L = (106, 168, 79, 255), (78, 125, 58, 255), (143, 206, 110, 255)
DIRT, DIRT_D = (176, 141, 87, 255), (138, 109, 66, 255)
WOOD, WOOD_D, WOOD_L = (139, 90, 43, 255), (94, 58, 26, 255), (192, 138, 74, 255)
ROOF, ROOF_D, ROOF_L = (179, 58, 46, 255), (126, 36, 28, 255), (217, 95, 78, 255)
WALL = (232, 216, 176, 255)
PINE, PINE_D, PINE_L = (47, 107, 47, 255), (30, 74, 30, 255), (74, 154, 74, 255)
LEAF, LEAF_D = (78, 143, 58, 255), (52, 100, 40, 255)
SKIN = (240, 200, 160, 255)
TUNIC, TUNIC_D = (192, 57, 43, 255), (140, 38, 28, 255)
PANTS = (93, 74, 54, 255)
STONE, STONE_D, STONE_L = (154, 154, 154, 255), (110, 110, 110, 255), (196, 196, 196, 255)


def diamond(draw, cx, cy, w, h, fill, outline=OL):
    draw.polygon([(cx, cy - h // 2), (cx + w // 2, cy), (cx, cy + h // 2), (cx - w // 2, cy)],
                 fill=fill, outline=outline)


def speckle(draw, cx, cy, w, h, colors, n=14):
    for _ in range(n):
        x = cx + random.randint(-w // 2 + 4, w // 2 - 4)
        y = cy + random.randint(-h // 2 + 3, h // 2 - 3)
        # dentro del rombo aprox
        if abs(x - cx) / (w / 2) + abs(y - cy) / (h / 2) <= 0.85:
            draw.point((x, y), fill=random.choice(colors))


def save(img, name):
    img.save(OUT / name)
    img.save(RAW / name)


def tile_grass():
    img = Image.new("RGBA", (64, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    diamond(d, 32, 16, 64, 32, GRASS)
    speckle(d, 32, 16, 64, 32, [GRASS_D, GRASS_L], 22)
    d.line([(4, 16), (32, 2)], fill=GRASS_L, width=1)  # luz arriba-izq
    save(img, "grass.png")


def tile_road():
    img = Image.new("RGBA", (64, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    diamond(d, 32, 16, 64, 32, GRASS)
    diamond(d, 32, 16, 52, 24, DIRT)
    diamond(d, 32, 16, 52, 24, None)
    speckle(d, 32, 16, 52, 24, [DIRT_D, WOOD_L], 14)
    save(img, "road.png")


def pine():
    img = Image.new("RGBA", (64, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([29, 70, 35, 90], fill=WOOD_D, outline=OL)  # tronco
    for i, (y0, w) in enumerate([(8, 44), (28, 52), (48, 60)]):
        d.polygon([(32, y0), (32 + w // 2, y0 + 26), (32 - w // 2, y0 + 26)],
                  fill=PINE, outline=OL)
        d.line([(32, y0 + 3), (32 - w // 4, y0 + 22)], fill=PINE_L, width=2)
    d.ellipse([8, 86, 56, 93], fill=(0, 0, 0, 60))  # sombra
    save(img, "pine.png")


def leaf_tree():
    img = Image.new("RGBA", (64, 96), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([8, 86, 56, 93], fill=(0, 0, 0, 60))
    d.rectangle([29, 62, 35, 90], fill=WOOD_D, outline=OL)
    for (x, y, r, c) in [(32, 40, 20, LEAF), (20, 50, 13, LEAF), (44, 50, 13, LEAF_D), (32, 30, 12, LEAF)]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=c, outline=OL)
    d.ellipse([22, 24, 33, 35], fill=GRASS_L)  # brillo
    for _ in range(8):
        d.point((random.randint(16, 48), random.randint(28, 58)), fill=GRASS_L)
    save(img, "leaf_tree.png")


def log_pile():
    img = Image.new("RGBA", (48, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for y in (18, 10):
        for x in (8, 20) if y == 18 else (14,):
            d.rectangle([x, y, x + 20, y + 9], fill=WOOD, outline=OL)
            d.ellipse([x + 15, y, x + 23, y + 9], fill=WOOD_L, outline=OL)
            d.point((x + 19, y + 4), fill=WOOD_D)
    save(img, "log.png")


def rock():
    img = Image.new("RGBA", (48, 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([4, 32, 44, 38], fill=(0, 0, 0, 60))
    d.polygon([(6, 33), (14, 12), (30, 10), (42, 33)], fill=STONE, outline=OL)
    d.polygon([(14, 12), (30, 10), (26, 22), (16, 24)], fill=STONE_L)
    d.line([(16, 26), (30, 26)], fill=STONE_D, width=1)
    save(img, "rock.png")


def building(w, h, roof_h, wall_h, door=True, side_logs=False, name="warehouse.png"):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    sh = h - 4
    d.ellipse([8, sh - 4, w - 8, sh + 3], fill=(0, 0, 0, 70))
    by = sh - wall_h  # top muro
    d.rectangle([14, by, w - 14, sh], fill=WALL, outline=OL)
    for xx in range(18, w - 14, 8):  # tablones muro
        d.line([(xx, by + 2), (xx, sh - 1)], fill=DIRT, width=1)
    # tejado triangulo solido + cumbrera
    d.polygon([(6, by + 6), (w // 2, by - roof_h), (w - 6, by + 6)], fill=ROOF, outline=OL)
    d.polygon([(6, by + 6), (w // 2, by - roof_h), (w // 2, by + 6)], fill=ROOF_D)
    d.line([(w // 2, by - roof_h), (w // 2, by + 6)], fill=ROOF_L, width=2)
    if door:
        d.rectangle([w // 2 - 8, sh - 20, w // 2 + 8, sh], fill=WOOD_D, outline=OL)
        d.point((w // 2 + 5, sh - 10), fill=WOOD_L)
    # ventana
    d.rectangle([w - 30, by + 8, w - 20, by + 16], fill=(60, 80, 120, 255), outline=OL)
    if side_logs:
        d.rectangle([w - 26, sh - 10, w - 6, sh - 3], fill=WOOD, outline=OL)
        d.ellipse([w - 11, sh - 10, w - 3, sh - 3], fill=WOOD_L, outline=OL)
    else:
        # cajas almacen
        d.rectangle([18, sh - 12, 34, sh - 1], fill=WOOD, outline=OL)
        d.line([(18, sh - 7), (34, sh - 7)], fill=WOOD_D, width=1)
    save(img, name)


def worker(carry=False, name="worker_idle.png"):
    img = Image.new("RGBA", (32, 44), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([4, 39, 28, 43], fill=(0, 0, 0, 70))
    # piernas
    d.rectangle([11, 30, 15, 40], fill=PANTS, outline=OL)
    d.rectangle([17, 30, 21, 40], fill=PANTS, outline=OL)
    # tunica
    d.rectangle([9, 18, 23, 31], fill=TUNIC, outline=OL)
    d.line([(9, 24), (23, 24)], fill=TUNIC_D, width=1)
    # brazos
    if carry:
        d.rectangle([20, 10, 30, 14], fill=WOOD, outline=OL)  # tronco al hombro
        d.rectangle([22, 16, 25, 26], fill=SKIN, outline=OL)
        d.rectangle([7, 20, 10, 28], fill=SKIN, outline=OL)
    else:
        d.rectangle([6, 19, 9, 29], fill=SKIN, outline=OL)
        d.rectangle([23, 19, 26, 29], fill=SKIN, outline=OL)
    # cabeza
    d.rectangle([10, 6, 22, 18], fill=SKIN, outline=OL)
    d.rectangle([10, 6, 22, 10], fill=(90, 60, 40, 255))  # pelo
    d.point((14, 13), fill=(0, 0, 0, 255))
    d.point((19, 13), fill=(0, 0, 0, 255))
    save(img, name)


def flag():
    img = Image.new("RGBA", (32, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([6, 42, 26, 46], fill=(0, 0, 0, 60))
    d.rectangle([14, 6, 17, 43], fill=WOOD_D, outline=OL)
    d.polygon([(17, 7), (30, 11), (17, 19)], fill=TUNIC, outline=OL)
    d.line([(17, 10), (26, 12)], fill=ROOF_L, width=1)
    d.ellipse([12, 4, 19, 9], fill=WOOD_L, outline=OL)
    save(img, "flag.png")


def style_master():
    img = Image.new("RGBA", (384, 192), (24, 20, 32, 255))
    d = ImageDraw.Draw(img)
    d.text((12, 8), "SETTLERSRAMOS Lote1 T002 - paleta propia procedural", fill=(255, 255, 255, 255))
    pal = [GRASS, DIRT, WOOD, ROOF, WALL, PINE, TUNIC, SKIN, STONE]
    for i, c in enumerate(pal):
        d.rectangle([12 + i * 30, 32, 12 + i * 30 + 26, 58], fill=c, outline=(255, 255, 255, 255))
    d.text((12, 66), "64x32 iso 2:1 - outline 1px - luz arriba-izq - sin assets Ubisoft", fill=(200, 200, 200, 255))
    thumbs = ["grass.png", "road.png", "log.png", "rock.png", "flag.png"]
    x = 12
    for t in thumbs:
        try:
            th = Image.open(OUT / t)
            img.alpha_composite(th, (x, 96))
            x += th.width + 8
        except FileNotFoundError:
            pass
    for t in ["warehouse.png", "worker_idle.png"]:
        try:
            th = Image.open(OUT / t)
            th.thumbnail((120, 90))
            img.alpha_composite(th, (x, 90))
            x += th.width + 8
        except FileNotFoundError:
            pass
    save(img, "_style_master.png")


tile_grass()
tile_road()
pine()
leaf_tree()
log_pile()
rock()
building(160, 140, 44, 56, door=True, side_logs=False, name="warehouse.png")
building(128, 116, 36, 44, door=True, side_logs=True, name="woodcutter.png")
worker(False, "worker_idle.png")
worker(True, "worker_carry_log.png")
flag()
style_master()
print("T002 OK: 12 PNG en assets/approved/ + raw/")
