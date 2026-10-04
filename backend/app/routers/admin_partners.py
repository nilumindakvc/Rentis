import cloudinary.uploader
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

import app.cloudinary_client  # noqa: F401  (configures the cloudinary SDK on import)
from app.admin_deps import get_current_super_admin
from app.crud import partners as partners_crud
from app.database import get_db
from app.models.admin import Admin
from app.schemas.partner import PartnerCreate, PartnerOut

router = APIRouter(prefix="/admin/partners", tags=["admin-partners"])


@router.get("", response_model=list[PartnerOut])
def list_partners(db: Session = Depends(get_db), _: Admin = Depends(get_current_super_admin)):
    return partners_crud.list_all(db)


@router.post("", response_model=PartnerOut, status_code=status.HTTP_201_CREATED)
def create_partner(
    payload: PartnerCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    return partners_crud.create(db, payload)


@router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_super_admin),
):
    partner = partners_crud.get(db, partner_id)
    if partner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    partners_crud.delete(db, partner)


@router.post("/logo")
def upload_partner_logo(
    file: UploadFile = File(...),
    _: Admin = Depends(get_current_super_admin),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image")

    result = cloudinary.uploader.upload(file.file, folder="rentis/partners")
    return {"url": result["secure_url"]}
