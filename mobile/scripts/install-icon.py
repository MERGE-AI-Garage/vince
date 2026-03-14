#!/usr/bin/env python3
# ABOUTME: Installs a source PNG as the Vince iOS app icon
# ABOUTME: Crops white borders, fills corners to dark bg, generates all required Xcode sizes

import sys
import os
from PIL import Image, ImageDraw
import numpy as np

SOURCE = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
    "~/Downloads/Generated Image March 14, 2026 - 10_11AM.png"
)

DEST_DIR = os.path.join(
    os.path.dirname(__file__),
    "../ios/App/App/Assets.xcassets/AppIcon.appiconset"
)

BG_COLOR = (12, 8, 20)  # #0c0814 — matches the icon background

# Xcode required sizes (filename: points@scale → actual pixels)
SIZES = {
    "Icon-20@2x.png":   40,
    "Icon-20@3x.png":   60,
    "Icon-29@2x.png":   58,
    "Icon-29@3x.png":   87,
    "Icon-40@2x.png":   80,
    "Icon-40@3x.png":   120,
    "Icon-60@2x.png":   120,
    "Icon-60@3x.png":   180,
    "Icon-76.png":      76,
    "Icon-76@2x.png":   152,
    "Icon-83.5@2x.png": 167,
    "Icon-1024.png":    1024,
}

def crop_to_content(img: Image.Image, fill: float = 0.88) -> Image.Image:
    """Crop dark padding and return content scaled to fill `fill` fraction of the image."""
    arr = np.array(img.convert("RGB"))
    # Sample the corner pixels to detect the background color
    corners = [arr[0,0], arr[0,-1], arr[-1,0], arr[-1,-1]]
    bg = np.mean(corners, axis=0)  # e.g. [12, 8, 20] for #0c0814
    # A pixel is "content" if it differs from background by more than threshold
    diff = np.abs(arr.astype(float) - bg).max(axis=2)
    is_content = diff > 18
    rows = np.where(is_content.any(axis=1))[0]
    cols = np.where(is_content.any(axis=0))[0]
    if len(rows) == 0 or len(cols) == 0:
        return img
    top, bottom = rows[0], rows[-1]
    left, right = cols[0], cols[-1]
    cropped = img.crop((left, top, right + 1, bottom + 1))
    # Scale so the content fills `fill` fraction of a square canvas
    content_size = max(cropped.width, cropped.height)
    canvas_size = int(content_size / fill)
    out = Image.new("RGB", (canvas_size, canvas_size), tuple(int(c) for c in bg))
    x = (canvas_size - cropped.width) // 2
    y = (canvas_size - cropped.height) // 2
    out.paste(cropped, (x, y))
    return out

def make_square_on_bg(img: Image.Image, size: int) -> Image.Image:
    """Resize img to size×size on solid dark background."""
    out = Image.new("RGB", (size, size), BG_COLOR)
    img_rgb = img.convert("RGBA")
    scale = size / max(img_rgb.width, img_rgb.height)
    new_w = int(img_rgb.width * scale)
    new_h = int(img_rgb.height * scale)
    resized = img_rgb.resize((new_w, new_h), Image.LANCZOS)
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    out.paste(resized, (x, y), resized)
    return out

def main():
    if not os.path.exists(SOURCE):
        print(f"Source not found: {SOURCE}")
        sys.exit(1)

    os.makedirs(DEST_DIR, exist_ok=True)

    print(f"Loading: {SOURCE}")
    src = Image.open(SOURCE)

    print("Cropping border...")
    cropped = crop_to_content(src)
    print(f"  Cropped: {src.size} → {cropped.size}")

    # Xcode 14+ single universal icon — Xcode generates all sizes automatically
    icon_path = os.path.join(DEST_DIR, "AppIcon.png")
    out = make_square_on_bg(cropped, 1024)
    out.save(icon_path, "PNG", optimize=True)
    print(f"  ✓ AppIcon.png (1024×1024)")

    # Clean up any old per-size files
    for filename in SIZES:
        old = os.path.join(DEST_DIR, filename)
        if os.path.exists(old):
            os.remove(old)

    contents = '''{
  "images" : [
    {
      "filename" : "AppIcon.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
'''
    contents_path = os.path.join(DEST_DIR, "Contents.json")
    with open(contents_path, "w") as f:
        f.write(contents)
    print(f"  ✓ Contents.json")
    print(f"\nDone. Open Xcode and verify the icon set looks correct.")

if __name__ == "__main__":
    main()
