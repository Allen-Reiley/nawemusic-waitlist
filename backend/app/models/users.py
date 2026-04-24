from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
import uuid

class User(SQLModel, table=True):
    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Identity & Contact
    # Unique constraint prevents duplicate signups at the DB level
    email: str = Field(unique=True, index=True)
    full_name: str
    
    # Referral Logic
    # Generates a unique 6-character slug (e.g., 'a1b2c3')
    # index=True allows for fast lookups when a new user joins with ?ref=xyz
    referral_code: str = Field(
        default_factory=lambda: uuid.uuid4().hex[:6].upper(), 
        unique=True, 
        index=True
    )
    
    # Self-referential ID to track who invited this user
    # links back to User.id
    referred_by_id: Optional[int] = Field(default=None, foreign_key="user.id")
    
    # Status & Verification
    # is_verified starts False; flipped to True by the /auth/verify/{token} endpoint
    is_verified: bool = Field(default=False)
    
    # Track when the user joined for leaderboard sorting and admin stats
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False
    )