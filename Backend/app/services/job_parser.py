import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

def parse_job_text(text: str) -> dict:
    prompt = f"""
    Extract the following job details from the provided text. Return as JSON only, no extra text, no markdown. 
    If you cannot find a specific field, return an empty string for that field ("").
    
    {{
        "company": "Company Name",
        "role": "Job Title",
        "location": "City, State or Remote",
        "salary_range": "Salary if mentioned, else empty string",
        "platform": "Platform name if it sounds like LinkedIn, Wellfound, etc, else empty string",
        "job_description": "A clean, concise 2-3 sentence summary of the job description"
    }}
    
    Text Input:
    {text}
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean the response to ensure valid JSON (remove markdown ticks)
        cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_text)
    except Exception as e:
        # Fallback if Gemini fails
        return {
            "company": "",
            "role": "",
            "location": "",
            "salary_range": "",
            "platform": "",
            "job_description": text[:500] # Return part of the text as fallback
        }
