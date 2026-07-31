from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from .database import get_db, DBUser
from auth.auth import User

# Hardcoded limits for MVP
PLAN_LIMITS = {
    "free": 50,
    "pro": 1000,
    "enterprise": -1 # Unlimited
}

def check_quota(user: User, db: Session = Depends(get_db)):
    """
    Checks if the authenticated user has enough quota remaining for the request.
    Raises HTTPException if quota is exceeded.
    """
    db_user = db.query(DBUser).filter(DBUser.id == user.id).first()
    
    # If user doesn't exist in DB yet, create them (mock behavior)
    if not db_user:
        db_user = DBUser(id=user.id, email=user.email, name=user.name, plan=user.plan, daily_quota_used=0)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    limit = PLAN_LIMITS.get(db_user.plan, 0)
    
    if limit != -1 and db_user.daily_quota_used >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily quota exceeded for {db_user.plan} plan."
        )
    
    return db_user

def increment_quota(user_id: str, db: Session):
    db_user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if db_user:
        db_user.daily_quota_used += 1
        db.commit()
