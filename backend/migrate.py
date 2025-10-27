#!/usr/bin/env python3
"""
Migration script to add missing columns to the database.
Run this script to update the database schema.
"""

from db import engine
from sqlalchemy import text

def add_missing_columns():
    """Add missing columns to bookrequest table."""
    with engine.connect() as conn:
        # Check and add completed_at
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'bookrequest' AND column_name = 'completed_at'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE bookrequest ADD COLUMN completed_at TIMESTAMP NULL
            """))
            print("Added completed_at column to bookrequest table.")
        else:
            print("completed_at column already exists.")

        # Check and add updated_at
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'bookrequest' AND column_name = 'updated_at'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE bookrequest ADD COLUMN updated_at TIMESTAMP NULL
            """))
            print("Added updated_at column to bookrequest table.")
        else:
            print("updated_at column already exists.")

        conn.commit()

if __name__ == "__main__":
    add_missing_columns()