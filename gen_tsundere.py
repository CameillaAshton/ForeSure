"""
Generate tsundere bird (傲娇雀) using Pillow
"""
from PIL import Image, ImageDraw, ImageFilter

def draw_tsundere_bird():
    """傲娇雀 - 口是心非，粉色"""
    size = 800
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)
    
    cx, cy = size // 2, size // 2 + 20
    
    # Shadow
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([cx-140, cy+100, cx+140, cy+145], fill=(0, 0, 0, 25))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    img = Image.alpha_composite(img, shadow)
    d = ImageDraw.Draw(img)
    
    # Body - pink
    d.ellipse([cx-130, cy-10, cx+130, cy+130], fill=(224, 138, 174))
    d.ellipse([cx-120, cy, cx+120, cy+120], fill=(245, 160, 192))  # #F5A0C0
    d.ellipse([cx-100, cy+10, cx+100, cy+100], fill=(255, 192, 216))  # highlight
    
    # Head
    d.ellipse([cx-110, cy-150, cx+110, cy+10], fill=(224, 138, 174))
    d.ellipse([cx-100, cy-140, cx+100, cy+5], fill=(245, 160, 192))
    d.ellipse([cx-85, cy-125, cx+85, cy-10], fill=(255, 192, 216))
    
    # Cat-like ear tufts (left)
    d.polygon([(cx-90, cy-130), (cx-110, cy-195), (cx-55, cy-135)], fill=(245, 160, 192))
    d.polygon([(cx-85, cy-128), (cx-100, cy-180), (cx-60, cy-133)], fill=(255, 192, 216))
    # Inner ear
    d.polygon([(cx-80, cy-130), (cx-95, cy-170), (cx-65, cy-133)], fill=(255, 107, 138, 80))
    
    # Cat-like ear tufts (right)
    d.polygon([(cx+90, cy-130), (cx+110, cy-195), (cx+55, cy-135)], fill=(245, 160, 192))
    d.polygon([(cx+85, cy-128), (cx+100, cy-180), (cx+60, cy-133)], fill=(255, 192, 216))
    d.polygon([(cx+80, cy-130), (cx+95, cy-170), (cx+65, cy-133)], fill=(255, 107, 138, 80))
    
    # Wings
    d.ellipse([cx-165, cy-20, cx-80, cy+90], fill=(224, 138, 174))
    d.ellipse([cx-155, cy-10, cx-85, cy+80], fill=(245, 160, 192))
    d.ellipse([cx+80, cy-20, cx+165, cy+90], fill=(224, 138, 174))
    d.ellipse([cx+85, cy-10, cx+155, cy+80], fill=(245, 160, 192))
    
    # Eyes - tsundere style (looking away)
    # Left eye - looking right (away)
    d.ellipse([cx-60, cy-110, cx-15, cy-65], fill=(255, 255, 255))
    d.ellipse([cx-28, cy-100, cx-18, cy-80], fill=(50, 50, 50))  # pupil to the right
    d.ellipse([cx-25, cy-96, cx-20, cy-86], fill=(255, 255, 255))  # shine
    
    # Right eye - looking right (away)
    d.ellipse([cx+15, cy-110, cx+60, cy-65], fill=(255, 255, 255))
    d.ellipse([cx+35, cy-100, cx+45, cy-80], fill=(50, 50, 50))  # pupil to the right
    d.ellipse([cx+38, cy-96, cx+43, cy-86], fill=(255, 255, 255))  # shine
    
    # Beak - pouty
    d.polygon([(cx-15, cy-48), (cx, cy-30), (cx+15, cy-48)], fill=(255, 155, 106))
    
    # Prominent blush marks
    blush = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(blush)
    # Big round blush spots
    bd.ellipse([cx-85, cy-60, cx-45, cy-25], fill=(255, 71, 87, 70))
    bd.ellipse([cx+45, cy-60, cx+85, cy-25], fill=(255, 71, 87, 70))
    blush = blush.filter(ImageFilter.GaussianBlur(6))
    img = Image.alpha_composite(img, blush)
    d = ImageDraw.Draw(img)
    
    # Feet
    d.ellipse([cx-55, cy+118, cx-20, cy+140], fill=(255, 155, 106))
    d.ellipse([cx+20, cy+118, cx+55, cy+140], fill=(255, 155, 106))
    d.line([(cx-48, cy+125), (cx-48, cy+138)], fill=(230, 130, 85), width=2)
    d.line([(cx-37, cy+125), (cx-37, cy+138)], fill=(230, 130, 85), width=2)
    d.line([(cx+37, cy+125), (cx+37, cy+138)], fill=(230, 130, 85), width=2)
    d.line([(cx+48, cy+125), (cx+48, cy+138)], fill=(230, 130, 85), width=2)
    
    img = img.resize((400, 400), Image.LANCZOS)
    # Save as JPG (convert from RGBA to RGB first with white background)
    bg = Image.new('RGB', img.size, (255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    bg.save(r'c:\Users\Administrator\Desktop\雀定\images\傲娇.jpg', 'JPEG', quality=95)
    print("Tsundere bird saved!")

draw_tsundere_bird()
