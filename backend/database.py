from sqlmodel import create_engine, Session, SQLModel
import os

# Use environment variable for database URL, fallback to local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///boi_adda.db")

# Handle PostgreSQL URL format for Render (if using PostgreSQL)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, echo=False)  # Disable echo in production

def create_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
