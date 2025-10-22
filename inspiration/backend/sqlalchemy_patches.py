"""
SQLAlchemy patches for timezone-aware datetime handling
"""
import sqlalchemy.sql.sqltypes as sqltypes
from datetime import datetime, timezone

def patch_datetime_parsing():
    """Patch SQLAlchemy's DateTime type to handle timezone-aware strings"""
    
    # Store the original method
    _original_result_processor = sqltypes.DateTime.result_processor

    def patched_result_processor(self, dialect, coltype):
        """Custom result processor that handles timezone-aware datetime strings"""
        def process(value):
            if value is None:
                return value
            if isinstance(value, str):
                try:
                    # Try parsing ISO format with timezone
                    if '+' in value or value.endswith('Z'):
                        return datetime.fromisoformat(value.replace('Z', '+00:00'))
                    else:
                        # Parse as naive and assume UTC
                        dt = datetime.fromisoformat(value)
                        return dt.replace(tzinfo=timezone.utc)
                except ValueError:
                    # Fallback to strptime parsing
                    try:
                        dt = datetime.strptime(value, '%Y-%m-%d %H:%M:%S.%f')
                        return dt.replace(tzinfo=timezone.utc)
                    except ValueError:
                        try:
                            dt = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                            return dt.replace(tzinfo=timezone.utc)
                        except ValueError:
                            # Last resort - return the original value
                            print(f"Warning: Could not parse datetime '{value}', returning as-is")
                            return value
            elif isinstance(value, datetime) and value.tzinfo is None:
                # Ensure naive datetimes get UTC timezone
                return value.replace(tzinfo=timezone.utc)
            return value
        return process

    # Apply the patch
    sqltypes.DateTime.result_processor = patched_result_processor
    print("✅ SQLAlchemy datetime parsing patch applied")

def patch_sqlite_datetime():
    """Alternative patch for SQLite-specific datetime handling"""
    from sqlalchemy.dialects.sqlite.pysqlite import SQLiteDialect_pysqlite
    
    # Store original method
    _original_connect = SQLiteDialect_pysqlite.connect
    
    def patched_connect(self, *args, **kwargs):
        conn = _original_connect(self, *args, **kwargs)
        # Register custom datetime converter
        import sqlite3
        
        def adapt_datetime(dt):
            """Convert datetime to ISO format string"""
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        
        def convert_datetime(s):
            """Convert ISO format string to datetime"""
            s = s.decode('utf-8') if isinstance(s, bytes) else s
            try:
                if '+' in s or s.endswith('Z'):
                    return datetime.fromisoformat(s.replace('Z', '+00:00'))
                else:
                    dt = datetime.fromisoformat(s)
                    return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                try:
                    dt = datetime.strptime(s, '%Y-%m-%d %H:%M:%S.%f')
                    return dt.replace(tzinfo=timezone.utc)
                except ValueError:
                    dt = datetime.strptime(s, '%Y-%m-%d %H:%M:%S')
                    return dt.replace(tzinfo=timezone.utc)
        
        # Register converters
        sqlite3.register_adapter(datetime, adapt_datetime)
        sqlite3.register_converter("datetime", convert_datetime)
        sqlite3.register_converter("DATETIME", convert_datetime)
        
        return conn
    
    SQLiteDialect_pysqlite.connect = patched_connect
    print("✅ SQLite datetime converter patch applied")

def apply_all_patches():
    """Apply all datetime-related patches"""
    patch_datetime_parsing()
    patch_sqlite_datetime()