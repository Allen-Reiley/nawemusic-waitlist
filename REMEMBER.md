This is a solid technical stack. By using a subdomain under **auraworks.co.za**, you leverage your existing domain authority while keeping the brand distinct. 

Below is the scope and execution plan focused on the transition from the "Waitlist Phase" to the "MVP Launch."

---

## 🏗️ Project Scope

### 1. The Waitlist Phase (Current Focus)
* **Lead Capture:** Name/Email collection with duplicate prevention.
* **Affiliate Engine:** Unique referral link generation and attribution.
* **Leaderboard:** Dynamic Top 10 ranking based on verified sign-ups.
* **Email Automation:** Two-stage flow (Verification → Success + Referral Link).

### 2. The Platform Phase (Post-Launch)
* **Artist Profiles:** Next.js ISR (Incremental Static Regeneration) for SEO-optimized landing pages at `nawemusic.auraworks.co.za/artist-name`.
* **PWA Integration:** Service workers to allow "Add to Home Screen" functionality.
* **Connectivity:** Direct messaging for contractors and fan notification systems.
* **Embed Layer:** Spotify/YouTube API integrations.

---

## 🛠️ Technical Stack & Dependencies

| Layer | Tool | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14/15 (App Router) | High SEO performance and PWA capabilities. |
| **Backend** | FastAPI | High-speed Python framework for referral logic. |
| **Database** | SQLModel (PostgreSQL) | Type-safe ORM combining SQLAlchemy and Pydantic. |
| **Styling** | Tailwind CSS + Framer Motion | Rapid UI development and leaderboard animations. |
| **Email** | Resend / Mailgun | Transactional emails for verification and referral updates. |
| **Deployment** | Render | Managed hosting for both the Frontend and Backend. |
| **Auth/Security** | JWT (JSON Web Tokens) | Secure email verification and affiliate link tracking. |

---

## 🚀 Execution Plan (6-Step Roadmap)

### Phase 1: Data Modeling & Backend (Week 1)
* Initialize **SQLModel** with the `User` schema (including `referrer_id`).
* Build the FastAPI endpoint `/join` to handle initial signups.
* Implement the **Referral Logic**: Generate a 6-character alphanumeric slug for each user.

### Phase 2: Frontend & Multi-Step Form (Week 1)
* Set up the Next.js project with a single-section Hero.
* Build the **Onboarding Modal** using a state machine (Step 1 → 2 → 3 → 4).
* Integrate `localStorage` to persist the `ref` code if a user arrives via an affiliate link.

### Phase 3: The Verification Loop (Week 2)
* Configure **Resend** to fire a "Verify Email" trigger upon signup.
* Create a `/verify` route in Next.js that calls the backend to flip `is_verified` to `true`.
* **Automated Payout/Credit Logic:** Calculate the 30% commission potential and store it in the user's dashboard view.

### Phase 4: Dynamic Leaderboard (Week 2)
* Create a backend route `/leaderboard` that aggregates verified referrals.
* Frontend: Use **SWR** or **React Query** to fetch leaderboard data every 60 seconds.
* Apply **Framer Motion's** `layout` prop to the list items so they physically slide into new positions when the rankings change.

### Phase 5: PWA & SEO Setup (Week 3)
* Configure `manifest.json` and icons for the PWA.
* Set up OpenGraph (OG) tags so when artists share their referral links on social media, a beautiful preview card appears.

### Phase 6: Deployment (Week 3)
* Deploy the Database (PostgreSQL) on Render.
* Connect the GitHub repo to Render for auto-deployments.
* Map the subdomain `nawemusic.auraworks.co.za` to the Render instance.

---

## 📈 The Affiliate Logic Flow

To ensure this is "legally binding" and clean, the flow follows this sequence:

1.  **User A** signs up → Receives verification email.
2.  **User A** clicks link → Redirected to `/dashboard` → Referral link is revealed: `nawemusic.auraworks.co.za?ref=USERA`.
3.  **User B** visits link → Cookie stores `ref=USERA`.
4.  **User B** signs up → Backend checks cookie → Assigns **User A** as the referrer.
5.  **User B** verifies email → **User A** gets +1 verified referral.

---

## 💡 Discussion: Manual vs. Automated Verification

For a South African context where you want to maintain high quality:
* **The Recommendation:** Use **Automated Email Verification** (Magic Link) for the general waitlist.
* **Manual Verification:** Keep this only for the **Top 10 Committee**. Before officially awarding stocks or lifetime access, you should manually vet their profiles to ensure they didn't use bot-farms to juice their referral numbers.

Does this timeline and logic align with your development capacity, or should we look at simplifying the referral tracking for the initial MVP?