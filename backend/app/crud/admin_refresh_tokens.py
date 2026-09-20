from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.admin_refresh_token import AdminRefreshToken
from app.security import create_refresh_token


def create(db: Session, admin_id: int) -> tuple[str, AdminRefreshToken]:
    token, jti, expires_at = create_refresh_token(admin_id, scope="admin")
    record = AdminRefreshToken(admin_id=admin_id, jti=jti, expires_at=expires_at)
    db.add(record)
    db.commit()
    db.refresh(record)
    return token, record


def get_active(db: Session, jti: str) -> AdminRefreshToken | None:
    record = db.query(AdminRefreshToken).filter(AdminRefreshToken.jti == jti).first()
    if record is None or record.revoked:
        return None
    if record.expires_at < datetime.now(timezone.utc):
        return None
    return record


def revoke(db: Session, jti: str) -> None:
    record = db.query(AdminRefreshToken).filter(AdminRefreshToken.jti == jti).first()
    if record is not None:
        record.revoked = True
        db.commit()
