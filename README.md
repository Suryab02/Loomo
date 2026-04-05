# Loomo

Loomo is an AI-assisted job tracker built to make job searching feel less chaotic.

Instead of managing everything in spreadsheets, notes, and random tabs, Loomo gives you one place to:
- save jobs
- track application status
- compare your resume against job descriptions
- generate cover letters and follow-up emails
- review progress through a dashboard, kanban board, and insights view

Right now, the project is set up mainly for local development.

## What Loomo Does

Loomo helps with the main parts of the job search workflow:

- **Resume parsing**: Upload a PDF resume and extract role, company, and skills.
- **Job parsing**: Paste job text or a job URL and let AI extract structured details.
- **Application tracking**: Manage jobs across stages like `wishlist`, `applied`, `screening`, `interview`, `offer`, and `rejected`.
- **Match scoring**: Compare your resume skills with a job description and calculate a match percentage.
- **Career assistant**: Ask the built-in AI agent to summarize, explain, or update job-related data.
- **Follow-up support**: Generate cover letters and follow-up emails.
- **Insights**: Review application counts, platform breakdowns, reminders, and common skill gaps.
- **Browser extension**: Save jobs from supported job pages into Loomo faster.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Redux Toolkit + RTK Query
- React Router
- Recharts

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- LiteLLM
- Pydantic
- `pypdf`
- `httpx`
- BeautifulSoup

### Testing
- pytest
- FastAPI TestClient

## Project Structure

```text
Loomo/
├── Frontend/   # React app
├── Backend/    # FastAPI API + database logic
├── Extension/  # Chrome extension
└── README.md
```

## Running Loomo Locally

### 1. Start the backend

```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

The backend runs on:

```text
http://127.0.0.1:8000
```

### 2. Start the frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend usually runs on:

```text
http://localhost:5173
```

## Backend Environment Variables

Create a `Backend/.env` file and add the values you need:

```env
DATABASE_URL=your_postgresql_url
SECRET_KEY=your_random_secret
LLM_MODEL=gemini/gemini-1.5-flash
GEMINI_API_KEY=your_key

# Optional SSL flag if your DATABASE_URL does not already include sslmode=require
# DATABASE_SSL=require

# Optional frontend origins
# CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Optional Gmail sync
# GMAIL_USER=your_email@gmail.com
# GMAIL_APP_PASSWORD=your_app_password
# GMAIL_LABEL=Loomo
```

## Database Migrations

Loomo now includes Alembic migration scaffolding.

Run migrations with:

```bash
cd Backend
alembic upgrade head
```

If you are using an older local or Neon database, you may still need the reminder SQL patch:

```bash
psql "$DATABASE_URL" -f Backend/scripts/add_job_reminder_columns.sql
```

## Running Tests

Backend tests:

```bash
cd Backend
source venv/bin/activate
pytest tests
```

## Gmail Sync

Gmail sync is optional and experimental.

To use it:
1. Create a Gmail label called `Loomo`
2. Move or filter job-related emails into that label
3. Generate a Gmail app password
4. Add the Gmail values to `Backend/.env`
5. Use the **Sync Gmail (Beta)** action in the dashboard

## Notes

- Loomo is currently being used as a **local-first** project.
- The browser extension is still configured around local development URLs.
- If you later want to deploy it, you should review CORS, secrets, API key storage, and production environment variables first.

## Author

Built by **Surya Prabhas Bandaru**

- [LinkedIn](https://www.linkedin.com/in/bsuryaprabhas/)
- [Portfolio](https://surya-portfolio-mu.vercel.app/)
