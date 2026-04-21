import resend
from app.core.config import settings

# Initialize Resend with your API Key from .env
resend.api_key = settings.RESEND_API_KEY

def send_verification_email(email: str, full_name: str, verification_link: str):
    """
    Sends the initial Magic Link to the user using the Resend SDK.
    Uses the EMAIL_FROM setting defined in core/config.py.
    """
    try:
        # We use f-strings to inject the user's name and the unique verification link
        params = {
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Verify your spot on the NaweMusic Waitlist",
            "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h1 style="color: #333;">Welcome to the Seed, {full_name}!</h1>
                    <p style="color: #555; font-size: 16px;">You're one step away from joining the NaweMusic founding community.</p>
                    <p style="color: #555; font-size: 16px;">Click the link below to verify your email and unlock your referral dashboard:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_link}" 
                           style="background-color: #f97316; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Verify My Email
                        </a>
                    </div>
                    
                    <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="color: #f97316; font-size: 12px; word-break: break-all;">{verification_link}</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #ccc; font-size: 10px; text-align: center; text-transform: uppercase;">A Project by AuraWorks (Pty) Ltd</p>
                </div>
            """,
        }
        
        email_response = resend.Emails.send(params)
        print(f"SUCCESS: Verification email queued for {email}")
        return email_response

    except Exception as e:
        # This catches DNS issues, invalid API keys, or Resend service interruptions
        print(f"RESEND ERROR for {email}: {e}")
        return None