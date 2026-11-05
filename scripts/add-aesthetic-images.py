"""Add mood-board images for one aesthetic: the tallest image becomes 1.jpg (the tall left slot).
Usage: python3 scripts/add-aesthetic-images.py <aesthetic-id> <img> <img> <img>"""
import os, sys
from PIL import Image, ImageOps

aid, files = sys.argv[1], sys.argv[2:5]
out = f'public/fanpage-blueprint/assets/aesthetics/{aid}'
os.makedirs(out, exist_ok=True)
ims = [ImageOps.exif_transpose(Image.open(f)).convert('RGB') for f in files]
tallest = max(range(len(ims)), key=lambda i: ims[i].height / ims[i].width)
order = [tallest] + [i for i in range(len(ims)) if i != tallest]
for n, i in enumerate(order, 1):
    im = ims[i].copy()
    im.thumbnail((720, 1280), Image.LANCZOS)
    im.save(f'{out}/{n}.jpg', 'JPEG', quality=80, optimize=True, progressive=True)
    print(f'{aid}/{n}.jpg  <- {os.path.basename(files[i])}  {im.size}')
