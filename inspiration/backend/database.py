from sqlmodel import create_engine, Session, SQLModel
import os

# Use environment variable for database URL, fallback to local SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///boi_adda.db")

# Replace postgresql:// with postgresql+psycopg://
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# SQLite-specific connection parameters for thread safety
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        echo=False,
        connect_args={
            "check_same_thread": False,
            "timeout": 20
        },
        pool_pre_ping=True
    )
else:
    engine = create_engine(DATABASE_URL, echo=False)

def create_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
