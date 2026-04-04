import json
import re
from app.services.llm_gateway import chat_completion, parse_json_response
from app.utils.security import security_gateway

def parse_job_text(text: str) -> dict:
    # Run through the security gateway to prevent prompt injection/PII leaks
    text = security_gateway(text)

    messages = [
        {"role": "system", "content": "You are Loomo's Job Extraction Agent. Your task is to analyze messy job description text and extract structured data. You are extremely accurate even with partial or low-quality text inputs. Return ONLY valid JSON."},
        {"role": "user", "content": f"""
            Analyze the following text and extract the specific job details.
            
            IMPORTANT:
            - The text starts with 'HEADER INFO', which contains the page title and headings. Use this to identify the 'company' and 'role' first.
            - If 'company' or 'role' are unclear in the body, rely on the 'HEADER INFO'.
            
            FORMAT REQUIREMENTS:
            - "company": Full official company name. Look for "About [Company]" or "Join [Company]".
            - "role": The exact job title (e.g., "Senior React Developer").
            - "location": City and State (or "Remote" / "Hybrid").
            - "salary_range": Extract numbers (e.g., "$120k - $150k") if mentioned.
            - "platform": Where did this text likely come from? (e.g., LinkedIn, Indeed, etc.)
            - "job_description": Avoid just copying the headers; write a 1-2 sentence high-level summary of the actual job responsibilities.

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
