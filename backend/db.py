from sqlmodel import SQLModel, Field, create_engine, Session
import os
from dotenv import load_dotenv
import models  # Changed from relative import

# Load environment variables
load_dotenv()

# Get database URL from environment
# For Supabase PostgreSQL, use: postgresql://postgres:[password]@[host]/postgres
database_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Create engine with appropriate settings
if database_url.startswith("postgresql"):
    # PostgreSQL settings
    engine = create_engine(
        database_url,
        echo=False,  # Set to True for SQL query logging
        pool_pre_ping=True,  # Verify connections before using them
        pool_size=5,
        max_overflow=10
    )
else:
    # SQLite settings
    engine = create_engine(
        database_url,
        echo=False,
        connect_args={"check_same_thread": False}  # SQLite specific
    )

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def drop_db_and_tables():
    SQLModel.metadata.drop_all(engine)

def get_session():
    with Session(engine) as session:
        yield session