"""One-time bootstrap for the single super admin account.

Run from backend/ with the venv active:
    python -m scripts.create_super_admin --name "..." --email "..." --password "..."

Refuses if a super admin already exists — there can only ever be one,
enforced at the database level (see migration 0004).
"""
import argparse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal  # noqa: E402
from app.models.admin import Admin  # noqa: E402
from app.models.enums import AdminRole  # noqa: E402
from app.security import hash_password  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        existing = db.query(Admin).filter(Admin.role == AdminRole.super_admin).first()
        if existing is not None:
            print(f"A super admin already exists ({existing.email}). Nothing to do.")
            return

        if db.query(Admin).filter(Admin.email == args.email).first() is not None:
            print(f"An admin with email {args.email} already exists.")
            return

        admin = Admin(
            name=args.name,
            email=args.email,
            password=hash_password(args.password),
            role=AdminRole.super_admin,
        )
        db.add(admin)
        db.commit()
        print(f"Super admin created: {args.email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
