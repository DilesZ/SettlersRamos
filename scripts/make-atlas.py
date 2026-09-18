"""T003: empaqueta assets/approved/*.png (menos _style_master) en public/atlas/atlas.png + .json.
Formato JSON Hash de Phaser. Re-ejecutable: `python scripts/make-atlas.py`.
"""
import json
from PIL import Image
from pathlib import Path

APPROVED = Path("assets/approved")
OUT = Path("public/atlas")
OUT.mkdir(parents=True, exist_ok=True)

names = ["grass", "road", "pine", "leaf_tree", "log", "rock",
         "warehouse", "woodcutter", "worker_idle", "worker_carry_log", "flag"]
imgs = [(n, Image.open(APPROVED / f"{n}.png").convert("RGBA")) for n in names]
for n, im in imgs:
    assert im.size == (64, 64), f"{n}: {im.size}"

cols, s = 4, 64
rows = (len(imgs) + cols - 1) // cols
atlas = Image.new("RGBA", (cols * s, rows * s), (0, 0, 0, 0))
frames = {}
for i, (n, im) in enumerate(imgs):
    x, y = (i % cols) * s, (i // cols) * s
    atlas.alpha_composite(im, (x, y))
    frames[n] = {"frame": {"x": x, "y": y, "w": s, "h": s}, "rotated": False,
                 "trimmed": False, "spriteSourceSize": {"x": 0, "y": 0, "w": s, "h": s},
                 "sourceSize": {"w": s, "h": s}}
atlas.save(OUT / "atlas.png")
(OUT / "atlas.json").write_text(json.dumps({"frames": frames,
    "meta": {"app": "settlers-ramos T003", "scale": "1"}}))
print(f"T003 atlas OK: {atlas.size} con {len(imgs)} frames -> public/atlas/")
