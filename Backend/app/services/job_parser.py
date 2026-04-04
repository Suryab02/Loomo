import json
import re
from app.services.llm_gateway import chat_completion, parse_json_response

def parse_job_text(text: str) -> dict:
    messages = [
        {"role": "system", "content": "You are a job description extraction assistant. Return only valid JSON."},
        {"role": "user", "content": f"""
            Extract the following job details from the provided text. Return as JSON only, no extra text, no markdown. 
            If you cannot find a specific field, return an empty string for that field ("").
            
            {{
                "company": "Company Name",
                "role": "Job Title",
                "location": "City, State or Remote",
                "salary_range": "Salary if mentioned, else empty string",
                "platform": "Platform name (LinkedIn, Wellfound, etc.)",
                "job_description": "Clean, concise 2-3 sentence summary"
            }}
            
            Text Input:
            {text}
        """}
    ]
    
    try:
        response = chat_completion(messages)
        return parse_json_response(response)
    except Exception as e:
        print(f"Error parsing job text: {str(e)}")
        # Fallback if Gemini/LLM fails
        return {
            "company": "",
            "role": "",
            "location": "",
            "salary_range": "",
            "platform": "",
            "job_description": text[:500] # Return part of the text as fallback
        }
