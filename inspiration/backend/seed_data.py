from enums import UserRole
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
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "cover": "/book-covers/to-kill-mockingbird.jpg",
        "published_year": 1960,
        "pages": 281
    },
    {
        "title": "পদ্মা নদীর মাঝি",
        "author": "মানিক বন্দ্যোপাধ্যায়",
        "cover": "/book-covers/cover-1.jpg",
        "published_year": 1936,
        "pages": 250
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "cover": "/book-covers/1984.jpg",
        "published_year": 1949,
        "pages": 328
    },
    {
        "title": "গীতাঞ্জলি",
        "author": "রবীন্দ্রনাথ ঠাকুর",
        "cover": "/book-covers/cover-2.jpg",
        "published_year": 1910,
        "pages": 120
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "cover": "/book-covers/cover-3.jpg",
        "published_year": 1925,
        "pages": 180
    },
    {
        "title": "হিমু সমগ্র",
        "author": "হুমায়ূন আহমেদ",
        "cover": "/book-covers/cover-4.jpg",
        "published_year": 1990,
        "pages": 800
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "cover": "/book-covers/pride-prejudice.jpg",
        "published_year": 1813,
        "pages": 432
    },
    {
        "title": "লালসালু",
        "author": "সৈয়দ ওয়ালীউল্লাহ",
        "cover": "/book-covers/cover-5.jpg",
        "published_year": 1948,
        "pages": 160
    },
    {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "cover": "/book-covers/alchemist.jpg",
        "published_year": 1988,
        "pages": 163
    },
    {
        "title": "অসমাপ্ত আত্মজীবনী",
        "author": "শেখ মুজিবুর রহমান",
        "cover": "/book-covers/cover-6.jpg",
        "published_year": 2012,
        "pages": 368
    }
]

# Additional books for variety
SEED_BOOKS_2 = [
    {
        "title": "Harry Potter and the Philosopher's Stone",
        "author": "J.K. Rowling",
        "cover": "/book-covers/harry-potter-philosophers-stone.jpg",
        "published_year": 1997,
        "pages": 223
    },
    {
        "title": "দেবদাস",
        "author": "শরৎচন্দ্র চট্টোপাধ্যায়",
        "cover": "/book-covers/cover-7.jpg",
        "published_year": 1917,
        "pages": 180
    },
    {
        "title": "The Catcher in the Rye",
        "author": "J.D. Salinger",
        "cover": "/book-covers/catcher-in-rye.jpg",
        "published_year": 1951,
        "pages": 277
    },
    {
        "title": "চিলেকোঠার সেপাই",
        "author": "আখতারুজ্জামান ইলিয়াস",
        "cover": "/book-covers/cover-8.jpg",
        "published_year": 1986,
        "pages": 280
    },
    {
        "title": "One Hundred Years of Solitude",
        "author": "Gabriel García Márquez",
        "cover": "/book-covers/hundred-years-solitude.jpg",
        "published_year": 1967,
        "pages": 417
    },
    {
        "title": "মিসির আলি সমগ্র",
        "author": "হুমায়ূন আহমেদ",
        "cover": "/book-covers/cover-9.jpg",
        "published_year": 1985,
        "pages": 600
    },
    {
        "title": "Lord of the Flies",
        "author": "William Golding",
        "cover": "/book-covers/lord-of-flies.jpg",
        "published_year": 1954,
        "pages": 224
    },
    {
        "title": "কাকতাড়ুয়া",
        "author": "সেলিনা হোসেন",
        "cover": "/book-covers/cover-10.jpg",
        "published_year": 1992,
        "pages": 220
    },
    {
        "title": "Brave New World",
        "author": "Aldous Huxley",
        "cover": "/book-covers/brave-new-world.jpg",
        "published_year": 1932,
        "pages": 268
    },
    {
        "title": "রূপসী বাংলা",
        "author": "জীবনানন্দ দাশ",
        "cover": "/book-covers/cover-11.jpg",
        "published_year": 1957,
        "pages": 140
    }
]
