#!/usr/bin/env python3
"""
Download random book cover images for the library
"""
import requests
import os

# Create the covers directory path
covers_dir = "/home/nomanstine/Desktop/basic_version/frontend/public/book-covers"
os.makedirs(covers_dir, exist_ok=True)

# Download 15 random book cover-style images
for i in range(1, 16):
    url = f"https://picsum.photos/300/400?random={i + 100}"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(f"{covers_dir}/cover-{i}.jpg", "wb") as f:
                f.write(response.content)
            print(f"Downloaded cover-{i}.jpg")
        else:
            print(f"Failed to download cover-{i}.jpg")
    except Exception as e:
        print(f"Error downloading cover-{i}.jpg: {e}")

print("Finished downloading book covers!")
