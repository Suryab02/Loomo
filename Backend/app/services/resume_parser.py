import json
from app.services.llm_gateway import chat_completion, parse_json_response

def parse_resume(text: str) -> dict:
    messages = [
        {"role": "system", "content": "You are an expert resume parser. Respond only with JSON."},
        {"role": "user", "content": f"""
            Extract the following from this resume and return as JSON only, 
            no extra text, no markdown:
            {{
                "current_role": "...",
                "years_experience": "...",
                "current_company": "...",
                "skills": "skill1, skill2, skill3"
            }}
            
            Resume content:
            {text}
        """}
    ]
    
    try:
        response = chat_completion(messages)
        return parse_json_response(response)
    except Exception as e:
        print(f"Error parsing resume: {str(e)}")
        # Simple fallback
        return {
            "current_role": "N/A",
            "years_experience": "N/A",
            "current_company": "N/A",
            "skills": ""
        }