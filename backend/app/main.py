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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nawemusic.auraworks.co.za", 
        "http://localhost:3000",
        # Added the required protocol prefix here
        "https://nawemusic-waitlist-izi23lolp-allen-reileys-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
async def root():
    return {"status": "online", "service": "NaweMusic Backend"}

@app.post("/join")
async def join_waitlist(
    user_data: User, 
    ref: Optional[str] = None, 
    session: Session = Depends(get_session)
):
    statement = select(User).where(User.email == user_data.email)
    existing_user = session.exec(statement).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already on the list.")

    if ref:
        ref_statement = select(User).where(User.referral_code == ref)
        referrer = session.exec(ref_statement).first()
        if referrer:
            user_data.referred_by_id = referrer.id

    try:
        session.add(user_data)
        session.commit()
        session.refresh(user_data)
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Database error.")
    
    token = auth.create_verification_token(user_data.email)
    verification_link = f"{settings.FRONTEND_URL}/invite?token={token}"
    
    try:
        send_verification_email(
            email=user_data.email,
            full_name=user_data.full_name,
            verification_link=verification_link
        )
    except Exception as e:
        print(f"RESEND ERROR: {e}")
    
    return {
        "status": "success",
        "referral_code": user_data.referral_code,
        "message": "Spot secured! Check your email."
    }

@app.get("/admin/stats")
async def get_admin_stats(session: Session = Depends(get_session)):
    """
    Returns full user list with count of verified referrals per user.
    Note: Secure this with an Admin API Key in production.
    """
    # This query joins the User table with itself to count referrals
    users = session.exec(select(User)).all()
    
    user_list = []
    for user in users:
        # Count how many users were referred by this specific ID
        invite_count = session.exec(
            select(func.count(User.id)).where(User.referred_by_id == user.id, User.is_verified == True)
        ).one()
        
        user_list.append({
            "full_name": user.full_name,
            "email": user.email,
            "referral_code": user.referral_code,
            "is_verified": user.is_verified,
            "invite_count": invite_count
        })
        
    return {"users": user_list}