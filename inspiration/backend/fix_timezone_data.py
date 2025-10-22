#!/usr/bin/env python3
"""
Script to fix timezone issues in existing database records.
This script converts existing naive datetime stamps to UTC-aware timestamps.
"""

import sqlite3
from datetime import datetime, timezone, timedelta
import sys

def fix_timezone_data():
    """
    Fix timezone data in the existing database.
    Existing naive timestamps were stored as Bangladesh time (UTC+6).
    Convert them to UTC by subtracting 6 hours.
    """
    try:
        # Connect to the database
        conn = sqlite3.connect('boi_adda.db')
        cursor = conn.cursor()
        
        print("🔧 Starting timezone data fix...")
        print("📝 Converting Bangladesh time (UTC+6) to UTC...")
        
        # Tables with datetime columns that need fixing
        tables_with_datetime = [
            ('user', ['created_at', 'updated_at']),
            ('category', ['created_at', 'updated_at']),
            ('book', ['created_at', 'updated_at']),
            ('bookcopy', ['created_at', 'updated_at', 'due_date', 'return_date']),
            ('borrow', ['created_at', 'updated_at', 'approved_at', 'handed_over_at', 'returned_at']),
            ('donation', ['created_at', 'updated_at', 'approved_at', 'completed_at']),
            ('adminconfig', ['created_at', 'updated_at'])
        ]
        
        total_fixed = 0
        
        for table_name, datetime_columns in tables_with_datetime:
            try:
                # Check if table exists
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
                if not cursor.fetchone():
                    print(f"⚠️  Table '{table_name}' not found, skipping...")
                    continue
                
                print(f"🔄 Processing table: {table_name}")
                
                for column in datetime_columns:
                    # Check if column exists
                    cursor.execute(f"PRAGMA table_info({table_name})")
                    columns = [row[1] for row in cursor.fetchall()]
                    
                    if column not in columns:
                        print(f"   ⚠️  Column '{column}' not found in {table_name}, skipping...")
                        continue
                    
                    # Get records with non-null datetime values that don't have timezone info
                    cursor.execute(f"""
                        SELECT id, {column} 
                        FROM {table_name} 
                        WHERE {column} IS NOT NULL 
                        AND {column} NOT LIKE '%+%' 
                        AND {column} NOT LIKE '%Z'
                    """)
                    
                    records = cursor.fetchall()
                    
                    if records:
                        print(f"   📝 Converting {len(records)} records in {table_name}.{column}")
                        
                        for record_id, naive_datetime_str in records:
                            try:
                                # Parse the naive datetime (stored as Bangladesh time)
                                bangladesh_dt = datetime.fromisoformat(naive_datetime_str)
                                
                                # Convert from Bangladesh time to UTC by subtracting 6 hours
                                utc_dt = bangladesh_dt.replace(tzinfo=timezone.utc) - timedelta(hours=6)
                                utc_iso = utc_dt.isoformat()
                                
                                # Update the record
                                cursor.execute(f"""
                                    UPDATE {table_name} 
                                    SET {column} = ? 
                                    WHERE id = ?
                                """, (utc_iso, record_id))
                                
                                total_fixed += 1
                                
                            except Exception as e:
                                print(f"   ❌ Error fixing record {record_id} in {table_name}.{column}: {e}")
                    else:
                        print(f"   ✅ No records to fix in {table_name}.{column}")
            
            except Exception as e:
                print(f"❌ Error processing table {table_name}: {e}")
        
        # Commit all changes
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"\n🎉 Timezone fix completed!")
        print(f"📊 Total records converted: {total_fixed}")
        print(f"✅ All timestamps now represent UTC time with timezone information")
        
        return True
        
    except Exception as e:
        print(f"❌ Critical error during timezone fix: {e}")
        return False

def verify_fix():
    """
    Verify that the timezone fix worked correctly.
    """
    try:
        conn = sqlite3.connect('boi_adda.db')
        cursor = conn.cursor()
        
        print("\n🔍 Verifying timezone fix...")
        
        # Check a sample of records from different tables
        test_queries = [
            ("user", "created_at"),
            ("borrow", "created_at"),
            ("donation", "updated_at")
        ]
        
        for table, column in test_queries:
            cursor.execute(f"SELECT {column} FROM {table} LIMIT 1")
            result = cursor.fetchone()
            
            if result and result[0]:
                timestamp = result[0]
                print(f"✅ {table}.{column}: {timestamp}")
                
                # Check if it has timezone info
                if '+' in timestamp or timestamp.endswith('Z'):
                    print(f"   ✅ Has timezone information")
                else:
                    print(f"   ❌ Still missing timezone information")
            else:
                print(f"⚠️  No data found in {table}.{column}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")

if __name__ == "__main__":
    print("🇧🇩 বই আড্ডা - Timezone Data Fix Script")
    print("=" * 50)
    
    if fix_timezone_data():
        verify_fix()
        print("\n🚀 Ready to restart the application with proper timezone support!")
        print("💡 All new records will automatically use UTC timestamps.")
        print("🌍 Frontend will display times in Bangladesh timezone (UTC+6).")
    else:
        print("\n💥 Fix failed. Please check the errors above.")
        sys.exit(1)