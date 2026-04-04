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
cd frontend
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
```

---
Built with 💜 by **Surya Prabhas Bandaru**
[LinkedIn](https://www.linkedin.com/in/bsuryaprabhas/) • [Portfolio](https://surya-portfolio-mu.vercel.app/)