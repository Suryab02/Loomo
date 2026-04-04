import json
from app.services.llm_gateway import chat_completion, parse_json_response

def calculate_match(user_skills: str, job_description: str) -> dict:
    messages = [
        {"role": "system", "content": "You are a professional hiring analyzer. Respond only with JSON."},
        {"role": "user", "content": f"""
            Compare these candidate skills against the job description.
            Return JSON only, no extra text, no markdown:
            {{
                "match_score": 0-100,
                "matched_skills": "list, of, skills",
                "missing_skills": "list, of, skills"
            }}
            
            Candidate skills: {user_skills}
            Job description: {job_description}
        """}
    ]
    
    try:
        response = chat_completion(messages)
        return parse_json_response(response)
    except Exception as e:
        print(f"Error calculating match score: {str(e)}")
        # Simple fallback
        return {
            "match_score": 0,
            "matched_skills": "n/a",
            "missing_skills": "n/a"
        }