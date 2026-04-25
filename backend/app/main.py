from typing import Optional, List
# Update: include timezone
from datetime import datetime, timedelta, timezone 
from fastapi import FastAPI, Depends, HTTPException, Header, BackgroundTasks # Added BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.core.db import get_session, init_db
from app.models.users import User 
from app.api import auth 
from app.core.config import settings
from app.services.email import send_verification_email

app = FastAPI(title="NaweMusic API")

ADMIN_SECRET_KEY = settings.ADMIN_SECRET_KEY 

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

# --- HEALTH CHECK FOR CRON-JOB.ORG ---
@app.get("/health")
async def health_check():
    """
    Lightweight endpoint to keep the Render instance from sleeping.
    """
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

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

# --- NEW CRON ENDPOINT ---
@app.post("/admin/process-reminders")
async def process_reminders(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
):
    """
    Triggered daily via cron-job.org to nudge unverified users.
    """
    if not x_admin_key or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Cutoff is 24 hours ago
    cutoff = datetime.now(timezone.utc) - timedelta(days=1)
    
    # Select users who:
    # 1. Are NOT verified
    # 2. Signed up more than 24 hours ago
    # 3. Have NOT been sent a reminder yet
    statement = select(User).where(
        User.is_verified == False,
        User.created_at <= cutoff,
        User.reminder_sent == False
    )
    pending_users = session.exec(statement).all()

    for user in pending_users:
        token = auth.create_verification_token(user.email)
        verification_link = f"{settings.FRONTEND_URL}/invite?token={token}"
        
        # Use background tasks to prevent the request from timing out
        background_tasks.add_task(
            send_verification_email,
            email=user.email,
            full_name=user.full_name,
            verification_link=verification_link
        )
        
        user.reminder_sent = True
        session.add(user)

    session.commit()
    return {"status": "success", "reminders_sent": len(pending_users)}

@app.get("/admin/stats")
async def get_admin_stats(
    session: Session = Depends(get_session),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key") 
):
    if not x_admin_key or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=403, 
            detail="Unauthorized: AuraWorks Growth Intelligence Access Denied."
        )

    users = session.exec(select(User).order_by(User.created_at.desc())).all()
    total_signups = len(users)
    
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

    avg_referrals = total_verified_invites / total_signups if total_signups > 0 else 0
    conv_rate = round((total_signups / total_visits) * 100, 1) if total_visits > 0 else 0

    chart_data = []
    now = datetime.now(timezone.utc)
    
    for i in range(6, -1, -1):
        target_date = (now - timedelta(days=i)).date()
        day_signups = session.exec(
            select(func.count(User.id)).where(
                func.date(User.created_at) == target_date
            )
        ).one()
        
        chart_data.append({
            "date": target_date.strftime("%b %d"),
            "Visits": 100 + (i * 15),
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