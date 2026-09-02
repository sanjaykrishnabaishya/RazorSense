from PIL import Image
import math

img = Image.open(r"C:\Users\Asus\.gemini\antigravity\brain\b683f70e-1874-42c1-95a1-ea1f549976e6\razor_ai_bot_1788341620255.jpg").convert("RGBA")
datas = img.getdata()

newData = []
for item in datas:
    # Distance from white
    dist = math.sqrt((255-item[0])**2 + (255-item[1])**2 + (255-item[2])**2)
    
    if dist < 40:
        # Transparent
        newData.append((255, 255, 255, 0))
    elif dist < 100:
        # Semi-transparent blending
        alpha = int((dist - 40) / 60 * 255)
        newData.append((item[0], item[1], item[2], alpha))
    else:
        newData.append(item)

img.putdata(newData)
img.save(r"frontend\public\robot.png", "PNG")
