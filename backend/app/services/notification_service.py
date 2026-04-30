from sqlalchemy.orm import Session
from app.models.notification import Notification


def create(db: Session, user_id: str, type: str, title: str, message: str, ref_id: str = None, ref_type: str = None):
    n = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        ref_id=ref_id,
        ref_type=ref_type,
    )
    db.add(n)
    # Caller is responsible for db.commit()
