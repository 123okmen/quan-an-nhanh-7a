import os
import shutil
from PIL import Image

BASE_DIR = r"c:\Users\pc\Desktop\mô hình quán ăn nhanh"
MENU_DIR = os.path.join(BASE_DIR, "menu")
PUBLIC_MENU_DIR = os.path.join(BASE_DIR, "public", "menu")

os.makedirs(MENU_DIR, exist_ok=True)
os.makedirs(PUBLIC_MENU_DIR, exist_ok=True)

# 1. Copy 4 existing food photos to clean names
existing_map = {
    "1792899802621_5916925786758833898_5916925786758833898_98bd1798385a8e9f9ead925f818c7131.jpg": ("com-2.jpg", "Com_Ga_Xoi_Mo.jpg"),
    "1792899808719_5916925786758833898_5916925786758833898_652ff7cc01d7e240857182841c97bbbf.jpg": ("com-3.jpg", "Com_Ga_Chien_Mam_Toi.jpg"),
    "1792899812325_5916925786758833898_5916925786758833898_7e8861f8c0c1e37f0e5f5c6e08049e90.jpg": ("mi-1.jpg", "Mi_Xao_Hai_San.jpg"),
    "1792899805683_5916925786758833898_5916925786758833898_14458dcfb950458a185288180e43ed7b.jpg": ("mi-2.jpg", "Mi_Xao_Bo.jpg"),
}

for src_name, (code_name, friendly_name) in existing_map.items():
    src_path = os.path.join(MENU_DIR, src_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, os.path.join(PUBLIC_MENU_DIR, code_name))
        shutil.copy2(src_path, os.path.join(MENU_DIR, friendly_name))
        print(f"Copied {src_name} -> {code_name} & {friendly_name}")

# 2. Inspect decal image and crop the 5 BBK items
decal_path = os.path.join(MENU_DIR, "1792899798876_5916925786758833898_5916925786758833898_8c4602dcb863bf04da784e3fe5b4cd10.jpg")
if os.path.exists(decal_path):
    im = Image.open(decal_path)
    w, h = im.size
    print(f"Decal size: {w}x{h}")
    # In the 90x60 bottom-right panel:
    # Let's crop using normalized coordinates based on the 1280x989 / 1222x945 layout:
    # Top row of 90x60 panel:
    # bbk-2 (Gà Rán 20K): x=[0.445, 0.625], y=[0.555, 0.725]
    # bbk-3 (Tôm Rán 24K): x=[0.620, 0.785], y=[0.555, 0.725]
    # bbk-4 (Tôm Phô Mai 26K): x=[0.795, 0.960], y=[0.555, 0.725]
    # Bottom row of 90x60 panel:
    # bbk-1 (Xúc Xích 18K): x=[0.445, 0.625], y=[0.720, 0.890]
    # bbk-5 (Sườn BBQ 25K): x=[0.620, 0.785], y=[0.720, 0.890]
    crops = {
        "bbk-2": ("BBK_Ga_Ran.jpg", (int(w * 0.45), int(h * 0.555), int(w * 0.62), int(h * 0.725))),
        "bbk-3": ("BBK_Tom_Ran.jpg", (int(w * 0.62), int(h * 0.555), int(w * 0.785), int(h * 0.725))),
        "bbk-4": ("BBK_Tom_Pho_Mai.jpg", (int(w * 0.795), int(h * 0.555), int(w * 0.96), int(h * 0.725))),
        "bbk-1": ("BBK_Xuc_Xich.jpg", (int(w * 0.45), int(h * 0.72), int(w * 0.62), int(h * 0.89))),
        "bbk-5": ("BBK_Suon_BBQ.jpg", (int(w * 0.62), int(h * 0.72), int(w * 0.785), int(h * 0.89))),
    }
    for code, (friendly, box) in crops.items():
        cropped = im.crop(box)
        cropped.save(os.path.join(PUBLIC_MENU_DIR, f"{code}.jpg"), quality=92)
        cropped.save(os.path.join(MENU_DIR, friendly), quality=92)
        print(f"Cropped {code}.jpg ({friendly}) -> {box}")
