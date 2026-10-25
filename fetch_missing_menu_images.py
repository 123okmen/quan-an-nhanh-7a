import os
import re
import json
import urllib.request
import urllib.parse
from io import BytesIO
from PIL import Image

BASE_DIR = r"c:\Users\pc\Desktop\mô hình quán ăn nhanh"
MENU_DIR = os.path.join(BASE_DIR, "menu")
PUBLIC_MENU_DIR = os.path.join(BASE_DIR, "public", "menu")

os.makedirs(MENU_DIR, exist_ok=True)
os.makedirs(PUBLIC_MENU_DIR, exist_ok=True)

# 1. Re-crop the 5 BBK items slightly tighter at top so no text from above shows
decal_path = os.path.join(MENU_DIR, "1792899798876_5916925786758833898_5916925786758833898_8c4602dcb863bf04da784e3fe5b4cd10.jpg")
if os.path.exists(decal_path):
    im = Image.open(decal_path)
    w, h = im.size
    crops = {
        "bbk-2": ("BBK_Ga_Ran.jpg", (int(w * 0.45), int(h * 0.562), int(w * 0.62), int(h * 0.722))),
        "bbk-3": ("BBK_Tom_Ran.jpg", (int(w * 0.62), int(h * 0.562), int(w * 0.785), int(h * 0.722))),
        "bbk-4": ("BBK_Tom_Pho_Mai.jpg", (int(w * 0.795), int(h * 0.562), int(w * 0.96), int(h * 0.722))),
        "bbk-1": ("BBK_Xuc_Xich.jpg", (int(w * 0.45), int(h * 0.726), int(w * 0.62), int(h * 0.888))),
        "bbk-5": ("BBK_Suon_BBQ.jpg", (int(w * 0.62), int(h * 0.726), int(w * 0.785), int(h * 0.888))),
    }
    for code, (friendly, box) in crops.items():
        cropped = im.crop(box).convert("RGB")
        cropped.save(os.path.join(PUBLIC_MENU_DIR, f"{code}.jpg"), quality=92)
        cropped.save(os.path.join(MENU_DIR, friendly), quality=92)

# 2. Search Bing Images for exact Vietnamese dish photos
ITEMS_TO_FETCH = [
    ("com-1", "Com_Chien_Phu_Trung.jpg", "cơm chiên phủ trứng ốp la ngon"),
    ("com-4", "Com_Chien_Hai_San.jpg", "cơm chiên hải sản tôm mực dĩa"),
    ("com-5", "Com_Xao_Hai_San.jpg", "cơm trắng xào hải sản tôm mực rau củ"),
    ("com-6", "Com_Bo_Luc_Lac.jpg", "cơm bò lúc lắc ớt chuông"),
    ("com-7", "Com_Bo_Xao_Rau_Cu.jpg", "cơm bò xào cải ngọt rau củ"),
    ("com-8", "Com_Suon_Chua_Ngot.jpg", "cơm sườn xào chua ngọt dĩa"),
    ("mi-3", "Mi_Xao_Gion.jpg", "mì xào giòn hải sản bò rau củ"),
    ("mi-4", "Hu_Tieu_Xao_Kho.jpg", "hủ tiếu xào bò giá hẹ"),
    ("mi-5", "Hu_Tieu_Xao_Nuoc.jpg", "hủ tiếu xào hải sản sốt sệt kiểu hoa"),
    ("ff-1", "Hamburger_Bo_Ga_Pho_Mai.jpg", "hamburger bò phô mai gà giòn"),
    ("ff-2", "Sandwich_Kep_Trung_Xuc_Xich.jpg", "bánh mì sandwich kẹp trứng xúc xích"),
    ("ff-3", "Mi_Tron_Thap_Cam.jpg", "mì trộn thập cẩm xúc xích trứng ốp la gà rán"),
    ("ff-4", "Mi_Cay_7_Cap_Do.jpg", "mì cay 7 cấp độ hải sản bò"),
    ("ff-5", "Banh_Trang_Tron_Dac_Biet.jpg", "bánh tráng trộn đặc biệt trứng cút khô bò"),
    ("tp-1", "Trung_Op_La_Them.jpg", "trứng ốp la lòng đào trên dĩa"),
    ("tp-2", "Pho_Mai_Lat_Them.jpg", "phô mai lát cheddar vàng"),
    ("tp-3", "Xuc_Xich_Chien_Them.jpg", "xúc xích đức chiên khía vàng"),
    ("tp-4", "Com_Them_Vat_Mi_Them.jpg", "chén cơm trắng nóng hổi"),
    ("tp-5", "Pepsi_Coca_7Up_Tra_Da.jpg", "lon nước ngọt pepsi coca 7up đá"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}

def search_bing_image_urls(query: str):
    url = "https://www.bing.com/images/search?q=" + urllib.parse.quote(query) + "&form=HDRSC2&first=1"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
    # Extract murl from Bing image search results
    urls = re.findall(r'murl&quot;:&quot;(https?://[^&]+?)&quot;', html)
    return urls

for code, friendly_name, query in ITEMS_TO_FETCH:
    out_pub = os.path.join(PUBLIC_MENU_DIR, f"{code}.jpg")
    out_menu = os.path.join(MENU_DIR, friendly_name)
    try:
        candidates = search_bing_image_urls(query)
        saved = False
        for img_url in candidates[:10]:
            try:
                req = urllib.request.Request(img_url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=8) as r:
                    data = r.read()
                im = Image.open(BytesIO(data)).convert("RGB")
                w, h = im.size
                if w < 220 or h < 160:
                    continue
                # Resize to clean 640px max width while preserving aspect ratio
                if w > 640:
                    new_h = int(h * (640 / w))
                    im = im.resize((640, new_h), Image.Resampling.LANCZOS)
                im.save(out_pub, "JPEG", quality=88)
                im.save(out_menu, "JPEG", quality=88)
                print(f"[OK] {code} ({friendly_name}) <- {img_url[:65]} ({im.size})")
                saved = True
                break
            except Exception:
                continue
        if not saved:
            print(f"[WARN] Could not download {code} ({query})")
    except Exception as e:
        print(f"[ERR] {code}: {e}")
