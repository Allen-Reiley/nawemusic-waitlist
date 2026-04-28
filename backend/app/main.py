from typing import Optional, List
from datetime import datetime, timedelta, timezone 
from fastapi import FastAPI, Depends, HTTPException, Header, BackgroundTasks 
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.core.db import get_session, init_db
from app.models.users import User 
from app.api import auth 
from app.core.config import settings
from app.services.email import send_verification_email, send_reminder_email

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
    allow_headers=["*"], # Fixed: Wildcard ensures X-Admin-Key is never blocked by CORS
)

app.include_router(auth.router)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
async def root():
    return {"status": "online", "service": "NaweMusic Backend"}

# --- INFRASTRUCTURE: HEALTH CHECK ---
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# --- CORE: JOIN WAITLIST ---
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

# --- ADMIN: GROWTH INTELLIGENCE & RE-ENGAGEMENT ---

@app.post("/admin/process-reminders")
async def process_reminders(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
):
    if not x_admin_key or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")

    cutoff = datetime.now(timezone.utc) - timedelta(days=1)
    
    statement = select(User).where(
        User.is_verified == False,
        User.created_at <= cutoff,
        User.reminder_sent == False
    )
    pending_users = session.exec(statement).all()

    for user in pending_users:
        token = auth.create_verification_token(user.email)
        verification_link = f"{settings.FRONTEND_URL}/invite?token={token}"
        
        background_tasks.add_task(
            send_reminder_email, # Using the specialized reminder template
            email=user.email,
            full_name=user.full_name,
            verification_link=verification_link
        )
        
        user.reminder_sent = True
        session.add(user)

    session.commit()
    return {"status": "success", "reminders_sent": len(pending_users)}

@app.delete("/admin/users/{email}")
async def delete_user(
    email: str,
    session: Session = Depends(get_session),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
):
    """Purge a user to allow a fresh start."""
    if not x_admin_key or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")

    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session.delete(user)
    session.commit()
    return {"status": "success", "message": f"Artist {email} purged."}

@app.post("/admin/users/{email}/resend")
async def resend_verification(
    email: str,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key")
):
    """Manually dispatch a fresh verification link."""
    if not x_admin_key or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")

    statement = select(User).where(User.email == email)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = auth.create_verification_token(user.email)
    verification_link = f"{settings.FRONTEND_URL}/invite?token={token}"
    
    background_tasks.add_task(
        send_verification_email,
        email=user.email,
        full_name=user.full_name,
        verification_link=verification_link
    )

    return {"status": "success", "message": "Verification link resent."}

@app.get("/admin/stats")
async def get_admin_stats(
    session: Session = Depends(get_session),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key") 
):
    if not x_admin_key or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Unauthorized")

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
            "reminder_sent": u.reminder_sent, # Added to track nudge status in UI
            "invite_count": invite_count
        })

    avg_referrals = total_verified_invites / total_signups if total_signups > 0 else 0
    conv_rate = round((total_signups / total_visits) * 100, 1) if total_visits > 0 else 0

    chart_data = []
    now = datetime.now(timezone.utc)
    
    for i in range(6, -1, -1):
        target_date = (now - timedelta(days=i)).date()
        # Robust date check to avoid SQL dialect errors
        start_of_day = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
        end_of_day = start_of_day + timedelta(days=1)
        
        day_signups = session.exec(
            select(func.count(User.id)).where(
                User.created_at >= start_of_day,
                User.created_at < end_of_day
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