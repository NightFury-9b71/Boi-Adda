"""
Custom datetime field for SQLModel that handles timezone-aware datetimes properly.
"""

from datetime import datetime, timezone
from typing import Any, Optional
from sqlmodel import Field
from pydantic import validator

def timezone_aware_datetime_validator(v: Any) -> datetime:
    """
    Custom validator to handle timezone-aware datetime parsing.
    """
    if isinstance(v, str):
        try:
            # Try parsing ISO format with timezone
            if v.endswith('+00:00') or v.endswith('Z') or '+' in v or v.endswith('UTC'):
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            else:
                # Parse naive datetime and assume UTC
                dt = datetime.fromisoformat(v)
                return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            # Fallback for other formats
            try:
                dt = datetime.strptime(v, '%Y-%m-%d %H:%M:%S.%f')
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                dt = datetime.strptime(v, '%Y-%m-%d %H:%M:%S')
                return dt.replace(tzinfo=timezone.utc)
    elif isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v
    return v

class TimezoneAwareDatetime(datetime):
    """Custom datetime class that handles timezone parsing"""
    
    @classmethod
    def __get_validators__(cls):
        yield timezone_aware_datetime_validator
    
    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type='string', format='date-time')

# Helper function to create timezone-aware datetime fields
def timezone_datetime_field(**kwargs) -> datetime:
    """Create a timezone-aware datetime field with proper validation"""
    return Field(**kwargs)