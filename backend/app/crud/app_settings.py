from sqlalchemy.orm import Session

from app.models.app_setting import AppSetting

BANNER_ENABLED_KEY = "banner_enabled"
BANNER_MESSAGE_KEY = "banner_message"


def _get(db: Session, key: str, default: str) -> str:
    setting = db.get(AppSetting, key)
    return setting.value if setting is not None else default


def _set(db: Session, key: str, value: str) -> None:
    setting = db.get(AppSetting, key)
    if setting is None:
        db.add(AppSetting(key=key, value=value))
    else:
        setting.value = value


def get_banner(db: Session) -> dict:
    return {
        "enabled": _get(db, BANNER_ENABLED_KEY, "false") == "true",
        "message": _get(db, BANNER_MESSAGE_KEY, ""),
    }


def set_banner(db: Session, enabled: bool, message: str) -> dict:
    _set(db, BANNER_ENABLED_KEY, "true" if enabled else "false")
    _set(db, BANNER_MESSAGE_KEY, message)
    db.commit()
    return get_banner(db)
