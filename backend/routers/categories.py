from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models import Category, User
from schemas import CategoryCreate, CategoryOut
from database import get_session
from auth import get_current_user, require_admin, require_librarian_or_admin

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=list[CategoryOut])
def getCategories(session: Session = Depends(get_session)):
    """Get all categories (public access)"""
    statement = select(Category)
    categories = session.exec(statement).all()
    return categories

@router.get("/{id}", response_model=CategoryOut)
def getCategory(id: int, session: Session = Depends(get_session)):
    """Get category by ID (public access)"""
    category = session.get(Category, id)
    if not category:
        raise HTTPException(404, "Category not found")
    return category

@router.post("/", response_model=CategoryOut)
def addCategory(category: CategoryCreate, session: Session = Depends(get_session), current_user: User = Depends(require_librarian_or_admin)):
    """Create a new category (librarian or admin only)"""
    db_category = Category(**category.model_dump())
    session.add(db_category)
    session.commit()
    session.refresh(db_category)
    return db_category

@router.put("/{id}", response_model=CategoryOut)
def updateCategory(id: int, category_update: CategoryCreate, session: Session = Depends(get_session), current_user: User = Depends(require_librarian_or_admin)):
    """Update category (librarian or admin only)"""
    category = session.get(Category, id)
    if not category:
        raise HTTPException(404, "Category not found")
    
    # Update category fields
    category_data = category_update.model_dump(exclude_unset=True)
    for field, value in category_data.items():
        setattr(category, field, value)
    
    session.add(category)
    session.commit()
    session.refresh(category)
    return category

@router.delete("/{id}")
def deleteCategory(id: int, session: Session = Depends(get_session), current_user: User = Depends(require_admin)):
    """Delete category (admin only)"""
    category = session.get(Category, id)
    if not category:
        raise HTTPException(404, "Category not found")
    
    # Check if category has books
    if category.books:
        raise HTTPException(400, f"Cannot delete category with {len(category.books)} associated books")
    
    session.delete(category)
    session.commit()
    
    return {
        "message": "Category deleted successfully",
        "deleted_category_id": id,
        "deleted_by": current_user.name
    }
