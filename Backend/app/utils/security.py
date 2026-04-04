import re

# Common prompt injection and web attack patterns
INJECTION_PATTERNS = [
    r"ignore (all )?previous instructions",
    r"stop everything",
    r"system override",
    r"output (the )?system prompt",
    r"disregard (the )?above",
    r"you are now (a|an) .*",
    r"new instructions:",
    r"forget what you were told",
    r"as a (developer|admin|root|superuser)",
    r"sql (injected|injection|drop|select|update)", # Safety for DB context
    r"(union|select|insert|update|delete|drop)\s+from", # SQL-like keywords
    r"<script.*?>.*?</script>", # Basic XSS
]

def sanitize_ai_input(text: str) -> str:
    """
    Sanitizes input text to prevent basic prompt injections.
    """
    if not text:
        return ""
    
    sanitized = text
    for pattern in INJECTION_PATTERNS:
        # We replace the malicious phrase with a placeholder instead of just deleting it
        # to preserve context without triggering the "override" behavior in the LLM.
        sanitized = re.sub(pattern, "[CLEANED_INSTRUCTION]", sanitized, flags=re.IGNORECASE)
    
    # Trim excessive length to avoid token-based DOS attacks
    if len(sanitized) > 20000:
        sanitized = sanitized[:20000]
        
    return sanitized

def redact_sensitive_info(text: str) -> str:
    """
    Redacts obvious PII (emails, phone numbers) before sending to LLM.
    """
    # Simple email regex
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    # Simple phone regex (basic)
    phone_pattern = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
    
    redacted = re.sub(email_pattern, "[EMAIL_REDACTED]", text)
    redacted = re.sub(phone_pattern, "[PHONE_REDACTED]", redacted)
    
    return redacted

def security_gateway(text: str) -> str:
    """
    Full security pipeline for AI-bound text.
    """
    text = sanitize_ai_input(text)
    text = redact_sensitive_info(text)
    return text

def scrub_database_input(data: dict) -> dict:
    """
    Deep-cleans a job object dictionary before it is persisted to the DB.
    Ensures that fields like 'job_description' or 'notes' are redacted of PII.
    """
    sensitive_fields = ["job_description", "notes", "company", "role"]
    for field in sensitive_fields:
        if field in data and isinstance(data[field], str):
            # We redact PII but keep the content for searchability/context
            data[field] = redact_sensitive_info(data[field])
    return data
