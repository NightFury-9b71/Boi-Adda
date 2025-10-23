"""
Mock data samples for seeding the database
"""

# Category data
CATEGORIES_DATA = [
    {"name": "Programming", "description": "Programming and software development books"},
    {"name": "Computer Science", "description": "Computer science theory and algorithms"},
    {"name": "Machine Learning", "description": "AI and machine learning books"},
    {"name": "Database", "description": "Database management and systems"},
    {"name": "Web Development", "description": "Web development and design"},
    {"name": "Software Engineering", "description": "Software engineering practices and patterns"},
]

# Admin data
ADMINS_DATA = [
    {"name": "Admin One", "email": "admin1@boiadda.com"},
    {"name": "Admin Two", "email": "admin2@boiadda.com"},
]

# Member data
MEMBERS_DATA = [
    {"name": "Member One", "email": "member1@boiadda.com"},
    {"name": "Member Two", "email": "member2@boiadda.com"},
    {"name": "Member Three", "email": "member3@boiadda.com"},
    {"name": "Member Four", "email": "member4@boiadda.com"},
    {"name": "Member Five", "email": "member5@boiadda.com"},
]

# Book data with category index (matches CATEGORIES_DATA index)
BOOKS_DATA = [
    {
        "title": "Python Programming",
        "author": "Guido van Rossum",
        "published_year": 2020,
        "pages": 500,
        "category_index": 0  # Programming
    },
    {
        "title": "JavaScript: The Good Parts",
        "author": "Douglas Crockford",
        "published_year": 2008,
        "pages": 176,
        "category_index": 0  # Programming
    },
    {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "published_year": 2008,
        "pages": 464,
        "category_index": 5  # Software Engineering
    },
    {
        "title": "Design Patterns",
        "author": "Gang of Four",
        "published_year": 1994,
        "pages": 395,
        "category_index": 5  # Software Engineering
    },
    {
        "title": "The Pragmatic Programmer",
        "author": "Andrew Hunt",
        "published_year": 1999,
        "pages": 352,
        "category_index": 5  # Software Engineering
    },
    {
        "title": "Introduction to Algorithms",
        "author": "Thomas H. Cormen",
        "published_year": 2009,
        "pages": 1312,
        "category_index": 1  # Computer Science
    },
    {
        "title": "Machine Learning Basics",
        "author": "Andrew Ng",
        "published_year": 2022,
        "pages": 350,
        "category_index": 2  # Machine Learning
    },
    {
        "title": "Database Systems",
        "author": "Ramez Elmasri",
        "published_year": 2015,
        "pages": 1200,
        "category_index": 3  # Database
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
