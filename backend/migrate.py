#!/usr/bin/env python3
"""
Migration script to add missing columns to the database.
Run this script to update the database schema.
"""

from db import engine
from sqlalchemy import text

def add_missing_columns():
    """Add missing columns to bookrequest and user tables."""
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

        # Add new columns to users table
        # Check and add phone
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user' AND column_name = 'phone'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE "user" ADD COLUMN phone VARCHAR(255) NULL
            """))
            print("Added phone column to user table.")
        else:
            print("phone column already exists.")

        # Check and add address
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user' AND column_name = 'address'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE "user" ADD COLUMN address TEXT NULL
            """))
            print("Added address column to user table.")
        else:
            print("address column already exists.")

        # Check and add date_of_birth
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user' AND column_name = 'date_of_birth'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE "user" ADD COLUMN date_of_birth TIMESTAMP NULL
            """))
            print("Added date_of_birth column to user table.")
        else:
            print("date_of_birth column already exists.")

        # Check and add bio
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user' AND column_name = 'bio'
        """))
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE "user" ADD COLUMN bio TEXT NULL
            """))
            print("Added bio column to user table.")
        else:
            print("bio column already exists.")

        conn.commit()

if __name__ == "__main__":
    add_missing_columns()