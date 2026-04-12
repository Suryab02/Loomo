import json
import re
from app.services.llm_gateway import chat_completion, parse_json_response
from app.utils.security import security_gateway

def parse_job_text(text: str) -> dict:
    # Run through the security gateway to prevent prompt injection/PII leaks
    text = security_gateway(text)

    messages = [
        {"role": "system", "content": "You are Loomo's Job Extraction Agent. Your task is to analyze messy job description text and extract structured data. Return ONLY valid JSON. Note the clear sections for PAGE TITLE, HEADINGS, and BODY CONTENT."},
        {"role": "user", "content": f"""
            Analyze the following text and extract the specific job details.
            
            CRITICAL RULES:
            1. DO NOT swap 'company' and 'role'. The 'role' is the job title (e.g., 'Software Engineer'). The 'company' is the organization hiring.
            2. Look closely at the PAGE TITLE and HEADINGS to figure out which is which! Usually, the page title explicitly says "[Company] is hiring [Role]" or "[Role] | [Company]".
            
            FORMAT REQUIREMENTS:
            - "company": Full official company name.
            - "role": The exact job title (e.g., "Senior React Developer").
            - "location": City and State (or "Remote" / "Hybrid").
            - "salary_range": Extract numbers (e.g., "$120k - $150k") if mentioned.
            - "platform": Where did this text likely come from? (e.g., LinkedIn, Indeed, etc.)
            - "job_description": The FULL actual job description text. Extract ALL responsibilities, requirements, and day-to-day details exactly as written. Clean out noisy UI elements (e.g., "Apply now", "Show match details", "People you can reach out to").

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
