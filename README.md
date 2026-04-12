# Loomo

Loomo is an AI-assisted job tracker built to make job searching feel less chaotic.

Instead of managing everything in spreadsheets, notes, and random tabs, Loomo gives you one place to:
- save jobs
- track application status
- compare your resume against job descriptions
- generate cover letters and follow-up emails
- review progress through a dashboard, kanban board, and insights view

## ✨ Key Features

- **Resume parsing**: Upload a PDF resume and extract role, company, and skills using AI.
- **Job parsing**: Paste job text or a job URL and let AI extract structured details automatically.
- **Application tracking**: Manage jobs across stages like `wishlist`, `applied`, `screening`, `interview`, `offer`, and `rejected`.
- **Match scoring**: Compare your resume skills with a job description and calculate a match percentage.
- **Career assistant**: Ask the built-in AI agent to summarize, explain, or update job-related data.
- **Follow-up support**: Generate cover letters and follow-up emails with AI.
- **Insights**: Review application counts, platform breakdowns, reminders, and common skill gaps.
- **Browser extension**: Save jobs from supported job pages directly into Loomo.

## 🛠️ Tech Stack

### Frontend
- **React 19 + TypeScript + Vite**
- **Tailwind CSS + Framer Motion** (Premium UI/UX)
- **Redux Toolkit + RTK Query** (Advanced State Management)
- **Recharts** (Interactive Analytics)

### Backend
- **FastAPI** (High-performance Python API)
- **SQLAlchemy + PostgreSQL** (Reliable Persistence)
- **LiteLLM + Gemini AI** (Advanced AI orchestration)
- **Structured Logging** (Professional observability)

## 🚀 Getting Started

### Quick Setup (Recommended)
Use the unified setup script to configure both frontend and backend automatically:

```bash
./setup_dev.sh
```

This will create virtual environments, install dependencies for both apps, and prepare default `.env` files.

### 1. Start the Backend
```bash
cd Backend
source venv/bin/activate
uvicorn app.main:app --reload
```
API runs on: `http://127.0.0.1:8000`

### 2. Start the Frontend
```bash
cd Frontend
npm run dev
```
App runs on: `http://localhost:5173`

## 🏗️ Project Architecture

```text
Loomo/
├── Frontend/   # React SPA
│   ├── src/hooks/       # Custom hooks (Filters, Logic)
│   ├── src/components/  # UI Library (Dashboard banners, Modals)
│   └── src/store/       # RTK Query API slices
├── Backend/    # FastAPI Services
│   ├── app/routes/      # API Controllers (Auth, Jobs, Insights)
│   ├── app/models/      # Database Schemas
│   └── app/utils/       # Helper utilities (Logging, Security)
├── Extension/  # Chrome extension
└── scripts/    # Automation & Utility scripts
```

## 📝 Environment Variables

Create a `Backend/.env` file:

```env
DATABASE_URL=your_postgresql_url
SECRET_KEY=your_random_secret
LLM_MODEL=gemini/gemini-1.5-flash
GEMINI_API_KEY=your_key
```

## 📜 Author

Built by **Surya Prabhas Bandaru**

- [LinkedIn](https://www.linkedin.com/in/bsuryaprabhas/)
- [Portfolio](https://surya-portfolio-mu.vercel.app/)
