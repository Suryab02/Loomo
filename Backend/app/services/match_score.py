import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

def calculate_match(user_skills: str, job_description: str) -> dict:
    prompt = f"""
    Compare these candidate skills against the job description.
    Return JSON only, no extra text, no markdown:
    {{
        "match_score": 0-100,
        "matched_skills": "skill1, skill2",
        "missing_skills": "skill1, skill2"
    }}
    
    Candidate skills: {user_skills}
    Job description: {job_description}
    """
    
    response = model.generate_content(prompt)
    
    # Clean the response to ensure valid JSON (remove markdown ticks)
    cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned_text)