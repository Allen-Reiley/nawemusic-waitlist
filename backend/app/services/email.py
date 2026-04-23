import resend
from app.core.config import settings

# Initialize Resend with your API Key from .env
resend.api_key = settings.RESEND_API_KEY

def send_verification_email(email: str, full_name: str, verification_link: str):
    """
    Sends the initial Magic Link to the user with the full 
    Legal Terms of Participation embedded in the footer.
    """
    try:
        params = {
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Action Required: Verify your spot on the NaweMusic Waitlist",
            "html": f"""
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.6;">
                    <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Welcome to the NaweMusic, {full_name}.</h1>
                    <p style="font-size: 16px; margin-bottom: 24px;">You are one step away from securing your spot on the NaweMusic waitlist and joining our community of early adopters.</p>
                    
                    <div style="margin: 40px 0;">
                        <a href="{verification_link}" 
                           style="background-color: #f97316; color: #000000; padding: 16px 32px; text-decoration: none; border-radius: 99px; font-weight: bold; display: inline-block; font-size: 16px; transition: background-color 0.3s ease;">
                            Verify My Identity
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-bottom: 40px;">
                        By clicking the button above to verify your account, you acknowledge and agree to the <strong>Terms of Participation</strong> included in the footer of this correspondence.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
                    
                    <div style="font-size: 11px; color: #888; line-height: 1.5; background-color: #fafafa; padding: 24px; border-radius: 12px; border: 1px solid #eee;">
                        <h3 style="font-size: 12px; color: #444; margin-top: 0; text-transform: uppercase; letter-spacing: 0.05em;">Terms of Participation & Founding Committee Agreement</h3>
                        <p><strong>Last Updated:</strong> April 22, 2026<br>
                        <strong>Entity:</strong> AuraWorks (Pty) Ltd (“the Company”) | <strong>Jurisdiction:</strong> Republic of South Africa</p>

                        <p><strong>1. THE WAITLIST STRUCTURE</strong><br>
                        NaweMusic operates a tiered entry system: (1) Users 1-100: Founding Committee (Lifetime Waiver + Equity Eligibility). (2) Users 101-300: Early Access (R150 Gatekeeper Fee + 50% Lifetime Discount). (3) Users 301+: Standard Access (R500/year).</p>

                        <p><strong>2. VERIFIED ARTIST DEFINITION</strong><br>
                        Waitlist Verification is free via email. Platform Verification (for leaderboard/rewards) is granted only upon completion of a Paid Subscription (R500/year or R150 Gatekeeper Fee).</p>

                        <p><strong>3. REFUNDS (CPA COMPLIANCE)</strong><br>
                        In accordance with Section 16 of the SA Consumer Protection Act, a 7-day "no-questions-asked" refund is available for the R500 annual fee.</p>

                        <p><strong>4. PROMOTIONAL LICENSE</strong><br>
                        Artists retain 100% IP ownership. You grant NaweMusic a non-exclusive, revocable license to use your stage name and logo solely for public Leaderboard and promotional displays.</p>

                        <p><strong>5. PRIVACY (POPIA)</strong><br>
                        AuraWorks (Pty) Ltd is committed to POPIA. Data is used for identity resolution and account security. Information Officer contact: legal@auraworks.co.za.</p>

                        <p><strong>6. DISPUTE RESOLUTION</strong><br>
                        Any disputes shall be referred to private arbitration via the Arbitration Foundation of Southern Africa (AFSA).</p>
                        
                        <p style="margin-top: 20px; border-top: 1px solid #eee; pt: 10px; text-align: center; text-transform: uppercase;">A Project by AuraWorks (Pty) Ltd</p>
                    </div>
                </div>
            """,
        }
        
        email_response = resend.Emails.send(params)
        print(f"SUCCESS: Verification email with terms sent to {email}")
        return email_response

    except Exception as e:
        print(f"RESEND ERROR for {email}: {e}")
        return None