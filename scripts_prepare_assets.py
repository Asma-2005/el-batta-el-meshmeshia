from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "assets" / "source" / "batta-pixel-master.png"
HERO = ROOT / "assets" / "source" / "batta-readme-hero.png"
IMAGES = ROOT / "images"
IMAGES.mkdir(parents=True, exist_ok=True)


def export_nearest(source: Path, destination: Path, size: tuple[int, int]) -> None:
    with Image.open(source) as image:
        converted = image.convert("RGBA")
        converted.thumbnail(size, Image.Resampling.NEAREST)

        canvas = Image.new("RGBA", size, (2, 6, 24, 255))
        x = (size[0] - converted.width) // 2
        y = (size[1] - converted.height) // 2
        canvas.alpha_composite(converted, (x, y))
        canvas.convert("RGB").save(destination, optimize=True)


export_nearest(MASTER, IMAGES / "icon.png", (256, 256))
export_nearest(MASTER, IMAGES / "duck-avatar.png", (512, 512))
export_nearest(HERO, IMAGES / "hero.png", (1280, 720))

print("Prepared icon.png, duck-avatar.png, and hero.png")
