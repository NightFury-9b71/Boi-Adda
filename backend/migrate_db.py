#!/usr/bin/env python3

import sqlite3
import os

def migrate_database():
    """Add new profile fields to existing user table"""
    db_path = 'boi_adda.db'
    
    if not os.path.exists(db_path):
        print("Database file not found!")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check current table structure
        cursor.execute('PRAGMA table_info(user)')
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Current columns: {columns}")
        
        # Add new columns if they don't exist
        new_columns = ['bio', 'date_of_birth', 'profile_image', 'cover_image']
        
        for column in new_columns:
            if column not in columns:
                try:
                    cursor.execute(f'ALTER TABLE user ADD COLUMN {column} TEXT')
                    print(f'✓ Added column: {column}')
                except sqlite3.OperationalError as e:
                    print(f'✗ Error adding column {column}: {e}')
            else:
                print(f'✓ Column {column} already exists')
        
        conn.commit()
        
        # Verify the changes
        cursor.execute('PRAGMA table_info(user)')
        updated_columns = [column[1] for column in cursor.fetchall()]
        print(f"Updated columns: {updated_columns}")
        
        conn.close()
        print("Database migration completed successfully!")
        
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate_database()
