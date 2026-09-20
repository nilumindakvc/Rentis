import cloudinary.uploader
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

import app.cloudinary_client  # noqa: F401  (configures the cloudinary SDK on import)
from app.deps import get_current_owner
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/image")
def upload_image(file: UploadFile = File(...), owner: User = Depends(get_current_owner)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image")

    result = cloudinary.uploader.upload(file.file, folder="rentis/properties")
    return {"url": result["secure_url"]}
