from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from pydantic import BaseModel  # Added missing import

from app.core.db import get_session, init_db
from app.models.users import User 
from app.api import auth 
from app.core.config import settings
from app.services.email import send_verification_email

app = FastAPI(title="NaweMusic API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nawemusic.auraworks.co.za", 
        "http://localhost:3000" 
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
    """Health check endpoint."""
    return {"status": "online"}

@app.post("/join")
async def join_waitlist(
    user_data: User, 
    ref: Optional[str] = None, # Captures ?ref=xyz from the frontend request
    session: Session = Depends(get_session)
):
    """
    Handles initial waitlist signup, referral attribution, 
    and triggers the verification email.
    """
    # 1. Prevent duplicate signups
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already on the list.")

    # 2. Handle Referral Logic
    if ref:
        ref_statement = select(User).where(User.referral_code == ref)
        referrer = session.exec(ref_statement).first()
        if referrer:
            user_data.referred_by_id = referrer.id

    # 3. Save the new lead
    session.add(user_data)
    session.commit()
    session.refresh(user_data)
    
    # 4. Generate Verification Token & Link
    token = auth.create_verification_token(user_data.email)
    
    # Ensure this points to your /invite page
    verification_link = f"{settings.FRONTEND_URL}/invite?token={token}"
    
    # 5. Trigger the actual Email Service
    try:
        send_verification_email(
            email=user_data.email,
            full_name=user_data.full_name,
            verification_link=verification_link
        )
    except Exception as e:
        # Log the error but don't break the response if email fails in dev
        print(f"Email failed to send: {e}")
    
    return {
        "status": "success",
        "referral_code": user_data.referral_code,
        "message": "Spot secured! Please check your email to verify your account."
    }

@app.get("/leaderboard")
async def get_leaderboard(session: Session = Depends(get_session)):
    """Placeholder for Phase 4 Leaderboard logic."""
    return {"message": "Leaderboard logic coming in Phase 4"}