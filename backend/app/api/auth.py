from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.core.config import settings
from app.core.db import get_session
from app.models.users import User

router = APIRouter(prefix="/auth", tags=["auth"])

def create_verification_token(email: str):
    """Generates a secure JWT for email verification."""
    # Expiration is controlled via settings to allow for the 24h-48h window
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": email}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.get("/verify/{token}")
async def verify_email(token: str, session: Session = Depends(get_session)):
    """Validates the token and flips the is_verified flag."""
    try:
        # Extract email directly from the JWT sub claim
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token structure")
    except JWTError:
        raise HTTPException(status_code=400, detail="Verification link has expired or is invalid")

    # Fetch artist by email
    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=404, detail="Artist record not found")
    
    # If already verified, return the referral_code immediately for the dashboard
    if user.is_verified:
        return {
            "status": "success",
            "message": "Email already verified",
            "referral_code": user.referral_code
        }

    # Update verification status
    try:
        user.is_verified = True
        session.add(user)
        session.commit()
        session.refresh(user) 
    except Exception as e:
        session.rollback()
        # Log error for Render monitoring
        print(f"CRITICAL: DB Verification Failure for {email} -> {e}")
        raise HTTPException(status_code=500, detail="Internal server error during verification")
    
    return {
        "status": "success", 
        "message": "Email verified successfully!",
        "referral_code": user.referral_code
    }