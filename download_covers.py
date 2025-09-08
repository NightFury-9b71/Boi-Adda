#!/usr/bin/env python3
"""
Download actual book cover images for the library
"""
import requests
import os
import time

# Create the covers directory path
covers_dir = "/home/nomanstine/Desktop/basic_version/frontend/public/book-covers"
os.makedirs(covers_dir, exist_ok=True)

# Real book cover URLs from Open Library and other sources
book_covers = [
    {
        "filename": "to-kill-mockingbird.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
        "title": "To Kill a Mockingbird"
    },
    {
        "filename": "padma-nadir-majhi.jpg", 
        "url": "https://covers.openlibrary.org/b/isbn/9789849321101-L.jpg",
        "title": "পদ্মা নদীর মাঝি"
    },
    {
        "filename": "1984.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg", 
        "title": "1984"
    },
    {
        "filename": "gitanjali.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9788171675166-L.jpg",
        "title": "গীতাঞ্জলি"
    },
    {
        "filename": "great-gatsby.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
        "title": "The Great Gatsby"
    },
    {
        "filename": "himu-somogro.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9789847015345-L.jpg",
        "title": "হিমু সমগ্র"
    },
    {
        "filename": "pride-prejudice.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
        "title": "Pride and Prejudice"
    },
    {
        "filename": "lalsalu.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9789847017832-L.jpg",
        "title": "লালসালু"
    },
    {
        "filename": "alchemist.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
        "title": "The Alchemist"
    },
    {
        "filename": "oshomapto-attojiboni.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9789849018469-L.jpg",
        "title": "অসমাপ্ত আত্মজীবনী"
    },
    {
        "filename": "harry-potter-philosophers-stone.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg",
        "title": "Harry Potter and the Philosopher's Stone"
    },
    {
        "filename": "devdas.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9789847018402-L.jpg",
        "title": "দেবদাস"
    },
    {
        "filename": "catcher-in-rye.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg",
        "title": "The Catcher in the Rye"
    },
    {
        "filename": "chilekothar-shepai.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9789847015987-L.jpg",
        "title": "চিলেকোঠার সেপাই"
    },
    {
        "filename": "hundred-years-solitude.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780060883287-L.jpg",
        "title": "One Hundred Years of Solitude"
    },
    {
        "filename": "misir-ali-somogro.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9789847015024-L.jpg",
        "title": "মিসির আলি সমগ্র"
    },
    {
        "filename": "lord-of-flies.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780571056866-L.jpg",
        "title": "Lord of the Flies"
    },
    {
        "filename": "kaktaruya.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9789847016434-L.jpg",
        "title": "কাকতাড়ুয়া"
    },
    {
        "filename": "brave-new-world.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg",
        "title": "Brave New World"
    },
    {
        "filename": "ruposhi-bangla.jpg",
        "url": "https://covers.openlibrary.org/b/isbn/9789847014587-L.jpg",
        "title": "রূপসী বাংলা"
    }
]

# Download each book cover
for i, book in enumerate(book_covers, 1):
    try:
        print(f"Downloading {book['title']} ({i}/{len(book_covers)})...")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(book['url'], headers=headers, timeout=10)
        if response.status_code == 200:
            filepath = os.path.join(covers_dir, book['filename'])
            with open(filepath, "wb") as f:
                f.write(response.content)
            print(f"✓ Downloaded {book['filename']}")
        else:
            print(f"✗ Failed to download {book['filename']} (Status: {response.status_code})")
            
    except Exception as e:
        print(f"✗ Error downloading {book['filename']}: {e}")
    
    # Add a small delay to be respectful to the server
    time.sleep(0.5)

print(f"\nFinished downloading {len(book_covers)} book covers!")
print(f"Covers saved to: {covers_dir}")
