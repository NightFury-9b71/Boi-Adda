from db import get_session
from models import Category
from sqlmodel import select, Session, SQLModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, Query
from auth import require_admin
from typing import Optional

router = APIRouter()


# Request/Response Models
class CategoryCreate(SQLModel):
    name: str
    description: Optional[str] = None


class CategoryUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(SQLModel):
    id: int
    name: str
    description: Optional[str] = None


# GET /categories - List all categories
@router.get("/", response_model=list[CategoryResponse])
def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    session: Session = Depends(get_session)
):
    """
    Get all categories.
    Public endpoint - no authentication required.
    """
    statement = select(Category).offset(skip).limit(limit)
    categories = session.exec(statement).all()
    
    return [
        CategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description
        )
        for category in categories
    ]


# GET /categories/{id} - Get category details
@router.get("/{category_id}", response_model=CategoryResponse)
def get_category_details(
    category_id: int,
    session: Session = Depends(get_session)
):
    """
    Get detailed information about a specific category.
    Public endpoint - no authentication required.
    """
    category = session.get(Category, category_id)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ক্যাটেগরি খুঁজে পাওয়া যায়নি।"
        )
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        description=category.description
    )


# POST /categories - Create a new category (Admin only)
@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_data: CategoryCreate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Create a new category.
    Admin only endpoint.
    """
    # Check if category already exists
    existing_category = session.exec(
        select(Category).where(Category.name == category_data.name)
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="এই নামের ক্যাটেগরি ইতিমধ্যে বিদ্যমান।"
        )
    
    # Create new category
    category = Category(
        name=category_data.name,
        description=category_data.description
    )
    
    session.add(category)
    session.commit()
    session.refresh(category)
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        description=category.description
    )


# PUT /categories/{id} - Update category (Admin only)
@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Update category details.
    Admin only endpoint.
    """
    category = session.get(Category, category_id)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ক্যাটেগরি খুঁজে পাওয়া যায়নি।"
        )
    
    # Update only provided fields
    if category_data.name is not None:
        # Check if new name conflicts with existing category
        existing_category = session.exec(
            select(Category).where(
                Category.name == category_data.name,
                Category.id != category_id
            )
        ).first()
        
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="এই নামের ক্যাটেগরি ইতিমধ্যে বিদ্যমান।"
            )
        
        category.name = category_data.name
    
    if category_data.description is not None:
        category.description = category_data.description
    
    session.add(category)
    session.commit()
    session.refresh(category)
    
    return CategoryResponse(
        id=category.id,
        name=category.name,
        description=category.description
    )


# DELETE /categories/{id} - Delete a category (Admin only)
@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(
    category_id: int,
    current_user: dict = Depends(require_admin),
    session: Session = Depends(get_session)
):
    """
    Delete a category.
    Admin only endpoint.
    """
    category = session.get(Category, category_id)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ক্যাটেগরি খুঁজে পাওয়া যায়নি।"
        )
    
    # Delete the category
    session.delete(category)
    session.commit()
    
    return {
        "message": "ক্যাটেগরি সফলভাবে মুছে ফেলা হয়েছে!",
        "category_id": category_id,
        "category_name": category.name
    }
