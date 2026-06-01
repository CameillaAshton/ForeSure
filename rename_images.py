"""Copy Chinese-named images to English-named versions"""
import shutil
import os

img_dir = r'c:\Users\Administrator\Desktop\雀定\images'

# Mapping: Chinese name -> English name
mapping = {
    '普通.jpg': 'bird-normal.jpg',
    '毒舌.jpg': 'bird-mean.jpg',
    '禅.jpg': 'bird-zen.jpg',
    'e531a3920920101dc9363bfb0328634b.jpg': 'bird-tsundere.jpg',
}

for cn_name, en_name in mapping.items():
    src = os.path.join(img_dir, cn_name)
    dst = os.path.join(img_dir, en_name)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"Copied: {cn_name} -> {en_name}")
    else:
        print(f"NOT FOUND: {cn_name}")
