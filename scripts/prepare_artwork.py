"""Export the active site artwork. Full-resolution source PNGs stay in artwork/."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ARTWORK = ROOT / "artwork"
EXPORTS = [
    ("hero-background.png", "hero-background", 1586, None),
    ("hero-background.png", "hero-background-mobile", 740, (0, 0, 1060, 992)),
    ("hero-foreground.png", "hero-foreground", 1586, None),
    ("hero-foreground.png", "hero-foreground-mobile", 740, (0, 0, 1060, 992)),
    ("Cinematic Sci-Fi City Within a Silhouette.png", "cinematic-silhouette", 1586, None),
    ("Cinematic Sci-Fi City Within a Silhouette.png", "cinematic-silhouette-mobile", 740, (0, 0, 1060, 992)),
    ("Cyberpunk Operations Room Silhouette.png", "projects-silhouette", 1585, None),
    ("Cyberpunk Operations Room Silhouette.png", "projects-silhouette-mobile", 900, (170, 0, 1350, 992)),
    ("silo for projects.png", "publications-silhouette-mobile", 900, (60, 0, 1240, 992)),
    ("silo for projects.png", "publications-silhouette", 1586, None),
]

for source, name, width, crop in EXPORTS:
    with Image.open(ARTWORK / source) as image:
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        if crop:
            assert 0 <= crop[0] < crop[2] <= image.width
            assert 0 <= crop[1] < crop[3] <= image.height
            image = image.crop(crop)
        height = round(image.height * width / image.width)
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        destination = ROOT / "assets" / f"{name}.webp"
        image.save(destination, "WEBP", quality=78 if name.startswith("hero-background") else 86, method=6)
        print(f"{destination.name}: {width}x{height}, {destination.stat().st_size:,} bytes")
