"""Build aligned hero layers from the original and supplied cloud texture (no API)."""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1] / "artwork"
SIZE = (1586, 992)
original = Image.open(ROOT / "Cinematic Sci-Fi City Within a Silhouette.png").convert("RGB")
assert original.size == SIZE

# Traced in original canvas coordinates: no subject resampling or repositioning.
outline = [
    (0, 716), (17, 694), (34, 659), (51, 627), (70, 609), (79, 590),
    (107, 572), (144, 552), (183, 535), (219, 513), (251, 497), (280, 485),
    (300, 456), (314, 428), (338, 421), (342, 406), (327, 399),
    (319, 382), (311, 362), (298, 341), (286, 317), (274, 295),
    (263, 272), (255, 251), (249, 229), (249, 204), (256, 180),
    (264, 165), (269, 146), (280, 126), (296, 109), (317, 91),
    (337, 81), (369, 72), (399, 67), (436, 63), (471, 63),
    (503, 66), (533, 66), (550, 74), (571, 73), (592, 82),
    (607, 98), (616, 121), (616, 141), (608, 153), (587, 163),
    (589, 175), (596, 195), (601, 210), (607, 219), (607, 229),
    (602, 240), (603, 246), (617, 258), (628, 270), (641, 282),
    (647, 290), (647, 296), (643, 302), (631, 308), (627, 313),
    (628, 320), (632, 326), (634, 333), (632, 340), (627, 344),
    (631, 350), (632, 356), (628, 365), (627, 373), (631, 384),
    (632, 393), (629, 402), (623, 409), (614, 414), (595, 417),
    (572, 419), (554, 421), (544, 425), (539, 431), (536, 442),
    (532, 458), (529, 465), (542, 478), (555, 499), (580, 512),
    (609, 526), (646, 540), (679, 553), (691, 565), (702, 578),
    (718, 586), (730, 603), (742, 633), (759, 655), (773, 687),
    (784, 715), (792, 741), (804, 766), (812, 789), (824, 814),
    (835, 843), (854, 872), (861, 892), (860, 912), (869, 939),
    (878, 961), (874, 977), (883, 992), (0, 992),
]
scale = 3
mask = Image.new("L", (SIZE[0] * scale, SIZE[1] * scale))
ImageDraw.Draw(mask).polygon([(x * scale, y * scale) for x, y in outline], fill=255)
mask = mask.resize(SIZE, Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(.65))
# Keep the luminous flyaway hair with a soft margin; the profile stays precise.
hair = Image.new("L", SIZE)
ImageDraw.Draw(hair).polygon(outline[17:48], fill=255)
hair = hair.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.GaussianBlur(3))
mask = Image.fromarray(np.maximum(np.array(mask), np.array(hair)))
mask.save(ROOT / "hero-subject-mask.png")
foreground = original.copy().convert("RGBA")
foreground.putalpha(mask)
foreground.save(ROOT / "hero-foreground.png", optimize=True)

# Both supplied PNGs contain buildings. Only their upper cloud bands enter the plate.
clouds = [Image.open(ROOT / name).convert("RGB").crop((0, 0, 800, 430))
          .resize(SIZE, Image.Resampling.LANCZOS) for name in ("asset1.png", "asset2.png")]
cloud = np.asarray(Image.blend(*clouds, .65)).astype(np.float32)
pixels = np.asarray(original)
erase = Image.fromarray(cv2.dilate(np.array(mask), np.ones((101, 101), np.uint8)))
small_size = (198, 124)
small = np.array(original.resize(small_size, Image.Resampling.LANCZOS))
small_mask = np.array(erase.resize(small_size, Image.Resampling.NEAREST))
small_mask = np.where(small_mask > 0, 255, 0).astype(np.uint8)
lighting = cv2.inpaint(small, small_mask, 8, cv2.INPAINT_TELEA)
lighting = cv2.GaussianBlur(lighting, (0, 0), 14)
lighting = cv2.resize(lighting.astype(np.float32), SIZE, interpolation=cv2.INTER_CUBIC)
texture = cloud - cv2.GaussianBlur(cloud, (0, 0), 90)
fill = Image.fromarray(np.clip(lighting + texture * 1.4, 0, 255).astype(np.uint8))
blend = erase.filter(ImageFilter.GaussianBlur(12))
background = Image.composite(fill, original, blend)
background.save(ROOT / "hero-background.png", optimize=True)

assert foreground.size == background.size == mask.size == SIZE
assert np.array_equal(np.array(foreground)[..., :3], pixels), "Original subject pixels changed"
assert mask.getextrema() == (0, 255), "Foreground must have actual transparency"
assert np.array(mask)[450:, 1100:].max() == 0, "Text area must stay transparent"
print("PASS: 1586x992 background, RGBA foreground and mask; original RGB/alignment retained")
