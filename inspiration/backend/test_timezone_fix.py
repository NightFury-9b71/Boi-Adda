#!/usr/bin/env python3
"""
Test script to verify timezone fixes for borrow/donate events
"""
import os
from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from database import get_session
from models import Borrow, Donation, BookCopy, User, Book
from enums import BorrowStatus, DonationStatus, CopyStatus
from timezone_utils import bangladesh_now, utc_now, utc_to_bangladesh

def test_timezone_functions():
    """Test timezone utility functions"""
    print("=== Testing Timezone Functions ===")
    utc_time = utc_now()
    bd_time = bangladesh_now()
    
    print(f"UTC now: {utc_time}")
    print(f"Bangladesh now: {bd_time}")
    print(f"Difference: {(bd_time.hour - utc_time.hour) % 24} hours")
    print(f"BD timezone: {bd_time.tzinfo}")
    print()

def test_model_defaults():
    """Test if models use Bangladesh time by default"""
    print("=== Testing Model Defaults ===")
    
    # Test Borrow model
    test_borrow = Borrow(user_id=1, book_copy_id=1, status=BorrowStatus.pending)
    print(f"New Borrow created_at: {test_borrow.created_at}")
    print(f"Timezone: {test_borrow.created_at.tzinfo}")
    
    # Test Donation model
    test_donation = Donation(user_id=1, book_copy_id=1, status=DonationStatus.pending)
    print(f"New Donation created_at: {test_donation.created_at}")
    print(f"Timezone: {test_donation.created_at.tzinfo}")
    print()

def test_database_operations():
    """Test actual database operations"""
    print("=== Testing Database Operations ===")
    
    session = next(get_session())
    
    try:
        # Get an available book copy
        available_copy = session.exec(
            "SELECT * FROM BookCopy WHERE status = 'available' LIMIT 1"
        ).first()
        
        if not available_copy:
            print("No available book copies found")
            return
        
        # Create and save a borrow
        new_borrow = Borrow(
            user_id=1,
            book_copy_id=available_copy.id,
            status=BorrowStatus.pending
        )
        
        session.add(new_borrow)
        session.commit()
        session.refresh(new_borrow)
        
        print(f"Saved Borrow ID: {new_borrow.id}")
        print(f"Created at: {new_borrow.created_at}")
        print(f"Updated at: {new_borrow.updated_at}")
        
        # Test admin approval with explicit timestamp
        from routers.admin import bangladesh_now as admin_bangladesh_now
        
        new_borrow.status = BorrowStatus.approved
        new_borrow.approved_at = admin_bangladesh_now()
        
        session.add(new_borrow)
        session.commit()
        session.refresh(new_borrow)
        
        print(f"Approved at: {new_borrow.approved_at}")
        print(f"Approved timezone: {new_borrow.approved_at.tzinfo if new_borrow.approved_at else 'None'}")
        
        # Clean up
        session.delete(new_borrow)
        session.commit()
        
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()
    
    print()

def test_json_response():
    """Test how datetime is serialized in JSON response"""
    print("=== Testing JSON Response ===")
    
    from main import TimezoneAwareJSONResponse
    
    # Test data with datetime
    test_data = {
        "id": 1,
        "created_at": bangladesh_now(),
        "updated_at": datetime.now(),  # Naive datetime
        "approved_at": None
    }
    
    response = TimezoneAwareJSONResponse(test_data)
    print("JSON Response content:")
    import json
    print(json.loads(response.body.decode()))
    print()

if __name__ == "__main__":
    print("Testing Timezone Fixes for Borrow/Donate Events")
    print("=" * 50)
    
    test_timezone_functions()
    test_model_defaults()
    test_database_operations()
    test_json_response()
    
    print("All tests completed!")