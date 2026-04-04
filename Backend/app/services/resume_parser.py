import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

def parse_resume(text: str) -> dict:
    prompt = f"""
    Extract the following from this resume and return as JSON only, 
    no extra text, no markdown:
    {{
        "current_role": "...",
        "years_experience": "...",
        "current_company": "...",
        "skills": "skill1, skill2, skill3"
    }}
    
    Resume:
    {text}
    """
    
    response = model.generate_content(prompt)
    
    # Clean the response to ensure valid JSON (remove markdown ticks)
    cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned_text)