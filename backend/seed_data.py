from .models import User, Category, Book, BookCopy, Borrow, Donation
from .enums import CopyStatus, BorrowStatus, DonationStatus, UserRole
import random

def get_random_cover():
    """Generate a random book cover URL"""
    cover_num = random.randint(1, 15)
    return f"/book-covers/cover-{cover_num}.jpg"

# Bangla seed data
SEED_USERS = [
    {
        "name": "রহিম উদ্দিন",
        "email": "rahim@example.com",
        "password": "123456",
        "role": UserRole.admin
    },
    {
        "name": "ফাতেমা খাতুন",
        "email": "fatema@example.com", 
        "password": "123456",
        "role": UserRole.librarian
    },
    {
        "name": "করিম আহমেদ",
        "email": "karim@example.com",
        "password": "123456",
        "role": UserRole.member
    },
    {
        "name": "সালমা বেগম",
        "email": "salma@example.com",
        "password": "123456",
        "role": UserRole.member
    },
    {
        "name": "নাসির হোসেন",
        "email": "nasir@example.com",
        "password": "123456",
        "role": UserRole.member
    }
]

SEED_CATEGORIES = [
    {
        "name": "উপন্যাস",
        "description": "বাংলা এবং বিদেশী উপন্যাস সংগ্রহ"
    },
    {
        "name": "কবিতা",
        "description": "আধুনিক ও ক্লাসিক কবিতার বই"
    },
    {
        "name": "বিজ্ঞান",
        "description": "বিজ্ঞান ও প্রযুক্তি বিষয়ক বই"
    },
    {
        "name": "ইতিহাস",
        "description": "বাংলাদেশ ও বিশ্ব ইতিহাস"
    },
    {
        "name": "শিশু সাহিত্য",
        "description": "শিশুদের জন্য গল্প ও শিক্ষামূলক বই"
    },
    {
        "name": "ধর্মীয়",
        "description": "ইসলামিক ও অন্যান্য ধর্মীয় বই"
    }
]

SEED_BOOKS = [
    {
        "title": "পদ্মা নদীর মাঝি",
        "author": "মানিক বন্দ্যোপাধ্যায়",
        "cover": "/book-covers/cover-1.jpg",
        "published_year": 1936,
        "pages": 250
    },
    {
        "title": "আরণ্যক",
        "author": "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
        "cover": "/book-covers/cover-2.jpg",
        "published_year": 1939,
        "pages": 180
    },
    {
        "title": "গীতাঞ্জলি",
        "author": "রবীন্দ্রনাথ ঠাকুর",
        "cover": "/book-covers/cover-3.jpg",
        "published_year": 1910,
        "pages": 120
    },
    {
        "title": "সূর্যদীঘল বাড়ি",
        "author": "আবু ইসহাক",
        "cover": "/book-covers/cover-4.jpg",
        "published_year": 1955,
        "pages": 200
    },
    {
        "title": "মুক্তিযুদ্ধের ইতিহাস",
        "author": "ড. মুনতাসীর মামুন",
        "cover": "/book-covers/cover-5.jpg",
        "published_year": 1985,
        "pages": 350
    },
    {
        "title": "ঠাকুরমার ঝুলি",
        "author": "দক্ষিণারঞ্জন মিত্র মজুমদার",
        "cover": "/book-covers/cover-6.jpg",
        "published_year": 1907,
        "pages": 150
    },
    {
        "title": "বিজ্ঞানের জয়যাত্রা",
        "author": "ড. আব্দুল্লাহ আল মুতী",
        "cover": "/book-covers/cover-7.jpg",
        "published_year": 1992,
        "pages": 280
    },
    {
        "title": "লালসালু",
        "author": "সৈয়দ ওয়ালীউল্লাহ",
        "cover": "/book-covers/cover-8.jpg",
        "published_year": 1948,
        "pages": 160
    },
    {
        "title": "কুরআন মজিদ",
        "author": "আল্লাহ তায়ালা",
        "cover": "/book-covers/cover-9.jpg",
        "published_year": 610,
        "pages": 604
    },
    {
        "title": "আমার দেখা নয়াচীন",
        "author": "শেখ মুজিবুর রহমান",
        "cover": "/book-covers/cover-10.jpg",
        "published_year": 2020,
        "pages": 170
    }
]

# Additional books for variety
SEED_BOOKS_2 = [
    {
        "title": "কাকতাড়ুয়া",
        "author": "সেলিনা হোসেন",
        "cover": "/book-covers/cover-11.jpg",
        "published_year": 1992,
        "pages": 220
    },
    {
        "title": "হাজার বছর ধরে",
        "author": "জহির রায়হান",
        "cover": "/book-covers/cover-12.jpg",
        "published_year": 1964,
        "pages": 190
    },
    {
        "title": "মধ্যাহ্ন",
        "author": "মানিক বন্দ্যোপাধ্যায়",
        "cover": "/book-covers/cover-13.jpg",
        "published_year": 1945,
        "pages": 170
    },
    {
        "title": "রূপসী বাংলা",
        "author": "জীবনানন্দ দাশ",
        "cover": "/book-covers/cover-14.jpg",
        "published_year": 1957,
        "pages": 140
    },
    {
        "title": "চিলেকোঠার সেপাই",
        "author": "আখতারুজ্জামান ইলিয়াস",
        "cover": "/book-covers/cover-15.jpg",
        "published_year": 1986,
        "pages": 280
    }
]
