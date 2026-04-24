from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.core.db import get_session, init_db
from app.models.users import User 
from app.api import auth 
from app.core.config import settings
from app.services.email import send_verification_email

app = FastAPI(title="NaweMusic API")

# Use the key from the updated Settings class
ADMIN_SECRET_KEY = settings.ADMIN_SECRET_KEY 

# backend/app/main.py

# backend/app/main.py

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nawemusic.auraworks.co.za", 
        "http://localhost:3000",
        "https://nawemusic-waitlist-izi23lolp-allen-reileys-projects.vercel.app",
        "https://nawemusic-waitlist-1.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    # Explicitly naming the custom header is the key to passing the preflight check
    allow_headers=[
        "Content-Type", 
        "Set-Cookie", 
        "Access-Control-Allow-Headers", 
        "Authorization", 
        "X-Admin-Key"
    ],
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
async def get_admin_stats(
    session: Session = Depends(get_session),
    x_admin_key: Optional[str] = Header(None) 
):
    """
    Returns unified data only if a valid X-Admin-Key is provided.
    FastAPI automatically handles the hyphen-to-underscore conversion for headers.
    """
    # Strict validation against the key defined in core/config.py
    if not x_admin_key or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=403, 
            detail="Unauthorized: AuraWorks Growth Intelligence Access Denied."
        )

    # 1. Fetch all users
    users = session.exec(select(User).order_by(User.created_at.desc())).all()
    total_signups = len(users)
    
    # 2. Traffic Placeholder (Link to analytics table in Phase 2)
    total_visits = 1210 
    
    formatted_users = []
    total_verified_invites = 0
    
    for u in users:
        invite_count = session.exec(
            select(func.count(User.id)).where(
                User.referred_by_id == u.id, 
                User.is_verified == True
            )
        ).one()
        
        total_verified_invites += invite_count
        
        formatted_users.append({
            "full_name": u.full_name,
            "email": u.email,
            "referral_code": u.referral_code,
            "is_verified": u.is_verified,
            "invite_count": invite_count
        })

    # 3. Calculations
    avg_referrals = total_verified_invites / total_signups if total_signups > 0 else 0
    conv_rate = round((total_signups / total_visits) * 100, 1) if total_visits > 0 else 0

    # 4. 7-Day Window Chart Data
    chart_data = []
    for i in range(6, -1, -1):
        target_date = (datetime.utcnow() - timedelta(days=i)).date()
        day_signups = session.exec(
            select(func.count(User.id)).where(
                func.date(User.created_at) == target_date
            )
        ).one()
        
        chart_data.append({
            "date": target_date.strftime("%b %d"),
            "Visits": 100 + (i * 15), # Placeholder logic
            "Signups": day_signups
        })

    return {
        "users": formatted_users,
        "stats": {
            "total_visits": total_visits,
            "total_signups": total_signups,
            "conversion_rate": conv_rate,
            "avg_referrals": avg_referrals
        },
        "chartData": chart_data
    }