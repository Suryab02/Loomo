# Loomo 🛰️
### Your AI-powered job hunt co-pilot.

Loomo is a smart job application tracker I built to turn the messy job search process into a clean, automated dashboard. It doesn't just list your jobs—it uses an **Agnostic AI Engine** (Gemini, Claude, or GPT-4o) to analyze every application you add.

## ✨ Why I built this
Standard spreadsheets are boring and static. Loomo is built for speed and intelligence:
*  **AI Smart Paste**: Don't waste time typing. Just paste the raw job description, and Loomo extracts the role, company, and location for you.
*  **Dynamic Brain**: Use **LiteLLM** to hot-swap your AI provider (Gemini, OpenAI, Anthropic) directly from your `.env` without restarting.
*  **Agentic Career Analyst**: A chat interface that doesn't just talk—it has **Write Access** to your database. You can say *"I just applied to Google as a SWE"* and it will add the job for you.
*  **Real-time Match Scoring**: See exactly how well your resume fits a job with a percentage score and a list of missing skills you should address before applying.
*  **Clean Kanban**: Move your applications through stages (Wishlist → Applied → Interview → Offer) with a minimalist drag-and-drop board.

## 🛠️ The Tech
*  **Frontend**: React + Tailwind CSS + Framer Motion (for that premium minimalist feel).
*  **Backend**: FastAPI + SQLAlchemy (PostgreSQL).
*  **AI Strategy**: LiteLLM for model-agnostic completions and unified tool calling.

## 🚀 Running it locally

### 1. Backend
```bash
cd Backend
pip install -r requirements.txt
# Add your keys to .env
python -m uvicorn app.main:app --reload
```

### 2. Frontend
```bash
cd Frontend
npm install
npm run dev
```

## 🧠 Environment Configuration
In your `Backend/.env`, you'll need:
```env
DATABASE_URL=your_postgresql_url
SECRET_KEY=your_random_string
LLM_MODEL=gemini/gemini-1.5-flash  # Or "openai/gpt-4o"
GEMINI_API_KEY=your_key

# Neon: use the connection string from the Neon dashboard (it usually includes ?sslmode=require).
# If your URL has no sslmode, add either ?sslmode=require or set:
# DATABASE_SSL=require

# Production CORS — comma-separated frontend origins (no trailing slashes)
# CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173

# Optional: Gmail Sync (Experimental)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
GMAIL_LABEL=Loomo
```

### Neon PostgreSQL (existing database)
If you already use Neon, apply schema updates **once** after pulling a version that adds columns:

1. Open **Neon Console → SQL Editor**, paste the contents of `Backend/scripts/add_job_reminder_columns.sql`, and run it, **or** from a shell (with `psql` installed):
   ```bash
   psql "$DATABASE_URL" -f Backend/scripts/add_job_reminder_columns.sql
   ```
2. Deployed frontend: set `VITE_API_URL` to your API base URL (e.g. `https://api.yourdomain.com`) so the app calls the right backend.


## 🤖 Experimental: Gmail Integration (Beta)
Loomo now features a **privacy-first Gmail sync** that only reads emails you've explicitly tagged. To set it up:
1.  **Labeling**: Create a new label in Gmail called **"Loomo"**.
2.  **Organization**: Move or filter any job application emails you want Loomo to track into this "Loomo" label.
3.  **App Password**: Go to your [Google Account Settings](https://myaccount.google.com/security) > 2-Step Verification > **App Passwords**.
4.  **Generate**: Create a new password for "Loomo" and paste it into your `Backend/.env` as `GMAIL_APP_PASSWORD`.
5.  **Sync**: Hit the **Sync from Gmail (Beta)** button in the **Workspace Tools** section at the bottom of your Dashboard!

---
Built with 💜 by **Surya Prabhas Bandaru**
[LinkedIn](https://www.linkedin.com/in/bsuryaprabhas/) • [Portfolio](https://surya-portfolio-mu.vercel.app/)