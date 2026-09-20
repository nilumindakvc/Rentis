from sqlalchemy.orm import Session

from app.models.admin import Admin
from app.models.enums import AdminRole
from app.schemas.admin import AdminCreate
from app.security import hash_password, verify_password


def get_by_email(db: Session, email: str) -> Admin | None:
    return db.query(Admin).filter(Admin.email == email).first()


def get(db: Session, admin_id: int) -> Admin | None:
    return db.get(Admin, admin_id)


def create_admin(db: Session, payload: AdminCreate) -> Admin:
    admin = Admin(
        name=payload.name,
        email=payload.email,
        password=hash_password(payload.password),
        role=AdminRole.admin,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def authenticate(db: Session, email: str, password: str) -> Admin | None:
    admin = get_by_email(db, email)
    if admin is None or not verify_password(password, admin.password):
        return None
    return admin


def list_all(db: Session) -> list[Admin]:
    return db.query(Admin).order_by(Admin.created_at).all()


def delete(db: Session, admin: Admin) -> None:
    if admin.role == AdminRole.super_admin:
        raise ValueError("The super admin account cannot be removed")
    db.delete(admin)
    db.commit()
