"""Elite Four overworld walk sheets: the top 64x64 of each pack character sheet, the same source as the battle trainers in .anbu/design/battle/trainers.py."""
import os
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
SRC = os.path.join(ROOT, 'vendor', 'ninja-adventure', 'Actor', 'Character')
OUT = os.path.join(ROOT, 'public', 'assets', 'ninja-adventure')
ELITE = {'dsa': 'KnightGold', 'machine-coding': 'RobotGrey', 'system-design': 'SorcererBlack', 'behavioral': 'Princess'}

for key, char in ELITE.items():
    sheet = Image.open(os.path.join(SRC, char, 'SpriteSheet.png')).convert('RGBA').crop((0, 0, 64, 64))
    sheet.save(os.path.join(OUT, f'{key}-sheet.png'))
    print('wrote', key, char)
