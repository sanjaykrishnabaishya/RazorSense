import urllib.request
import os

logos = {
    "zomato": "https://icon.horse/icon/zomato.com",
    "amazon": "https://icon.horse/icon/amazon.com",
    "ebay": "https://icon.horse/icon/ebay.com",
    "swiggy": "https://icon.horse/icon/swiggy.com",
    "steam": "https://icon.horse/icon/steampowered.com",
    "nike": "https://icon.horse/icon/nike.com",
}

os.makedirs("frontend/public/logos", exist_ok=True)
req = urllib.request.build_opener()
req.addheaders = [('User-agent', 'Mozilla/5.0')]
urllib.request.install_opener(req)

for name, url in logos.items():
    try:
        urllib.request.urlretrieve(url, f"frontend/public/logos/{name}.png")
        print(f"Downloaded {name}")
    except Exception as e:
        print(f"Failed {name}: {e}")
