from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken
from app.security import create_refresh_token


def create(db: Session, user_id: int) -> tuple[str, RefreshToken]:
    token, jti, expires_at = create_refresh_token(user_id)
    record = RefreshToken(user_id=user_id, jti=jti, expires_at=expires_at)
    db.add(record)
    db.commit()
    db.refresh(record)
    return token, record


def get_active(db: Session, jti: str) -> RefreshToken | None:
    record = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if record is None or record.revoked:
        return None
    if record.expires_at < datetime.now(timezone.utc):
        return None
    return record


def revoke(db: Session, jti: str) -> None:
    record = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if record is not None:
        record.revoked = True
        db.commit()
