# Loomo API 🛰️
### The AI-powered job search intelligence engine.

This is the central brain behind **Loomo**, handling multi-model fallback, agentic tool-calling, and real-time job application parsing.

## 🛠️ Performance & Features
*   **Dual LLM Gateway**: Powered by **LiteLLM** to allow provider switching (Gemini, Claude, GPT-o1) on-the-fly.
*   **Smart-Extract Logic**: High-speed parsing of messy job descriptions into structured JSON.
*   **Agentic Persistence**: An AI analyst that doesn't just read—it can **WRITE** and **UPDATE** your applications.
*   **Match-Score Ranking**: Intelligent comparison between user skills and job requirements.

## 🚀 Rapid Setup

### 1. Environment and Deps
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Database & API Configuration
Create a `.env` file and add:
```bash
DATABASE_URL=your_postgresql_url
SECRET_KEY=your_secure_string
GEMINI_API_KEY=your_key
LLM_MODEL=gemini/gemini-1.5-flash  # Switch models anytime without restart
```

### 3. Launch
```bash
python -m uvicorn app.main:app --reload
```

### 4. Run Migrations
```bash
alembic upgrade head
```

### 5. Run Tests
```bash
pytest tests
```

## 📚 API Endpoints
*   **Interactive Docs**: http://127.0.0.1:8000/docs
*   **Base URL**: http://127.0.0.1:8000
*   **Health Check**: http://127.0.0.1:8000/health

---
Built with 💜 by **Surya Prabhas Bandaru**
[LinkedIn](https://www.linkedin.com/in/bsuryaprabhas/) • [Portfolio](https://surya-portfolio-mu.vercel.app/)
