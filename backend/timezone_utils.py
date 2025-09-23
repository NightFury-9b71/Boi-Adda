"""
Timezone utilities for consistent datetime handling across local and production environments.
All datetime operations should use UTC timezone to ensure consistency.
Bangladesh Standard Time (BST) is UTC+6.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
import os

# Get timezone from environment variable or default to UTC
DEFAULT_TIMEZONE = os.getenv('TIMEZONE', 'UTC')

# Bangladesh Standard Time is UTC+6
BANGLADESH_TZ = timezone(timedelta(hours=6))

def utc_now() -> datetime:
    """
    Get current UTC datetime.
    Use this instead of datetime.now() or datetime.utcnow() for consistency.
    """
    return datetime.now(timezone.utc)

def bangladesh_now() -> datetime:
    """
    Get current Bangladesh time (UTC+6).
    """
    return datetime.now(BANGLADESH_TZ)

def get_current_time() -> datetime:
    """
    Get current UTC datetime for database operations.
    This replaces the get_current_time function in models.py
    Always store in UTC for consistency.
    """
    return utc_now()

def local_to_utc(dt: datetime, local_tz: Optional[timezone] = None) -> datetime:
    """
    Convert local datetime to UTC.
    If dt is naive (no timezone), assume it's in local_tz.
    """
    if dt.tzinfo is None:
        if local_tz is None:
            # Assume it's already in UTC if no timezone specified
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.replace(tzinfo=local_tz)
    
    return dt.astimezone(timezone.utc)

def utc_to_bangladesh(dt: datetime) -> datetime:
    """
    Convert UTC datetime to Bangladesh time (UTC+6).
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    return dt.astimezone(BANGLADESH_TZ)

def utc_to_local(dt: datetime, target_tz: timezone) -> datetime:
    """
    Convert UTC datetime to target timezone.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    return dt.astimezone(target_tz)

def format_datetime_for_bangladesh(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S BST") -> str:
    """
    Format datetime for display in Bangladesh time.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    bangladesh_dt = dt.astimezone(BANGLADESH_TZ)
    return bangladesh_dt.strftime(format_str)

def format_datetime_for_display(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S UTC") -> str:
    """
    Format datetime for display, ensuring it's in UTC.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    utc_dt = dt.astimezone(timezone.utc)
    return utc_dt.strftime(format_str)

def add_timezone_to_naive_datetime(dt: datetime, tz: timezone = timezone.utc) -> datetime:
    """
    Add timezone info to naive datetime.
    Default to UTC if no timezone specified.
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=tz)
    return dt

def is_datetime_expired(dt: datetime, expiry_minutes: int = 30) -> bool:
    """
    Check if a datetime has expired based on expiry_minutes from now.
    Handles timezone-aware comparison.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    
    current_time = utc_now()
    expiry_time = dt + timedelta(minutes=expiry_minutes)
    
    return current_time > expiry_time

def create_expiry_datetime(minutes_from_now: int = 30) -> datetime:
    """
    Create an expiry datetime that's 'minutes_from_now' minutes from current UTC time.
    Use this for token expiration, etc.
    """
    return utc_now() + timedelta(minutes=minutes_from_now)

# Bangladesh-specific helper functions
def bangladesh_to_utc(bangladesh_dt: datetime) -> datetime:
    """
    Convert Bangladesh time to UTC.
    """
    if bangladesh_dt.tzinfo is None:
        bangladesh_dt = bangladesh_dt.replace(tzinfo=BANGLADESH_TZ)
    
    return bangladesh_dt.astimezone(timezone.utc)

def get_bangladesh_offset() -> str:
    """
    Get Bangladesh timezone offset string (+06:00).
    """
    return "+06:00"

def get_timezone_info() -> dict:
    """
    Get comprehensive timezone information.
    """
    utc_time = utc_now()
    bangladesh_time = utc_to_bangladesh(utc_time)
    
    return {
        "utc_time": utc_time,
        "bangladesh_time": bangladesh_time,
        "offset": get_bangladesh_offset(),
        "timezone_name": "Bangladesh Standard Time (BST)",
        "utc_formatted": format_datetime_for_display(utc_time),
        "bangladesh_formatted": format_datetime_for_bangladesh(utc_time)
    }

# Backward compatibility functions
def get_utc_now():
    """Alias for utc_now() for backward compatibility"""
    return utc_now()

def get_current_utc_time():
    """Alias for utc_now() for backward compatibility"""
    return utc_now()