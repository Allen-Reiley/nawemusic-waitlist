from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.db import get_session, init_db
from app.models.users import User 
from app.api import auth 
from app.core.config import settings
from app.services.email import send_verification_email

app = FastAPI(title="NaweMusic API")

# CORS configuration
# Note: origins must be URLs (including https://). Emails are not valid origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nawemusic.auraworks.co.za", 
        "http://localhost:3000",
        "https://nawemusic-waitlist-izi23lolp-allen-reileys-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the Auth router so /auth/verify/{token} is active
app.include_router(auth.router)

@app.on_event("startup")
def on_startup():
    """Initializes the database connection on startup."""
    init_db()

@app.get("/")
async def root():
    """
    Health check endpoint for Render. 
    A 200 OK here prevents the 'Build Failed' error.
    """
    return {"status": "online", "service": "NaweMusic Backend"}

@app.post("/join")
async def join_waitlist(
    user_data: User, 
    ref: Optional[str] = None, 
    session: Session = Depends(get_session)
):
    """
    Handles initial waitlist signup, referral attribution, 
    and triggers the verification email with full Terms & Conditions.
    """
    # 1. Prevent duplicate signups
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already on the list.")

    # 2. Handle Referral Logic (Logic-driven attribution)
    if ref:
        ref_statement = select(User).where(User.referral_code == ref)
        referrer = session.exec(ref_statement).first()
        if referrer:
            user_data.referred_by_id = referrer.id

    # 3. Save the new lead
    try:
        session.add(user_data)
        session.commit()
        session.refresh(user_data)
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Database error during signup.")
    
    # 4. Generate Verification Token & Link
    token = auth.create_verification_token(user_data.email)
    
    # settings.FRONTEND_URL must be set in Render env to https://nawemusic.auraworks.co.za
    verification_link = f"{settings.FRONTEND_URL}/invite?token={token}"
    
    # 5. Trigger the Email Service (Now containing the full legal T&Cs)
    try:
        send_verification_email(
            email=user_data.email,
            full_name=user_data.full_name,
            verification_link=verification_link
        )
    except Exception as e:
        # We don't fail the request if email fails, but we log it for debugging
        print(f"RESEND SERVICE ERROR: {e}")
    
    return {
        "status": "success",
        "referral_code": user_data.referral_code,
        "message": "Spot secured! Please check your email to verify your account."
    }

@app.get("/leaderboard")
async def get_leaderboard(session: Session = Depends(get_session)):
    """Placeholder for Phase 4: High-level leaderboard rankings."""
    return {"message": "Leaderboard logic coming in Phase 4"}