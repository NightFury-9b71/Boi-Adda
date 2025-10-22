"""
Mock data samples for seeding the database
"""

# Admin data
ADMINS_DATA = [
    {"name": "John Admin", "email": "admin@library.com"},
    {"name": "Sarah Manager", "email": "sarah@library.com"},
]

# Member data
MEMBERS_DATA = [
    {"name": "Alice Reader", "email": "alice@example.com"},
    {"name": "Bob Student", "email": "bob@example.com"},
    {"name": "Charlie Bookworm", "email": "charlie@example.com"},
    {"name": "Diana Scholar", "email": "diana@example.com"},
    {"name": "Eve Learner", "email": "eve@example.com"},
]

# Book data
BOOKS_DATA = [
    {
        "title": "Python Programming",
        "author": "Guido van Rossum",
        "published_year": 2020,
        "pages": 500
    },
    {
        "title": "JavaScript: The Good Parts",
        "author": "Douglas Crockford",
        "published_year": 2008,
        "pages": 176
    },
    {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "published_year": 2008,
        "pages": 464
    },
    {
        "title": "Design Patterns",
        "author": "Gang of Four",
        "published_year": 1994,
        "pages": 395
    },
    {
        "title": "The Pragmatic Programmer",
        "author": "Andrew Hunt",
        "published_year": 1999,
        "pages": 352
    },
    {
        "title": "Introduction to Algorithms",
        "author": "Thomas H. Cormen",
        "published_year": 2009,
        "pages": 1312
    },
    {
        "title": "Machine Learning Basics",
        "author": "Andrew Ng",
        "published_year": 2022,
        "pages": 350
    },
    {
        "title": "Database Systems",
        "author": "Ramez Elmasri",
        "published_year": 2015,
        "pages": 1200
    },
]

# Book copy counts (how many copies per book)
# 3 copies for first 4 books, 2 copies for next 2, 1 copy for last 2
BOOK_COPY_COUNTS = [3, 3, 3, 3, 2, 2, 1, 1]

# Donation request data
DONATION_DATA = {
    "donation_title": "Web Development Fundamentals",
    "donation_author": "Jennifer Robbins",
    "donation_year": 2021,
    "donation_pages": 800
}
