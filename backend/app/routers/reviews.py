from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import reviews as reviews_crud
from app.database import get_db
from app.deps import get_current_customer
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut, ReviewUpdate

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/mine", response_model=list[ReviewOut])
def my_reviews(
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    return [
        reviews_crud.serialize(review)
        for review in reviews_crud.list_for_customer(db, customer.id)
    ]


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    try:
        review = reviews_crud.create_for_booking(db, customer.id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return reviews_crud.serialize(review)


@router.put("/{review_id}", response_model=ReviewOut)
def update_review(
    review_id: int,
    payload: ReviewUpdate,
    db: Session = Depends(get_db),
    customer: User = Depends(get_current_customer),
):
    review = reviews_crud.get_for_customer(db, review_id, customer.id)
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Review not found"
        )
    return reviews_crud.serialize(reviews_crud.update(db, review, payload))
