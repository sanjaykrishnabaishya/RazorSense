import sys
from rembg import remove
from PIL import Image

input_path = r'C:\Users\Asus\.gemini\antigravity\brain\b683f70e-1874-42c1-95a1-ea1f549976e6\.user_uploaded\media_1788353949859.jpg'
output_path = r'C:\Users\Asus\OneDrive\Desktop\RazorSense\razorsense-app\frontend\public\krish.png'

try:
    print("Loading image...")
    input_image = Image.open(input_path)
    
    print("Removing background...")
    output_image = remove(input_image)
    
    print("Saving to public/krish.png...")
    output_image.save(output_path)
    
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
