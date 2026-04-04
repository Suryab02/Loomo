import json
import re
from app.services.llm_gateway import chat_completion, parse_json_response

def parse_job_text(text: str) -> dict:
    messages = [
        {"role": "system", "content": "You are Loomo's Job Extraction Agent. Your task is to analyze messy job description text and extract structured data. You are extremely accurate even with partial or low-quality text inputs. Return ONLY valid JSON."},
        {"role": "user", "content": f"""
            Analyze the following text and extract the specific job details.
            
            FORMAT REQUIREMENTS:
            - "company": Full official company name. Look for "About [Company]" or "Join [Company]".
            - "role": The exact job title (e.g., "Senior React Developer").
            - "location": City and State (or "Remote" / "Hybrid").
            - "salary_range": Extract numbers (e.g., "$120k - $150k") if mentioned.
            - "platform": Where did this text likely come from? (e.g., LinkedIn, Indeed, etc.)
            - "job_description": A 1-2 sentence high-level summary of what the role entails.

            If a field is absolutely not found, use an empty string "". No extra commentary. Return ONLY the JSON object.

            TEXT INPUT:
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
